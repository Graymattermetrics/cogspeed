import { Application, Container, Sprite } from "pixi.js";
import axios from "axios";

export const buttonPositions: { [key: number]: number[] } = {
    1: [-58, -102],
    2: [-120, 0],
    3: [-58, 102],
    4: [58, 102],
    5: [119, 0],
    6: [58, -102],
};

/**
 * Cogspeed game
 * @param {Application} app
 * @param {Sprite[]} numbers
 * @param {Sprite[]} dots
 * @param {Sprite[]} numbersInverted
 * @param {Sprite[]} dotsInverted
 * @return {void}
 */
export class CogSpeedGame {
    // Time
    private startTime: number | undefined;
    private currentDuration: number = -1;
    private currentRoundType: "training" | "self-paced" | "machine-paced" | "postblock" | "endmode" | null = "training";
    private previousBlockDurations: number[] = [-1];

    // Answers
    private answer: number | undefined;
    private previousAnswers: { [key: string]: any }[] = [];

    // Containers
    private leftContainer: Container | undefined;
    private rightContainer: Container | undefined;

    // Config
    private constants: { [key: string]: any } = {};

    // Timeouts
    private noResponseTimeout: NodeJS.Timeout | undefined;
    private currentScreenTimeout: NodeJS.Timeout | undefined;
    private maxTestDuration: NodeJS.Timeout | undefined;

    constructor(
        private app: Application,
        private numbers: { [key: number]: Sprite },
        private dots: { [key: number]: Sprite },
        private numbersInverted: { [key: number]: Sprite },
        private dotsInverted: { [key: number]: Sprite },
    ) {}

    /**
     * Loads the config
     * @return {Promise<void>}
     */
    private async loadConfig(): Promise<void> {
        const response = await axios.get(
            "https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig",
        );
        this.constants = response.data;
    }

    /**
     * Sets the position of a sprite
     * @param {Sprite} sprite The sprite to set the position of
     * @param {number} x The x position
     * @param {number} y The y position
     * @param {Container | undefined} container The container to add the sprite to (if undefined, adds to stage)
     */
    private setSpritePosition(
        sprite: Sprite,
        x: number,
        y: number,
        container: Container | undefined = undefined,
    ): void {
        sprite.x = container ? x : this.app.screen.width * x;
        sprite.y = container ? y : this.app.screen.height * y;

        if (container) container.addChild(sprite);
        else this.app.stage.addChild(sprite);
    }

    /**
     * Clears the stage
     * @return {void}
     */
    private clearStage(): void {
        for (const sprite of Object.values(this.numbers)
            .concat(Object.values(this.dots))
            .concat(Object.values(this.numbersInverted))
            .concat(Object.values(this.dotsInverted))) {
            // TODO: Find a better way to remove sprites
            this.app.stage.removeChild(sprite);
            this.leftContainer?.removeChild(sprite);
            this.rightContainer?.removeChild(sprite);
        }
    }

    /**
     * Gets a random sprite that is either inverted or not
     * @return {Sprite}
     */
    private getSprite(spriteType: "numbers" | "dots", spriteNumber: number, randomInverted: boolean = true): Sprite {
        const spriteInverted = randomInverted ? Math.random() > 0.5 : false;

        if (spriteType === "numbers") {
            if (spriteInverted) return this.numbersInverted[spriteNumber];
            else return this.numbers[spriteNumber];
        } else {
            if (spriteInverted) return this.dotsInverted[spriteNumber];
            else return this.dots[spriteNumber];
        }
    }

