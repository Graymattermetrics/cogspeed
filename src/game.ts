import { Application } from "pixi.js";
import { CogSpeedGraphicsHandler } from "./ui/handler";

import { v4 } from "uuid";
import { ProcessResultsPage } from "./processResultsPage";

/**
 * Cogspeed game
 * @param {Application} app
 * @return {void}
 */
export class CogSpeedGame {
  // Time
  private startTime: number | undefined;
  private currentDuration: number = -1;
  private currentRoundType: "training" | "self-paced" | "machine-paced" | "postblock" | "fail" | "success" | "null" =
    "training";
  private previousBlockDurations: number[] = [-1];

  // Answers
  private answer: number | undefined;
  private previousAnswers: { [key: string]: any }[] = [];

  // Timeouts
  private noResponseTimeout: NodeJS.Timeout | undefined;
  private currentScreenTimeout: NodeJS.Timeout | undefined;
  private maxTestDuration: NodeJS.Timeout | undefined;

  constructor(private app: Application, private config: { [key: string]: any }, private ui: CogSpeedGraphicsHandler) {}

  /**
   * Sets up the next round
   * @return {void}
   */
  private nextRound(): void {
    // Clear stage
    this.ui.clearStage();

    // Create random answer location
    const answerLocation = Math.floor(Math.random() * 6) + 1; // 1-6
    this.answer = answerLocation;

    // Set display sprites
    this.ui.setDisplayNumbers(answerLocation);

    // Update duration
    if (["machine-paced", "postblock", "fail", "success"].includes(this.currentRoundType)) {
      this.updateDuration();
    }

    // Set timers
    this.setTimer();
  }

  /**
   * Gets the number of correct answers in the last `rolling_average.mean_size` answers
   * @return {number}
   */
  private getCorrectAnswers(): number {
    let lastAnswers = this.previousAnswers
      .filter((a) => a.roundType === "machine-paced")
      .slice(-this.config.machine_paced.rolling_average.mean_size);

    // Reset after block
    const lastBlockIndex = this.previousAnswers
      .slice()
      .reverse()
      .findIndex((a) => a.roundType === "postblock");
    if (lastBlockIndex !== -1) {
      lastAnswers = lastAnswers.slice(lastAnswers.length - lastBlockIndex);
    }

    let correctAnswers = lastAnswers.filter((a) => a.status === "correct").length;
    // If there are not enough answers in machine-paced, say all previous answers are correct
    if (lastAnswers.length !== this.config.machine_paced.rolling_average.mean_size) {
      correctAnswers += this.config.machine_paced.rolling_average.mean_size - lastAnswers.length;
    }
    return correctAnswers;
  }

