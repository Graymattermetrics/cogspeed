import { Application, Container, Graphics, Point, Rectangle, Sprite, Text, Texture } from "pixi.js";

import buttonTextureImage from "../assets/button.png";
import invertedButtonTextureImage from "../assets/button_inverted.png";
import buttonWellTextureImage from "../assets/button_well.png";
import gearTextureImage from "../assets/gear.png";
import gearWellTextureImage from "../assets/gear_well.png";
import largeButtonTextureImage from "../assets/large_button.png";
import loadingGearImage from "../assets/loading_gear.png";
import logoWithGearsImage from "../assets/logo_with_gears.png";
import numbersAndDotsTextureImage from "../assets/numbers_and_dots.png";
import numbersAndDotsInvertedTextureImage from "../assets/numbers_and_dots_inverted.png";
import smallButtonTextureImage from "../assets/small_button.png";

import readyDemoImageTwo from "../assets/ready_demo_two.png";
import readyDemoImageThree from "../assets/ready_demo_three.png";
import readyDemoImageFinal from "../assets/ready_demo_final.png";

import bgCarbonImage from "../assets/bg_carbon.jpg";
import bgSteelImage from "../assets/bg_steel.jpg";
import { CogSpeedGame } from "../routes/game";

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

  public smallButtons: Rectangle[] = [];

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
  public logoTexture: Texture;
  public readyDemoTextures: Texture[];

  answerSprite: Sprite | null;
  inputButtons: Sprite[];

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
    this.readyDemoTextures = [Texture.from(readyDemoImageTwo), 
      Texture.from(readyDemoImageThree), Texture.from(readyDemoImageFinal)];
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
    this.answerSprite = null;
    this.inputButtons = [];
  }

  public async emulateLoadingTime(loadingTime_: number = 3000) {
    let loadingTime = loadingTime_;
    if (process.env.NODE_ENV === "development") loadingTime = 0;
    await new Promise((resolve) => setTimeout(resolve, loadingTime));
  }

  private _getMapValue(map: Record<number, number>, value: number, inverse=false): number {
    let v = null;
    for (const [key, value_] of Object.entries(map)) {
      if (inverse) {
        if (value < Number.parseInt(key)) v = value_;
      } else {
        if (value >= Number.parseInt(key)) v = value_;
      }
    }
    if (v == null) {
      return inverse ? 0xF4B4B4 : 0x7CE8FF;
    }
    return v;
  }

  public createResultsTable(spfScore: 1 | 2 | 3 | 4 | 5 | 6 | 7, cpiScore: number | "N/A", blockingRoundDuration: number | "N/A", yPos: number): Container {
    const _spfScoreMap = {
      1: 0xF4B4B4,
      2: 0xff644e,
      3: 0xFFB05C,
      4: 0xFFEE67,
      5: 0x8DFA01,
      6: 0x1DB201,
      7: 0x7CE8FF
    };
    
    // COGSPEED Score Mapping
    const _cogspeedScoreMap = {
      0: 0xF4B4B4,   // 0 - < 0
      1: 0xff644e,   // 10 - 1
      11: 0xFFB05C,  // 25 - 11
      26: 0xFFEE67,  // 50 - 26
      51: 0x8DFA01,  // 75 - 51
      76: 0x1DB201,  // 90 - 76
      91: 0x7CE8FF   // 100 - 91
    };
    
    // Blocking Round Duration Mapping
    const _blockingRoundDurationMap = {
      1800: 0xF4B4B4,   // >1800 ms
      1690: 0xff644e,   // 1690-1789 ms
      1525: 0xFFB05C,   // 1525-1668 ms
      1250: 0xFFEE67,   // 1250-1514 ms
      975: 0x8DFA01,    // 975-1239 ms
      810: 0x1DB201,    // 810-964 ms
      700: 0x7CE8FF     // 700-799 ms
    };

    const container = new Container();

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    const width = screenWidth * 0.28;
    const height = screenHeight * 0.05;

    const marginLeft = screenWidth * 0.08;
    
    // First column, SPF
    const headerBoxSPF = new Graphics();
    headerBoxSPF.beginFill(0xffffff);
    headerBoxSPF.lineStyle(4, 0xafafaf);
    headerBoxSPF.drawRect(marginLeft, yPos, width, height);

    const headerTextSPF = new Text("S-PF Score", {fill: 0x00000, fontSize: 14})
    headerTextSPF.position.set(screenWidth * 0.135, yPos + 8);

    const valueTextSPF = new Text(spfScore, {fill: 0x00000, fontSize: 18})
    valueTextSPF.position.set(screenWidth * 0.135 + 30, yPos + 50);

    const valueBoxSPF = new Graphics();
    let colour = _spfScoreMap[spfScore];
    valueBoxSPF.beginFill(colour);
    valueBoxSPF.lineStyle(4, 0xafafaf);
    valueBoxSPF.drawRect(marginLeft, yPos + height, width, height);


    // Second column, CPI
    const headerBoxCPI = new Graphics();
    headerBoxCPI.beginFill(0xffffff);
    headerBoxCPI.lineStyle(4, 0xafafaf);
    headerBoxCPI.drawRect(marginLeft + width, yPos, width, height);

    const headerTextCPI = new Text("CogSpeed Score", {fill: 0x00000, fontSize: 14})
    headerTextCPI.position.set(screenWidth * 0.105 + width, yPos + 8);

    const valueTextCPI = new Text(cpiScore.toString(), {fill: 0x00000, fontSize: 18})
    valueTextCPI.position.set(screenWidth * 0.105 + width + 30, yPos + 50);

    const valueBoxCPI = new Graphics();
    if (cpiScore === "N/A") colour = 0xffffff;
    else colour = this._getMapValue(_cogspeedScoreMap, cpiScore);
    valueBoxCPI.beginFill(colour);
    valueBoxCPI.lineStyle(4, 0xafafaf);
    valueBoxCPI.drawRect(marginLeft + width, yPos + height, width, height);
    
    // Third column, BRD
    const headerBoxBRD = new Graphics();
    headerBoxBRD.beginFill(0xffffff);
    headerBoxBRD.lineStyle(4, 0xafafaf);
    headerBoxBRD.drawRect(marginLeft + width * 2, yPos, width, height);

    const headerTextBRD = new Text("BRD", {fill: 0x00000, fontSize: 14})
    headerTextBRD.position.set(screenWidth * 0.12 + width * 2, yPos + 8);

    const valueTextBRD = new Text(blockingRoundDuration.toString(), {fill: 0x00000, fontSize: 18});
    valueTextBRD.position.set(screenWidth * 0.12 + width * 2 + 30, yPos + 50);

    const valueBoxBRD = new Graphics();
    if (blockingRoundDuration === "N/A") colour = 0xffffff;
    else colour = this._getMapValue(_blockingRoundDurationMap, blockingRoundDuration);
    valueBoxBRD.beginFill(colour);
    valueBoxBRD.lineStyle(4, 0xafafaf);
    valueBoxBRD.drawRect(marginLeft + width * 2, yPos + height, width, height);


    container.addChild(headerBoxSPF);
    container.addChild(valueBoxSPF);
    container.addChild(headerBoxCPI);
    container.addChild(valueBoxCPI);
    container.addChild(headerBoxBRD);
    container.addChild(valueBoxBRD);

    container.addChild(headerTextSPF);
    container.addChild(headerTextCPI);
    container.addChild(headerTextBRD);

    container.addChild(valueTextSPF);
    container.addChild(valueTextCPI);
    container.addChild(valueTextBRD);

    return container;
  }

  public createButton(content: string, x: number, y: number, width: number, height: number, fontSize: number = 24): Container {
    const container = new Container();
    container.eventMode = "dynamic";

    const button = new Sprite(this.largeButtonTexture);
    button.anchor.set(0.5);
    button.position.set(x, y);
    button.width = width;
    button.height = height;

    const text = new Text(content, {
      fontFamily: "Trebuchet",
      fontSize: fontSize,
      fill: 0xc4e4ff,
      align: "center",
    });
    text.anchor.set(0.5);
    text.position.set(x, y);

    container.addChild(button);
    container.addChild(text);
    return container;
  }

  private loadButtons(): Rectangle[] {
    const buttons = [];
    const spaceBetween = 128;

    for (let i = 0; i < 2; i++) {
      const smallButtonTexture = new Rectangle(i * spaceBetween, 0, 128, 96);
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

      const numberOrDotTexture = new Rectangle(posX, posY, spaceBetween, spaceBetween);
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
    return { numbers, dots };
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
    this.answerSprite = answerSprite;
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
  public async rippleAnimation(sprite: Sprite) {
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

  public removeAllStageChildren() {
    for (var i = this.app.stage.children.length - 1; i >= 0; i--) {
      this.app.stage.removeChild(this.app.stage.children[i]);
    }
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
        const ripple = game.buttonClicked(7 - i);
        if (ripple) this.rippleAnimation(button);
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

    this.inputButtons = buttons;
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
  
  /**
   * Wait for a click on a sprite
   */
  public async waitForKeyPressCorrectAnswer(sprite: Sprite, timeout: number) {
    const container = new Container();
    const startTime = performance.now();

    sprite.eventMode = "dynamic";
    sprite.on("pointerdown", () => {
      container.destroy();
    });

    // Block until the start page is removed
    let i = 0;
    while (container.destroyed === false) {
      // Ripple 3 times every 300 ms
      if (i % 3 === 0 && i < 9) this.rippleAnimation(sprite);
      // Timed out
      if (performance.now() > startTime + timeout) return null;
      await new Promise((resolve) => setTimeout(resolve, 100));
      i ++;
    }
    return true;
  }
}
