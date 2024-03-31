import axios from "axios";
import { Application, Text } from "pixi.js";
import { CogSpeedGame } from "./routes/game";
import { StartPage } from "./routes/start";
import { Config } from "./types/Config";
import { CogSpeedGraphicsHandler } from "./ui/handler";

const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;

const app = new Application<HTMLCanvasElement>({
  width: gameWidth,
  height: gameHeight,
});

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
 * Loads initial page
 */
async function main() {
  const config = await loadConfig();
  if (config.error) throw new Error(config.reason);

  const appDiv = document.querySelector(".App");
  if (!appDiv) throw new Error("No app div found");
  appDiv.appendChild(app.view);

  // Show GMM Logo while loading all textures
  // Temp text instead of logo for now
  const loadingText = new Text("Loading", {
    fontFamily: "Trebuchet",
    fontSize: 24,
    fill: 0xffffff,
    align: "center",
  });
  loadingText.anchor.set(0.5);
  loadingText.position.set(gameWidth * 0.5, gameHeight * 0.5);
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
  await startPage.displayHomePage();
  
  // Display start page
  const sleepData = await startPage.start();
  if (!sleepData) throw new Error("No sleep data");

  // Game phase - called after start button is clicked
  const game = new CogSpeedGame(config, app, graphicsManager, sleepData);
  game.start();
}

window.onload = main;
export default function App() {
  return <div className="App"></div>;
}
