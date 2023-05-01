import { Application, Container, Point, SimplePlane, Sprite, Text, Texture } from "pixi.js";

import logoWithGearsImage from "./assets/logo_with_gears.png";
import readyDemoImage from "./assets/ready_demmo.png";
import { CogSpeedGraphicsHandler } from "./ui/handler";

export class StartPage {
  private container: Container;

  private readyDemoTexture: Texture;
  private logoTexture: Texture;

  constructor(private app: Application, private ui: CogSpeedGraphicsHandler) {
    this.container = new Container();
    this.app.stage.addChild(this.container);

    this.readyDemoTexture = Texture.from(readyDemoImage);
    this.logoTexture = Texture.from(logoWithGearsImage);
  }

  private async confirm(confirmText: string, denyText: string = ""): Promise<boolean> {
    const yesBorderPane = new SimplePlane(this.ui.smallButtons[1], 50, 50);
    yesBorderPane.scale = new Point(1.2, 1.2);
    yesBorderPane.x = this.app.screen.width * 0.5;
    yesBorderPane.y = this.app.screen.height * 0.7;
    this.container.addChild(yesBorderPane);

    const yesText = new Text(confirmText, {
      fontFamily: "Trebuchet",
      fontSize: 30,
      fill: 0xffffff,
    });
    yesText.x = yesBorderPane.width * 0.55 - yesText.width;
    yesText.y = yesBorderPane.height * 0.55 - yesText.height;
    yesBorderPane.addChild(yesText);

    if (denyText === "") {
      await this.waitForKeyPress(yesBorderPane);
      return true;
    }

    const noBorderPane = new SimplePlane(this.ui.smallButtons[1], 50, 50);
    noBorderPane.scale = new Point(1.2, 1.2);
    noBorderPane.x = this.app.screen.width * 0.1;
    noBorderPane.y = this.app.screen.height * 0.7;
    this.container.addChild(noBorderPane);

    const noText = new Text(denyText, {
      fontFamily: "Trebuchet",
      fontSize: 30,
      fill: 0xffffff,
    });
    noText.x = noBorderPane.width * 0.55 - noText.width;
    noText.y = noBorderPane.height * 0.55 - noText.height;
    noBorderPane.addChild(noText);

    return (await this.waitForKeyPress([yesBorderPane, noBorderPane])) === yesBorderPane;
  }

  private createText(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    { wordWrap = true, centre = false, fill = 0xffffff }
  ) {
    const textObject = new Text(text, {
      fontFamily: "Trebuchet",
      fontSize: fontSize,
      fill: fill,
      align: "center",
    });

    textObject.x = x - (centre ? textObject.width * 0.6 : 0);
    textObject.y = y;

    if (wordWrap) {
      textObject.style.wordWrap = true;
      textObject.style.wordWrapWidth = this.app.screen.width * 0.9;
    }

    this.container.addChild(textObject);
  }

  /**
   * Wait for a click on a sprite
   */
  private async waitForKeyPress(
    sprite: Sprite | Container | Sprite[] | SimplePlane[] = this.container
  ): Promise<Sprite | null | SimplePlane> {
    if (Array.isArray(sprite)) {
      for (const sprite_ of sprite) {
        sprite_.eventMode = "dynamic";
        sprite_.on("pointerdown", () => {
          sprite_.destroy();
          this.container.destroy();
        });
      }
    } else {
      sprite.eventMode = "dynamic";
      sprite.on("pointerdown", () => {
        this.container.destroy();
      });
    }

    // Block until the start page is removed
    while (this.container.destroyed === false) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.container = new Container();
    this.app.stage.addChild(this.container);

    if (Array.isArray(sprite)) {
      for (const sprite_ of sprite) {
        if (sprite_.destroyed === true) {
          return sprite_;
        }
      }
    }
    return null;
  }

  /**
   * Display the ready demo screen
   */
  private async displayReadyDemo() {
    // Display the ready demo screen
    const readyDemo = new Sprite(this.readyDemoTexture);
    readyDemo.x = 0;
    readyDemo.y = 0;
    readyDemo.width = this.app.screen.width;
    readyDemo.height = this.app.screen.height;
    readyDemo.eventMode = "dynamic";

    this.container.addChild(readyDemo);
    await this.waitForKeyPress();
  }

  /**
   * Display the home page
   */
  private async displayHomePage() {
    const logoSprite = new Sprite(this.logoTexture);
    logoSprite.scale = new Point(0.7, 0.7);
    logoSprite.y = this.app.screen.height * 0.05;
    this.container.addChild(logoSprite);

    const buttonPane = new SimplePlane(this.ui.largeButtonTexture, 10, 10);
    buttonPane.scale = new Point(0.6, 0.6);
    buttonPane.x = 0;
    buttonPane.y = this.app.screen.height * 0.65;
    this.container.addChild(buttonPane);

    // Display the start page
    const startNowButton = new Text("Test now!", {
      fontFamily: "Trebuchet",
      fontSize: 64,
      fill: 0xffffff,
    });
    // Center the start now button in the button pane
    startNowButton.x = buttonPane.width * 300;
    startNowButton.y = buttonPane.height * 200;

    buttonPane.addChild(startNowButton);

    await this.waitForKeyPress(buttonPane);
  }

  /**
   * Display the test disclaimer
   * Asks the user if they are ready and in a safe
   * environment to start the test
   * Must click yes to continue
   * @returns {Promise<boolean>} Whether the user is ready
   */
  private async displayTestDisclaimer(): Promise<boolean> {
    this.createText(
      "Take this test only when you're in a safe condition to do so.",
      this.app.screen.width * 0.05,
      this.app.screen.height * 0.05,
      24,
      { wordWrap: true }
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
    const confirm = await this.confirm("Ok", "Skip");
    if (confirm === false) {
      return {}; // TODO: Implement Skip button
    }
    return {};
  }

  /**
   * Confirm the sleep data
   * Asks the user to confirm their sleep data
   * Must click yes to continue
   * @returns {Promise<boolean>} Whether the data is correct
   */
  private async confirmSleepData(sleepData: { [key: string]: string }): Promise<boolean> {
    return await this.confirm("Confirm", "Back");
  }

  /**
   * Display the Samn Perelli checklist
   * Asks the user about the quality of their sleep
   * @returns {number} The level on the samn perelli fatigue scale
   * @see https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5803055/
   */
  private async displaySamnPerelliChecklist(): Promise<number> {
    await this.confirm("Ok");
    return 0; // TODO: Implement
  }

  /**
   * Start the test
   * Goes through different pages - home page, disclaimer, sleep form
   * TODO: Seperate pages better
   * @returns {Promise<{ [key: string]: any }>} The test data
   */
  public async start(): Promise<{ [key: string]: any } | false> {
    // Display the home page
    await this.displayHomePage();

    // Display the test disclaimer
    const ready = await this.displayTestDisclaimer();
    if (!ready) return false;

    // Get sleep data
    const sleepData = await this.displaySleepForm();

    // Confirm sleep data
    if (!(await this.confirmSleepData(sleepData))) return false; // TODO: Go back to sleep form

    // Display the Samn Perelli checklist
    const fatigueLevel = await this.displaySamnPerelliChecklist();

    // Display the ready demo screen
    await this.displayReadyDemo();

    return {
      fatigueLevel,
      ...sleepData,
    };
  }
}
