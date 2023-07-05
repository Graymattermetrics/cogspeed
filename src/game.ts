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
 * 4: self-paced restart
 * 5: final rounds
 *
 * The way in which each round is handled is as follows:
 * buttonClicked -> nextRound -> round -> stop | nextRound
 * The round function is called to create timers for the round
 *
 *
 * @param {Application} app The pixi application
 * @param {object} config The config holding the game settings
 * @param {CogSpeedGraphicsHandler} ui The ui handler
 * @return {void}
 */
export class CogSpeedGame {
  // Time
  startTime: number = -1;
  currentTimeout: number = -1;

  // Round types
  currentRound: 0 | 1 | 2 | 3 | 4 | 5 = 0;

  // Hold the timeout of the last two blocks
  previousBlockTimeouts: number[] = [-1];

  // Answers
  answer: number = -1;
  previousAnswers: { [key: string]: any }[] = [];

  // Timers
  maxTestTimeout: NodeJS.Timeout | undefined;
  currentRoundTimeout: NodeJS.Timeout | undefined;

  constructor(
    public config: { [key: string]: any },
    private app: Application | null = null,
    private ui: CogSpeedGraphicsHandler | null = null
  ) {}

  /**
   * Returns the ratio of correct to incorrect
   * answers in the rolling mean
   */
  getIncorrectRollingMean(): number {
    // Create rolling mean answers of last machine paced answers up to the last post-block round
    let lastNonMachinePacedRound = this.previousAnswers
      .slice()
      .reverse()
      .findIndex((answer: { [key: string]: any }) => answer.roundType !== 2);
    if (lastNonMachinePacedRound === -1) lastNonMachinePacedRound = 0;

    const lastRollingMeanAnswers = this.previousAnswers.slice(-lastNonMachinePacedRound);
    // Get the correct answers (count answers as correct if the rolling mean is not large enough)
    const incorrectAnswers = lastRollingMeanAnswers.filter((answer) =>
      ["incorrect", "no response"].includes(answer.status)
    ).length;
    return incorrectAnswers / this.config.machine_paced.rolling_average.mean_size;
  }

  /**
   * Simply runs the next round
   */
  nextRound(): void {
    this.ui?.clearStage();

    // Create random answer location
    // Pick random number from 1-6 excluding the previous answer
    const numbers = [1, 2, 3, 4, 5, 6];
    numbers.splice(numbers.indexOf(this.answer), 1);
    const answerLocation = numbers[Math.floor(Math.random() * numbers.length)];
    // const answerLocation = 1;
    this.answer = answerLocation;

    // Set display sprites
    this.ui?.setDisplayNumbers(answerLocation);

    const rounds = {
      0: this.trainingRound,
      1: this.selfPacedStartupRound,
      2: this.machinePacedRound,
      3: this.postBlockRound,
      4: this.selfPacedRestartRound,
      5: this.finalRounds,
    };
    rounds[this.currentRound].bind(this)();
  }

  /**
   * [One] self paced round without a timeout
   * Round type 0
   * @return {void}
   */
  async trainingRound(): Promise<void> {
    // Check how many training rounds have been completed
    const lastTrainingAnswers = this.previousAnswers.filter((answer) => answer.roundType === 0);
    if (lastTrainingAnswers.length === this.config.self_paced.number_of_training_rounds) {
      this.currentRound = 1;
      return this.selfPacedStartupRound();
    }
    this.currentRoundTimeout = setTimeout(
      this.stop.bind(this),
      this.config.timeouts.max_initial_no_response
    );
  }

  /**
   * Round type 1
   * @return {Promise <void>}
   */
  async selfPacedStartupRound(): Promise<void> {
    // 1) Set no response timeout (roughly 6000ms)
    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(
      this.stop.bind(this),
      this.config.self_paced.no_response_duration
    );

    // 2) Max wrong limit (roughly 5)
    const selfPacedAnswers = this.previousAnswers.filter((answer) => answer.roundType === 1);
    const wrongAnswers = selfPacedAnswers.filter((answer) => answer.status === "incorrect");
    if (wrongAnswers.length >= this.config.self_paced.max_wrong_count) return this.stop();

    // 3) More than (roughly 12) correct answers that are less than (roughly 3000ms)
    // But not (roughly 4) correct answers in a row
    const correctAnswers = selfPacedAnswers.filter(
      (answer) =>
        answer.status === "correct" &&
        answer.timeTaken <= this.config.self_paced.max_correct_duration
    );
    if (correctAnswers.length >= this.config.self_paced.total_correct_count) return this.stop();

    // 4) If (roughly 4) correct answers in a row
    // We move to the next round
    const lastNAnswers = selfPacedAnswers.slice(-this.config.self_paced.max_right_count);
    if (
      lastNAnswers.filter((answer) => answer.status === "correct").length ===
      this.config.self_paced.max_right_count
    ) {
      this.currentRound = 2;
      // Set machine paced timeout
      this.currentTimeout =
        Math.min(
          lastNAnswers.map((answer) => answer.timeTaken).reduce((a, b) => a + b, 0) / 4,
          this.config.machine_paced.max_start_duration
        ) - this.config.machine_paced.slowdown.initial_duration; // Minimim response time (roughly 100ms)
      // Call next round
      return this.machinePacedRound();
    }
  }

