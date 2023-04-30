import { Application, Sprite, Text } from "pixi.js";
import readyDemoImage from "./assets/ready_demmo.png";

export class StartPage {
  constructor(private app: Application) {}

  /**
   * Wait for a click on a sprite
   * @param {Sprite} sprite The sprite to wait for a click on
   */
  async waitForKeyPress(sprite: Sprite) {
    sprite.on("pointerdown", () => {
      this.app.stage.removeChild(sprite);
      sprite.destroy();
    });

    // Block until the start page is removed
    while (sprite.destroyed === false) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Display the ready demo screen
   */
  async displayReadyDemo() {
    // Display the ready demo screen
    const readyDemo = Sprite.from(readyDemoImage);
    readyDemo.x = 0;
    readyDemo.y = 0;
    readyDemo.width = this.app.screen.width;
    readyDemo.height = this.app.screen.height;
    readyDemo.eventMode = "dynamic";

    this.app.stage.addChild(readyDemo);
    await this.waitForKeyPress(readyDemo);
  }

  /**
   * Display the start page
   */
  async display() {
    // Display the start page
    const startNowText = new Text("Click me to start the test", {
      fontSize: 24,
      fill: 0xffffff,
    });
    startNowText.y = this.app.screen.height / 2;
    startNowText.eventMode = "dynamic";

    this.app.stage.addChild(startNowText);

    await this.waitForKeyPress(startNowText);
    await this.displayReadyDemo();
  }
}
