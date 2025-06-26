import axios from "axios";
import { Application, Container, Graphics, Point, Sprite, Text, Texture, Ticker } from "pixi.js";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { table } from "table";
import { CogSpeedGraphicsHandler } from "../ui/handler";
import { startUp } from "../main";
import { Config } from "../types/Config";

import resultsGraph from "../assets/results_graph.png";

export class ProcessResultsPage {
  public resultsGraphTexture: Texture | undefined;

  constructor(private app: Application, private ui: CogSpeedGraphicsHandler) {}

  private formatKey(key: string, capitalise: boolean = false): string {
    let result = capitalise ? key[0].toUpperCase() : key[0];
    let i = 0;
    for (const letter of key.slice(1)) {
      i ++;
      if (letter === "_") {
        continue;
      }

      if (key[i - 1] === "_") {
        result += letter.toUpperCase();
      } else {
        result += letter;
      }
    }
    return result;
  }
  
  private formatKeys(keys: string[]): string {
    let result = "";
    for (const key of keys) {
      result += this.formatKey(key, key !== keys[0]);
    }
    return result
  }

  private formatObject(data: Record<string, any>, keys: string[] | null = null): string {
    if (!data) return ``;

    let formattedData = ``;
    for (const [key, value] of Object.entries(data)) {
      if (["answerLogs"].includes(key)) continue;
      
      // Add the keys
      let copyKeys = null;
      if (keys !== null) copyKeys = [...keys, key];
      if (typeof value === "object") formattedData += this.formatObject(value, copyKeys);
      else formattedData += `${copyKeys ? this.formatKeys(copyKeys): key} = ${value}\n`;
    }
    return formattedData;
  }

  private formatData(data: Record<string, any>, config: Config): string {
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

    // Copy data into display data to also add the local date and time
    const displayData = JSON.parse(JSON.stringify(data));
    displayData["localDate"] = new Date(data["_date"]).toLocaleDateString();
    displayData["localTime"] = new Date(data["_date"]).toLocaleTimeString();
    
    return (
      `${this.formatObject(displayData)}\n` +
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
      }) +
      `\n${this.formatObject(config, [])}`
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

