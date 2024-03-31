import { Application } from "pixi.js";
import { CogSpeedGraphicsHandler } from "../ui/handler";

import { v4 } from "uuid";
import { Config } from "../types/Config";
import { GameAnswer } from "../types/GameAnswer";
import { SleepData } from "../types/SleepData";
import { ProcessResultsPage } from "./results";

/**
 * Cogspeed game that handles button clicks,
 * Starting and stopping the game and rounds
 *
 * Note the order of the rounds is as follows:
 * 0: training
 * 1: practice
 * 2: self-paced startup
 * 3: machine-paced
 * 4: postblock
 * 5: self-paced restart
 * 6: final rounds
 * 
 * The way in which each round is handled is as follows:
 * buttonClicked -> nextRound -> round -> stop | nextRound
 * The round function is called to create timers for the round
 *
 * @param {Application} app The pixi application
 * @param {object} config The config holding the game settings
 * @param {CogSpeedGraphicsHandler} ui The ui handler
 * @return {void}
 * 
 * @see https://dub.sh/cogspeed-protocol
 */
export class CogSpeedGame {
  // Time
  startTime: number = -1;
  currentTimeout: number = -1;

  // Round types
  currentRound: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0;

  // Hold the timeout of the last two blocks
  previousBlockTimeouts: number[] = [-1];
  numberOfRollMeanLimitExceedences: number = 0;

  // Answers
  answer: number = -1;
  query: { queryNumber: number; numbersOrDots: "numbers" | "dots" } = {
    queryNumber: -1,
    numbersOrDots: "numbers",
  };
  previousAnswers: GameAnswer[] = [];

  // Timers
  maxTestTimeout: NodeJS.Timeout | undefined;
  currentRoundTimeout: NodeJS.Timeout | undefined;

  constructor(
    public config: Config,
    private app: Application | null = null,
    private ui: CogSpeedGraphicsHandler | null = null,
    private sleepData: SleepData | null = null,
  ) {}

  /**
   * Returns the fraction of correct answers in the rolling mean
   */
  getCorrectRollingMean(): number {
    let correctAnswers = 0;
    let totalAnswers = 0;

    let i = this.previousAnswers.length - 1;
    while (this.config.machine_paced.rolling_average.mean_size > totalAnswers) {
      const answer = this.previousAnswers[i];
      if (!answer || answer.roundType !== 3) break;

      if (answer.isCorrectOrIncorrectFromPrevious) {
        if (answer.status === "correct") correctAnswers += 1;
        else if (answer.status === "no response") break;
        // Skip the no response
        i--;
      } else if (answer.status === "correct") correctAnswers += 1;

      totalAnswers++;
      i--;
    }
    // If the rolling mean is not large enough, default the remaining responses to correct
    if (this.config.machine_paced.rolling_average.mean_size > totalAnswers) {
      correctAnswers += this.config.machine_paced.rolling_average.mean_size - totalAnswers;
    }
    return correctAnswers / this.config.machine_paced.rolling_average.mean_size;
  }

  /**
   * Simply runs the next round
   */
  nextRound() {
    this.ui?.clearStage();

    // Create random answer location
    // Pick random number from 1-6 excluding the previous answer
    const numbers = [1, 2, 3, 4, 5, 6];
    numbers.splice(numbers.indexOf(this.answer), 1);

    const answerLocation = numbers[Math.floor(Math.random() * numbers.length)];
    this.answer = answerLocation;

    // Randomize query number and number or dots again excluding the previous answer
    const queryNumber = Math.floor(Math.random() * 9) + 1;
    let numbersOrDots: "dots" | "numbers" = Math.random() > 0.5 ? "numbers" : "dots";
    // The query number is the same as last round, so invert the numbersordots
    if (queryNumber === this.query["queryNumber"]) {
      numbersOrDots = this.query["numbersOrDots"] === "numbers" ? "dots" : "numbers";
    }

    this.query = {queryNumber, numbersOrDots};

    // Set display sprites
    this.ui?.setDisplayNumbers(answerLocation, queryNumber, numbersOrDots);

    const rounds = {
      0: this.trainingRound,
      1: this.practiceMode,
      2: this.selfPacedStartupRound,
      3: this.machinePacedRound,
      4: this.postBlockRound,
      5: this.selfPacedRestartRound,
      6: this.finalRounds,
    };
    rounds[this.currentRound].bind(this)();
  }

