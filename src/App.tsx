import { withAuthenticator } from "@aws-amplify/ui-react";
import "./App.css";

import { Application, Container, Point, Rectangle, Sprite, Texture } from "pixi.js";
import { CogSpeedGame, buttonPositions } from "./game";
import { StartPage } from "./startPage";

import buttonTextureImage from "./assets/button.png";
import buttonWellTextureImage from "./assets/button_well.png";
import gearTextureImage from "./assets/gear.png";
import gearWellTextureImage from "./assets/gear_well.png";
import numbersAndDotsTextureImage from "./assets/numbers_and_dots.png";
import numbersAndDotsInvertedTextureImage from "./assets/numbers_and_dots_inverted.png";

import bgSteelImage from "./assets/bg_steel.jpg";
import bgCarbonImage from "./assets/bg_carbon.jpg";

const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;

const app = new Application<HTMLCanvasElement>({
  width: gameWidth,
  height: gameHeight,
});
app.stage.interactive = true;

const gearWellTexture = Texture.from(gearWellTextureImage);
const gearTexture = Texture.from(gearTextureImage);
const buttonWellTexture = Texture.from(buttonWellTextureImage);
const buttonTexture = Texture.from(buttonTextureImage);
const numbersAndDotsTexture = Texture.from(numbersAndDotsTextureImage);
const numbersAndDotsInvertedTexture = Texture.from(numbersAndDotsInvertedTextureImage);

window.onload = async (): Promise<void> => {
  const appDiv = document.querySelector(".App");
  if (!appDiv) throw new Error("No app div found");
  appDiv.appendChild(app.view);

  resizeCanvas(); // TODO

  // Load number and dot assets
  const { numbers, dots } = loadNumbersAndDots(false);
  const { numbers: numbersInverted, dots: dotsInverted } = loadNumbersAndDots(true);

  const bgCarbon = Sprite.from(bgCarbonImage);
  app.stage.addChild(bgCarbon);

  const startPage = new StartPage(app);
  // Initiate before displaying to load config
  const game = new CogSpeedGame(app, numbers, dots, numbersInverted, dotsInverted);
  // Display start page
  await startPage.display();

  // Start game - called after start button is clicked
  const bgSteel = Sprite.from(bgSteelImage);
  app.stage.removeChild(bgCarbon);
  app.stage.addChild(bgSteel);

  // Add gears
  createGear(0.5, 0.75, "input", game);

  const leftContainer = createGear(0.001, 0.25, "left", game); // TODO: scale with screen size
  const rightContainer = createGear(1.01, 0.25, "right", game); // TODO: scale with screen size

  game.start(leftContainer, rightContainer);
};

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
 * Ripple animation
 */
async function rippleAnimation(sprite: Sprite): Promise<void> {
  const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const animationSprite = new Sprite(buttonTexture);
  animationSprite.x = sprite.x;
  animationSprite.y = sprite.y;
  animationSprite.anchor.set(0.5);
  animationSprite.scale = new Point(0.8, 0.8);
  animationSprite.alpha = 0.7;
  animationSprite.eventMode = "none";

  sprite.parent.addChild(animationSprite);

  // 100 iterations to reach scale.x of 5
  for (let i = 0; i < 100; i++) {
    await timer(0.2);

    animationSprite.scale.x += 0.05;
    animationSprite.scale.y += 0.05;
    animationSprite.alpha -= 0.001;
  }
  sprite.parent.removeChild(animationSprite);
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
        rippleAnimation(button);
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

function loadNumbersAndDots(inverted: boolean): {
  [key: string]: { [key: number]: Sprite };
} {
  const spaceBetween = 96;
  const texture = inverted ? numbersAndDotsInvertedTexture : numbersAndDotsTexture;

  const numbers: { [key: number]: Sprite } = {};
  const dots: { [key: number]: Sprite } = {};
  for (let i = 0; i < 18; i++) {
    const posX = (i % 4) * spaceBetween;
    const posY = Math.floor(i / 4) * spaceBetween;

    // Split up numbers and dots png into separate sprites

    const numberOrDotTexture = new Texture(texture.baseTexture, new Rectangle(posX, posY, spaceBetween, spaceBetween));
    const numberOrDot = new Sprite(numberOrDotTexture);

    numberOrDot.anchor.set(0.5);
    numberOrDot.scale = new Point(0.7, 0.7); // TODO: scale with screen size

    if (i <= 8) numbers[i + 1] = numberOrDot;
    else dots[i - 8] = numberOrDot;
  }
  return { numbers: numbers, dots: dots };
}

function App() {
  return <div className="App"></div>;
}

export default withAuthenticator(App);
