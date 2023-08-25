import { Application, Container, Point, Rectangle, Sprite, Texture, Text } from "pixi.js";

import buttonTextureImage from "../assets/button.png";
import invertedButtonTextureImage from "../assets/button_inverted.png";
import buttonWellTextureImage from "../assets/button_well.png";
import gearTextureImage from "../assets/gear.png";
import gearWellTextureImage from "../assets/gear_well.png";
import numbersAndDotsTextureImage from "../assets/numbers_and_dots.png";
import numbersAndDotsInvertedTextureImage from "../assets/numbers_and_dots_inverted.png";
import smallButtonTextureImage from "../assets/small_button.png";
import largeButtonTextureImage from "../assets/large_button.png";
import loadingGearImage from "../assets/loading_gear.png";
import logoWithGearsImage from "../assets/logo_with_gears.png";
import readyDemoImage from "../assets/ready_demmo.png";

import { CogSpeedGame } from "../game";
import bgCarbonImage from "../assets/bg_carbon.jpg";
import bgSteelImage from "../assets/bg_steel.jpg";

// Width, height of gear
export const buttonPositions: { [key: number]: any } = {
  1: (width: number, height: number) => {
    const kx = 2 / 3;
    const ky = 0.43;
    return [-(width / 2 - kx * (width / 2)), -(height / 2 - ky * (height / 2))];
  },
  2: (width: number, height: number) => {
    const kx = 1 / 3;
    return [-(width / 2 - kx * (width / 2)), 0];
  },
  3: (width: number, height: number) => {
    const kx = 2 / 3;
    const ky = 0.43;
    return [-(width / 2 - kx * (width / 2)), height / 2 - ky * (height / 2)];
  },
  4: (width: number, height: number) => {
    const kx = 0.675;
    const ky = 0.43;
    return [width / 2 - kx * (width / 2), height / 2 - ky * (height / 2)];
  },
  5: (width: number, height: number) => {
    const kx = 0.34;
    return [+(width / 2 - kx * (width / 2)), 0];
  },
  6: (width: number, height: number) => {
    const kx = 0.675;
    const ky = 0.43;
    return [width / 2 - kx * (width / 2), -(height / 2 - ky * (height / 2))];
  },
};

export class CogSpeedGraphicsHandler {
  // Containers
  public leftGearContainer: Container | undefined;
  public rightGearContainer: Container | undefined;

  // Scalable
  public gearWellSize: number = 0.5;

  // Sprites
  public numbers: { [key: number]: Sprite } = {};
  public dots: { [key: number]: Sprite } = {};
  public numbersInverted: { [key: number]: Sprite } = {};
  public dotsInverted: { [key: number]: Sprite } = {};

  public smallButtons: Texture[] = [];

  public gearWellTexture: Texture;
  public gearTexture: Texture;
  public buttonWellTexture: Texture;
  public buttonTexture: Texture;
  public invertedButtonTexture: Texture;
  public numbersAndDotsTexture: Texture;
  public numbersAndDotsInvertedTexture: Texture;
  public bgCarbonTexture: Texture;
  public bgSteelTexture: Texture;
  public smallButtonTextures: Texture;
  public largeButtonTexture: Texture;
  public loadingGearTexture: Texture;
  public readyDemoTexture: Texture;
  public logoTexture: Texture;

  constructor(public app: Application) {
    this.gearWellTexture = Texture.from(gearWellTextureImage);
    this.gearTexture = Texture.from(gearTextureImage);
    this.buttonWellTexture = Texture.from(buttonWellTextureImage);
    this.buttonTexture = Texture.from(buttonTextureImage);
    this.invertedButtonTexture = Texture.from(invertedButtonTextureImage);
    this.numbersAndDotsTexture = Texture.from(numbersAndDotsTextureImage);
    this.numbersAndDotsInvertedTexture = Texture.from(numbersAndDotsInvertedTextureImage);
    this.bgCarbonTexture = Texture.from(bgCarbonImage);
    this.bgSteelTexture = Texture.from(bgSteelImage);
    this.smallButtonTextures = Texture.from(smallButtonTextureImage);
    this.largeButtonTexture = Texture.from(largeButtonTextureImage);
    this.loadingGearTexture = Texture.from(loadingGearImage);
    this.readyDemoTexture = Texture.from(readyDemoImage);
    this.logoTexture = Texture.from(logoWithGearsImage);

    // Load number and dot assets
    const { numbers, dots } = this.loadNumbersAndDots(false);
    const { numbers: numbersInverted, dots: dotsInverted } = this.loadNumbersAndDots(true);

    this.numbers = numbers;
    this.dots = dots;
    this.numbersInverted = numbersInverted;
    this.dotsInverted = dotsInverted;

    // Load button assets
    this.smallButtons = this.loadButtons();
  }

  public async loadScreen(): Promise<void> {
    const loadingTime = process.env.NODE_ENV === "development" ? 100 : 3000;
    await new Promise((resolve) => setTimeout(resolve, loadingTime));
  }