  async displayCorrectAnswer() {
    if (!this.ui?.inputButtons) return;

    const answerSprite = this.ui.inputButtons[6 - this.answer];
    for (let i = 0; i < 3; i ++){ 
      this.ui.rippleAnimation(answerSprite);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // TODO: Exit if incorrect button was pressed immediately 
    if (await this.ui.waitForKeyPress(answerSprite, this.config.practice_mode.no_response_duration)) {
      return
    }
    return this.stop(4);
  }

  /**
   * Un-prejudiced training rounds to remind the user how to perform
   * the cogspeed test.
   * 
   * 1. Sets timeout of max initial no response time [exit unsuccessfully]
   * 
   * Round type 0
   */
  async trainingRound() {
    // Check how many training rounds have been completed
    const lastTrainingAnswers = this.previousAnswers.filter((answer) => answer.roundType === 0);
    if (lastTrainingAnswers.length === this.config.self_paced.number_of_training_rounds) {
      this.currentRound = 1;
      return this.practiceMode();
    }
    this.currentRoundTimeout = setTimeout(this.stop.bind(this), this.config.timeouts.max_initial_no_response);
  }

  /**
   * This mode consists of (roughly 20) screens to allow the user to become 
   * acquitted with taking the CogSpeed test. If in these 20 screens, 4 correct
   * answers in a row have not been obtained with an art of ``right_count_art_less_than``
   * then the test fails.
   * 
   * 
   * 
   * Round type 1
   */
  async practiceMode() {
    // 1) Set no response timeout 
    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(this.displayCorrectAnswer.bind(this), this.config.practice_mode.no_response_duration);
    
    const practiceTestAnswers = this.previousAnswers.filter((answer) => answer.roundType === 1);

    // 2) If there have been (roughly 4) correct answers in a row under (roughly 2600ms), continue to self-paced
    if (practiceTestAnswers.slice(-this.config.practice_mode.max_right_count).filter((answer) => answer.status === "correct").length === this.config.practice_mode.max_right_count
    && practiceTestAnswers.slice(-this.config.practice_mode.max_right_count).reduce((a, b) => a + b.timeTaken, 0) / this.config.practice_mode.max_right_count < this.config.practice_mode.right_count_art_less_than) {
      this.currentRound = 2;
      return this.selfPacedStartupRound();
    }
    
    // 2) If more than (roughly 20) answers have occurred without (roughly 4) successful answers, exit test unsuccessfully
    if (practiceTestAnswers.length > this.config.practice_mode.total_answer_count) {
      return this.stop(4);
    }
  }

  /**
   * Self paced startup rounds to deduce a baseline to start the 
   * machine-paced at.
   * 
   * 1. Sets no response timeout for self-paced rounds [exit unsuccessfully]
   * 2. Checks for max-wrong limit within the self-paced startup rounds [exit unsuccessfully]
   * 3. Checks for more than total-correct-count without max-right-count in a row [exit unsuccessfully]
   * 4. Checks for max-right-count in a row -> [next round]
   * 
   * Round type 2
   */
  async selfPacedStartupRound() {
    // 1) Set no response timeout (roughly 6000ms)
    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(this.stop.bind(this), this.config.self_paced.no_response_duration);

    // 2) Max wrong limit (roughly 5)
    const selfPacedAnswers = this.previousAnswers.filter((answer) => answer.roundType === 2);
    const wrongAnswers = selfPacedAnswers.filter((answer) => answer.status === "incorrect");
    if (wrongAnswers.length >= this.config.self_paced.max_wrong_count) return this.stop(2);

    // 3) More than (roughly 12) correct answers that are less than (roughly 3000ms)
    // But not (roughly 4) correct answers in a row
    const correctAnswers = selfPacedAnswers.filter(
      (answer) => answer.status === "correct" && answer.timeTaken <= this.config.self_paced.max_correct_duration,
    );
    if (correctAnswers.length >= this.config.self_paced.total_correct_count) return this.stop(2);

    // 4) If (roughly 4) correct answers in a row
    // We move to the next round
    const lastNAnswers = selfPacedAnswers.slice(-this.config.self_paced.max_right_count);
    if (lastNAnswers.filter((answer) => answer.status === "correct").length === this.config.self_paced.max_right_count) {
      this.currentRound = 3;
      // Set machine paced timeout
      this.currentTimeout =
        Math.min(
          lastNAnswers.map((answer) => answer.timeTaken).reduce((a, b) => a + b, 0) / 4,
          this.config.machine_paced.max_start_duration,
        ) - this.config.machine_paced.initial_speedup_amount; // Minimum response time (roughly 100ms)
      // Call next round
      return this.machinePacedRound();
    }
  }

  /**
   * Machine paced rounds attempt to force a block by slowly increasing the timeout
   * 
   * 1. Determine speedup and slowdown [speed]
   * 2. Check if the last no-input number of answers were no input [block]
   * 3. Check if roll mean limit exceeded [go to self-paced-restart mode]
   * 4. Set no response timeout [next round]
   * 
   * Round type 3
   */
  async machinePacedRound() {
    // 1) Determine speedup and slowdown amount based on the ratio last answer
    const lastAnswer = this.previousAnswers.slice(-1).filter((answer) => answer.roundType === 3)[0];
    // If there is a last answer, change the timeout
    if (lastAnswer) {
      if (lastAnswer.status === "correct") {
        // If the answer is correct, speed up the timeout
        let speedupAmount =
          (this.config.machine_paced.correct.x * lastAnswer.ratio - this.config.machine_paced.correct.y) * this.currentTimeout;

        // If the speedup time is greater than 0, limit it to the max speedup amount
        if (speedupAmount > 0) speedupAmount = Math.min(speedupAmount, this.config.machine_paced.correct.max_slowdown_amount);
        // If the speedup time is less than 0, limit it to the max slowdown amount
        else speedupAmount = Math.max(speedupAmount, -this.config.machine_paced.correct.max_speedup_amount);
        this.currentTimeout += speedupAmount;
      } else if (lastAnswer.status === "incorrect") {
        // If the answer is incorrect, slow down the timeout
        this.currentTimeout += this.config.machine_paced.incorrect.base_duration;
      }
    }

    // 2) Check if the last (roughly 2) answers were no response
    // Indicating that the user has blocked
    const lastNAnswers = this.previousAnswers
      .slice(-this.config.machine_paced.blocking.no_input_count)
      .filter((answer) => answer.roundType === 3);
    if (
      lastNAnswers.filter((answer) => answer.status === "no response").length ===
      this.config.machine_paced.blocking.no_input_count
    ) {
      this.currentRound = 4;
      // Add the block time to the previousBlockTimeouts
      this.previousBlockTimeouts.push(this.currentTimeout);
      // Slow down the timeout (roughly 275ms)
      this.currentTimeout += this.config.machine_paced.blocking.slow_down_duration;
      return this.postBlockRound();
    }

    if (lastAnswer) {
      // 3) Roll mean limit exceeded
      // So we place the user in an SP Restart Phase
      const correctRatio = this.getCorrectRollingMean();
      if (correctRatio < this.config.machine_paced.rolling_average.threshold) {
        this.currentRound = 5;
        this.numberOfRollMeanLimitExceedences++;
        return this.selfPacedRestartRound();
      }
    }

    // 4) Set no response timeout from the average of the last 4 answers (roughly 1500ms)
    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(this.buttonClicked.bind(this), this.currentTimeout);
  }

  /**
   * Simulates a mini self paced environment after a block
   * Acts as a cooldown period to allow the user to recover.
   * 
   * 1. Checks if two consecutive similar-timed blocks exist [exit successfully]
   * 2. Check if there are too many blocks [exit unsuccessfully]
   * 
   * Round type 4
   */
  async postBlockRound(): Promise<void> {
    const lastTwoBlocks = this.previousBlockTimeouts.slice(-2);
    // 1) If the last two blocks are within (roughly 135ms) of each other then the test is a success
    if (
      lastTwoBlocks.length === 2 &&
      Math.abs(lastTwoBlocks[0] - lastTwoBlocks[1]) < this.config.machine_paced.blocking.duration_delta
    ) {
      this.currentRound = 6;
      return this.finalRounds();
    }

    // 2) If there are too many blocks (roughly 6) the test must exit
    if (this.previousBlockTimeouts.length - 1 === this.config.machine_paced.blocking.max_block_count) {
      return this.stop(3);
    }

    // 3) We can exit post-block successfully with (roughly 2) correct answers in a row
    // If the last (roughly 2) answers were correct, continue to machine paced
    const lastNAnswers = this.previousAnswers
      .slice(-this.config.machine_paced.blocking.min_correct_answers)
      .filter((answer) => answer.roundType === 4);
    if (
      lastNAnswers.filter((answer) => answer.status === "correct").length ===
      this.config.machine_paced.blocking.min_correct_answers
    ) {
      this.currentRound = 3;
      return this.machinePacedRound();
    }

    // 3) If there are (roughly 3) answers wrong before (roughly 2) correct answers in a row
    // So end test unsuccessfully
    const lastPostBlockAnswers = this.previousAnswers.filter((answer) => answer.roundType === 4);
    if (
      lastPostBlockAnswers.filter((answer) => answer.status === "incorrect").length ===
      this.config.machine_paced.blocking.max_wrong_answers
    )
      return this.stop(2);

    clearTimeout(this.currentRoundTimeout);
    this.currentRoundTimeout = setTimeout(this.stop.bind(this), this.config.machine_paced.blocking.no_response_duration);
  }

  /**
   * Self paced restart round that occurs when the correct rolling mean average
   * is below the required threshold.
   * 
   * While this function is similar to postBlockRound, there are subtle differences
   * which would make it difficult to merge the two functions
   *
   * @augments CogSpeedGame.postBlockRound
   * 
   * Round type 5
   */
  async selfPacedRestartRound():Promise<void>  {
    // 1) We can exit self paced restart successfully with (roughly 2) correct answers in a row
    // If the last (roughly 2) answers were correct, continue to machine paced
    const lastNAnswers = this.previousAnswers
      .slice(-this.config.machine_paced.blocking.min_correct_answers)
      .filter((answer) => answer.roundType === 5);
    if (
      lastNAnswers.filter((answer) => answer.status === "correct").length ===
      this.config.machine_paced.blocking.min_correct_answers
    ) {
      this.currentRound = 3;
      this.currentTimeout -= this.config.machine_paced.incorrect.base_duration;
      return this.machinePacedRound();
    }

    // 2) If there are (roughly 3) answers wrong before (roughly 2) correct answers in a row
    // So end test unsuccessfully
    const lastNonSelfPacedRestartAnswer = this.previousAnswers
      .slice()
      .reverse()
      .findIndex((answer) => answer.roundType !== 5);

    const lastSelfPacedRestartAnswers = this.previousAnswers
      .slice(-lastNonSelfPacedRestartAnswer)
      .filter((answer) => answer.roundType === 5);
    if (
      lastSelfPacedRestartAnswers.filter((answer) => answer.status === "incorrect").length ===
      this.config.machine_paced.blocking.max_wrong_answers
    )
      return this.stop(2);

    clearTimeout(this.currentRoundTimeout);
  }

  /**
   * The final unscored rounds that act as confusion rounds.
   * 
   * Round type 6
   */
  async finalRounds() {
    const lastNRounds = this.previousAnswers
      .slice(-this.config.number_of_endmode_rounds)
      .filter((answer) => answer.roundType === 6);
    if (lastNRounds.length === this.config.number_of_endmode_rounds) {
      return this.stop(0); // Successfully exit (only way to successfully exit)
    }
    clearTimeout(this.currentRoundTimeout);
  }

  /**
   * Button clicked
   * @param {number | boolean} location The location of the button clicked or false if no response
   * @param {number} timeClicked The time (performance.now) the button was clicked
   */
  public buttonClicked(location: number | null = null, timeClicked: number | null = null): void {
    timeClicked = timeClicked || performance.now();

    const previousAnswer = this.previousAnswers[this.previousAnswers.length - 1];
    const previousTime = previousAnswer ? previousAnswer._time_epoch : this.startTime;

    let timeTaken = timeClicked - previousTime;
    let answer = this.answer;
    let status = location === null ? "no response" : location === this.answer ? "correct" : "incorrect";
    let isCorrectOrIncorrectFromPrevious: "correct" | "incorrect" | null = null;
    let ratio = this.currentTimeout === -1 ? 0 : (timeClicked - previousTime) / this.currentTimeout;

    if (
      previousAnswer &&
      previousAnswer.status === "no response" &&
      this.config.machine_paced.minimum_response_time > timeTaken &&
      location != null
    ) {
      if (location === previousAnswer.answerLocation) {
        // The answer is correct for the previous answer
        status = "correct";
        isCorrectOrIncorrectFromPrevious = "correct";
      } else {
        // The answer is incorrect from the previous answer
        status = "incorrect";
        isCorrectOrIncorrectFromPrevious = "incorrect";
      }

      // Update ratio (> 1)
      timeTaken += previousAnswer.timeTaken;
      ratio = timeTaken / this.currentTimeout;
    }

    const normalizeRounds = {
      0: "training",
      1: "practice",
      2: "self-paced",
      3: "machine-paced",
      4: "post-block",
      5: "self-paced-restart",
      6: "final",
    };

    // Log answer
    const data: GameAnswer = {
      status,
      roundTypeNormalized: normalizeRounds[this.currentRound],
      answerLocation: answer,
      locationClicked: location, 
      queryNumber: `${this.query["queryNumber"]}${this.query["numbersOrDots"].slice(0, 3)}`,
      duration: this.currentTimeout,
      correctRollingMeanRatio: "n/a", 
      roundNumber: this.previousAnswers.length + 1, 
      roundType: this.currentRound,
      timeTaken, 
      isCorrectOrIncorrectFromPrevious, 
      ratio,
      _time_epoch: timeClicked
    };

    this.previousAnswers.push(data);
    if (this.currentRound === 2) {
      this.previousAnswers[this.previousAnswers.length - 1].correctRollingMeanRatio = this.getCorrectRollingMean();
    }

    this.nextRound();
  }

  /**
   * Starts the game
   */
  public async start(time: number | null = null) {
    this.ui?.setupGame(this);

    this.startTime = time === null ? performance.now() : time;
    this.maxTestTimeout = setTimeout(this.stop.bind(this), this.config.timeouts.max_test_duration);
    this.nextRound();
  }

  /**
   * The status codes link to a message and status in the config
   * for example (0 = "success", 1 = "Timed out...")
   *
   * @param statusCode The status code of the exit
   */
  public async stop(statusCode: number = 1) {
    if (!this.app || !this.ui) return;

    clearTimeout(this.maxTestTimeout);
    clearTimeout(this.currentRoundTimeout);
    const info = this.config.exit_codes[statusCode];
    const status = info.status;
    const message = info.message;

    for (var i = this.app.stage.children.length - 1; i >= 0; i--) {
      this.app.stage.removeChild(this.app.stage.children[i]);
    }

    const round = (num: number, sf: number = 3) => {
      return Math.round((num * 10 ** sf) / 10 ** sf);
    };
    const filterByStatus = (answers: GameAnswer[], status: string) => {
      return answers.filter((answer) => answer.status === status);
    };
    const filterByRoundType = (answers: GameAnswer[], roundType: number) => {
      return answers.filter((answer) => answer.roundType === roundType);
    };
    const mapToTimeTaken = (answers: GameAnswer[]) => {
      return answers.map((answer) => answer.timeTaken);
    };

    const sumOfLastTwoBlocks = this.previousBlockTimeouts.slice(-2).reduce((a, b) => a + b, 0);
    const blockingRoundDuration = round(sumOfLastTwoBlocks / 2);

    // CPImax - CPImin/BRDmin - BRDmax
    const M =
      (this.config.cpi_calculation.cpi_max - this.config.cpi_calculation.cpi_min) /
      (this.config.cpi_calculation.brd_min - this.config.cpi_calculation.brd_max);
    // M(BRD - CPImin) + 100
    const cognitiveProcessingIndex = round(M * (blockingRoundDuration - this.config.cpi_calculation.brd_min) + 100);

    const blockCount = this.previousBlockTimeouts.length - 1;
    const lowestBlockTime = Math.min(...this.previousBlockTimeouts.slice(1, blockCount + 1));
    const highestBlockTime = Math.max(...this.previousBlockTimeouts.slice(1, blockCount + 1));

    const firstMachinePacedRound: GameAnswer | undefined = this.previousAnswers.filter(
      (answer) => answer.roundType === 3,
    )[0];

    const totalMachinePacedAnswers = filterByRoundType(this.previousAnswers, 3);
    const correctMachinePacedAnswers = filterByStatus(totalMachinePacedAnswers, "correct");

    const quickestResponse = Math.min(...mapToTimeTaken(totalMachinePacedAnswers));
    const quickestCorrectResponse = Math.min(...mapToTimeTaken(filterByStatus(totalMachinePacedAnswers, "correct")));
    const slowestResponse = Math.max(...mapToTimeTaken(totalMachinePacedAnswers));
    const slowestCorrectResponse = Math.max(...mapToTimeTaken(filterByStatus(totalMachinePacedAnswers, "correct")));
    const meanMachinePacedAnswerTime =
      totalMachinePacedAnswers.reduce((a, b) => a + b.timeTaken, 0) /
      totalMachinePacedAnswers.length;
    const meanCorrectMachinePacedAnswerTime =
      correctMachinePacedAnswers.reduce((a, b) => a + b.timeTaken, 0) /
      correctMachinePacedAnswers.length;

    const data = {
      statusCode,
      status,
      success: statusCode === 0,
      message,
      testDuration: round(performance.now() - this.startTime),
      numberOfRounds: this.previousAnswers.length,
      blockingRoundDuration,
      cognitiveProcessingIndex,
      machinePacedBaseline: firstMachinePacedRound?.duration,
      version: this.config.version,
      sleepData: this.sleepData,
      numberOfRollMeanLimitExceedences: this.numberOfRollMeanLimitExceedences,
      finalRatio: this.previousAnswers[this.previousAnswers.length - 1]?.timeTaken / blockingRoundDuration,
      blocking: {
        blockCount,
        lowestBlockTime,
        highestBlockTime,
        blockRange: highestBlockTime - lowestBlockTime,
        finalBlockDiff: Math.abs(this.previousBlockTimeouts[blockCount] - this.previousBlockTimeouts[blockCount - 1]),
      },
      answers: {
        totalMachinePacedAnswers: totalMachinePacedAnswers.length,
        totalMachinePacedCorrectAnswers: correctMachinePacedAnswers.length,
        totalMachinePacedIncorrectAnswers: filterByStatus(totalMachinePacedAnswers, "incorrect").length,
        totalMachinePacedNoResponseAnswers: filterByStatus(totalMachinePacedAnswers, "no response").length,
      },
      responseTimes: {
        quickestResponse,
        quickestCorrectResponse,
        slowestResponse,
        slowestCorrectResponse,
        meanMachinePacedAnswerTime,
        meanCorrectMachinePacedAnswerTime,
      },
      answerLogs: this.previousAnswers,
      _date: new Date().toISOString(),
      _date_minute_offset: new Date().getTimezoneOffset(),
      _id: v4(),
    };

    const resultsPage = new ProcessResultsPage(this.app, this.ui);
    await resultsPage.show(data);
  }
}
