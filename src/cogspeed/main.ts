import axios from "axios";
import { Application, Assets, Sprite } from "pixi.js";
import { CogSpeedGame } from "./routes/game.ts";
import { StartPage } from "./routes/start.ts";
import { Config } from "./types/Config.ts";
import { CogSpeedGraphicsHandler } from "./ui/handler.ts";
import { SleepData } from "./types/SleepData.ts";
import { Client } from 'src/types/client.ts';


async function createApp(): Promise<Application> {
  const gameWidth = window.innerWidth;
  const gameHeight = window.innerHeight;

  const app = new Application();
  await app.init({
    width: gameWidth,
    height: gameHeight,
  });

  const appDiv = document.querySelector(".App");
  if (!appDiv) throw new Error("No app div found");
  appDiv.innerHTML = ""; // TODO: Fix(?)
  appDiv.appendChild(app.canvas);

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

async function displayGmmlogo(app: Application) {
  // Resize and center function
  const resizeAndCenter = () => {
    videoSprite.x = app.renderer.width / 2;
    videoSprite.y = app.renderer.height / 2;
    const scale = Math.min(app.renderer.width / videoSprite.texture.width, app.renderer.height / videoSprite.texture.height);
    videoSprite.scale.set(scale);
  };

  const onResize = () => {
    resizeAndCenter();
  };
  
  const cleanup = () => {
    videoTexture.source.resource.removeEventListener("ended", cleanup);
    Assets.unload(videoTexture).catch(() => {});
    videoSprite.destroy({ children: true });
    window.removeEventListener("resize", resizeAndCenter);
  };

  await new Promise((r) => setTimeout(r, 500));
  const videoTexture = await Assets.load({
  src: "/gmmLoadingAnimation.mp4",
  data: {
    autoPlay: true,
    muted: true,
    playsinline: true,
    crossOrigin: "anonymous",
  },
});
  // Create the sprite from the video texture
  const videoSprite = new Sprite(videoTexture);
  videoSprite.anchor.set(0.5);

  resizeAndCenter();
  app.stage.addChild(videoSprite);

  window.addEventListener("resize", onResize);

  await new Promise<void>((resolve) => {
    videoTexture.source.resource.addEventListener("ended", () => {
      setTimeout(cleanup, 500);
      resolve();
    });
  });
}

interface StartUpOptions {
  config?: Config | null;
  startNowData?: SleepData | false;
}

// The rewritten function signature
export async function startUp(
  client: Client | null,
  logoutFunc: any,
  options: StartUpOptions = {} 
) {
  let { config = null, startNowData = false } = options;
  let showLoadingGMMLogo = false;
  
  if (config === null) {
    // Either restart or home called
    showLoadingGMMLogo = true;

    config = await loadConfig();
    if (config.error) throw new Error(config.reason);
  }

  const app = await createApp();

  // TODO: Fix reload bug
  if (showLoadingGMMLogo) await displayGmmlogo(app);

  const graphicsManager = new CogSpeedGraphicsHandler(app, config);
  await graphicsManager.loadAssets();

  graphicsManager.setBackground("carbon");

  // Display the home page
  const startPage = new StartPage(config, app, graphicsManager);
  if (startNowData === false) await startPage.displayHomePage(client, logoutFunc);

  // Display start page
  const sleepData = await startPage.start(startNowData);
  if (!sleepData) {
    // TODO: Start over
  };

  // Game phase - called after start button is clicked
  const game = new CogSpeedGame(config, app, graphicsManager, sleepData);
  game.start();
}