  /**
   * Round type 2
   * @return {Promise <void>}
   */
  async machinePacedRound(): Promise<void> {
    // 1) Determine speedup and slowdown amount based on the ratio last answer
    const lastAnswer = this.previousAnswers.slice(-1).filter((answer) => answer.roundType === 2)[0];
    // If there is a last answer, change the timeout
    if (lastAnswer) {
      if (lastAnswer.status === "correct") {
        // If the answer is correct, speed up the timeout
        this.currentTimeout +=
          (lastAnswer.ratio - 1.0) * this.config.machine_paced.speedup.speedup_with_ratio_amount;
      } else if (lastAnswer.status === "incorrect") {
        // If the answer is incorrect, slow down the timeout
        this.currentTimeout += this.config.machine_paced.slowdown.base_duration;
      }
    }

    // 2) Determine if the last (roughly 2) answers were no response
    // Indicating that the user has blocked
    const lastNAnswers = this.previousAnswers
      .slice(-this.config.machine_paced.blocking.no_input_count)
      .filter((answer) => answer.roundType === 2);
    if (
      lastNAnswers.filter((answer) => answer.status === "no response").length ===
      this.config.machine_paced.blocking.no_input_count
    ) {
      this.currentRound = 3;
      // Add the block time to the previousBlockTimeouts
      this.previousBlockTimeouts.push(this.currentTimeout);
      // Slow down the timeout (roughly 275ms)
      this.currentTimeout += this.config.machine_paced.blocking.slow_down_duration;
      return this.postBlockRound();
    }

    if (lastAnswer) {
      // 3) Roll mean limit exceeded
      // So we place the user in an SP Restart Phase
      const incorrectRatio = this.getIncorrectRollingMean();
      if (incorrectRatio > this.config.machine_paced.rolling_average.threshold) {
        this.currentRound = 4;
        return this.selfPacedRestartRound();
      }
    }

    // Set no response timeout from the average of the last 4 answers (roughly 1500ms)
    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(this.buttonClicked.bind(this), this.currentTimeout);
  }

  /**
   * Round type 3
   * Simulates a mini self paced environment after a block
   * In order to act as a cooldown period
   * @return {Promise <void>}
   */
  async postBlockRound(): Promise<void> {
    const lastTwoBlocks = this.previousBlockTimeouts.slice(-2);
    // 1) If the last two blocks are within (roughly 135ms) of each other then the test is a success
    if (
      lastTwoBlocks.length === 2 &&
      Math.abs(lastTwoBlocks[0] - lastTwoBlocks[1]) <
        this.config.machine_paced.blocking.duration_delta
    ) {
      this.currentRound = 5;
      return this.finalRounds();
    }

    // If there are too many blocks (roughly 6) the test must exit
    if (
      this.previousBlockTimeouts.length ===
      this.config.machine_paced.blocking.max_block_count - 1
    ) {
      return this.stop();
    }

    // 2) We can exit post-block successfully with (roughly 2) correct answers in a row
    // If the last (roughly 2) answers were correct, continue to machine paced
    const lastNAnswers = this.previousAnswers
      .slice(-this.config.machine_paced.blocking.min_correct_answers)
      .filter((answer) => answer.roundType === 3);
    if (
      lastNAnswers.filter((answer) => answer.status === "correct").length ===
      this.config.machine_paced.blocking.min_correct_answers
    ) {
      this.currentRound = 2;
      return this.machinePacedRound();
    }

    // 3) If there are (roughly 3) answers wrong before (roughly 2) correct answers in a row
    // So end test unsuccessfully
    const lastPostBlockAnswers = this.previousAnswers.filter((answer) => answer.roundType === 3);
    if (
      lastPostBlockAnswers.filter((answer) => answer.status === "incorrect").length ===
      this.config.machine_paced.blocking.max_wrong_answers
    )
      return this.stop(false);

    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(
      this.stop.bind(this),
      this.config.machine_paced.blocking.no_response_duration
    );
  }

