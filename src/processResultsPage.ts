import axios from "axios";
import { Application, Container, Graphics, Point, Sprite, Text, Texture } from "pixi.js";

import { CogSpeedGraphicsHandler } from "./ui/handler";
import { table } from "table";

export class ProcessResultsPage {
  constructor(
    private app: Application,
    private ui: CogSpeedGraphicsHandler,
  ) {}

  private formatData(data: { [key: string]: any }): string {
    const keys = [
      ["Round number", "roundNumber"],
      ["Type", "roundType"],
      ["Round Duration", "duration"],
      ["Status", "status"],
      ["Response time", "timeTaken"],
      ["Ratio", "ratio"],
      ["Rolling mean", "correctRollingMeanRatio"],
      ["Answer location", "answerLocation"],
      ["Location clicked", "locationClicked"],
      ["Query number", "queryNumber"],
      ["Is correct from previous", "isCorrectFromPrevious"],
      ["Time epoch", "_time_epoch"],
    ];
    const tableDataObj = [];
    tableDataObj.push(keys.map((k) => k[0]));
    for (const response of data["answerLogs"]) {
      const tableAnswer = [];
      for (const key of keys) {
        tableAnswer.push(response[key[1]]);
      }
      tableDataObj.push(tableAnswer);
    }
    return table(tableDataObj, {
      border: {
        topBody: `─`,
        topJoin: `┬`,
        topLeft: `┌`,
        topRight: `┐`,

        bottomBody: `─`,
        bottomJoin: `┴`,
        bottomLeft: `└`,
        bottomRight: `┘`,

        bodyLeft: `│`,
        bodyRight: `│`,
        bodyJoin: `│`,

        joinBody: `─`,
        joinLeft: `├`,
        joinRight: `┤`,
        joinJoin: `┼`,
      },
    });
  }

