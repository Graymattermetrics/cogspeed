import "./App.css";

import { Application, Text } from "pixi.js";
import { CogSpeedGame } from "./game";
import { StartPage } from "./startPage";
import { CogSpeedGraphicsHandler } from "./ui/handler";
import axios from "axios";
import MakeGMMLogo from "./drawGMMLogo";

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
  let configUrl = "https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig";
  const urlParams = new URLSearchParams(window.location.search);
  const version = urlParams.get("version");
  if (version) configUrl += `?version=${version}`;
  else {
    const branch = urlParams.get("branch");
    if (branch) configUrl += `?branch=${branch}`;
  }
  return (await axios.get(configUrl)).data;
}

/**
 * Loads initial page
 */
async function main(): Promise<void> {
  // const config = await loadConfig();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const appDiv = document.querySelector(".App");
  if (!appDiv) throw new Error("No app div found");
  appDiv.appendChild(app.view);

  resizeCanvas(); // TODO

  // if (config.error) throw new Error(config.reason);

  // Show GMM Logo while loading all textures
  const gmmLogoMaker = new MakeGMMLogo(app);


  // const graphicsManager = new CogSpeedGraphicsHandler(app);

  // // Emulate loading time
  // const loadingTime = process.env.NODE_ENV === "development" ? 100 : 3000;
  // await new Promise((resolve) => setTimeout(resolve, loadingTime));

  // app.stage.removeChild(loadingText);
  // graphicsManager.setBackground("carbon");

  // const startPage = new StartPage(app, graphicsManager);
  // // Initiate before displaying to load config
  // // Display start page
  // const sleepData = await startPage.start();
  // if (!sleepData) throw new Error("No sleep data");

  // // Game phase - called after start button is clicked
  // const game = new CogSpeedGame(config, app, graphicsManager, sleepData);
  // game.start();
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