  public createButton(content: string, x: number, y: number, width: number, height: number): Container {
    const container = new Container();
    container.eventMode = "dynamic";

    const button = new Sprite(this.largeButtonTexture);
    button.anchor.set(0.5);
    button.position.set(x, y);
    button.width = width;
    button.height = height;

    const text = new Text(content, {
      fontFamily: "Trebuchet",
      fontSize: 24,
      fill: 0xc4e4ff,
      align: "center",
    });
    text.anchor.set(0.5);
    text.position.set(x, y);

    container.addChild(button);
    container.addChild(text);
    return container;
  }

  private loadButtons(): Texture[] {
    const buttons = [];
    const spaceBetween = 128;

    for (let i = 0; i < 2; i++) {
      const smallButtonTexture = new Texture(this.smallButtonTextures.baseTexture, new Rectangle(i * spaceBetween, 0, 128, 96));
      buttons.push(smallButtonTexture);
    }
    return buttons;
  }

  private loadNumbersAndDots(inverted: boolean): {
    [key: string]: { [key: number]: Sprite };
  } {
    const spaceBetween = 96;
    const texture = inverted ? this.numbersAndDotsInvertedTexture : this.numbersAndDotsTexture;

    const numbers: { [key: number]: Sprite } = {};
    const dots: { [key: number]: Sprite } = {};
    for (let i = 0; i < 18; i++) {
      const posX = (i % 4) * spaceBetween;
      const posY = Math.floor(i / 4) * spaceBetween;

      // Split up numbers and dots png into separate sprites

      const numberOrDotTexture = new Texture(texture.baseTexture, new Rectangle(posX, posY, spaceBetween, spaceBetween));
      const numberOrDot = new Sprite(numberOrDotTexture);

      numberOrDot.anchor.set(0.5);

      // const numberOrDotScale = 0.5;
      const screenWidth = this.app.screen.width;
      const scaleMinWidth = 200; // Minimum screen width for the smallest scale
      const scaleMaxWidth = 400; // Maximum screen width for the largest scale
      const minScale = 0.35; // Smallest scale value
      const maxScale = 0.7; // Largest scale value

      const scaleRange = maxScale - minScale;
      const scaleRatio = (screenWidth - scaleMinWidth) / (scaleMaxWidth - scaleMinWidth);
      const scaledValue = Math.min(maxScale, minScale + scaleRange * scaleRatio);

      const scale = new Point(scaledValue, scaledValue);
      numberOrDot.scale = scale;

      if (i <= 8) numbers[i + 1] = numberOrDot;
      else dots[i - 8] = numberOrDot;
    }
    return { numbers: numbers, dots: dots };
  }

  /**
   * Sets the position of a sprite
   * @param {Sprite} sprite The sprite to set the position of
   * @param {number} x The x position
   * @param {number} y The y position
   * @param {Container | undefined} container The container to add the sprite to (if undefined, adds to stage)
   */
  public setSpritePosition(sprite: Sprite, x: number, y: number, container: Container | undefined = undefined): void {
    sprite.position.set(container ? x : this.app.screen.width * x, container ? y : this.app.screen.height * y);

    if (container) container.addChild(sprite);
    else this.app.stage.addChild(sprite);
  }

  /**
   * Clears the stage
   * @return {void}
   */
  public clearStage(): void {
    for (const sprite of Object.values(this.numbers)
      .concat(Object.values(this.dots))
      .concat(Object.values(this.numbersInverted))
      .concat(Object.values(this.dotsInverted))) {
      // TODO: Find a better way to remove sprites
      this.app.stage.removeChild(sprite);
      this.leftGearContainer?.removeChild(sprite);
      this.rightGearContainer?.removeChild(sprite);
    }
  }

  /**
   * Gets a random sprite that is either inverted or not
   * @return {Sprite}
   */
  public getSprite(spriteType: "numbers" | "dots", spriteNumber: number, randomInverted: boolean = true): Sprite {
    const spriteInverted = randomInverted ? Math.random() > 0.5 : false;

    if (spriteType === "numbers") {
      if (spriteInverted) return this.numbersInverted[spriteNumber];
      else return this.numbers[spriteNumber];
    } else {
      if (spriteInverted) return this.dotsInverted[spriteNumber];
      else return this.dots[spriteNumber];
    }
  }

