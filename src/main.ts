import axios from "axios";
import { Application, Text } from "pixi.js";
import { CogSpeedGame } from "./routes/game";
import { StartPage } from "./routes/start";
import { Config } from "./types/Config";
import { CogSpeedGraphicsHandler } from "./ui/handler";


function createApp(): Application {
  const gameWidth = window.innerWidth;
  const gameHeight = window.innerHeight;

  const app = new Application<HTMLCanvasElement>({
    width: gameWidth,
    height: gameHeight,
  });

  const appDiv = document.querySelector(".App");
  if (!appDiv) throw new Error("No app div found");
  appDiv.innerHTML = "";  // TODO: Fix(?)
  appDiv.appendChild(app.view);

  return app;
}


/**
 * Loads the config from the backend
 * NOTE: Increases load time
 */
async function loadConfig(): Promise<Config> {
  let url = "https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig";
  const params = new URLSearchParams(window.location.search);

  const version = params.get("version");
  const branch = params.get("branch");

  // Either append version or branch
  if (version) url += `?version=${version}`;
  else if (branch) url += `?branch=${branch}`;

  const request = await axios.get(url);
  return await request.data;
}


/**
 * 
 * @param config 
 * @param startNow Called from restart. Bypasses sleep data
 */
export async function startUp(config: Config | null = null, startNowData: Record<string, any> | false = false) {
  if (config === null) {
    config = await loadConfig();
    if (config.error) throw new Error(config.reason);
  }

  const app = createApp();

  // Show GMM Logo while loading all textures
  // Temp text instead of logo for now
  const loadingText = new Text("Loading", {
    fontFamily: "Trebuchet",
    fontSize: 24,
    fill: 0xffffff,
    align: "center",
  });
  loadingText.anchor.set(0.5);
  loadingText.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
  app.stage.addChild(loadingText);
  app.ticker.add((delta) => {
    loadingText.text = "Loading" + ".".repeat((Math.floor(app.ticker.lastTime / 1000) % 3) + 1);
  });

  const graphicsManager = new CogSpeedGraphicsHandler(app);

  // Load screen while displaying loading text
  await graphicsManager.emulateLoadingTime();
  graphicsManager.setBackground("carbon");
  app.stage.removeChild(loadingText);

  // Display the home page
  const startPage = new StartPage(config, app, graphicsManager);
  if (startNowData == false) await startPage.displayHomePage();

  // Display start page
  const sleepData = await startPage.start(startNowData);
  if (!sleepData) throw new Error("No sleep data");

  // Game phase - called after start button is clicked
  const game = new CogSpeedGame(config, app, graphicsManager, sleepData);
  game.start();
};
