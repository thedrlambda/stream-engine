import { Game } from "./Game";
import {
  ajax,
  calculateOrthogonalMask,
  formatTime,
  getCookie,
  handleInterior,
  loadObject,
  MapCollider,
  PLAYER_LAYER,
  setCookie,
  tile_of_world,
  TILE_SIZE,
  tile_to_world,
  twoWayAnimation,
  twoWayJumpAnimation,
  twoWayStaticAnimation,
} from "./index";
import { JumpCharacter } from "./JumpCharacter";
import { Canvas, MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";
import { Persistance, Region } from "./Region";
import { StaticObject } from "./StaticObject";
import { Tile } from "./Tile";
import { TileMap } from "./TileMap";
import { Depth } from "./Depth";
import { CollidingThingy } from "./CollidingThingy";
import { Fluff } from "./Fluff";
let Background = Depth.Background;
let Foreground = Depth.Foreground;

const JUMP_CHAR_RUN = "assets/sprites/SteamMan/SteamMan_run.png";
const JUMP_CHAR_IDLE = "assets/sprites/SteamMan/SteamMan_idle.png";
const JUMP_CHAR_JUMP = "assets/sprites/SteamMan/SteamMan_jump.png";
const JUMP_CHAR_DEATH = "assets/sprites/SteamMan/SteamMan_death.png";

let sign_right: MyImage;
let sign_left: MyImage;
let sign_right_up: MyImage;
let sign_left_up: MyImage;
let sign_right_down: MyImage;
let sign_left_down: MyImage;

export class JumpGameMapCollider implements MapCollider {
  constructor(private map: Tile[][]) {}
  point_is_solid(x: number, y: number) {
    return this.tile_is_solid(tile_of_world(x), tile_of_world(y));
  }
  tile_is_solid(xTile: number, yTile: number) {
    if (yTile >= this.map.length || 0 > yTile) return undefined;
    if (xTile >= this.map[yTile].length || 0 > xTile) return undefined;
    return this.map[yTile][xTile];
  }
}
export class JumpGuy implements Game {
  private upStart = 0;
  private zoom = 2;
  private map: Tile[][];
  private mapCollider: JumpGameMapCollider;
  private backgroundFluff: StaticObject[] = [];
  private constructor(
    private colliders: CollidingThingy[],
    tileMap: TileMap,
    fluffConfiguration: Fluff[],
    private player: JumpCharacter,
    jumpWorld: boolean[][],
    private timer: { value: number },
    private signs: StaticObject[],
    private canvas: Canvas
  ) {
    this.map = [];
    for (let y = 0; y < jumpWorld.length; y++) {
      this.map.push([]);
      for (let x = 0; x < jumpWorld[y].length; x++) {
        if (!jumpWorld[y][x]) continue;
        let t = handleInterior(
          jumpWorld,
          x,
          y,
          calculateOrthogonalMask(jumpWorld, x, y)
        );
        this.map[y][x] = new Tile(tileMap, t);
        if (Math.random() < 0.66) continue;
        // Find a tree that is happy
        let candidates = fluffConfiguration.filter((tree) =>
          tree.hasSpace(jumpWorld, x, y)
        );
        if (candidates.length === 0) continue;
        let tree = candidates[~~(Math.random() * candidates.length)];
        tree?.foreground?.place2(
          signs,
          this.backgroundFluff,
          new StaticObject(tree.img, x, y)
        );
      }
    }
    this.mapCollider = new JumpGameMapCollider(this.map);
  }
  static async initialize(canvasGraphics: MyGraphics) {
    let char_run_img = await MyImage.load(JUMP_CHAR_RUN);
    let char_idle_img = await MyImage.load(JUMP_CHAR_IDLE);
    let char_jump_img = await MyImage.load(JUMP_CHAR_JUMP);
    let char_death_img = new TileMap(
      await MyImage.load(JUMP_CHAR_DEATH),
      6,
      1,
      0
    );

    let fluffConfiguration = (
      await Promise.all([
        loadObject(
          "assets/objects/Willows/1.png",
          [`...`, `?..`, `?.?`, `?.?`, `##?`],
          new Foreground()
        ),
        loadObject(
          "assets/objects/Willows/2.png",
          [`...`, `...`, `?.?`, `?.?`, `...`, `###`],
          new Background()
        ),
        loadObject(
          "assets/objects/Willows/3.png",
          [`?...?`, `??..?`, `??..?`, `???..`, `??###`],
          new Background()
        ),
        loadObject("assets/objects/Bushes/1.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Bushes/2.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Bushes/3.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Bushes/4.png", [`.`, `#`], new Background()),
        loadObject(
          "assets/objects/Bushes/5.png",
          [`...`, `###`],
          new Background()
        ),
        loadObject("assets/objects/Bushes/6.png", [`.`, `#`], new Background()),
        loadObject(
          "assets/objects/Bushes/7.png",
          [`...`, `###`],
          new Background()
        ),
        loadObject(
          "assets/objects/Bushes/8.png",
          [`...`, `###`],
          new Background()
        ),
        loadObject(
          "assets/objects/Bushes/9.png",
          [`...`, `###`],
          new Background()
        ),
        loadObject("assets/objects/Grass/1.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/2.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/3.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/4.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/5.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/6.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/7.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/8.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/9.png", [`.`, `#`], new Foreground()),
        loadObject("assets/objects/Grass/10.png", [`.`, `#`], new Foreground()),
      ])
    ).flat();

    let tileMap = new TileMap(
      await MyImage.load("assets/tiles/Tileset.png"),
      10,
      10,
      0
    );

    sign_right = await MyImage.load("assets/objects/Pointers/1.png");
    sign_left = await MyImage.load("assets/objects/Pointers/2.png");
    sign_right_up = await MyImage.load("assets/objects/Pointers/3.png");
    sign_left_up = await MyImage.load("assets/objects/Pointers/4.png");
    sign_right_down = await MyImage.load("assets/objects/Pointers/5.png");
    sign_left_down = await MyImage.load("assets/objects/Pointers/6.png");

    let run = twoWayAnimation(char_run_img, 6, 0, 1, true, []);
    let idle = twoWayAnimation(char_idle_img, 4, 0, 1.2, true, []);
    let jump = twoWayJumpAnimation(char_jump_img, true);
    let charging = twoWayStaticAnimation(char_death_img, true, 1);
    let recovering = twoWayStaticAnimation(char_death_img, true, 5);

    let px = -1;
    let py = -1;
    let vx = 0;
    let vy = 0;
    let timer = { value: -1 };
    let signs: StaticObject[] = [];
    let colliders: CollidingThingy[] = [];
    let map = (await ajax("/jumpPrinceWorld.map")).split("\n").map((line, y) =>
      line.split("").map((c, x) => {
        if (c === "@") {
          px = tile_to_world(x) + TILE_SIZE / 2;
          py = tile_to_world(y + 1);
        } else if (c === "$") {
          colliders.push(
            new Region(
              tile_to_world(x),
              tile_to_world(y),
              Persistance.PERMANENT,
              () => {
                timer.value = Date.now();
              },
              PLAYER_LAYER
            )
          );
        } else if (c === "↙") {
          signs.push(new StaticObject(sign_left_down, x, y + 1));
        } else if (c === "←") {
          signs.push(new StaticObject(sign_left, x, y + 1));
        } else if (c === "↖") {
          signs.push(new StaticObject(sign_left_up, x, y + 1));
        } else if (c === "↗") {
          signs.push(new StaticObject(sign_right_up, x, y + 1));
        } else if (c === "→") {
          signs.push(new StaticObject(sign_right, x, y + 1));
        } else if (c === "↘") {
          signs.push(new StaticObject(sign_right_down, x, y + 1));
        }
        return c === "#";
      })
    );
    let pos = getCookie("playerPos");
    if (pos) {
      let [x, y, v1, v2] = pos.split(",");
      px = +x;
      py = +y;
      vx = +v1;
      vy = +v2;
    }
    let timerCookie = getCookie("timer");
    if (timerCookie) {
      timer.value = Date.now() - +timerCookie;
    }

    let player = new JumpCharacter(
      px,
      py,
      vx,
      vy,
      run,
      idle,
      jump,
      charging,
      recovering,
      8
    );

    return new JumpGuy(
      colliders,
      tileMap,
      fluffConfiguration,
      player,
      map,
      timer,
      signs,
      canvasGraphics.createNewCanvasGraphics()
    );
  }
  draw(canvasGraphics: MyGraphics) {
    this.canvas.graphics.clear();
    let WITHOUT_ZOOM = 1;
    this.player.setCameraLocation(this.canvas.graphics, WITHOUT_ZOOM);
    let c = Math.floor(
      255 - 230 * (this.player.getY() / (TILE_SIZE * this.map.length))
    );
    this.canvas.graphics.setBackgroundColor(`rgb(${c}, ${c}, ${c})`);
    this.backgroundFluff.forEach((s) =>
      s.draw(this.canvas.graphics, WITHOUT_ZOOM)
    );
    let startX = this.canvas.graphics.getLeftmostTile();
    let endX = this.canvas.graphics.getRightmostTile(WITHOUT_ZOOM);
    for (let y = 0; y < this.map.length; y++) {
      for (let x = startX; x < endX; x++) {
        this.mapCollider
          .tile_is_solid(x, y)
          ?.draw(
            this.canvas.graphics,
            tile_to_world(x),
            tile_to_world(y),
            WITHOUT_ZOOM
          );
      }
    }
    this.player.draw(this.canvas.graphics, WITHOUT_ZOOM);
    this.signs.forEach((s) => s.draw(this.canvas.graphics, WITHOUT_ZOOM));
    this.zoom = this.player.setCameraZoom(this.zoom);
    canvasGraphics.setTranslate(0, 0, this.zoom);
    canvasGraphics.drawImageCentered(this.canvas.img, 0, 0, this.zoom);
    if (this.timer.value >= 0) {
      canvasGraphics.setColor("white");
      let diff = Date.now() - this.timer.value;
      let time = formatTime(diff);
      canvasGraphics.drawText("" + time, 10, 30);
      setCookie("timer", "" + diff, 30);
    }
  }

  update(dt: number) {
    this.player.update(dt, this.mapCollider, this.colliders);
  }
  handleMouseUp() {}
  handleMouseDown() {}
  handleMouseMove(x: number, y: number) {}
  handleKeyUp(key: string) {
    if (key === "ArrowUp") {
      this.player.reqJump((Date.now() - this.upStart) / 1000);
    }
  }
  handleKeyDown(key: string) {
    if (key === "ArrowUp") {
      this.upStart = Date.now();
    }
  }
}