  private async downloadHandler(logContent: string) {
    // Create a blob from the log content
    const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "log.txt";

    // Trigger the download
    document.body.appendChild(link);
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
    // Disgusting test code
    data = {
      statusCode: 0,
      status: "success",
      success: true,
      message: "Test completed successfully",
      testDuration: 27635,
      numberOfRounds: 29,
      blockingRoundDuration: 1062,
      cognitiveProcessingIndex: 67,
      blockCount: 3,
      machinePacedBaseline: 811.1499999985099,
      version: "f104966a7fe447974f10987f012044c9ef3f72da",
      sleepData: {},
      numberOfRollMeanLimitExceedences: 0,
      finalRatio: 1.5848399246648206,
      answers: {
        totalMachinePacedAnswers: 17,
        totalMachinePacedCorrectAnswers: 9,
        totalMachinePacedIncorrectAnswers: 1,
        totalMachinePacedNoResponseAnswers: 7,
      },
      responseTimes: {
        quickestResponse: 730.9000000059605,
        quickestCorrectResponse: 730.9000000059605,
        slowestResponse: 1132,
        slowestCorrectResponse: 1061.0999999940395,
        meanMachinePacedAnswerTime: 877.8588235290612,
        meanCorrectMachinePacedAnswerTime: 804.5666666693157,
      },
      answerLogs: [
        {
          status: "correct",
          roundTypeNormalized: "training",
          answerLocation: 4,
          locationClicked: 4,
          queryNumber: "4:numbers",
          correctRollingMeanRatio: 1,
          duration: -1,
          roundNumber: 1,
          roundType: 0,
          timeTaken: 2225.7000000178814,
          isCorrectFromPrevious: false,
          ratio: 0,
          _time_epoch: 5965.5999999940395,
        },
        {
          status: "correct",
          roundTypeNormalized: "self-paced",
          answerLocation: 5,
          locationClicked: 5,
          queryNumber: "2:numbers",
          correctRollingMeanRatio: 1,
          duration: -1,
          roundNumber: 2,
          roundType: 1,
          timeTaken: 959.7999999821186,
          isCorrectFromPrevious: false,
          ratio: 0,
          _time_epoch: 6925.399999976158,
        },
        {
          status: "correct",
          roundTypeNormalized: "self-paced",
          answerLocation: 6,
          locationClicked: 6,
          queryNumber: "7:numbers",
          correctRollingMeanRatio: 1,
          duration: -1,
          roundNumber: 3,
          roundType: 1,
          timeTaken: 937.1000000238419,
          isCorrectFromPrevious: false,
          ratio: 0,
          _time_epoch: 7862.5,
        },
        {
          status: "correct",
          roundTypeNormalized: "self-paced",
          answerLocation: 2,
          locationClicked: 2,
          queryNumber: "2:dots",
          correctRollingMeanRatio: 1,
          duration: -1,
          roundNumber: 4,
          roundType: 1,
          timeTaken: 895.8999999761581,
          isCorrectFromPrevious: false,
          ratio: 0,
          _time_epoch: 8758.399999976158,
        },
        {
          status: "correct",
          roundTypeNormalized: "self-paced",
          answerLocation: 5,
          locationClicked: 5,
          queryNumber: "9:dots",
          correctRollingMeanRatio: 1,
          duration: -1,
          roundNumber: 5,
          roundType: 1,
          timeTaken: 851.8000000119209,
          isCorrectFromPrevious: false,
          ratio: 0,
          _time_epoch: 9610.199999988079,
        },
        {
          status: "no response",
          roundTypeNormalized: "machine-paced",
          answerLocation: 3,
          locationClicked: null,
          queryNumber: "9:numbers",
          correctRollingMeanRatio: 1,
          duration: 811.1499999985099,
          roundNumber: 6,
          roundType: 2,
          timeTaken: 815.5999999940395,
          isCorrectFromPrevious: false,
          ratio: 1.0054860383351265,
          _time_epoch: 10425.799999982119,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 3,
          locationClicked: 3,
          queryNumber: "7:dots",
          correctRollingMeanRatio: 0.875,
          duration: 811.1499999985099,
          roundNumber: 7,
          roundType: 2,
          timeTaken: 816.3000000119209,
          isCorrectFromPrevious: true,
          ratio: 1.0063490106804174,
          _time_epoch: 10426.5,
        },
        {
          status: "no response",
          roundTypeNormalized: "machine-paced",
          answerLocation: 3,
          locationClicked: null,
          queryNumber: "3:numbers",
          correctRollingMeanRatio: 0.875,
          duration: 803.553499999866,
          roundNumber: 8,
          roundType: 2,
          timeTaken: 804.7999999821186,
          isCorrectFromPrevious: false,
          ratio: 1.001551234587682,
          _time_epoch: 11231.299999982119,
        },
        {
          status: "no response",
          roundTypeNormalized: "machine-paced",
          answerLocation: 4,
          locationClicked: null,
          queryNumber: "4:dots",
          correctRollingMeanRatio: 0.75,
          duration: 803.553499999866,
          roundNumber: 9,
          roundType: 2,
          timeTaken: 805.5999999940395,
          isCorrectFromPrevious: false,
          ratio: 1.002546812370519,
          _time_epoch: 12036.899999976158,
        },
        {
          status: "incorrect",
          roundTypeNormalized: "post-block",
          answerLocation: 2,
          locationClicked: 1,
          queryNumber: "6:numbers",
          correctRollingMeanRatio: 0.625,
          duration: 1078.5534999998658,
          roundNumber: 10,
          roundType: 3,
          timeTaken: 1579.5,
          isCorrectFromPrevious: false,
          ratio: 1.464461429127249,
          _time_epoch: 13616.399999976158,
        },
        {
          status: "correct",
          roundTypeNormalized: "post-block",
          answerLocation: 4,
          locationClicked: 4,
          queryNumber: "9:numbers",
          correctRollingMeanRatio: 0.5,
          duration: 1078.5534999998658,
          roundNumber: 11,
          roundType: 3,
          timeTaken: 1130.9000000059605,
          isCorrectFromPrevious: false,
          ratio: 1.0485339855705824,
          _time_epoch: 14747.299999982119,
        },
        {
          status: "correct",
          roundTypeNormalized: "post-block",
          answerLocation: 1,
          locationClicked: 1,
          queryNumber: "2:numbers",
          correctRollingMeanRatio: 0.5,
          duration: 1078.5534999998658,
          roundNumber: 12,
          roundType: 3,
          timeTaken: 752.3000000119209,
          isCorrectFromPrevious: false,
          ratio: 0.697508283095845,
          _time_epoch: 15499.59999999404,
        },
        {
          status: "incorrect",
          roundTypeNormalized: "machine-paced",
          answerLocation: 4,
          locationClicked: 5,
          queryNumber: "3:numbers",
          correctRollingMeanRatio: 0.5,
          duration: 1078.5534999998658,
          roundNumber: 13,
          roundType: 2,
          timeTaken: 995.7999999821186,
          isCorrectFromPrevious: false,
          ratio: 0.9232736252603533,
          _time_epoch: 16495.399999976158,
        },
        {
          status: "no response",
          roundTypeNormalized: "machine-paced",
          answerLocation: 6,
          locationClicked: null,
          queryNumber: "7:numbers",
          correctRollingMeanRatio: 0.875,
          duration: 1128.5534999998658,
          roundNumber: 14,
          roundType: 2,
          timeTaken: 1131.7000000178814,
          isCorrectFromPrevious: false,
          ratio: 1.0027880822823338,
          _time_epoch: 17627.09999999404,
        },
        {
          status: "no response",
          roundTypeNormalized: "machine-paced",
          answerLocation: 5,
          locationClicked: null,
          queryNumber: "3:dots",
          correctRollingMeanRatio: 0.75,
          duration: 1128.5534999998658,
          roundNumber: 15,
          roundType: 2,
          timeTaken: 1132,
          isCorrectFromPrevious: false,
          ratio: 1.0030539092742476,
          _time_epoch: 18759.09999999404,
        },
        {
          status: "correct",
          roundTypeNormalized: "post-block",
          answerLocation: 1,
          locationClicked: 1,
          queryNumber: "5:dots",
          correctRollingMeanRatio: 0.625,
          duration: 1403.5534999998658,
          roundNumber: 16,
          roundType: 3,
          timeTaken: 826,
          isCorrectFromPrevious: false,
          ratio: 0.5885062450416596,
          _time_epoch: 19585.09999999404,
        },
        {
          status: "correct",
          roundTypeNormalized: "post-block",
          answerLocation: 6,
          locationClicked: 6,
          queryNumber: "5:numbers",
          correctRollingMeanRatio: 0.125,
          duration: 1403.5534999998658,
          roundNumber: 17,
          roundType: 3,
          timeTaken: 897.7999999821186,
          isCorrectFromPrevious: false,
          ratio: 0.639662114755301,
          _time_epoch: 20482.899999976158,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 3,
          locationClicked: 3,
          queryNumber: "1:numbers",
          correctRollingMeanRatio: 0.125,
          duration: 1403.5534999998658,
          roundNumber: 18,
          roundType: 2,
          timeTaken: 745.4000000059605,
          isCorrectFromPrevious: false,
          ratio: 0.5310805751302189,
          _time_epoch: 21228.29999998212,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 2,
          locationClicked: 2,
          queryNumber: "4:dots",
          correctRollingMeanRatio: 1,
          duration: 1323.7026150004767,
          roundNumber: 19,
          roundType: 2,
          timeTaken: 811.7000000178814,
          isCorrectFromPrevious: false,
          ratio: 0.613204197694804,
          _time_epoch: 22040,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 3,
          locationClicked: 3,
          queryNumber: "2:numbers",
          correctRollingMeanRatio: 1,
          duration: 1259.2653273522124,
          roundNumber: 20,
          roundType: 2,
          timeTaken: 750.1999999880791,
          isCorrectFromPrevious: false,
          ratio: 0.5957441880540641,
          _time_epoch: 22790.19999998808,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 6,
          locationClicked: 6,
          queryNumber: "4:dots",
          correctRollingMeanRatio: 1,
          duration: 1195.7661413422768,
          roundNumber: 21,
          roundType: 2,
          timeTaken: 736.9000000059605,
          isCorrectFromPrevious: false,
          ratio: 0.6162576230656374,
          _time_epoch: 23527.09999999404,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 1,
          locationClicked: 1,
          queryNumber: "2:dots",
          correctRollingMeanRatio: 1,
          duration: 1137.9218657952224,
          roundNumber: 22,
          roundType: 2,
          timeTaken: 1061.0999999940395,
          isCorrectFromPrevious: false,
          ratio: 0.9324893315522179,
          _time_epoch: 24588.19999998808,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 2,
          locationClicked: 2,
          queryNumber: "4:dots",
          correctRollingMeanRatio: 1,
          duration: 1118.860460557152,
          roundNumber: 23,
          roundType: 2,
          timeTaken: 730.9000000059605,
          isCorrectFromPrevious: false,
          ratio: 0.653253936279059,
          _time_epoch: 25319.09999999404,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 5,
          locationClicked: 5,
          queryNumber: "2:numbers",
          correctRollingMeanRatio: 1,
          duration: 1068.8758098964613,
          roundNumber: 24,
          roundType: 2,
          timeTaken: 827.5,
          isCorrectFromPrevious: false,
          ratio: 0.7741778720580806,
          _time_epoch: 26146.59999999404,
        },
        {
          status: "correct",
          roundTypeNormalized: "machine-paced",
          answerLocation: 2,
          locationClicked: 2,
          queryNumber: "5:dots",
          correctRollingMeanRatio: 1,
          duration: 1034.0494708078506,
          roundNumber: 25,
          roundType: 2,
          timeTaken: 761.0999999940395,
          isCorrectFromPrevious: false,
          ratio: 0.7360382858659853,
          _time_epoch: 26907.69999998808,
        },
        {
          status: "no response",
          roundTypeNormalized: "machine-paced",
          answerLocation: 4,
          locationClicked: null,
          queryNumber: "6:numbers",
          correctRollingMeanRatio: 1,
          duration: 996.414029018391,
          roundNumber: 26,
          roundType: 2,
          timeTaken: 997.5,
          isCorrectFromPrevious: false,
          ratio: 1.001089879256998,
          _time_epoch: 27905.19999998808,
        },
        {
          status: "no response",
          roundTypeNormalized: "machine-paced",
          answerLocation: 3,
          locationClicked: null,
          queryNumber: "3:dots",
          correctRollingMeanRatio: 0.875,
          duration: 996.414029018391,
          roundNumber: 27,
          roundType: 2,
          timeTaken: 999.5,
          isCorrectFromPrevious: false,
          ratio: 1.0030970770098941,
          _time_epoch: 28904.69999998808,
        },
        {
          status: "incorrect",
          roundTypeNormalized: "final",
          answerLocation: 6,
          locationClicked: 1,
          queryNumber: "7:dots",
          correctRollingMeanRatio: 0.75,
          duration: 1271.414029018391,
          roundNumber: 28,
          roundType: 5,
          timeTaken: 786.4000000059605,
          isCorrectFromPrevious: false,
          ratio: 0.6185239285216234,
          _time_epoch: 29691.09999999404,
        },
        {
          status: "correct",
          roundTypeNormalized: "final",
          answerLocation: 5,
          locationClicked: 5,
          queryNumber: "7:numbers",
          correctRollingMeanRatio: -0.25,
          duration: 1271.414029018391,
          roundNumber: 29,
          roundType: 5,
          timeTaken: 1683.0999999940395,
          isCorrectFromPrevious: false,
          ratio: 1.3238016582949736,
          _time_epoch: 31374.19999998808,
        },
      ],
      _date: "2023-07-31T17:10:51.332Z",
      _date_minute_offset: -60,
      _id: "4f928a78-6103-4dbe-abec-68670a074540",
      location: { geolocation: null, normalizedLocation: "Could not get location" },
    };
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
    text.on("pointerdown", this.downloadHandler.bind(this, this.formatData(data)));

    const loadingTime = process.env.NODE_ENV === "development" ? 100 : 5000;
    await new Promise((resolve) => setTimeout(resolve, loadingTime));

    loadingContainer.destroy();
    this.app.stage.addChild(text);
  }
}
