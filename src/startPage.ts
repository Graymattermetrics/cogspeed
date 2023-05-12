import { Application, Container, Point, Sprite, Text, Texture } from "pixi.js";

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
    const yesBorder = new Sprite(this.ui.smallButtons[1]);
    yesBorder.scale = new Point(1.2, 1.2);
    yesBorder.width = this.app.screen.width * 0.4;
    yesBorder.height = this.app.screen.height * 0.2;
    yesBorder.x = this.app.screen.width * 0.5;
    yesBorder.y = this.app.screen.height * 0.7;
    this.container.addChild(yesBorder);

    const yesText = new Text(confirmText, {
      fontFamily: "Trebuchet",
      fontSize: 30,
      fill: 0xffffff,
    });
    yesText.x = yesBorder.x + (yesBorder.width - yesText.width) * 0.5;
    yesText.y = yesBorder.y + (yesBorder.height - yesText.height) * 0.5;
    this.container.addChild(yesText);

    if (denyText === "") {
      await this.waitForKeyPress([yesBorder, yesText]);
      return true;
    }

    const noBorder = new Sprite(this.ui.smallButtons[1]);
    noBorder.scale = new Point(1.2, 1.2);
    noBorder.width = this.app.screen.width * 0.4;
    noBorder.height = this.app.screen.height * 0.2;
    noBorder.x = this.app.screen.width * 0.1;
    noBorder.y = this.app.screen.height * 0.7;
    this.container.addChild(noBorder);

    const noText = new Text(denyText, {
      fontFamily: "Trebuchet",
      fontSize: 30,
      fill: 0xffffff,
    });
    noText.x = noBorder.x + (noBorder.width - noText.width) * 0.5;
    noText.y = noBorder.y + (noBorder.height - noText.height) * 0.5;
    this.container.addChild(noText);

    const keypress = await this.waitForKeyPress([yesBorder, yesText], [noBorder, noText]);
    return keypress === yesBorder || keypress === yesText;
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
    sprite: (Sprite | Container | Text)[] = [this.container],
    secondSprites: (Sprite | Container | Text)[] = []
  ): Promise<Sprite | Container | null> {
    [...sprite, ...secondSprites].forEach((sprite_) => {
      sprite_.eventMode = "dynamic";
      sprite_.on("pointerdown", () => {
        sprite_.destroy();
        this.container.destroy();
      });
    });

    // Block until the start page is removed
    while (this.container.destroyed === false) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.container = new Container();
    this.app.stage.addChild(this.container);

    for (const sprite_ of sprite) {
      if (sprite_.destroyed === true) {
        return sprite_;
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
    // Create the logo
    const logoSprite = new Sprite(this.logoTexture);
    logoSprite.width = this.app.screen.width * 0.8 > 400 ? 400 : this.app.screen.width * 0.8;
    logoSprite.height = this.app.screen.height * 0.6 > 400 ? 400 : this.app.screen.height * 0.6;
    logoSprite.x = this.app.screen.width * 0.5 - logoSprite.width * 0.5;
    this.container.addChild(logoSprite);

    const buttonBorder = new Sprite(this.ui.largeButtonTexture);
    buttonBorder.width = this.app.screen.width * 0.8 > 400 ? 400 : this.app.screen.width * 0.8;
    buttonBorder.height = this.app.screen.height * 0.25 > 200 ? 200 : this.app.screen.height * 0.25;
    buttonBorder.x = this.app.screen.width * 0.5 - buttonBorder.width * 0.5;
    buttonBorder.y = this.app.screen.height * 0.7;
    this.container.addChild(buttonBorder);

    // Display the start page
    const startNowButton = new Text("Test now!", {
      fontFamily: "Trebuchet",
      fontSize: 36,
      fill: 0xffffff,
    });
    // Center the start now button
    startNowButton.x = buttonBorder.x + (buttonBorder.width - startNowButton.width) * 0.5;
    startNowButton.y = buttonBorder.y + (buttonBorder.height - startNowButton.height) * 0.5;
    this.container.addChild(startNowButton);

    await this.waitForKeyPress([buttonBorder, startNowButton]);
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
    // // Display the home page
    // await this.displayHomePage();

    // // Display the test disclaimer
    // const ready = await this.displayTestDisclaimer();
    // if (!ready) return false;

    // // Get sleep data
    // const sleepData = await this.displaySleepForm();

    // // Confirm sleep data
    // if (!(await this.confirmSleepData(sleepData))) return false; // TODO: Go back to sleep form

    // // Display the Samn Perelli checklist
    // const fatigueLevel = await this.displaySamnPerelliChecklist();

    // // Display the ready demo screen
    // await this.displayReadyDemo();

    // return {
    //   fatigueLevel,
    //   ...sleepData,
    // };
    return {};
  }
}
