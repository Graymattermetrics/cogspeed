import axios from "axios";
import { Application, Container, Graphics, Point, Sprite, Text, Texture } from "pixi.js";

import { CogSpeedGraphicsHandler } from "./ui/handler";

export class ProcessResultsPage {
  constructor(private app: Application, private ui: CogSpeedGraphicsHandler) {}

  /**
 * Wait for a click on a sprite
 */
  private async waitForKeyPress(container: Container): Promise<void> {
    return new Promise((resolve) => {
      container.eventMode = "dynamic";
      container.once("pointerdown", () => {
        resolve();
      });
    });

  }

  private downloadHandler(data: object) {
    // Generate the log file content (replace this with your own logic)
    const logContent = JSON.stringify(data);

    // Create a blob from the log content
    const blob = new Blob([logContent], { type: "text/plain" });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = url;
    link.download = "log.txt"; // Specify the filename

    // Trigger the download
    document.body.appendChild(link); // Required for Firefox
    link.click();

    // Clean up the temporary URL and link
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private async getLocation(): Promise<(string | null)[]> {
    const coords: GeolocationCoordinates | null = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position.coords);
        },
        (error) => {
          resolve(null);
        }
      );
    });
    const geolocation = coords ? `${coords.latitude},${coords.longitude}` : null;
    // prettier-ignore
    const normalizedLocation = coords ? (await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${coords.latitude},${coords.longitude}`
      )).data[0].display_name : "Could not get location";

    return [geolocation, normalizedLocation];
  }

  /**
   * Displays a loading screen in order to
   * process data such as current position
   */
  public loadingScreen(): Container {
    const container = new Container();
    this.ui.setBackground("carbon", container);
    
    this.app.stage.addChild(container);

    const dynamicScreenWidth = this.app.screen.width * 0.1;
    const dynamicScreenHeight = this.app.screen.height * 0.1;

    const graphics = new Graphics();
    graphics.lineStyle(2, 0x457bda, 1);
    graphics.beginFill(0x00000, 100);

    graphics.moveTo(dynamicScreenWidth * 1, dynamicScreenHeight * 3.5);
    graphics.lineTo(dynamicScreenWidth * 9, dynamicScreenHeight * 3.5);
    graphics.lineTo(dynamicScreenWidth * 9, dynamicScreenHeight * 6.5);
    graphics.lineTo(dynamicScreenWidth * 1, dynamicScreenHeight * 6.5 );
    
    graphics.closePath();
    graphics.endFill();
    container.addChild(graphics);

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const loadingGearSprite = new Sprite(this.ui.loadingGearTexture);
        loadingGearSprite.scale = new Point(0.4, 0.4);
        loadingGearSprite.x = dynamicScreenWidth * (x === 0 ? 1 : 9);
        loadingGearSprite.y = dynamicScreenHeight * (y === 0 ? 3.5 : 6.5);
        loadingGearSprite.anchor.set(0.5);

        this.app.ticker.add((delta: number) => {
          loadingGearSprite.rotation += 0.1 * delta;
        });
        container.addChild(loadingGearSprite);
      }
    }
    return container;
  }

  public resultsScreen(data: { [key: string]: any }): Container {
    const container = new Container();
    this.ui.setBackground("carbon", container);

    this.app.stage.addChild(container);

    const dashMeter = new Sprite(this.ui.dashMeterTexture);
    dashMeter.width = this.app.screen.width + this.app.screen.width * 0.19;
    dashMeter.height = this.app.screen.height * 0.5 + dashMeter.width * 0.02;
    dashMeter.x = this.app.screen.width * 0.5;
    dashMeter.y = this.app.screen.height * 0.41;
    dashMeter.anchor.set(0.5);
    container.addChild(dashMeter);

    const background = new Graphics();
    background.beginFill(0x18c436, 1);
    background.drawRect(0, 0, this.app.screen.width, this.app.screen.height * 0.1);
    background.endFill();
    container.addChild(background);

    this.ui.createText(`C\nSeems OK. Passable`, 0.5, 0.05, container, {
      fill: 0xFFFFFF,
    })  // TOOD: Replace with data variable

    this.ui.createText("Cognitive Performance Index", 0.5, (dashMeter.y + (dashMeter.height * 0.3)) / this.app.screen.height, container, {
      fill: 0xc2e2ff,
      fontSize: 12
    })
    // TOOD: Replace with data variable
    this.ui.createText(`65`, 0.6, (dashMeter.y + (dashMeter.height * 0.2)) / this.app.screen.height, container, {
      fill: 0xc2e2ff,
      fontSize: 50
    });
    this.ui.createText("CPI", 0.35, (dashMeter.y + (dashMeter.height * 0.15)) / this.app.screen.height, container, {
      fill: 0xc2e2ff,
      fontSize: 20
    });
    const sfpBar = new Sprite(this.ui.spfBarTexture);
    sfpBar.width = this.app.screen.width + this.app.screen.width * 0.1;
    sfpBar.height = this.app.screen.height * 0.1;
    sfpBar.x = this.app.screen.width * 0.5;
    sfpBar.y = dashMeter.x + dashMeter.height * 0.827;
    sfpBar.anchor.set(0.5);
    container.addChild(sfpBar);

    for (let i = 1; i < 8; i++) {
      this.ui.createText(`${i}`, 0.05 + ((i - 1) * 0.15), (sfpBar.y) / this.app.screen.height, container, {
        fill: (i === 4) ? 0x4dd64d : 0x5d5e5e,  // TOOD: Replace with data variable
        fontSize: (i === 4) ? 30 : 20  // TOOD: Replace with data variable
      });
    }
    return container;
  }

  public async show(data: { [key: string]: any }) {
    // Create a loading screen
    const loadingContainer = this.loadingScreen();
    
    // Load location from API in loading screen
    const [geolocation, normalizedLocation] = await this.getLocation();
    data.geolocation = geolocation;
    data.normalizedLocation = normalizedLocation;

    const messageText = this.ui.createText("Test Complete!", 0.5, 0.45, loadingContainer);
    const statusText = this.ui.createText("Analyzing...", 0.5, 0.55, loadingContainer, {
      fontSize: 35,
      fill: data.success ? 0x6493c9 : 0xff0000,
    });

    // Emulate a loading screen
    const duration = process.env.NODE_ENV === "development" ? 200 : 3000;
    await new Promise((resolve) => setTimeout(resolve, duration));
    
    statusText.text = data.success ? "Success" : "Failed";
    this.ui.createText("Tap to show results", 0.5, 0.8, loadingContainer);

    // Wait for a click on the loading screen before showing results
    const waitPromise = this.waitForKeyPress(loadingContainer);
    if (process.env.NODE_ENV !== "development") {
      await waitPromise;
    }
    this.app.stage.removeChild(loadingContainer);

    // Create the screen for the results
    const responseContainer = this.resultsScreen(data);
  }
}