    /**
     * Sets up the next round
     * @return {void}
     */
    private nextRound(): void {
        // Clear stage
        this.clearStage();

        // Create and set query sprite
        const queryNumber = Math.floor(Math.random() * 9) + 1;
        const numberOrDot = Math.random() > 0.5 ? "numbers" : "dots";
        const queryNumberSprite = this.getSprite(numberOrDot, queryNumber, false);
        this.setSpritePosition(queryNumberSprite, 0.5, 0.75);

        const answerSprite = this.getSprite(numberOrDot !== "numbers" ? "numbers" : "dots", queryNumber, true);
        const answerLocation = Math.floor(Math.random() * 6) + 1; // 1-6

        this.setSpritePosition(
            answerSprite,
            buttonPositions[answerLocation][0],
            buttonPositions[answerLocation][1],
            answerLocation > 3 ? this.leftContainer : this.rightContainer,
        );

        const numbers = Array.from({length: 19}, (x, i) => i);
        delete numbers[queryNumber];
        delete numbers[queryNumber + 9];
        delete numbers[0];

        for (let i = 0; i < 6; i++) {
            if (i === answerLocation - 1) continue;

            const possibleNumbers = numbers.filter((number) => number !== null);
            const number = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
            delete numbers[number];

            const randomIncorrectSprite = this.getSprite(
                number > 9 ? "dots" : "numbers",
                number > 9 ? number - 9 : number,
                true,
            );

            this.setSpritePosition(
                randomIncorrectSprite,
                buttonPositions[i + 1][0],
                buttonPositions[i + 1][1],
                i > 2 ? this.leftContainer : this.rightContainer,
            );
        }
        this.answer = answerLocation;

        // Update duration
        if (
            this.currentRoundType !== null &&
            ["machine-paced", "postblock", "endmode"].includes(this.currentRoundType)
        ) {
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
        const lastAnswers = this.previousAnswers
            .filter((a) => a.roundType === "machine-paced")
            .slice(-this.constants.machine_paced.rolling_average.mean_size);

        let correctAnswers = lastAnswers.filter((a) => a.status === "correct").length;
        // If there are not enough answers in machine-paced, say all previous answers are correct
        if (lastAnswers.length !== this.constants.machine_paced.rolling_average.mean_size) {
            correctAnswers += this.constants.machine_paced.rolling_average.mean_size - lastAnswers.length;
        }
        return correctAnswers;
    }

    /**
     * Updates the duration
     * @return {void}
     */
    private updateDuration(): void {
        if (this.currentRoundType === "endmode") {
            const lastEndmodeAnswers = this.previousAnswers.filter((a) => a.roundType === "endmode");
            if (lastEndmodeAnswers.length === this.constants.number_of_endmode_rounds) {
                this.stop(true);
            }
            return;
        }

        // Last `rolling_average.mean_size` machine-paced answers
        const lastAnswers = this.previousAnswers
            .filter((a) => a.roundType === "machine-paced")
            .slice(-this.constants.machine_paced.rolling_average.mean_size);

        // If the user is in `postblock`, start again with increased time
        if (this.currentRoundType === "postblock") {
            const lastPostBlockAnswers = this.previousAnswers
                .slice(-this.constants.machine_paced.blocking.self_paced_rounds)
                .filter((a) => a.roundType === "postblock");

            // If there are not enough (self-paced) answers in postblock, do not resume machine paced
            if (lastPostBlockAnswers.length !== this.constants.machine_paced.blocking.self_paced_rounds) {
                return;
            }
            // Resume machine paced again
            this.currentDuration =
                lastAnswers[lastAnswers.length - 1].duration + this.constants.machine_paced.blocking.slow_down_duration;
            this.currentRoundType = "machine-paced";
        }

        /// Last `no_input_count` answers
        const lastMissedAnswers = this.previousAnswers
            .slice(-this.constants.machine_paced.blocking.no_input_count)
            .filter((a) => a.status === "no response");

        // If the user does not respond for `no_input_count` times in a row, they "blocked"
        if (lastMissedAnswers.length === this.constants.machine_paced.blocking.no_input_count) {
            const blockDuration = this.previousAnswers[this.previousAnswers.length - 1].duration;
            const lastBlockDuration = this.previousBlockDurations[this.previousBlockDurations.length - 1];

            if (Math.abs(blockDuration - lastBlockDuration) < this.constants.machine_paced.blocking.duration_delta) {
                this.currentRoundType = "endmode";
            } else {
                this.currentRoundType = "postblock";
            }
            this.previousBlockDurations.push(blockDuration);
            return;
        }

        const correctAnswers = this.getCorrectAnswers();
        const percentageCorrect = correctAnswers / this.constants.machine_paced.rolling_average.mean_size;

        const incorrectAnswers = lastAnswers.filter((a) => a.status === "incorrect").length;
        if (incorrectAnswers > this.constants.machine_paced.rolling_average.max_wrong_count) {
            this.currentRoundType = "endmode";
            return;
        }

        let isCorrect = lastAnswers[lastAnswers.length - 1].status === "correct";

        // If percentage correct is greater than threshold, speed up if answer was correct
        if (percentageCorrect > this.constants.machine_paced.rolling_average.threshold && isCorrect) {
            this.currentDuration -= this.constants.machine_paced.speedup.base_duration;
        }
        // If percentage correct is less than threshold, slow down if answer was incorrect
        else if (
            percentageCorrect < this.constants.machine_paced.rolling_average.threshold &&
            lastAnswers[lastAnswers.length - 1].status === "incorrect"
        )
            this.currentDuration += this.constants.machine_paced.slowdown.base_duration;
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
            this.stop.bind(this),
            this.previousAnswers.length === 0
                ? this.constants.timeouts.max_initial_no_response
                : this.constants.timeouts.max_no_response,
        );

        const correctAnswers = this.previousAnswers
            .slice(this.constants.self_paced.number_of_training_rounds)
            .filter((a) => a.status === "correct");
        const incorrectAnswers = this.previousAnswers
            .slice(this.constants.self_paced.number_of_training_rounds)
            .filter((a) => a.status === "incorrect");

        // Set currentRoundType to self-paced if correct answers is less than `max_right_count` and
        // number of rounds is greater than `number_of_training_rounds`
        if (
            correctAnswers.length <= this.constants.self_paced.max_right_count &&
            this.previousAnswers.length >= this.constants.self_paced.number_of_training_rounds &&
            this.currentDuration === -1
        )
            this.currentRoundType = "self-paced";

        if (this.currentRoundType === "self-paced") {
            // Start machine paced
            if (correctAnswers.length === this.constants.self_paced.max_right_count) {
                const sumOfAnswers = correctAnswers.map((a) => a.timedelta).reduce((a, b) => a + b, 0);

                this.currentDuration =
                    sumOfAnswers / correctAnswers.length + this.constants.machine_paced.slowdown.initial_duration;
                if (this.currentDuration > this.constants.machine_paced.max_start_duration) {
                    this.currentDuration = this.constants.machine_paced.max_start_duration;
                }
                this.currentRoundType = "machine-paced";
            }
            // Exit if too many incorrect answers in self paced
            if (incorrectAnswers.length === this.constants.self_paced.max_wrong_count) {
                console.log("Too many incorrect answers in self paced");
                return this.stop();
            }
        }

        // Currently in machine paced, set timeout before next screen
        if (this.currentRoundType !== null && ["machine-paced", "endmode"].includes(this.currentRoundType)) {
            this.currentScreenTimeout = setTimeout(() => {
                this.buttonClicked(false);
            }, this.currentDuration);
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
        if (this.constants.machine_paced.minimum_response_time > timeTaken) {
            if (
                this.previousAnswers[this.previousAnswers.length - 1].status === "no response" &&
                location === this.previousAnswers[this.previousAnswers.length - 1].answerLocation
            ) {
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
            data["lastCorrectAnswers"] = `${this.getCorrectAnswers()}/${
                this.constants.machine_paced.rolling_average.mean_size
            }`;
        }

        this.previousAnswers.push(data);

        console.log(this.previousAnswers);
        this.nextRound();
    }

    /**
     * Starts the game
     * @return {void}
     * @param {Container} leftContainer The container for the left gear
     * @param {Container} rightContainer The container for the right gear
     * @return {Promise<void>}
     */
    public async start(leftContainer: Container, rightContainer: Container): Promise<void> {
        this.leftContainer = leftContainer;
        this.rightContainer = rightContainer;

        await this.loadConfig();
        this.startTime = performance.now();
        this.maxTestDuration = setTimeout(this.stop.bind(this), this.constants.timeouts.max_test_duration);
        this.nextRound();
    }

    private stop(success: boolean = false): void {
        if (success) {
            console.log("Finished");
        } else {
            console.log("Stopped");
        }

        clearTimeout(this.maxTestDuration);
        clearTimeout(this.currentScreenTimeout);
        clearTimeout(this.noResponseTimeout);

        this.currentRoundType = null;
        this.clearStage();

        const lastTwoBlocks = this.previousBlockDurations.slice(-2);
        const sumOfLastTwoBlocks = lastTwoBlocks.reduce((a, b) => a + b, 0);
        const blockingRoundDuration = sumOfLastTwoBlocks / 2;
        console.log("Blocking round duration", blockingRoundDuration);

        const informationProcessingRate = blockingRoundDuration / 1000;
        console.log("Information processing rate", informationProcessingRate);

        // @ts-ignore
        const testDuration = performance.now() - this.startTime;
        console.log("Test duration", testDuration);

        const numberOfRounds = this.previousAnswers.length;
        console.log("Number of rounds", numberOfRounds);
    }

    // private reset(): void {
    //     this.stop();
    //     this.start();
    // }
}