import { Application, Container, Sprite } from "pixi.js";

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
    private answer: number | undefined;
    private leftContainer: Container | undefined;
    private rightContainer: Container | undefined;

    constructor(
        public app: Application,
        public numbers: { [key: number]: Sprite },
        public dots: { [key: number]: Sprite },
        public numbersInverted: { [key: number]: Sprite },
        public dotsInverted: { [key: number]: Sprite },
    ) {}

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
     * Sets up the game
     * @return {void}
     */
    private createAnswer(): void {
        // Create and set query sprite
        const queryNumber = Math.floor(Math.random() * 9) + 1;
        const numberOrDot = Math.random() > 0.5 ? "number" : "dot";
        const queryNumberSprite = numberOrDot === "number" ? this.numbers[queryNumber] : this.dots[queryNumber];
        this.setSpritePosition(queryNumberSprite, 0.5, 0.75);

        // Create and set answer sprite
        let answerSprite;
        if (numberOrDot === "number") answerSprite = this.dots[queryNumber];
        else answerSprite = this.numbers[queryNumber];

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

            let randomIncorrectSprite;
            if (number > 9) randomIncorrectSprite = this.dots[number - 9];
            else randomIncorrectSprite = this.numbers[number];

            this.setSpritePosition(
                randomIncorrectSprite,
                buttonPositions[i + 1][0],
                buttonPositions[i + 1][1],
                i > 2 ? this.leftContainer : this.rightContainer,
            );
        }
        this.answer = answerLocation;
    }

    public buttonClicked(location: number): void {
        if (this.answer === location) {
            console.log("correct");
        } else {
            console.log("incorrect");
        }
        for (const sprite of Object.values(this.numbers).concat(Object.values(this.dots))) {
            // TODO: Find a better way to remove sprites
            this.app.stage.removeChild(sprite);
            this.leftContainer?.removeChild(sprite);
            this.rightContainer?.removeChild(sprite);
        }
        this.createAnswer();
    }

    public start(leftContainer: Container, rightContainer: Container): void {
        this.leftContainer = leftContainer;
        this.rightContainer = rightContainer;
        this.createAnswer();
    }

    public stop(): void {
        this.app.stage.removeChildren();
    }

    // public reset(): void {
    //     this.stop();
    //     this.start();
    // }
}
