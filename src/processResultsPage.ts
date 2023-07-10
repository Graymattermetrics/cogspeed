import axios from "axios";
import { Application, Container, Graphics, Point, Sprite, Text, Texture } from "pixi.js";

import { CogSpeedGraphicsHandler } from "./ui/handler";

export class ProcessResultsPage {
  constructor(private app: Application, private ui: CogSpeedGraphicsHandler) {}

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

  private async getCurrentPosition(): Promise<(string | null)[]> {
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
    this.app.stage.addChild(container);

    const dynamicScreenWidth = this.app.screen.width * 0.1;
    const dynamicScreenHeight = this.app.screen.height * 0.1;

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const loadingGearSprite = new Sprite(this.ui.loadingGearTexture);
        loadingGearSprite.scale = new Point(0.4, 0.4);
        loadingGearSprite.x = dynamicScreenWidth * (x === 0 ? 2 : 8);
        loadingGearSprite.y = dynamicScreenHeight * (y === 0 ? 4 : 6);
        loadingGearSprite.anchor.set(0.5);

        this.app.ticker.add((delta: number) => {
          loadingGearSprite.rotation += 0.1 * delta;
        });
        container.addChild(loadingGearSprite);
      }
    }

    const graphics = new Graphics();
    graphics.lineStyle(1, 0x457bda, 1);

    graphics.moveTo(dynamicScreenWidth * 2, dynamicScreenHeight * 4);
    graphics.lineTo(dynamicScreenWidth * 8, dynamicScreenHeight * 4);
    graphics.lineTo(dynamicScreenWidth * 8, dynamicScreenHeight * 6);
    graphics.lineTo(dynamicScreenWidth * 2, dynamicScreenHeight * 6);

    graphics.closePath();
    container.addChild(graphics);

    return container;
  }

  public async show(data: { [key: string]: any }) {
    const loadingContainer = this.loadingScreen();

    const [geolocation, normalizedLocation] = await this.getCurrentPosition();
    data.location = {
      geolocation,
      normalizedLocation,
    };

    const responseData = JSON.parse(JSON.stringify(data));
    delete responseData['answerLogs'];
    const testSummary = JSON.stringify(responseData, null, 2).replaceAll('"', "").replaceAll(",", "")

    let textContent = data.success ? `Test finished [temp text] \n${testSummary}` : "Test stopped (failed) [temp text]";
    textContent += "\n**Click me to download results**";

    const text = new Text(textContent, {
      fontFamily: "Arial",
      fontSize: 15,
      fill: 0xff1010,
      align: "left",
    });
    text.style.wordWrap = true;
    text.style.wordWrapWidth = this.app.screen.width - 30;
    text.x = 5;
    text.y = 5;
    text.eventMode = "dynamic";
    text.on("pointerdown", this.downloadHandler.bind(this, data));

    await new Promise((resolve) => setTimeout(resolve, 5000));

    loadingContainer.destroy();
    this.app.stage.addChild(text);
  }
}
