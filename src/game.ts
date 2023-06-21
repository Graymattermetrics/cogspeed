import { Application } from "pixi.js";
import { CogSpeedGraphicsHandler } from "./ui/handler";

import { v4 } from "uuid";
import { ProcessResultsPage } from "./processResultsPage";

/**
 * Cogspeed game that handles button clicks,
 * Starting and stopping the game and rounds
 *
 * Note the order of the rounds is as follows:
 * 0: training
 * 1: self-paced startup
 * 2: machine-paced
 * 3: postblock
 *
 * The way in which each round is handled is as follows:
 * buttonClicked -> nextRound -> round -> stop | nextRound
 * First the round function is called to create timers for the round
 *
 *
 * @param {Application} app The pixi application
 * @param {object} config The config holding the game settings
 * @param {CogSpeedGraphicsHandler} ui The ui handler
 * @return {void}
 */
export class CogSpeedGame {
  // Time
  startTime: number | undefined;
  currentTimeout: number = -1;

  // Round types
  previousRound: 0 | 1 | 2 | 3 = 0;
  currentRound: 0 | 1 | 2 | 3 = 1;

  // Hold the timeout of the last two blocks
  previousBlockTimeouts: number[] = [-1];

  // Answers
  answer: number | undefined;
  previousAnswers: { [key: string]: any }[] = [];

  // Timers
  maxTestTimeout: NodeJS.Timeout | undefined;
  currentRoundTimeout: NodeJS.Timeout | undefined;

  constructor(private app: Application, private config: { [key: string]: any }, private ui: CogSpeedGraphicsHandler) {}

  /**
   * Simply runs the next round
   */
  nextRound(): void {
    this.ui.clearStage();

    // Create random answer location
    const answerLocation = Math.floor(Math.random() * 6) + 1; // 1-6
    // const answerLocation = 1;
    this.answer = answerLocation;

    // Set display sprites
    this.ui.setDisplayNumbers(answerLocation);

    const rounds = {
      0: this.trainingRound,
      1: this.selfPacedStartupRound,
      2: this.machinePacedRound,
      3: this.postBlockRound,
    };
    rounds[this.currentRound].bind(this)();
  }

  /**
   * [One] self paced round without a timeout
   * Round type 0
   * @return {void}
   */
  trainingRound(): void {
    console.log("Training round");

    this.currentRound = 1;
    this.previousRound = 0;

    // Note: No need to call the next round as there is
    // only one training round
  }

  /**
   * Round type 1
   * @return {void | Promise<void>}
   */
  selfPacedStartupRound(): void | Promise<void> {
    console.log("Self paced startup round");

    // 1) Set no response timeout (roughly 6000ms)
    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(this.stop.bind(this), this.config.self_paced.no_response_duration);

    // 2) Max wrong limit (roughly 5)
    const lastSelfPacedAnswers = this.previousAnswers.filter((answer) => answer.roundType === 1);
    if (lastSelfPacedAnswers.length >= this.config.self_paced.max_wrong) return this.stop();

    // 3) More than (roughly 12) correct answers that are less than (roughly 3000ms)
    // But not (roughly 4) correct answers in a row
    const lastCorrectAnswers = lastSelfPacedAnswers.filter((answer) => answer.status === "correct");
    if (lastCorrectAnswers.length >= this.config.self_paced.min_correct) return this.stop();

    // 4) If (roughly 4) correct answers in a row
    // We move to the next round
    const lastNAnswers = lastSelfPacedAnswers.slice(-this.config.self_paced.max_right_count);
    if (lastNAnswers.filter((answer) => answer.status === "correct").length === this.config.self_paced.max_right_count) {
      this.currentRound = 2;
      // Set machine paced timeout
      this.currentTimeout =
        Math.min(lastNAnswers.map((answer) => answer.timeTaken).reduce((a, b) => a + b, 0) / 4, this.config.machine_paced.max_start_duration) -
        this.config.machine_paced.slowdown.initial_duration; // Minimim response time (roughly 100ms)
      // Call next round
      return this.machinePacedRound(true);
    }
    this.previousRound = 1;
  }

  /**
   * Round type 2
   * @return {void | Promise<void>}
   */
  machinePacedRound(called: boolean = false): void | Promise<void> {
    console.log("Machine paced round");

    // 1) Determine speedup and slowdown amount based on the ratio last answer
    const lastAnswer = this.previousAnswers.filter((answer) => answer.roundType === 2).slice(-1)[0];
    // If there is a last answer, change the timeout
    if (lastAnswer) {
      if (lastAnswer.status === "correct") {
        // If the answer is correct, speed up the timeout
        console.log("Speeding up", {
          ratio: lastAnswer.ratio,
          timeout: this.currentTimeout,
          newTimeout: this.currentTimeout + (lastAnswer.ratio - 1.0) * this.config.machine_paced.speedup.speedup_with_ratio_amount,
        });
        this.currentTimeout += (lastAnswer.ratio - 1.0) * this.config.machine_paced.speedup.speedup_with_ratio_amount;
      } else if (lastAnswer.status === "incorrect") {
        // If the answer is incorrect, slow down the timeout
        console.log("Slowing down", {
          ratio: lastAnswer.ratio,
          timeout: this.currentTimeout,
          newTimeout: this.currentTimeout + this.config.machine_paced.slowdown.base_duration,
        });
        this.currentTimeout += this.config.machine_paced.slowdown.base_duration;
      }
    }

    // 2) Determine if the last (roughly 2) answers were no response
    // Indicating that the user has blocked
    const lastNAnswers = this.previousAnswers.slice(-this.config.machine_paced.blocking.no_input_count).filter((answer) => answer.roundType === 2);
    if (lastNAnswers.filter((answer) => answer.status === "no response").length === this.config.machine_paced.blocking.no_input_count) {
      this.currentRound = 3;
      // Add the block time to the previousBlockTimeouts
      this.previousBlockTimeouts.push(this.currentTimeout);
      // Slow down the timeout (roughly 275ms)
      this.currentTimeout += this.config.machine_paced.blocking.slow_down_duration;
      return this.postBlockRound(true);
    }

    // Set no response timeout from the average of the last 4 answers (roughly 1500ms)
    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(this.buttonClicked.bind(this), this.currentTimeout);
    // Set the previousRound as machine paced
    this.previousRound = 2;
  }