  public setDisplayNumbers(answerLocation: number, queryNumber: number, numberOrDot: "numbers" | "dots"): void {
    // Create and set query sprite
    const queryNumberSprite = this.getSprite(numberOrDot, queryNumber, false);
    this.setSpritePosition(queryNumberSprite, 0.5, 0.75);

    const answerSprite = this.getSprite(numberOrDot !== "numbers" ? "numbers" : "dots", queryNumber, true);
    this.setSpritePosition(
      answerSprite,
      buttonPositions[answerLocation](this.gearWellSize, this.gearWellSize)[0],
      buttonPositions[answerLocation](this.gearWellSize, this.gearWellSize)[1],
      answerLocation > 3 ? this.leftGearContainer : this.rightGearContainer
    );

    const numbers = Array.from({ length: 19 }, (x, i) => i);
    delete numbers[queryNumber];
    delete numbers[queryNumber + 9];
    delete numbers[0];

    for (let i = 0; i < 6; i++) {
      if (i === answerLocation - 1) continue;

      const possibleNumbers = numbers.filter((number) => number !== null);
      const number = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
      delete numbers[number];

      const randomIncorrectSprite = this.getSprite(number > 9 ? "dots" : "numbers", number > 9 ? number - 9 : number, true);

      this.setSpritePosition(
        randomIncorrectSprite,
        buttonPositions[i + 1](this.gearWellSize, this.gearWellSize)[0],
        buttonPositions[i + 1](this.gearWellSize, this.gearWellSize)[1],
        i > 2 ? this.leftGearContainer : this.rightGearContainer
      );
    }
  }

  /**
   * Create gear
   * @param {number} posX
   * @param {number} posY
   * @return {Container} The container that the buttons are in
   * TODO: add gear rotation
   */
  public createGear(posX: number, posY: number, gearLocation: string = ""): [Container, Sprite[]] {
    // Add container
    const container = new Container();
    container.position.set(this.app.screen.width * posX, this.app.screen.height * posY);
    this.app.stage.addChild(container);

    // Add gear well below gear
    const gearScale = 0.95;
    let size = Math.min(400, this.app.screen.width * gearScale);

    const gearWell = new Sprite(this.gearWellTexture);
    gearWell.width = size;
    gearWell.height = size;
    gearWell.anchor.set(0.5);
    container.addChild(gearWell);

    const gearRelativeToWell = 0.935;
    // Add gears
    const gear = new Sprite(this.gearTexture);
    this.gearWellSize = gearWell.width * gearRelativeToWell;
    gear.width = gearWell.width * gearRelativeToWell;
    gear.height = gearWell.height * gearRelativeToWell;
    gear.anchor.set(0.5);
    container.addChild(gear);

    const buttons = [];
    // Add buttons
    for (let i = 1; i <= 6; i++) {
      const inverted = gearLocation === "input" ? false : Math.random() > 0.8;
      const button = new Sprite(inverted ? this.invertedButtonTexture : this.buttonTexture);
      button.anchor.set(0.5);
      const gearK = 2.592592;
      button.width = gear.width / gearK;
      button.height = gear.height / gearK;

      button.position.set(...buttonPositions[i](gear.height, gear.width));
      container.addChild(button);
      buttons.push(button);
    }

    return [container, buttons];
  }

  /**
   * Ripple animation
   */
  public async rippleAnimation(sprite: Sprite): Promise<void> {
    const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const animationSprite = new Sprite(this.buttonTexture);
    animationSprite.position.set(sprite.x, sprite.y);
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

  public setBackground(texture: string) {
    // Remove old background
    this.app.stage.removeChild(this.app.stage.getChildByName("background") as Sprite);

    const background = new Sprite(texture === "carbon" ? this.bgCarbonTexture : this.bgSteelTexture);
    background.name = "background";
    background.width = this.app.screen.width;
    background.height = this.app.screen.height;

    this.app.stage.addChild(background);
  }

  public createDisplayGear(posX: number, posY: number, gearLocation: string): Container {
    const [container] = this.createGear(posX, posY, gearLocation);
    return container;
  }

  public createInputGear(posX: number, posY: number, game: CogSpeedGame): void {
    const [container, buttons] = this.createGear(posX, posY, "input");

    for (let i = 1; i <= 6; i++) {
      const button = buttons[i - 1];
      button.eventMode = "dynamic";
      button.on("pointerdown", () => {
        game.buttonClicked(7 - i);
        this.rippleAnimation(button);
      });
    }

    // Create centre button to display query number
    const buttonWell = new Sprite(this.buttonWellTexture);
    buttonWell.anchor.set(0.5);
    buttonWell.width = buttons[0].width;
    buttonWell.height = buttons[0].height;

    container.addChild(buttonWell);

    const button = new Sprite(this.buttonTexture);
    button.anchor.set(0.5);
    button.width = buttons[0].width;
    button.height = buttons[0].height;
    container.addChild(button);
  }

  /**
   * Sets the left and right containers
   * @param {CogSpeedGame} game The game to set up
   */
  public setupGame(game: CogSpeedGame): void {
    this.setBackground("steel");

    // Create left and right display gears
    // TODO: Make location scalable
    this.leftGearContainer = this.createDisplayGear(0.001, 0.25, "left");
    this.rightGearContainer = this.createDisplayGear(1.01, 0.25, "right");

    // Create input gear
    this.createInputGear(0.5, 0.75, game);
  }
}
