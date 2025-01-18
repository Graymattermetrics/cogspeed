import { Application, Container, Graphics, Point, Sprite, Text } from "pixi.js";

import { Config } from "../types/Config";
import { SleepData } from "../types/SleepData";
import { CogSpeedGraphicsHandler } from "../ui/handler";
import { startUp } from "../main";

type GraphicList = [Graphics, number, number, number, number];

export class StartPage {
  private container: Container;

  constructor(
    private config: Config,
    private app: Application,
    private ui: CogSpeedGraphicsHandler,
  ) {
    this.container = new Container();
    this.app.stage.addChild(this.container);
  }

  private async confirm(confirmText: string, denyText: string = ""): Promise<boolean> {
    const yesBorder = new Sprite(this.ui.smallButtons[1]);
    yesBorder.scale = new Point(1.2, 1.2);
    yesBorder.anchor.set(0.5);
    yesBorder.width = this.app.screen.width * 0.475;
    yesBorder.height = this.app.screen.height * 0.2;
    yesBorder.position.set(this.app.screen.width * 0.7, this.app.screen.height * 0.85);
    this.container.addChild(yesBorder);

    const yesText = new Text(confirmText, {
      fontFamily: "Trebuchet",
      fontSize: 30,
      fill: 0xffffff,
    });
    yesText.anchor.set(0.5);
    yesText.position.set(this.app.screen.width * 0.7, this.app.screen.height * 0.85);
    yesText.eventMode = "none";
    this.container.addChild(yesText);

    if (denyText === "") {
      await this.waitForKeyPress(yesBorder);
      return true;
    }

    const noBorder = new Sprite(this.ui.smallButtons[1]);
    noBorder.anchor.set(0.5);
    noBorder.scale = new Point(1.2, 1.2);
    noBorder.width = this.app.screen.width * 0.475;
    noBorder.height = this.app.screen.height * 0.2;
    noBorder.position.set(this.app.screen.width * 0.3, this.app.screen.height * 0.85);
    this.container.addChild(noBorder);

    const noText = new Text(denyText, {
      fontFamily: "Trebuchet",
      fontSize: 30,
      fill: 0xffffff,
    });
    noText.anchor.set(0.5);
    noText.position.set(this.app.screen.width * 0.3, this.app.screen.height * 0.85);
    noText.eventMode = "none";
    this.container.addChild(noText);

    const keypress = await this.waitForKeyPress(yesBorder, [noBorder]);
    return keypress === yesBorder || keypress === yesText;
  }

  private createText(text: string, x: number, y: number, fontSize: number, { wordWrap = true, centre = false, fill = 0xffffff, anchor = true }) {
    const textObject = new Text(text, {
      fontFamily: "Trebuchet",
      fontSize: fontSize,
      fill: fill,
      align: "center",
    });
    textObject.position.set(x, y);
    if (anchor) textObject.anchor.set(0.5);

    if (wordWrap) {
      textObject.style.wordWrap = true;
      textObject.style.wordWrapWidth = this.app.screen.width * 0.9;
    }

    this.container.addChild(textObject);
    return textObject;
  }

