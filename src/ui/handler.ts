import { Application, Assets, Container, Graphics, Point, Rectangle, Sprite, Text, Texture } from "pixi.js";

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
import { Config } from "../types/Config";

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

  // Textures - These are now initialized in loadAssets()
  public gearWellTexture!: Texture;
  public gearTexture!: Texture;
  public buttonWellTexture!: Texture;
  public buttonTexture!: Texture;
  public invertedButtonTexture!: Texture;
  public numbersAndDotsTexture!: Texture;
  public numbersAndDotsInvertedTexture!: Texture;
  public bgCarbonTexture!: Texture;
  public bgSteelTexture!: Texture;
  public smallButtonTextures!: Texture;
  public largeButtonTexture!: Texture;
  public loadingGearTexture!: Texture;
  public readyDemoTextures!: Texture[];
  public logoTexture!: Texture;

  // Note: The type of smallButtons has changed from Rectangle[] to Texture[]
  public smallButtons: Texture[] = [];

  answerSprite: Sprite | null;
  inputButtons: Sprite[];

  // The constructor is now much simpler.
  constructor(public app: Application, public config: Config) {
    this.answerSprite = null;
    this.inputButtons = [];
  }

  private readonly performanceData = {
    2400: "FUNCTIONING\nEXCEPTIONALLY WELL",
    2200: "FUNCTIONING\nVERY WELL",
    1960: "FUNCTIONING\nNORMALLY",
    1500: "FUNCTIONING\nSLIGHTLY LESS THAN NORMAL",
    1050: "FUNCTIONING\nSTARTING TO SLOW",
    800: "DIFFICULT TO FUNCTION\nBECOMING UNSAFE",
    600: "UNABLE TO FUNCTION\nDEFINITELY UNSAFE",
  };

  /**
   * NEW: This method handles all asynchronous asset loading.
   * It must be called and awaited after creating an instance of this class.
   */
  public async loadAssets() {
    // Bundle all assets for a single loading request
    const assetsToLoad = {
      gearWell: gearWellTextureImage,
      gear: gearTextureImage,
      buttonWell: buttonWellTextureImage,
      button: buttonTextureImage,
      invertedButton: invertedButtonTextureImage,
      numbersAndDots: numbersAndDotsTextureImage,
      numbersAndDotsInverted: numbersAndDotsInvertedTextureImage,
      bgCarbon: bgCarbonImage,
      bgSteel: bgSteelImage,
      smallButtons: smallButtonTextureImage,
      largeButton: largeButtonTextureImage,
      loadingGear: loadingGearImage,
      logo: logoWithGearsImage,
      readyDemoTwo: readyDemoImageTwo,
      readyDemoThree: readyDemoImageThree,
      readyDemoFinal: readyDemoImageFinal,
    };

    // Use Assets.load to load everything and wait for it to complete
    const loadedTextures = await Assets.load(Object.values(assetsToLoad));

    // Now that assets are loaded, assign them to class properties
    this.gearWellTexture = loadedTextures[assetsToLoad.gearWell];
    this.gearTexture = loadedTextures[assetsToLoad.gear];
    this.buttonWellTexture = loadedTextures[assetsToLoad.buttonWell];
    this.buttonTexture = loadedTextures[assetsToLoad.button];
    this.invertedButtonTexture = loadedTextures[assetsToLoad.invertedButton];
    this.numbersAndDotsTexture = loadedTextures[assetsToLoad.numbersAndDots];
    this.numbersAndDotsInvertedTexture = loadedTextures[assetsToLoad.numbersAndDotsInverted];
    this.bgCarbonTexture = loadedTextures[assetsToLoad.bgCarbon];
    this.bgSteelTexture = loadedTextures[assetsToLoad.bgSteel];
    this.smallButtonTextures = loadedTextures[assetsToLoad.smallButtons];
    this.largeButtonTexture = loadedTextures[assetsToLoad.largeButton];
    this.loadingGearTexture = loadedTextures[assetsToLoad.loadingGear];
    this.logoTexture = loadedTextures[assetsToLoad.logo];
    this.readyDemoTextures = [
      loadedTextures[assetsToLoad.readyDemoTwo],
      loadedTextures[assetsToLoad.readyDemoThree],
      loadedTextures[assetsToLoad.readyDemoFinal],
    ];

    // Now that textures are available, we can parse the spritesheets
    const { numbers, dots } = this.loadNumbersAndDots(false);
    const { numbers: numbersInverted, dots: dotsInverted } = this.loadNumbersAndDots(true);

    this.numbers = numbers;
    this.dots = dots;
    this.numbersInverted = numbersInverted;
    this.dotsInverted = dotsInverted;

    this.smallButtons = this.loadButtons();
  }

  public async emulateLoadingTime(loadingTime_: number = 3000) {
    let loadingTime = loadingTime_;
    // if (process.env.NODE_ENV === "development") loadingTime = 0;
    await new Promise((resolve) => setTimeout(resolve, loadingTime));
  }

  private _getMapValue(map: Record<number, number | string>, value: number, inverse = false): number | string {
    let v = null;
    for (const [key, value_] of Object.entries(map)) {
      if (inverse) {
        if (value < Number.parseInt(key)) v = value_;
      } else {
        if (value >= Number.parseInt(key)) v = value_;
      }
    }
    if (v === null) {
      return inverse ? 0xff94ca : 0x56c1fe;
    }
    return v;
  }

  public createResultsTable(
    spfScore: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    cpiScore: number | "N/A",
    blockingRoundDuration: number | "N/A",
    yPos: number
  ): Container {
    const _spfScoreMap = {
      1: 0xff94ca,
      2: 0xfe634d,
      3: 0xfdad00,
      4: 0xfff056,
      5: 0x8df900,
      6: 0x1cb000,
      7: 0x56c1fe,
    };

    // COGSPEED Score Mapping
    const _cogspeedScoreMap = {
      0: 0xff94ca, // 0 - < 0
      1: 0xfe634d, // 10 - 1
      11: 0xfdad00, // 25 - 11
      26: 0xfff056, // 50 - 26
      51: 0x8df900, // 75 - 51
      76: 0x1cb000, // 90 - 76
      91: 0x56c1fe, // 100 - 91
    };

    // Blocking Round Duration Mapping
    const _blockingRoundDurationMap = {
      2400: 0xff94ca, // >1800 ms
      2200: 0xfe634d, // 1690-1789 ms
      1960: 0xfdad00, // 1525-1668 ms
      1500: 0xfff056, // 1250-1514 ms
      1050: 0x8df900, // 975-1239 ms
      800: 0x1cb000, // 810-964 ms
      600: 0x56c1fe, // 700-799 ms
    };
    
    const container = new Container();
    const screenWidth = this.app.screen.width;

    const totalTableWidth = screenWidth * 0.95; // Use 95% of screen width for the table
    const tableX = (screenWidth - totalTableWidth) / 2; // Center the table
    const headerHeight = screenWidth * 0.13; // Generous height for multiline headers
    const valueRowHeight = screenWidth * 0.1;
    const strokeOptions = { width: 2, colour: 0x000000 };
    const headerFillColour = 0xffffff;

    const headerTextStyle = {
      fontFamily: "Arial",
      fontSize: screenWidth * 0.03,
      fontWeight: "bold",
      fill: 0x000000,
      align: "center",
      wordWrap: true,
    };
    const valueTextStyle = {
      fontFamily: "Arial",
      fontSize: screenWidth * 0.035,
      fontWeight: "bold",
      fill: 0x000000,
      align: "center",
      wordWrap: true,
    };

    let rowData;
    if (blockingRoundDuration === "N/A") rowData = "No values"
    else rowData = this._getMapValue(this.performanceData, blockingRoundDuration)

    spfScore = 3;
    const spfScoreColour = _spfScoreMap[spfScore];

    let brdColour;
    if (blockingRoundDuration === "N/A") brdColour = 0xffffff;
    else brdColour = this._getMapValue(_blockingRoundDurationMap, blockingRoundDuration);

    let cpiColour;
    if (cpiScore === "N/A") cpiColour = 0xffffff;
    else cpiColour = this._getMapValue(_cogspeedScoreMap, cpiScore);

    const columns = [
      { header: "S-PF Score", value: spfScore, width: 0.13, colour: spfScoreColour },
      { header: "Cognitive Processing Index (CPI)", value: cpiScore, width: 0.24, colour: cpiColour },
      { header: "Blocking Round Duration (BRD) ms", value: blockingRoundDuration, width: 0.24, colour: brdColour },
      { header: "Cognitive Performance Capability *", value: rowData, width: 0.39, colour: cpiColour },
    ];

    let currentX = tableX;

    const createCell = (x: number, y: number, w: number, h: number, fill: number, textContent: string | number, style: any) => {
      const cellContainer = new Container();

      const box = new Graphics();
      box.rect(0, 0, w, h);
      box.fill({
        color: fill,
        alpha: 1
      });
      box.stroke(strokeOptions);

      const cellText = new Text({
        text: textContent.toString(),
        style: { ...style, wordWrapWidth: w * 0.9 }, // Set wrap width relative to cell
      });
      cellText.anchor.set(0.5);
      cellText.position.set(w / 2, h / 2);

      cellContainer.position.set(x, y);
      cellContainer.addChild(box, cellText);
      return cellContainer;
    };

    // --- Generate Table Columns ---
    for (const col of columns) {
      const colWidth = totalTableWidth * col.width;

      // Create and add Header Cell
      const headerCell = createCell(currentX, yPos, colWidth, headerHeight, headerFillColour, col.header, headerTextStyle);
      container.addChild(headerCell);

      // Create and add Value Cell
      console.log(col.colour)
      if (typeof col.colour !== "number" ) throw new Error("Colour must be number")
      const valueCell = createCell(currentX, yPos + headerHeight, colWidth, valueRowHeight, col.colour, col.value, valueTextStyle);
      container.addChild(valueCell);

      currentX += colWidth;
    }

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

    const text = new Text({
      text: content,
      style: {
        fontFamily: "Trebuchet",
        fontSize: fontSize,
        fill: 0xc4e4ff,
        align: "center",
      },
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
      const frame = new Rectangle(i * spaceBetween, 0, 128, 96);
      // Create a new texture from the base spritesheet texture and the frame
      const buttonTexture = new Texture({
        source: this.smallButtonTextures.source,
        frame,
      });
      buttons.push(buttonTexture);
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

      const frame = new Rectangle(posX, posY, spaceBetween, spaceBetween);
      const numberOrDotTexture = new Texture({
        source: texture.source,
        frame,
      });
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

    const numbers = Array.from({ length: 2 * this.config.number_of_dots_upper + 1 }, (x, i) => i);
    delete numbers[queryNumber];
    delete numbers[queryNumber + this.config.number_of_dots_upper];
    delete numbers[0];

    for (let i = 0; i < 6; i++) {
      if (i === answerLocation - 1) continue;

      const possibleNumbers = numbers.filter((number) => number !== null);
      const number = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
      delete numbers[number];

      const randomIncorrectSprite = this.getSprite(
        number > this.config.number_of_dots_upper ? "dots" : "numbers",
        number > this.config.number_of_dots_upper ? number - this.config.number_of_dots_upper : number,
        true
      );

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
    // background.name = "background";
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
      i++;
    }
    return true;
  }
}