  /**
   * Updates the duration
   * @return {void}
   */
  private updateDuration(): void {
    if (["fail", "success"].includes(this.currentRoundType)) {
      const lastEndmodeAnswers = this.previousAnswers.filter((a) => ["fail", "success"].includes(a.roundType));
      if (lastEndmodeAnswers.length === this.config.number_of_endmode_rounds) {
        this.stop(this.currentRoundType === "success" ? true : false);
      }
      return;
    }

    // Last `rolling_average.mean_size` machine-paced answers
    const lastAnswers = this.previousAnswers
      .filter((a) => a.roundType === "machine-paced")
      .slice(-this.config.machine_paced.rolling_average.mean_size);

    // If the user is in `postblock`, start again with increased time
    if (this.currentRoundType === "postblock") {
      const lastPostBlockAnswers = this.previousAnswers
        .slice(-this.config.machine_paced.blocking.self_paced_rounds)
        .filter((a) => a.roundType === "postblock");

      // If there are not enough (self-paced) answers in postblock, do not resume machine paced
      if (lastPostBlockAnswers.length !== this.config.machine_paced.blocking.self_paced_rounds) {
        return;
      }
      // Resume machine paced again
      this.currentDuration =
        lastAnswers[lastAnswers.length - 1].duration + this.config.machine_paced.blocking.slow_down_duration;
      this.currentRoundType = "machine-paced";
    }

    /// Last `no_input_count` answers
    const lastMissedAnswers = this.previousAnswers
      .slice(-this.config.machine_paced.blocking.no_input_count)
      .filter((a) => a.status === "no response");

    // If the user does not respond for `no_input_count` times in a row, they "blocked"
    if (lastMissedAnswers.length === this.config.machine_paced.blocking.no_input_count) {
      const blockDuration = this.previousAnswers[this.previousAnswers.length - 1].duration;
      const lastBlockDuration = this.previousBlockDurations[this.previousBlockDurations.length - 1];

      if (Math.abs(blockDuration - lastBlockDuration) < this.config.machine_paced.blocking.duration_delta) {
        this.currentRoundType = "success";
      } else {
        this.currentRoundType = "postblock";
      }
      this.previousBlockDurations.push(blockDuration);
      return;
    }

    const percentageCorrect = this.getCorrectAnswers() / this.config.machine_paced.rolling_average.mean_size;

    const incorrectAnswers = lastAnswers.filter((a) => a.status === "incorrect").length;
    if (incorrectAnswers > this.config.machine_paced.rolling_average.max_wrong_count) {
      this.currentRoundType = "fail";
      return;
    }

    let isCorrect = lastAnswers[lastAnswers.length - 1].status === "correct";

    // If percentage correct is greater than threshold, speed up if answer was correct
    if (percentageCorrect > this.config.machine_paced.rolling_average.threshold && isCorrect) {
      this.currentDuration -= this.config.machine_paced.speedup.base_duration;
    }
    // If percentage correct is less than threshold, slow down if answer was incorrect
    else if (
      percentageCorrect < this.config.machine_paced.rolling_average.threshold &&
      lastAnswers[lastAnswers.length - 1].status === "incorrect"
    )
      this.currentDuration += this.config.machine_paced.slowdown.base_duration;
  }

  /**
   * Sets the timer for the next screen
   * @return {void}
   */
  private setTimer(): void {
    clearTimeout(this.currentScreenTimeout); // Clear previous timeout
    clearTimeout(this.noResponseTimeout); // Clear no response timeout
    // Set no response timeout
    this.noResponseTimeout = setTimeout(
      () => {
        if (this.currentRoundType !== "null") {
          this.stop();
        }
      },
      this.previousAnswers.length === 0
        ? this.config.timeouts.max_initial_no_response
        : this.config.timeouts.max_no_response
    );

    const correctAnswers = this.previousAnswers
      .slice(this.config.self_paced.number_of_training_rounds)
      .filter((a) => a.status === "correct");
    const incorrectAnswers = this.previousAnswers
      .slice(this.config.self_paced.number_of_training_rounds)
      .filter((a) => a.status === "incorrect");

    // Set currentRoundType to self-paced if correct answers is less than `max_right_count` and
    // number of rounds is greater than `number_of_training_rounds`
    if (
      correctAnswers.length <= this.config.self_paced.max_right_count &&
      this.previousAnswers.length >= this.config.self_paced.number_of_training_rounds &&
      this.currentDuration === -1
    )
      this.currentRoundType = "self-paced";

    if (this.currentRoundType === "self-paced") {
      // Start machine paced
      if (correctAnswers.length === this.config.self_paced.max_right_count) {
        const sumOfAnswers = correctAnswers.map((a) => a.timedelta).reduce((a, b) => a + b, 0);

        this.currentDuration =
          sumOfAnswers / correctAnswers.length + this.config.machine_paced.slowdown.initial_duration;
        if (this.currentDuration > this.config.machine_paced.max_start_duration) {
          this.currentDuration = this.config.machine_paced.max_start_duration;
        }
        this.currentRoundType = "machine-paced";
      }
      // Exit if too many incorrect answers in self paced
      console.log(incorrectAnswers.length, this.config.self_paced.max_wrong_count, incorrectAnswers);
      if (incorrectAnswers.length === this.config.self_paced.max_wrong_count) {
        console.log("e");
        this.stop();
        return;
      }
    }

    // Currently in machine paced, set timeout before next screen
    if (["machine-paced", "fail", "success"].includes(this.currentRoundType)) {
      this.currentScreenTimeout = setTimeout(this.buttonClicked.bind(this, false), this.currentDuration);
    }
  }

