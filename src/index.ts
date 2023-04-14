import { Application, Loader, Sprite, Container, Texture, Point, Rectangle } from "pixi.js";
import { CogSpeedGame, buttonPositions } from "./game";
import "./style.css";

declare const VERSION: string;
console.log(`Welcome from cogspeed ${VERSION}`);

const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;

const app = new Application({
    width: gameWidth,
    height: gameHeight,
});
app.stage.interactive = true;

const gearWellTexture = Texture.from("./assets/gear_well.png");
const gearTexture = Texture.from("./assets/gear.png");
const buttonWellTexture = Texture.from("./assets/button_well.png");
const buttonTexture = Texture.from("./assets/button.png");
const numbersAndDotsTexture = Texture.from("./assets/numbers_and_dots.png");
const numbersAndDotsInvertedTexture = Texture.from("./assets/numbers_and_dots_inverted.png");

window.onload = async (): Promise<void> => {
    // await loadGameAssets();

    document.body.appendChild(app.view);

    resizeCanvas();

    // Add background
    const bg = Sprite.from("./assets/bg_steel.jpg");
    app.stage.addChild(bg);

    const { numbers, dots } = loadNumbersAndDots(false);
    const { numbers: numbersInverted, dots: dotsInverted } = loadNumbersAndDots(true);

    const game = new CogSpeedGame(app, numbers, dots, numbersInverted, dotsInverted);

    // Add gears
    createGear(0.5, 0.75, "input", game);
    const leftContainer = createGear(0.001, 0.25, "left", game); // TODO: scale with screen size
    const rightContainer = createGear(1.01, 0.25, "right", game); // TODO: scale with screen size

    game.start(leftContainer, rightContainer);
};

/**
 * Load game assets
 * @return {Promise<void>}
 */
async function loadGameAssets(): Promise<void> {
    return new Promise((res, rej) => {
        const loader = Loader.shared;
        loader.add("rabbit", "./assets/simpleSpriteSheet.json");
        loader.add("pixie", "./assets/spine-assets/pixie.json");

        loader.onComplete.once(() => {
            res();
        });

        loader.onError.once(() => {
            rej();
        });

        loader.load();
    });
}

/**
 * Resize canvas
 * @return {void}
 */
function resizeCanvas(): void {
    const resize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        app.stage.scale.x = window.innerWidth / gameWidth;
        app.stage.scale.y = window.innerHeight / gameHeight;
    };
    resize();

    window.addEventListener("resize", resize);
}

/**
 * Create gear
 * @param {number} posX
 * @param {number} posY
 * @return {void}
 * TODO: scale with screen size
 * TODO: add gear rotation
 */
function createGear(posX: number, posY: number, gearLocation: string, game: CogSpeedGame): Container {
    // Add container
    const container = new Container();
    const containerX = app.screen.width * posX;
    const containerY = app.screen.height * posY;

    container.x = containerX; // Centre
    container.y = containerY; // Top

    app.stage.addChild(container);

    // Add gear well
    const gearWell = new Sprite(gearWellTexture);
    gearWell.anchor.set(0.5);
    gearWell.scale = new Point(0.7, 0.7); // TODO: scale with screen size

    container.addChild(gearWell);

    // Add gears
    const gear = new Sprite(gearTexture);
    gear.anchor.set(0.5);

    gear.scale = new Point(0.7, 0.7); // TODO: scale with screen size

    container.addChild(gear);

    // Add button
    for (let i = 1; i <= 6; i++) {
        if (gearLocation === "left" && i <= 3) continue;
        if (gearLocation === "right" && i > 3) continue;

        const button = new Sprite(buttonTexture);
        button.anchor.set(0.5);
        button.scale = new Point(0.7, 0.7); // TODO: scale with screen size

        button.x = buttonPositions[i][0];
        button.y = buttonPositions[i][1];
        container.addChild(button);

        if (gearLocation === "input") {
            button.interactive = true;
            button.on("pointerdown", () => {
                game.buttonClicked(7 - i);
            });
        }
    }

    if (gearLocation === "input") {
        const buttonWell = new Sprite(buttonWellTexture);
        buttonWell.anchor.set(0.5);
        buttonWell.scale = new Point(0.7, 0.7); // TODO: scale with screen size

        container.addChild(buttonWell);

        // Add button
        const button = new Sprite(buttonTexture);
        button.anchor.set(0.5);
        button.scale = new Point(0.7, 0.7); // TODO: scale with screen size

        container.addChild(button);
    }
    return container;
}

function loadNumbersAndDots(inverted: boolean): { [key: string]: { [key: number]: Sprite } } {
    const spaceBetween = 96;
    const texture = inverted ? numbersAndDotsInvertedTexture : numbersAndDotsTexture;

    const numbers: { [key: number]: Sprite } = {};
    const dots: { [key: number]: Sprite } = {};
    for (let i = 0; i < 18; i++) {
        const posX = (i % 4) * spaceBetween;
        const posY = Math.floor(i / 4) * spaceBetween;

        // Split up numbers and dots png into separate sprites

        const numberOrDotTexture = new Texture(
            texture.baseTexture,
            new Rectangle(posX, posY, spaceBetween, spaceBetween),
        );
        const numberOrDot = new Sprite(numberOrDotTexture);

        numberOrDot.anchor.set(0.5);
        numberOrDot.scale = new Point(0.7, 0.7); // TODO: scale with screen size

        if (i <= 8) numbers[i + 1] = numberOrDot;
        else dots[i - 8] = numberOrDot;
    }
    return { numbers: numbers, dots: dots };
}
