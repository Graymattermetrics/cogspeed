import axios from "axios";
import { Application, Assets, Sprite, Text, VideoResource } from "pixi.js";
import { CogSpeedGame } from "./routes/game";
import { StartPage } from "./routes/start";
import { Config } from "./types/Config";
import { CogSpeedGraphicsHandler } from "./ui/handler";
import { SleepData } from "./types/SleepData";

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
  const cleanup = () => {
    videoSprite.destroy();
    window.removeEventListener("resize", resizeAndCenter);
  };

  await new Promise((r) => setTimeout(r, 500));
  // Use PixiJS's modern Assets loader for better caching and handling.
  // We pass resourceOptions to configure the underlying HTMLVideoElement.
  const videoTexture = await Assets.load({
    src: "/assets/gmmLoadingAnimation.mp4",
    data: {
      autoPlay: true,
      muted: true,
      playsinline: true,
      // It's also good practice to add crossOrigin for assets from other domains
      crossOrigin: "anonymous",
    },
  });

  // Create the sprite from the video texture
  const videoSprite = new Sprite(videoTexture);
  videoSprite.anchor.set(0.5);

  // Resize and center function
  const resizeAndCenter = () => {
    videoSprite.x = app.renderer.width / 2;
    videoSprite.y = app.renderer.height / 2;
    const scale = Math.min(app.renderer.width / videoSprite.texture.width, app.renderer.height / videoSprite.texture.height);
    videoSprite.scale.set(scale);
  };

  resizeAndCenter();
  app.stage.addChild(videoSprite);

  // Handle window resize to keep it centered
  const onResize = () => {
    resizeAndCenter();
  };
  window.addEventListener("resize", onResize);

  await new Promise<void>((resolve) => {
    videoTexture.source.resource.addEventListener("ended", () => {
      setTimeout(cleanup, 500);
      resolve();
    });
  });
}

/**
 *
 * @param config
 * @param startNow Called from restart. Bypasses sleep data
 */
export async function startUp(config: Config | null = null, startNowData: SleepData | false = false) {
  if (config === null) {
    config = await loadConfig();
    if (config.error) throw new Error(config.reason);
  }

  const app = await createApp();

  // await displayGmmlogo(app);

  const graphicsManager = new CogSpeedGraphicsHandler(app, config);
  await graphicsManager.loadAssets();

  graphicsManager.setBackground("carbon");

  // Display the home page
  const startPage = new StartPage(config, app, graphicsManager);
  if (startNowData === false) await startPage.displayHomePage();

  // Display start page
  const sleepData = await startPage.start(startNowData);
  if (!sleepData) return;

  // Game phase - called after start button is clicked
  const game = new CogSpeedGame(config, app, graphicsManager, sleepData);
  game.start();
}