  /**
   * Round type 3
   * Simulates a mini self paced environment after a block
   * In order to act as a cooldown period
   * @return {void | Promise<void>}
   */
  postBlockRound(called: boolean = false): void | Promise<void> {
    if (called) console.log("Block!");
    else console.log("Post block round");

    const lastTwoBlocks = this.previousBlockTimeouts.slice(-2);
    // 1) If the last two blocks are within (roughly 135ms) of each other then the test is a success
    if (lastTwoBlocks.length === 2 && Math.abs(lastTwoBlocks[0] - lastTwoBlocks[1]) < this.config.machine_paced.blocking.duration_delta)
      return this.stop(true);

    // 2) We can exit post-block successfully with (roughly 2) correct answers in a row
    // If the last (roughly 2) answers were correct, continue to machine paced
    const lastNAnswers = this.previousAnswers
      .slice(-this.config.machine_paced.blocking.min_correct_answers)
      .filter((answer) => answer.roundType === 3);
    console.log(lastNAnswers);
    if (lastNAnswers.filter((answer) => answer.status === "correct").length === this.config.machine_paced.blocking.min_correct_answers) {
      this.currentRound = 2;
      return this.machinePacedRound(true);
    }

    // 3) If there are (roughly 3) answers wrong before (roughly 2) correct answers in a row
    // So end test unsuccessfully
    const lastPostBlockAnswers = this.previousAnswers.filter((answer) => answer.roundType === 3);
    if (lastPostBlockAnswers.filter((answer) => answer.status === "incorrect").length === this.config.machine_paced.blocking.max_wrong_answers)
      return this.stop(false);

    clearTimeout(this.currentRoundTimeout);
    this.previousRound = 3;
  }

  /**
   * Button clicked
   * @param {number | boolean} location The location of the button clicked or false if no response
   * @return {void}
   */
  public buttonClicked(location: number | boolean = false): void {
    const previousAnswer = this.previousAnswers[this.previousAnswers.length - 1];
    const previousTime = previousAnswer ? previousAnswer._time_epoch : this.startTime;

    let timeTaken = performance.now() - previousTime;
    let answer = this.answer;
    let status = location === false ? "no response" : location === this.answer ? "correct" : "incorrect";
    let isCorrectFromPrevious = false;
    let ratio = this.currentTimeout === -1 ? 0 : (performance.now() - previousTime) / this.currentTimeout;

    if (
      previousAnswer &&
      previousAnswer.status === "no response" &&
      this.config.machine_paced.minimum_response_time > timeTaken &&
      location === previousAnswer.answerLocation
    ) {
      // The answer is correct for the previous answer
      status = "correct";
      answer = this.previousAnswers[this.previousAnswers.length - 1].answerLocation;
      timeTaken = timeTaken + previousAnswer.timeTaken;
      isCorrectFromPrevious = true;

      // Update ratio (> 1)
      ratio = timeTaken / this.currentTimeout;
    }

    // Log answer
    const data: { [key: string]: number | string | undefined | null | boolean } = {
      status, // correct, incorrect, no response
      answerLocation: answer, // Location of answer
      // Current duration (timeout)
      duration: this.currentTimeout,
      roundNumber: this.previousAnswers.length + 1, // Round number
      roundType: this.previousRound, // Round type
      timeTaken, // Time delta between previous answer
      // Ratio of time taken to respond to time given
      isCorrectFromPrevious, // If the answer was correct from the previous answer
      ratio,
      _time_epoch: performance.now(), // Time of answer
    };

    // if (this.currentRoundType === "machine-paced") {
    //   data["lastCorrectAnswers"] = `${this.getCorrectAnswers()}/${this.config.machine_paced.rolling_average.mean_size}`;
    // }

    this.previousAnswers.push(data);
    console.log(this.previousAnswers, this.previousBlockTimeouts);
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
    this.maxTestTimeout = setTimeout(this.stop.bind(this), this.config.timeouts.max_test_duration);
    this.nextRound();
  }

  public async stop(success: boolean = false): Promise<void> {
    for (var i = this.app.stage.children.length - 1; i >= 0; i--) {
      this.app.stage.removeChild(this.app.stage.children[i]);
    }

    const round = (num: number, sf: number = 3) => {
      return Math.round((num * 10 ** sf) / 10 ** sf);
    };

    const sumOfLastTwoBlocks = this.previousBlockTimeouts.slice(-2).reduce((a, b) => a + b, 0);
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
