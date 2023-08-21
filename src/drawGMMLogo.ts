import { Application, Container, Point, SVGResource, Sprite, Texture } from "pixi.js";

interface TweenData {
  n: number;
  t?: number;
}

interface TweenCallback {
  (data: TweenData): void;
}

class Tween {
  time: number[] = [0];
  nCallback: TweenCallback[] = [];
  startTime = performance.now();
  data: TweenData = { n: 0 };
  callback: TweenCallback | null = null;
  state = 0;

  addInterval(a: number, b?: TweenCallback): void {
    const c = this.time.length - 1;
    this.time.push(this.time[c] + a);
    if (b) {
      this.nCallback[c + 1] = b;
    }
  }

  setStartTime(b: number): void {
    this.startTime = performance.now() + b;
  }

  restart(): void {
    this.startTime = performance.now();
    this.update();
  }

  setCallback(a: TweenCallback): void {
    this.callback = a;
  }

  update(): void {
    let d, e, f, g;
    const b = performance.now();
    let c = 0;
    for (d = 0; d < this.time.length; d += 1) {
      if (b >= this.time[d] + this.startTime) {
        c = d;
      }
    }
    if (this.state !== c) {
      if (this.callback) {
        this.callback({ n: c });
      }
      if (this.nCallback[c]) {
        this.nCallback[c](this.data); // pass the data object as an argument
      }
      this.state = c;
    }
    e = -1;
    if (c < this.time.length - 1) {
      f = this.time[c + 1] - this.time[c];
      g = b - (this.time[c] + this.startTime);
      e = g / f;
    }
    this.data = { n: c, t: e };
  }

  getIndex(): number {
    return this.data.n;
  }

  getTween(a?: number): number | undefined {
    const b = this.data.n;
    if (a === undefined) {
      return this.data.t;
    }
    return a > b ? 0 : b === a ? this.data.t : b > a ? 1 : undefined;
  }
}

class MakeGMMLogo {
  public tween: Tween;

  public logoContainer: Container;

  public gmmLogoG: Sprite;
  public gmmLogom0: Sprite;
  public gmmLogom1: Sprite;
  public gmmLogoText: Sprite;

  constructor(private app: Application) {
    this.tween = new Tween();
    this.tween.addInterval(1000);
    this.tween.addInterval(1000);

    this.gmmLogoG = Sprite.from(false);
    this.gmmLogom0 = Sprite.from(false);
    this.gmmLogom1 = Sprite.from(false);
    this.gmmLogoText = Sprite.from("./assets/gmmLogoText.jpg");

    this.logoContainer = new Container();
    this.logoContainer.width = 512;
    this.logoContainer.height = 512;
    this.logoContainer.x = 0
    this.logoContainer.y = 150
  }

  createInitialLogo() {
    
  }

  draw(): void {
    const dx = 960;
    const dy = 230.65625
    const scale = 0.6989583333333333;

    const p1 = [];
    const p2 = [];

    //Draw the gmm text

    p1[0] = {
      x: dx - 150 * scale,
      y: dy,
      scale: 0.75 * scale,
      rot: 0,
      sprite: this.gmmLogoG,
    };
    p1[1] = {
      x: dx - 10 * scale,
      y: dy,
      scale: 1.5 * scale,
      rot: 0,
      sprite: this.gmmLogom0,
    };
    p1[2] = {
      x: dx + 150 * scale,
      y: dy,
      scale: 1.5 * scale,
      rot: 0,
      sprite: this.gmmLogom1,
    };

    p2[0] = {
      x: dx,
      y: dy - 50 * scale,
      scale: 1.64 * scale,
      rot: 0,
      sprite: this.gmmLogoG,
    };
    p2[1] = {
      x: dx - 140 * scale,
      y: dy - 40 * scale,
      scale: 1.64 * scale,
      rot: -Math.PI / 2,
      sprite: this.gmmLogom0,
    };
    p2[2] = {
      x: dx - 10 * scale,
      y: dy - 200 * scale,
      scale: 1.64 * scale,
      rot: -0.15,
      sprite: this.gmmLogom1,
    };

    this.tween.update();
    var t = 0;
    if (this.tween.getIndex() > 0) {
      // @ts-ignore
      t = this.tween.getTween();
    }
    if (t < 0) {
      t = 1;
    }
    console.log(t);

    for (let i = 0; i < 3; i += 1) {
      const p = {
        x: (p2[i].x - p1[i].x) * t + p1[i].x,
        y: (p2[i].y - p1[i].y) * t + p1[i].y,
        scale: (p2[i].scale - p1[i].scale) * t + p1[i].scale,
        rot: (p2[i].rot - p1[i].rot) * t + p1[i].rot,
        sprite: p1[i].sprite,
      };
      // T.drawImgFrame(ctx, p.sprite, p.x, p.y, p.scale, p.scale, p.rot);
    }
  }
}

export default MakeGMMLogo;