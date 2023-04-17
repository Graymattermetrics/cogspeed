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
    private currentRoundType: "training" | "self-paced" | "machine-paced" | "postblock" = "training";

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
        const response = await axios.get("http://localhost/config");
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
        for (const sprite of Object.values(this.numbers).concat(Object.values(this.dots))) {
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

        const numbers = [...Array(19).keys()];
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
        if (["machine-paced", "postblock"].includes(this.currentRoundType)) {
            this.updateDuration();
        }

        // Set timers
        this.setTimer();
    }

    /**
     * Updates the duration
     * @return {void}
     */
    private updateDuration(): void {
        const lastAnswers = this.previousAnswers
            .filter((a) => a.roundType === "machine-paced")
            .slice(-this.constants.machine_paced.rolls.mean_size);

        // If there are not enough answers in machine-paced, return
        if (lastAnswers.length !== this.constants.machine_paced.rolls.mean_size) return;

        const correctAnswers = lastAnswers.filter((a) => a.status === "correct").length;
        const percentageCorrect = correctAnswers / this.constants.machine_paced.rolls.mean_size;

        // If percentage correct is greater than threshold, speed up
        if (percentageCorrect > this.constants.machine_paced.rolls.threshold) {
            this.currentDuration -= this.constants.machine_paced.speedup.base_duration;
        }
        // If percentage correct is less than threshold, slow down if answer was incorrect
        else if (lastAnswers[lastAnswers.length - 1].status === "incorrect")
            this.currentDuration += this.constants.machine_paced.slowdown.base_duration;
    }

    /**
     * Sets the timer for the next screen
     * @return {void}
     */
    private setTimer(): void {
        clearTimeout(this.currentScreenTimeout); // Clear previous timeout
        clearTimeout(this.noResponseTimeout); // Clear no response timeout
        this.noResponseTimeout = setTimeout(this.stop.bind(this), this.constants.no_response_timeout); // Set no response timeout

        const correctAnswers = this.previousAnswers
            .slice(this.constants.self_paced.number_of_training_rounds)
            .filter((a) => a.status === "correct").length;
        const incorrectAnswers = this.previousAnswers
            .slice(this.constants.self_paced.number_of_training_rounds)
            .filter((a) => a.status === "incorrect").length;

        // Set currentRoundType to self-paced if correct answers is less than max_right_count and number of rounds is greater than number_of_training_rounds
        if (
            correctAnswers <= this.constants.self_paced.max_right_count &&
            this.previousAnswers.length >= this.constants.self_paced.number_of_training_rounds &&
            this.currentDuration === -1
        )
            this.currentRoundType = "self-paced";

        // -1 indicates self paced
        if (this.currentDuration === -1) {
            // Start machine paced
            if (correctAnswers === this.constants.self_paced.max_right_count) {
                const sumOfAnswers = this.previousAnswers.map((a) => a.timedelta).reduce((a, b) => a + b, 0);
                this.currentDuration =
                    sumOfAnswers / this.previousAnswers.length + this.constants.machine_paced.slowdown.initial_duration;
                if (this.currentDuration > this.constants.machine_paced.max_start_duration) {
                    this.currentDuration = this.constants.machine_paced.max_start_duration;
                }
                this.currentRoundType = "machine-paced";
            }
            // Exit if too many incorrect answers in self paced
            if (incorrectAnswers === this.constants.self_paced.max_wrong_count) {
                console.log("Too many incorrect answers in self paced");
                return this.stop();
            }
        }

        // Currently in machine paced, set timeout before next screen
        if (this.currentDuration !== -1) {
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
        const status = location === false ? "no response" : location === this.answer ? "correct" : "incorrect";

        const previousAnswer = this.previousAnswers[this.previousAnswers.length - 1];
        const previousTime = previousAnswer ? previousAnswer.perftime : this.startTime;

        // Log answer
        this.previousAnswers.push({
            status, // correct, incorrect, no response
            duration: this.currentDuration, // -1 indicates self paced, otherwise machine paced
            perftime: performance.now(), // Time of answer
            timedelta: performance.now() - previousTime, // Time delta between previous answer
            round: this.previousAnswers.length + 1, // Round number
            roundType: this.currentRoundType,
        });

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
        this.maxTestDuration = setTimeout(this.stop.bind(this), this.constants.max_test_duration);
        this.nextRound();
    }

    private stop(): void {
        console.log("Stopped");
        clearTimeout(this.maxTestDuration);
        // this.app.stage.removeChildren();
    }

    // private reset(): void {
    //     this.stop();
    //     this.start();
    // }
}
