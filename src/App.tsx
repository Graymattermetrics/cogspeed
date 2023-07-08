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
app.stage.interactive = true;

/**
 * Loads the config from the backend
 * NOTE: Increases load time
 * @return {Promise<void>}
 */
async function loadConfig(): Promise<{ [key: string]: any }> {
  let configUrl =
    "https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig";
  const urlParams = new URLSearchParams(window.location.search);
  const version = urlParams.get("version");
  if (version) {
    configUrl += "?version=" + version;
  }
  if (!version) {
    const branch = urlParams.get("branch");
    if (branch) {
      configUrl += "?branch=" + branch;
    }
  }
  return (await axios.get(configUrl)).data;
}

/**
 * Loads initial page
 */
async function main(): Promise<void> {
  const config = await loadConfig();

  const appDiv = document.querySelector(".App");
  if (!appDiv) throw new Error("No app div found");
  appDiv.appendChild(app.view);

  resizeCanvas(); // TODO

  // Show GMM Logo while loading all textures
  // Temp text instead of logo for now
  const loadingText = new Text("Loading", {
    fontFamily: "Arial",
    fontSize: 24,
    fill: 0xffffff,
    align: "center",
  });
  loadingText.anchor.set(0.5);
  loadingText.position.set(gameWidth / 2, gameHeight / 2);
  app.stage.addChild(loadingText);
  app.ticker.add((delta) => {
    loadingText.text =  "Loading" + ".".repeat(Math.floor(app.ticker.lastTime / 1000) % 3 + 1);
  });

  const graphicsManager = new CogSpeedGraphicsHandler(app);

  // Emulate loading time
  await new Promise((resolve) => setTimeout(resolve, 3000));

  app.stage.removeChild(loadingText);
  graphicsManager.setBackground("carbon");

  const startPage = new StartPage(app, graphicsManager);
  // Initiate before displaying to load config
  // Display start page
  await startPage.start();

  // Game phase - called after start button is clicked
  const game = new CogSpeedGame(config, app, graphicsManager);
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
  window.addEventListener("resize", resize);
}

window.onload = main;
export default function App() {
  return <div className="App"></div>;
}