  /**
   * Round type 4
   *
   * While this function is similar to postBlockRound, there are subtle differences
   * which would make it difficult to merge the two functions
   * @return {Promise <void>}
   */
  async selfPacedRestartRound(): Promise<void> {
    // 1) We can exit self paced restart successfully with (roughly 2) correct answers in a row
    // If the last (roughly 2) answers were correct, continue to machine paced
    const lastNAnswers = this.previousAnswers
      .slice(-this.config.machine_paced.blocking.min_correct_answers)
      .filter((answer) => answer.roundType === 4);
    if (
      lastNAnswers.filter((answer) => answer.status === "correct").length ===
      this.config.machine_paced.blocking.min_correct_answers
    ) {
      this.currentRound = 2;
      this.currentTimeout -= this.config.machine_paced.slowdown.base_duration;
      return this.machinePacedRound();
    }

    // 2) If there are (roughly 3) answers wrong before (roughly 2) correct answers in a row
    // So end test unsuccessfully
    const lastNonSelfPacedRestartAnswer = this.previousAnswers
      .slice()
      .reverse()
      .findIndex((answer) => answer.roundType !== 4);

    const lastSelfPacedRestartAnswers = this.previousAnswers
      .slice(-lastNonSelfPacedRestartAnswer)
      .filter((answer) => answer.roundType === 4);
    if (
      lastSelfPacedRestartAnswers.filter((answer) => answer.status === "incorrect").length ===
      this.config.machine_paced.blocking.max_wrong_answers
    )
      return this.stop(false);

    clearTimeout(this.currentRoundTimeout);
  }

  /**
   * Round type 5
   *
   * The final unscored rounds
   */
  async finalRounds(): Promise<void> {
    const lastNRounds = this.previousAnswers
      .slice(-this.config.number_of_endmode_rounds)
      .filter((answer) => answer.roundType === 5);
    if (lastNRounds.length === this.config.number_of_endmode_rounds) {
      return this.stop(true);
    }
    clearTimeout(this.currentRoundTimeout);
  }

  /**
   * Button clicked
   * @param {number | boolean} location The location of the button clicked or false if no response
   * @param {number} timeClicked The time (performance.now) the button was clicked
   * @return {void}
   */
  public buttonClicked(location: number | null = null, timeClicked: number | null = null): void {
    timeClicked = timeClicked || performance.now();

    const previousAnswer = this.previousAnswers[this.previousAnswers.length - 1];
    const previousTime = previousAnswer ? previousAnswer._time_epoch : this.startTime;

    let timeTaken = timeClicked - previousTime;
    let answer = this.answer;
    let status =
      location === null ? "no response" : location === this.answer ? "correct" : "incorrect";
    let isCorrectFromPrevious = false;
    let ratio = this.currentTimeout === -1 ? 0 : (timeClicked - previousTime) / this.currentTimeout;

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
    const data: { [key: string]: number | string | null | boolean } = {
      status, // correct, incorrect, no response
      answerLocation: answer, // Location of answer
      // Current duration (timeout)
      duration: this.currentTimeout,
      roundNumber: this.previousAnswers.length + 1, // Round number
      roundType: this.currentRound, // Round type
      timeTaken, // Time delta between previous answer
      // Ratio of time taken to respond to time given
      isCorrectFromPrevious, // If the answer was correct from the previous answer
      ratio,
      _time_epoch: timeClicked, // Time of answer
    };

    // if (this.currentRoundType === "machine-paced") {
    //   data["lastCorrectAnswers"] = `${this.getCorrectAnswers()}/${this.config.machine_paced.rolling_average.mean_size}`;
    // }

    this.previousAnswers.push(data);
    console.log(this.previousAnswers);
    this.nextRound();
  }

  /**
   * Starts the game
   * @return {void}
   * @return {Promise<void>}
   */
  public async start(time: number | null = null): Promise<void> {
    this.ui?.setupGame(this);

    this.startTime = time === null ? performance.now() : time;
    this.maxTestTimeout = setTimeout(this.stop.bind(this), this.config.timeouts.max_test_duration);
    this.nextRound();
  }

  public async stop(success: boolean = false): Promise<void> {
    if (!this.app) return;

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
    const cognitiveProcessingIndex = round(
      M * (blockingRoundDuration - this.config.cpi_calculation.brd_min) + 100
    );

    const firstMachinePacedRound: { [key: string]: any } | undefined = this.previousAnswers.filter(
      (answer: { [key: string]: any }) => answer.roundType === 2
    )[0];

    const data: { [key: string]: any } = {
      success,
      testDuration: round(performance.now() - this.startTime),
      numberOfRounds: this.previousAnswers.length,
      blockingRoundDuration,
      cognitiveProcessingIndex,
      id: v4(),
      date: new Date().toISOString(),
      previousAnswers: this.previousAnswers,
      machinePacedBaseline: firstMachinePacedRound?.duration,
      version: this.config.version,
    };

    const resultsPage = new ProcessResultsPage(this.app);
    await resultsPage.show(data);
  }
}
