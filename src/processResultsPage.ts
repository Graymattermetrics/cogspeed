import axios from "axios";
import { Application, Container, Graphics, Point, Sprite, Text } from "pixi.js";

import { CogSpeedGraphicsHandler } from "./ui/handler";
import { table } from "table";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export class ProcessResultsPage {
  constructor(
    private app: Application,
    private ui: CogSpeedGraphicsHandler,
  ) {}

  private formatObject(data: object): string {
    if (!data) return ``;

    let formattedData = ``;
    for (const [key, value] of Object.entries(data)) {
      if (["answerLogs"].includes(key)) continue;
      if (typeof value === "object") formattedData += this.formatObject(value);
      else formattedData += `${key} = ${value}\n`;
    }
    return formattedData;
  }

  private formatData(data: { [key: string]: any }): string {
    const keys = [
      ["Num", "roundNumber"],
      ["Type", "roundType"],
      ["Duration", "duration"],
      ["Response", "timeTaken"],
      ["Status", "status"],
      ["Ratio", "ratio"],
      ["Rm", "correctRollingMeanRatio"],
      ["Query", "queryNumber"],
      ["Location", "answerLocation"],
      ["Clicked", "locationClicked"],
      ["Previous", "isCorrectOrIncorrectFromPrevious"],
    ];

    const tableDataObj = [];
    tableDataObj.push(keys.map((k) => k[0]));
    for (const response of data["answerLogs"]) {
      const tableAnswer = [];
      for (const key of keys) {
        let value = response[key[1]];
        if (typeof value === "number") value = Math.round(value * 100) / 100;
        tableAnswer.push(value);
      }
      tableDataObj.push(tableAnswer);
    }

    return (
      `${this.formatObject(data)}\n` +
      table(tableDataObj, {
        border: {
          topBody: `-`,
          topJoin: `-`,
          topLeft: `-`,
          topRight: `-`,

          bottomBody: `-`,
          bottomJoin: `-`,
          bottomLeft: `-`,
          bottomRight: `-`,

          bodyLeft: `|`,
          bodyRight: `|`,
          bodyJoin: `|`,

          joinMiddleUp: `|`,
          joinMiddleDown: `|`,
          joinMiddleLeft: `|`,
          joinMiddleRight: `|`,

          joinBody: `-`,
          joinLeft: `|`,
          joinRight: `|`,
          joinJoin: `|`,
        },
        header: {
          alignment: "center",
          content: "Answer logs\n(Rm = rolling mean average)",
        },
      })
    );
  }

  private async downloadHandler(logContent: string, height: number) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);

    const page = pdfDoc.addPage([1150, height]);

    const fontSize = 17;
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(logContent, {
      x: 35,
      y: page.getHeight() - 50 - textHeight, // Align at the top of the page
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "log.pdf";

    document.body.appendChild(link);
    link.click();

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
        },
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
        loadingGearSprite.anchor.set(0.5);
        loadingGearSprite.position.set(dynamicScreenWidth * (x === 0 ? 2 : 8), dynamicScreenHeight * (y === 0 ? 4 : 6));
        loadingGearSprite.scale = new Point(0.4, 0.4);

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
    delete responseData["answerLogs"];
    const testSummary = JSON.stringify(responseData, null, 2).replaceAll('"', "").replaceAll(",", "");

    let textContent = data.success ? `Test finished [temp text] \n${testSummary}` : "Test stopped (failed) [temp text]";
    textContent += "\n**Click me to download results**";

    const text = new Text(textContent, {
      fontFamily: "Trebuchet",
      fontSize: 15,
      fill: 0xff1010,
      align: "left",
    });
    text.style.wordWrap = true;
    text.style.wordWrapWidth = this.app.screen.width - 30;
    text.position.set(5, 5);
    text.eventMode = "dynamic";
    text.on("pointerdown", this.downloadHandler.bind(this, this.formatData(data), 850 + data.answerLogs.length * 75));

    const buttonContainer = this.ui.createButton("Restart test", this.app.screen.width / 2, this.app.screen.height / 2, this.app.screen.width / 2, this.app.screen.height / 5)
    buttonContainer.eventMode = "dynamic";
    buttonContainer.on("pointerdown", () => {
      window.location.reload();
    });

    await this.ui.loadScreen();

    loadingContainer.destroy();

    this.app.stage.addChild(text);
    this.app.stage.addChild(buttonContainer);
    

  }
}