    // @ts-ignore
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
  public loadingScreen(): [Container, Text] {
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

        this.app.ticker.add((delta) => {
          loadingGearSprite.rotation += 0.1 * delta.lastTime;
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

    const text = new Text(`WAIT!...
CogSpeed thinking...`, {
      fontFamily: "Trebuchet",
      fontSize: 23,
      fill: 0xffffff,
      align: "center",
    });
    text.anchor.set(0.5, 0.5)
    text.position.set(this.app.screen.width * 0.5, this.app.screen.height * 0.5)

    container.addChild(text)

    return [container, text];
  }

  public async showCompareScores(data: { [key: string]: any }, config: Config) {
    const resultsTableContainer = this.ui.createResultsTable(data.sleepData.fatigueLevel, data.cognitiveProcessingIndex, data.blockingRoundDuration, this.app.screen.height * 0.05);
    this.app.stage.addChild(resultsTableContainer)

    const textDescription = new Text(`
      RELATIONSHIP OF EXPECTED COGNITIVE PERFORMANCE BETWEEN SUBJECTIVE AND OBJECTIVE SCORES`, {
      fontFamily: "Trebuchet",
      fontSize: 24,
      fill: 0xffffff,
      align: "center",
      wordWrap: true,
      wordWrapWidth: this.app.screen.width * 0.8
    });
    textDescription.position.set(this.app.screen.width * 0.5,
      this.app.screen.height * 0.28);

      textDescription.anchor.set(0.5);
    this.app.stage.addChild(textDescription);

    if (!this.resultsGraphTexture) {
      throw new Error("Results graph texture is not loaded.");
    }

    const graphSprite = new Sprite(this.resultsGraphTexture);
    graphSprite.position.set(this.app.screen.width * 0.5, this.app.screen.height * 0.65)
    graphSprite.scale.set(0.5, 0.65);
    graphSprite.anchor.set(0.5, 0.5)

    this.app.stage.addChild(graphSprite);

    const backButtonContainer = this.ui.createButton(
      "Go back",
      this.app.screen.width * 0.5,
      this.app.screen.height * 0.92,
      this.app.screen.width * 0.6,
      this.app.screen.height * 0.2
    );
    backButtonContainer.on("pointerdown", () => {
      this.ui.removeAllStageChildren();
      this.showSummaryPage(data, config);
    });

    this.app.stage.addChild(backButtonContainer);
  }

  public async showSummaryPage(data: { [key: string]: any }, config: Config) {
    const blockRangeText = (data.status === "failed") ? "N/A" : `${Math.round(data.blocking.blockRange*10)/10}ms`;
    const finalBlockDiffText = (data.status === "failed") ? "N/A" : `${Math.round(data.blocking.finalBlockDiff*10)/10}ms`

    let message = data.status === "failed" ? `(${data.message})` : "";
    const textSummary = new Text(`
      Test version: ${config.version.slice(0, 7)}
      Account ID: N/A
      Date: ${data._date.split(", ")[0]}
      Time: ${data._date.split(", ")[1]}
      Location: ${data.location.normalizedLocation}
      Status: ${data.status} ${message}
      Test duration: ${Math.round(data.testDuration/100) / 10}s
      Number of rounds: ${data.numberOfRounds}
      Number of blocks: ${data.blocking.blockCount}
      Block range: ${blockRangeText}
      Final block difference: ${finalBlockDiffText}`, {
      fontFamily: "Trebuchet",
      fontSize: 28,
      fill: 0xffffff,
      align: "center",
      wordWrap: true,
      wordWrapWidth: this.app.screen.width * 0.95
    });
    textSummary.position.set(this.app.screen.width * 0.5,
      this.app.screen.height * 0.33);

    textSummary.anchor.set(0.5);
    this.app.stage.addChild(textSummary);

    const compareScoresButtonContainer = this.ui.createButton(
      "Compare Scores",
      this.app.screen.width * 0.5,
      this.app.screen.height * 0.80,
      this.app.screen.width * 0.6,
      this.app.screen.height * 0.2
    );
    compareScoresButtonContainer.on("pointerdown", () => {
      this.ui.removeAllStageChildren();
      this.showCompareScores(data, config);
    });

    const backButtonContainer = this.ui.createButton(
      "Go back",
      this.app.screen.width * 0.5,
      this.app.screen.height * 0.92,
      this.app.screen.width * 0.6,
      this.app.screen.height * 0.2
    );
    backButtonContainer.on("pointerdown", () => {
      this.ui.removeAllStageChildren();
      this.show(data, config, {shouldLoad: false});
    });

    this.app.stage.addChild(compareScoresButtonContainer);
    this.app.stage.addChild(backButtonContainer);
  }

  public async show(data: { [key: string]: any }, config: Config, args: { shouldLoad: boolean} = {shouldLoad: true}) {
    const [geolocation, normalizedLocation] = await this.getCurrentPosition();
    data.location = {
      geolocation,
      normalizedLocation,
    };

    // Add table to top of page
    if (data.status === "failed") {
      data.cognitiveProcessingIndex = "N/A";
      data.blockingRoundDuration = "N/A";
    }
    const resultsTableContainer = this.ui.createResultsTable(data.sleepData.fatigueLevel, data.cognitiveProcessingIndex, data.blockingRoundDuration, this.app.screen.height * 0.15);

    const summaryPageButtonContainer = this.ui.createButton(
      "Test summary",
      this.app.screen.width * 0.5,
      this.app.screen.height * 0.40,
      this.app.screen.width * 0.6,
      this.app.screen.height * 0.2
    );
    summaryPageButtonContainer.on("pointerdown", () => {
      this.ui.removeAllStageChildren();
      this.showSummaryPage(data, config);
    });

    const responseData = JSON.parse(JSON.stringify(data));
    delete responseData["answerLogs"];

    const viewTestLogsButtonContainer = this.ui.createButton(
      "Test logs",
      this.app.screen.width * 0.5,
      this.app.screen.height * 0.53,
      this.app.screen.width * 0.6,
      this.app.screen.height * 0.2
    );
    viewTestLogsButtonContainer.on(
      "pointerdown",
      this.downloadHandler.bind(this, this.formatData(data, config), 1850 + data.answerLogs.length * 75)
    );

    const restartTestButtonContainer = this.ui.createButton(
      "Restart",
      this.app.screen.width * 0.5,
      this.app.screen.height * 0.7,
      this.app.screen.width * 0.6,
      this.app.screen.height * 0.2
    );
    restartTestButtonContainer.on("pointerdown", () => {
      // TODO: Send back to home page
      this.app.destroy();
      startUp(config, data.sleepData);
    });

    const homeButton = this.ui.createButton(
      "Home",
      this.app.screen.width * 0.5,
      this.app.screen.height * 0.83,
      this.app.screen.width * 0.6,
      this.app.screen.height * 0.2
    );
    homeButton.on("pointerdown", () => {
      // TODO: Send back to home page
      this.app.destroy();
      startUp(config, false);
    });

    if (args.shouldLoad) {
      const m = this.loadingScreen();
      const loadingContainer = m[0];
      const loadingContainerText = m[1];
      this.resultsGraphTexture = Texture.from(resultsGraph);

      await this.ui.emulateLoadingTime(2500);
      loadingContainerText.text = `Test ${data.status[0].toUpperCase() + data.status.slice(1, data.status.length)}`;
      if (data.status === "success") loadingContainerText.tint = 0x00FF00;
      else loadingContainerText.tint = 0xFF0000;

      await this.ui.emulateLoadingTime(2000);
      loadingContainer.destroy();
    }

    this.app.stage.addChild(resultsTableContainer);
    this.app.stage.addChild(summaryPageButtonContainer);
    this.app.stage.addChild(viewTestLogsButtonContainer);
    this.app.stage.addChild(restartTestButtonContainer);
    this.app.stage.addChild(homeButton);
  }
}
