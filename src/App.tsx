import { withAuthenticator } from "@aws-amplify/ui-react";
import "./App.css";

import { Application } from "pixi.js";
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
  return (await axios.get(
    "https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig"
  )).data;
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

  const graphicsManager = new CogSpeedGraphicsHandler(app);
  graphicsManager.setBackground("carbon");
  
  const startPage = new StartPage(app);
  // Initiate before displaying to load config
  // Display start page
  await startPage.display();
  
  // Game phase - called after start button is clicked
  const game = new CogSpeedGame(app, config, graphicsManager);
  game.start();
}

/**
 * Resize canvas
 * @return {void}
 */
function resizeCanvas(): void {
  const resize = () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    app.stage.scale.x = window.innerWidth / gameWidth;
    app.stage.scale.y = window.innerHeight / gameHeight;
  };
  resize();

  window.addEventListener("resize", resize);
}

window.onload = main;
export default withAuthenticator(function App() {
  return <div className="App"></div>;
});