  /**
   * Button clicked
   * @param {number | boolean} location The location of the button clicked or false if no response
   * @return {void}
   */
  public buttonClicked(location: number | boolean): void {
    const previousAnswer = this.previousAnswers[this.previousAnswers.length - 1];
    const previousTime = previousAnswer ? previousAnswer.time : this.startTime;

    const timeTaken = performance.now() - previousTime;

    let answer = this.answer;
    let status = location === false ? "no response" : location === this.answer ? "correct" : "incorrect";
    if (this.config.machine_paced.minimum_response_time > timeTaken) {
      if (previousAnswer && previousAnswer.status === "no response" && location === previousAnswer.answerLocation) {
        status = "correct";
        answer = this.previousAnswers[this.previousAnswers.length - 1].answerLocation;
      }
    }

    // Log answer
    const data: { [key: string]: number | string | undefined | null } = {
      status, // correct, incorrect, no response
      answerLocation: answer, // Location of answer
      // Current duration (timeout)
      duration: this.currentRoundType !== "postblock" ? this.currentDuration : -1,
      round: this.previousAnswers.length + 1, // Round number
      roundType: this.currentRoundType,
      timedelta: timeTaken, // Time delta between previous answer
      // Ratio of time taken to respond to time given
      ratio: this.currentDuration === -1 ? 0 : (performance.now() - previousTime) / this.currentDuration,
      time: performance.now(), // Time of answer
    };

    if (this.currentRoundType === "machine-paced") {
      data["lastCorrectAnswers"] = `${this.getCorrectAnswers()}/${this.config.machine_paced.rolling_average.mean_size}`;
    }

    this.previousAnswers.push(data);

    console.log(this.previousAnswers);
    this.nextRound();
  }

  /**
   * Starts the game
   * @return {void}
   * @return {Promise<void>}
   */
  public async start(): Promise<void> {
    this.ui.setupGame(this);

    this.startTime = performance.now();
    this.maxTestDuration = setTimeout(this.stop.bind(this), this.config.timeouts.max_test_duration);
    this.nextRound();
  }

  public async stop(success: boolean = false): Promise<void> {
    clearTimeout(this.maxTestDuration);
    clearTimeout(this.currentScreenTimeout);
    clearTimeout(this.noResponseTimeout);

    this.currentRoundType = "null";
    for (var i = this.app.stage.children.length - 1; i >= 0; i--) {
      this.app.stage.removeChild(this.app.stage.children[i]);
    }

    const round = (num: number, sf: number = 3) => {
      return Math.round((num * 10 ** sf) / 10 ** sf);
    };

    const sumOfLastTwoBlocks = this.previousBlockDurations.slice(-2).reduce((a, b) => a + b, 0);
    const blockingRoundDuration = round(sumOfLastTwoBlocks / 2);

    // CPImax - CPImin/BRDmin - BRDmax
    const M =
      (this.config.cpi_calculation.cpi_max - this.config.cpi_calculation.cpi_min) /
      (this.config.cpi_calculation.brd_min - this.config.cpi_calculation.brd_max);
    // M(BRD - CPImin) + 100
    const cognitiveProcessingIndex = round(M * (blockingRoundDuration - this.config.cpi_calculation.brd_min) + 100);

    const data: { [key: string]: any } = {
      success,
      // @ts-ignore
      testDuration: round(performance.now() - this.startTime),
      numberOfRounds: this.previousAnswers.length,
      blockingRoundDuration,
      cognitiveProcessingIndex,
      id: v4(),
      date: new Date().toISOString(),
      previousAnswers: this.previousAnswers,
    };

    const resultsPage = new ProcessResultsPage(this.app);
    await resultsPage.show(data);
  }
}
