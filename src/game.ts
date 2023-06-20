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
  currentRound: 0 | 1 | 2 | 3 = 0;

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
    if (lastSelfPacedAnswers.length >= this.config.self_paced.max_wrong) {
      console.log("Found more than 5 wrong answers");
      return this.stop();
    }

    // 3) More than (roughly 12) correct answers that are less than (roughly 3000ms)
    // But not (roughly 4) correct answers in a row
    const lastCorrectAnswers = lastSelfPacedAnswers.filter((answer) => answer.status === "correct");
    if (lastCorrectAnswers.length >= this.config.self_paced.min_correct) {
      console.log("Found more than 12 correct answers without 4 in a row");
      return this.stop();
    }

    // 4) If (roughly 4) correct answers in a row
    // We move to the next round
    const lastNAnswers = lastSelfPacedAnswers.slice(-this.config.self_paced.max_right_count);
    if (lastNAnswers.filter((answer) => answer.status === "correct").length === this.config.self_paced.max_right_count) {
      this.currentRound = 2;
      // Set machine paced timeout
      this.currentTimeout =
        Math.min(lastNAnswers.map((answer) => answer.timedelta).reduce((a, b) => a + b, 0) / 4, this.config.machine_paced.max_start_duration) -
        this.config.machine_paced.slowdown.initial_duration; // Minimim response time (roughly 100ms)

      console.log(`Found ${this.config.self_paced.max_right_count} correct answers in a row`, {
        currentTimeout: this.currentTimeout,
        lastNAnswers,
      });
      // Call next round
      return this.machinePacedRound();
    }
    this.previousRound = 1;
  }

  /**
   * Round type 2
   * @return {void}
   */
  machinePacedRound(): void {
    console.log("Machine paced round");

    // 1) Set no response timeout from the average of the last 4 answers (roughly 1500ms)
    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(this.nextRound.bind(this), this.currentTimeout);

    // 2) Determine speedup and slowdown amount based on the ratio last answer
    if (this.previousRound === 1) return;

    const lastAnswer = this.previousAnswers[this.previousAnswers.length - 1];
    if (lastAnswer.status === "correct") this.currentRound -= (lastAnswer.ratio - 1.0) * this.config.machine_paced.speedup.speedup_with_ratio_amount;
    else if (lastAnswer.status === "incorrect") this.currentRound += this.config.machine_paced.slowdown.base_duration;

    this.previousRound = 2;
  }

  /**
   * Round type 3
   * @return {void}
   */
  postBlockRound(): void {}

  /**
   * Button clicked
   * @param {number | boolean} location The location of the button clicked or false if no response
   * @return {void}
   */
  public buttonClicked(location: number | boolean): void {
    const previousAnswer = this.previousAnswers[this.previousAnswers.length - 1];
    const previousTime = previousAnswer ? previousAnswer.time : this.startTime;

    let timeTaken = performance.now() - previousTime;
    let answer = this.answer;
    let status = location === false ? "no response" : location === this.answer ? "correct" : "incorrect";

    if (this.config.machine_paced.minimum_response_time > timeTaken) {
      if (previousAnswer && previousAnswer.status === "no response" && location === previousAnswer.answerLocation) {
        status = "correct";
        answer = this.previousAnswers[this.previousAnswers.length - 1].answerLocation;
        timeTaken = timeTaken + previousAnswer.timedelta;
      }
    }

    // Log answer
    const data: { [key: string]: number | string | undefined | null } = {
      status, // correct, incorrect, no response
      answerLocation: answer, // Location of answer
      // Current duration (timeout)
      // duration: this.currentRoundType !== "postblock" ? this.currentDuration : -1,
      round: this.previousAnswers.length + 1, // Round number
      roundType: this.previousRound, // Round type
      timedelta: timeTaken, // Time delta between previous answer
      // Ratio of time taken to respond to time given
      ratio: this.currentTimeout === -1 ? 0 : (performance.now() - previousTime) / this.currentTimeout,
      time: performance.now(), // Time of answer
    };

    // if (this.currentRoundType === "machine-paced") {
    //   data["lastCorrectAnswers"] = `${this.getCorrectAnswers()}/${this.config.machine_paced.rolling_average.mean_size}`;
    // }

    this.previousAnswers.push(data);
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