  /**
   * Wait for a click on a sprite but don't destroy the sprite
   */
  private async waitForKeyPressNoDestroy(sprite: (Sprite | Container | Text)[] = [this.container]) {
    // Block until a sprite is clicked but don't destroy the sprite
    var block = true;

    sprite.forEach((sprite_) => {
      sprite_.eventMode = "dynamic";
      sprite_.on("pointerdown", () => {
        block = false;
      });
    });

    while (block) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Wait for a click on a sprite
   */
  private async waitForKeyPress(sprite: Sprite | Container = this.container,
    secondSprites: (Sprite | Container)[] = []): Promise<Sprite | Container | null> {
    // Set each sprite to dynamic and listen for pointerdown event
    [sprite, ...secondSprites].forEach((sprite_) => {
      if (sprite_ !== null) {
        sprite_.eventMode = "dynamic";
        sprite_.on("pointerdown", () => {
          sprite_.destroy();
          this.container.destroy();
        });
      }
    });

    // Block until the start page is removed
    while (this.container.destroyed === false) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.container = new Container();
    this.app.stage.addChild(this.container);

    for (const sprite_ of [sprite, ...secondSprites]) {
      if (sprite_.destroyed === true) {
        return sprite_;
      }
    }
    return null;
  }

  /**
   * Display the home page
   */
  public async displayHomePage() {
    // GMM Logo
    const smallestScreenSize = Math.min(this.app.screen.width, this.app.screen.height);
    const size = 512;

    const logoSprite = new Sprite(this.ui.logoTexture);
    logoSprite.scale = new Point(smallestScreenSize / size, smallestScreenSize / size);
    logoSprite.anchor.set(0.5);
    logoSprite.position.set(this.app.screen.width * 0.5, this.app.screen.height * 0.315);
    this.container.addChild(logoSprite);

    // Test now button
    const testNowContainer = this.ui.createButton("Test now!", this.app.screen.width * 0.5, this.app.screen.height * 0.7, 
    this.app.screen.width * 0.8 > 400 ? 400 : this.app.screen.width * 0.8, this.app.screen.height * 0.25 > 200 ? 200 : this.app.screen.height * 0.25, 36)
    this.container.addChild(testNowContainer);

    // Privacy policies
    const privacyPoliciesText = this.createText("View our pivacy policies", this.app.screen.width * 0.5, this.app.screen.height * 0.87, 21, {wordWrap: true});
    privacyPoliciesText.eventMode = "dynamic";
    // privacyPoliciesText.
    privacyPoliciesText.on('pointertap', () => {
      window.open("https://amplify-cogspeed-staging-86d4e-deployment.s3.us-east-2.amazonaws.com/PRIVACY%20POLICY%2006_19_2023.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA2OHQBPCPZMVM2M3U%2F20250117%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20250117T090329Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGEaCXVzLWVhc3QtMiJGMEQCIF6pW0iWZEv%2FGx%2FIrnUgyb5PzsXKpUKxP1F0x9i2Oyf0AiBl%2B3msSnn%2FV4et2ElHnfAl2BeKI8ytWVjNL59k%2F7SUHCroAghaEAEaDDcxNzc2Mjk1MTMyNyIMIOYHIXsQ12Bk7BxBKsUCIZmVm7%2BK5WbYczGU6LXyjV5RK%2Bhe47cHOpzxyb6RNsNhX8MJY5%2Fuv38NH7EfxHc9GNLlvZM7pYM2zXdKLCX0PWXSlXtKsKbIyLKkKmyd%2B96ucUqvhvo7WOMk65UpOZx8HJf1Saxr2xPLxiDO43kuSd0aX%2FGnuiS87qZPGQiD5dL9NQbh9t9tnFId%2BUoDpdHI11qZdepMPU9Uhi5zIxajg%2FLAw%2BGVGYMcSTl9M8m%2BBqrjciBWOr4ZIYr4EeQ9OIi1zfHYC3C7KngVTI%2FIJWJCIdKsm1dyPq5hvLfdwfz6kzSGgqI%2FjvKmxvMX2EaHDy29iTRMNP4R%2F7IgLMIcMx3glRI1VRxD1svKCvWKegFaG8MTBLNtIKi3FKeFUu%2F9tit7z6u0F6YRyg5De1DuipGbmrkickyVsovXpHIY7r2JOrpASH63JTCcuai8Bjq0AlDTYkidHv4rrPIo1ockIUb7DWc7o1OOFU8HDQOcXvoj3Zw8ZVg%2Bu5P3fFYq6Xfld9xMjVRr08IV2ldUYl1lcC4mrUGG1gLyfG1X11b5WxLJBUpfWR%2B%2FNPk%2B7SunWtZpbK%2BnTrtqu%2Bgvc5RorkTENsRZv70pAdaVsTJxC2yPQPquq81eVx%2FlQqFjKKD86W1GagMgAIe4WG6PnGtBewQNdjGMxT2%2FplU7XE%2FnKBthZpHsr0FISlW%2FZ28uOpgCa%2B%2B3PpcY3ifKCIrq6AmNDWPx3x740pVOFBhTxyxCk7xOABnNa0sKjW1P3uEFEn9w0q239zSVZysiNfi8G8LUcYKbt%2BrBahsNv875K%2Bg0Qs0JG%2BoPGkU%2FzaszdLSSSGuLpwA%2FVh5B%2FY2a9sZjxQqvLzlZCHxWwzy8&X-Amz-Signature=98e50a327dfaa1ecb68e480da1ae41079ecf7795d62c680f5a32288c3ee74913&X-Amz-SignedHeaders=host&response-content-disposition=inline")
    });

    // Terms of service
    const tosText = this.createText("View our TOS", this.app.screen.width * 0.5, this.app.screen.height * 0.93, 21, {wordWrap: true});
    tosText.eventMode = "dynamic";
    // privacyPoliciesText.
    tosText.on('pointertap', () => {
      window.open("https://amplify-cogspeed-staging-86d4e-deployment.s3.us-east-2.amazonaws.com/TOS%2006_19_2023.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA2OHQBPCPZMVM2M3U%2F20250117%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20250117T090428Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGEaCXVzLWVhc3QtMiJGMEQCIF6pW0iWZEv%2FGx%2FIrnUgyb5PzsXKpUKxP1F0x9i2Oyf0AiBl%2B3msSnn%2FV4et2ElHnfAl2BeKI8ytWVjNL59k%2F7SUHCroAghaEAEaDDcxNzc2Mjk1MTMyNyIMIOYHIXsQ12Bk7BxBKsUCIZmVm7%2BK5WbYczGU6LXyjV5RK%2Bhe47cHOpzxyb6RNsNhX8MJY5%2Fuv38NH7EfxHc9GNLlvZM7pYM2zXdKLCX0PWXSlXtKsKbIyLKkKmyd%2B96ucUqvhvo7WOMk65UpOZx8HJf1Saxr2xPLxiDO43kuSd0aX%2FGnuiS87qZPGQiD5dL9NQbh9t9tnFId%2BUoDpdHI11qZdepMPU9Uhi5zIxajg%2FLAw%2BGVGYMcSTl9M8m%2BBqrjciBWOr4ZIYr4EeQ9OIi1zfHYC3C7KngVTI%2FIJWJCIdKsm1dyPq5hvLfdwfz6kzSGgqI%2FjvKmxvMX2EaHDy29iTRMNP4R%2F7IgLMIcMx3glRI1VRxD1svKCvWKegFaG8MTBLNtIKi3FKeFUu%2F9tit7z6u0F6YRyg5De1DuipGbmrkickyVsovXpHIY7r2JOrpASH63JTCcuai8Bjq0AlDTYkidHv4rrPIo1ockIUb7DWc7o1OOFU8HDQOcXvoj3Zw8ZVg%2Bu5P3fFYq6Xfld9xMjVRr08IV2ldUYl1lcC4mrUGG1gLyfG1X11b5WxLJBUpfWR%2B%2FNPk%2B7SunWtZpbK%2BnTrtqu%2Bgvc5RorkTENsRZv70pAdaVsTJxC2yPQPquq81eVx%2FlQqFjKKD86W1GagMgAIe4WG6PnGtBewQNdjGMxT2%2FplU7XE%2FnKBthZpHsr0FISlW%2FZ28uOpgCa%2B%2B3PpcY3ifKCIrq6AmNDWPx3x740pVOFBhTxyxCk7xOABnNa0sKjW1P3uEFEn9w0q239zSVZysiNfi8G8LUcYKbt%2BrBahsNv875K%2Bg0Qs0JG%2BoPGkU%2FzaszdLSSSGuLpwA%2FVh5B%2FY2a9sZjxQqvLzlZCHxWwzy8&X-Amz-Signature=b08b0904327697dd5cf42a4dcdbb20fe43763f6de50b8104309d21bbaf1053ee&X-Amz-SignedHeaders=host&response-content-disposition=inline");
    });

    // Version text
    this.createText(`Version ${this.config.version}`, this.app.screen.width * 0.5, this.app.screen.height * 0.03, 14, {wordWrap: true});
    
    await this.waitForKeyPress(testNowContainer);
  }

  /**
   * Display the test disclaimer
   * Asks the user if they are ready and in a safe
   * environment to start the test
   * Must click yes to continue
   * @returns {Promise<boolean>} Whether the user is ready
   */
  public async displayTestDisclaimer(): Promise<boolean> {
    this.createText(
      "Take this test only when you're in a safe condition to do so.",
      this.app.screen.width * 0.5,
      this.app.screen.height * 0.1,
      24,
      { wordWrap: true },
    );

    this.createText("Ready?", this.app.screen.width * 0.5, this.app.screen.height * 0.5, 48, {
      centre: true,
      fill: 0xc4e4ff,
    });

    return await this.confirm("Yes", "No");
  }

  /**
   * Display the sleep form
   * Asks the user to enter their sleep data
   * @returns {Promise<{ [key: string]: any }>} The sleep data
   */
  private async displaySleepForm(): Promise<{ [key: string]: any }> {
    await this.confirm("Ok");
    return {}; // TODO: Implement
  }

  /**
   * Confirm the sleep data
   * Asks the user to confirm their sleep data
   * Must click yes to continue
   * @returns {Promise<boolean>} Whether the data is correct
   */
private async confirmSleepData(sleepData: { [key: string]: any }): Promise<boolean> {
    return await this.confirm("Confirm", "Back");
  }

  /**
   * Recolour a graphic
   * @param {GraphicList} graphic_ List of graphic to recolour (Graphic, x, y, width, height)
   * @param colour The colour to recolour the graphic
   * @param prevGraphic The previous graphic to colour (used to remove the previous colour)
   */
  private recolour(graphic_: GraphicList, colour: number, prevGraphic: GraphicList | null = null) {
    if (prevGraphic !== null) {
      this.recolour(prevGraphic, 0x00000);
    }
    const [graphic, x, y, width, height] = graphic_;
    graphic.clear();
    graphic.beginFill(colour);
    graphic.lineStyle(2, 0x628fc2);
    graphic.drawRect(x, y, width, height);
  }

  /**
   * Display the Samn Perelli checklist
   * Asks the user about the quality of their sleep
   * @returns {number} The level on the samn perelli fatigue scale
   * @see https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5803055/
   * @see https://www.icao.int/safety/fatiguemanagement/FRMSBangkok/4.%20Measuring%20Fatigue.pdf
   */
  public async displaySamnPerelliChecklist(): Promise<number> {
    var level = 0;

    this.createText(`Samn-Perelli Fatigue Scale`, this.app.screen.width * 0.5, this.app.screen.height * 0.05, 20, { wordWrap: true })
    this.createText(`S-PFS`, this.app.screen.width * 0.5, this.app.screen.height * 0.1, 24, { wordWrap: true })

    const levels = [
      "Fully alert, wide awake",
      "Very lively, responsive, but not at peak",
      "Okay, about normal",
      "Less than sharp, let down",
      "Feeling dull, losing focus",
      "Very difficult to concentrate, groggy",
      "Unable to function, ready to drop",
    ];

    const graphics: GraphicList[] = [];
    for (let index = levels.length - 1; index >= 0; index--) {
      const y = this.app.screen.height * 0.15 + (index * this.app.screen.height * 0.09);
      const x = this.app.screen.width * 0.1;
      const width = this.app.screen.width * 0.8;
      const height = this.app.screen.height * 0.09;

      const graphic = new Graphics();
      graphic.beginFill(0x0000);
      graphic.lineStyle(2, 0x628fc2);
      graphic.drawRect(x, y, width, height);
      graphics.push([graphic, x, y, width, height]);

      graphic.eventMode = "dynamic";
      graphic.on("pointerdown", () => {
        this.recolour(graphics[6 - index], 0x808080, level !== 0 ? graphics[7 - level] : null);
        level = index + 1;
      });
      this.container.addChild(graphic);

      this.createText(`${7 - index}. ${levels[index]}`, x + 10, y + this.app.screen.height * 0.0405 - 8.55, 16, {anchor: false});
    }

    this.createText(`Samn, S. & Perelli, L. (1981). Estimating Aircrew Fatigue: A Technique with Application to 
    // Airlift Operations. SAM-TR-82-2.`, this.app.screen.width * 0.5, this.app.screen.height * 0.94, 12, { wordWrap: true });

    await this.waitForKeyPressNoDestroy(graphics.map((graphic) => graphic[0]));
    await this.confirm("Ok");
    return 8 - level;
  }

  /**
   * Display the ready demo screen.
   * This consists of 6-7 refresher screens to remind how the buttons
   * and numbers correlate to different parts of the screen. 
   */
  public async displayReadyDemo(numberOfScreens: number) {
    let continueButton;
    for (let i = 0; i < numberOfScreens; i ++ ) {
      if (i >= this.ui.readyDemoTextures.length - 1) break;

      const size = 512;
      const smallestScreenSize = Math.min(this.app.screen.width, this.app.screen.height);

      const readyDemo = new Sprite(this.ui.readyDemoTextures[i]);
      readyDemo.scale = new Point(smallestScreenSize / size, smallestScreenSize / size);
      readyDemo.position.set(this.app.screen.width * 0.5, this.app.screen.height * 0.45);
      readyDemo.anchor.set(0.5);

      continueButton = this.ui.createButton("Continue", this.app.screen.width * 0.3, this.app.screen.height * 0.85, this.app.screen.width * 0.6, this.app.screen.height * 0.2, 18);
      const skipToTest = this.ui.createButton("Skip", this.app.screen.width * 0.7, this.app.screen.height * 0.85, this.app.screen.width * 0.6, this.app.screen.height * 0.2, 18)
      
      this.container.addChild(continueButton);
      this.container.addChild(readyDemo);
      this.container.addChild(skipToTest);
      if (await this.waitForKeyPress(skipToTest, [this.container]) === skipToTest) break;
    }

    // TODO: Simplify
    // Display final screen
    const size = 512;
    const smallestScreenSize = Math.min(this.app.screen.width, this.app.screen.height);

    const readyDemo = new Sprite(this.ui.readyDemoTextures[this.ui.readyDemoTextures.length - 1]);
    readyDemo.scale = new Point(smallestScreenSize / size, smallestScreenSize / size);
    readyDemo.position.set(this.app.screen.width * 0.5, this.app.screen.height * 0.45);
    readyDemo.anchor.set(0.5);

    const skipToTest = this.ui.createButton("Start now", this.app.screen.width * 0.5, this.app.screen.height * 0.85, this.app.screen.width * 0.6, this.app.screen.height * 0.2)
    
    this.container.addChild(readyDemo);
    this.container.addChild(skipToTest);
    await this.waitForKeyPress();
  }

  /**
   * Start the test
   * Goes through different pages - home page, disclaimer, sleep form
   * TODO: Seperate pages better
   * @returns {Promise<SleepData>} The test data
   */
  public async start(sleepData: SleepData | false): Promise<SleepData | false> {
    if (process.env.NODE_ENV === "development") return {fatigueLevel: -1};

    if (sleepData != false) {
      await this.displayReadyDemo(Infinity);
      return sleepData;
    }

    // Display the test disclaimer
    const ready = await this.displayTestDisclaimer();
    if (!ready) {
      this.app.destroy();
      startUp();
      return false;
    }

    // Get sleep data
    // TODO: Implement
    // let sleepData;
    // while (true) {
    //   sleepData = await this.displaySleepForm();
    //   // Confirm sleep data
    //   if (await this.confirmSleepData(sleepData)) break;
    // }

    // Display the Samn Perelli checklist
    // Minus from 8 because the scale is inverted
    const fatigueLevel = await this.displaySamnPerelliChecklist();

    if (this.config.display_refresher_screens) {
      // Display the ready demo screen with one screen
      await this.displayReadyDemo(Infinity);
    }

    return {
      fatigueLevel
        };
  }
}
