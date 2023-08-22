import "./App.css";

import { Application, Text } from "pixi.js";
import { CogSpeedGame } from "./game";
import { StartPage } from "./startPage";
import { CogSpeedGraphicsHandler } from "./ui/handler";
import axios from "axios";

const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;

const app = new Application<HTMLCanvasElement>({
  width: gameWidth,
  height: gameHeight,
});

/**
 * Loads the config from the backend
 * NOTE: Increases load time
 * @return {Promise<void>}
 */
async function loadConfig(): Promise<{ [key: string]: any }> {
  let configUrl = "https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig";
  const urlParams = new URLSearchParams(window.location.search);
  const version = urlParams.get("version");
  // Append version and branch from window search location
  if (version) configUrl += `?version=${version}`;
  else {
    const branch = urlParams.get("branch");
    if (branch) configUrl += `?branch=${branch}`;
  }
  return (await axios.get(configUrl)).data;
}

/**
 * 
 */
async function performPracticeTest(config: { [key: string]: any }, graphicsManager: CogSpeedGraphicsHandler) {

}

/**
 * Loads initial page
 */
async function main(): Promise<void> {
  const config = await loadConfig();
  if (config.error) throw new Error(config.reason);

  const appDiv = document.querySelector(".App");
  if (!appDiv) throw new Error("No app div found");
  appDiv.appendChild(app.view);

  resizeCanvas(); // TODO

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
  const route = await startPage.displayHomePage();
  if (route === "practice") {
    return performPracticeTest(config, graphicsManager);
  }

  // Display start page
  const sleepData = await startPage.start();
  if (!sleepData) throw new Error("No sleep data");

  // Game phase - called after start button is clicked
  const game = new CogSpeedGame(config, app, graphicsManager, sleepData);
  game.start();
}

/**
 * Resize canvas
 * @return {void}
 */
function resizeCanvas(): void {
  const resize = () => {
    window.location.reload(); // TODO: Implement auto resize
  };
  // Test: may be breaking test when downloading logs on mobile
  // window.addEventListener("resize", resize);
}

window.onload = main;
export default function App() {
  return <div className="App"></div>;
}
