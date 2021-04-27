import { Character } from "./Character";
import { CollidingThingy } from "./CollidingThingy";
import { Entity } from "./Entity";
import { GameEntity } from "./GameEntity";
import { GameObject } from "./GameObject";
import { Monster } from "./Monster";
import {
  FromBeginning,
  Left,
  MyAnimation,
  PlayOnce,
  Random,
  RegularTicker,
  Right,
  StillTicker,
  WrapAround,
} from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";
import { Particle } from "./Particle";
import { Point2d } from "./Point2d";
import { Profiler } from "./Profiler";
import { StaticObject } from "./StaticObject";
import { Tile } from "./Tile";
import { TileMap } from "./TileMap";
import { TilePosition } from "./TilePosition";
export const PLAYER_LAYER = 1 << 0;
export const MONSTER_LAYER = 1 << 1;

export const CHUNK_SIZE = 20;
export const GRAVITY = 200;
export const WALK_SPEED = 35;
export const TILE_SIZE = 32;
export const FPS = 30;
export const SLEEP = 1000 / FPS;
const CHAR_RUN = "assets/sprites/GraveRobber/GraveRobber_run.png";
const CHAR_WALK = "assets/sprites/GraveRobber/GraveRobber_walk.png";
const CHAR_IDLE = "assets/sprites/GraveRobber/GraveRobber_idle.png";
const CHAR_HURT = "assets/sprites/GraveRobber/GraveRobber_hurt.png";
const CHAR_JUMP = "assets/sprites/GraveRobber/GraveRobber_jump.png";
const MONSTER_WALK = "assets/sprites/BigBloated/Big_bloated_walk.png";
const MONSTER_IDLE = "assets/sprites/BigBloated/Big_bloated_idle.png";
const MONSTER_THROW_ATTACK =
  "assets/sprites/BigBloated/Big_bloated_attack1.png";
const MONSTER_ATTACK = "assets/sprites/BigBloated/Big_bloated_attack3.png";
let char_run_img: MyImage;
let char_walk_img: MyImage;
let char_idle_img: MyImage;
let char_hurt_img: MyImage;
let char_jump_img: MyImage;
let monster_walk_img: MyImage;
let monster_idle_img: MyImage;
let monster_throw_attack_img: MyImage;
let monster_attack_img: MyImage;
let chestImage: MyImage;
export const MONSTERS = 3;
const KEY_CONFIG: { [key: string]: string } = {
  d: "ArrowRight",
  a: "ArrowLeft",
  w: "ArrowUp",
  s: "ArrowDown",
};

export let worldObjects: GameObject[][] = [];
export let char: Character;
export let entities: GameEntity[] = [];
export let colliders: CollidingThingy[] = [];
export let power = false;
class Coins {
  constructor(public value: number) {}
}

export let coins = new Coins(3);
export let boltImage: TileMap;
export let keyPressed: { [key: string]: boolean } = {};

let fluffConfiguration: {
  img: MyImage;
  hasSpace: (_: boolean[][], x: number, y: number) => boolean;
  foreground?: boolean;
}[];
let backgroundFluff: StaticObject[][] = [];
let foregroundFluff: StaticObject[][] = [];
let px = 0;
let backgroundLayers: MyImage[];
let foregroundLayers: MyImage[];
let tileMap: TileMap;
let lastBefore: number | undefined;
let profile = new Profiler();
let lastClickTime = 0;
let lastClick = "";
let coinImage: TileMap;
let gImg: HTMLCanvasElement;
let canvasGraphics: MyGraphics; // FIXME: remove from global space

let chunk: Tile[][][] = [];
let chunkX = 0;
let chunkY = 0;

interface Game {
  handleMouseUp(): void;
  handleMouseDown(): void;
  handleMouseMove(x: number, y: number): void;
  draw(g: MyGraphics): void;
  update(dt: number): void;
}
class Button {
  private left: number;
  private top: number;
  constructor(
    private text: string,
    private x: number,
    private y: number,
    private w: number,
    private h: number,
    private act: () => void
  ) {
    this.left = x - w / 2;
    this.top = y + (-3 / 4) * h;
  }
  draw() {
    canvasGraphics.drawRect(this.left, this.top, this.w, this.h);
    canvasGraphics.drawTextCentered(this.text, this.x, this.y);
  }
  actIfHit(x: number, y: number) {
    if (
      this.left <= x &&
      x <= this.left + this.w &&
      this.top <= y &&
      y <= this.top + this.h
    )
      this.act();
  }
}

class Mouse {
  private x: number = -1;
  private y: number = -1;
  private drawStartX: number = -1;
  private drawStartY: number = -1;
  private onClickObservers: ((x: number, y: number) => void)[] = [];
  constructor() {}
  handleMouseUp() {
    if (Math.hypot(this.x - this.drawStartX, this.y - this.drawStartY) < 10) {
      this.onClickObservers.forEach((f) => f(this.x, this.y));
    }
  }
  handleMouseDown() {
    this.drawStartX = this.x;
    this.drawStartY = this.y;
  }
  handleMouseMove(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  registerOnClick(f: (x: number, y: number) => void) {
    this.onClickObservers.push(f);
  }
}

class Menu implements Game {
  private mouse: Mouse;
  private constructor(private buttons: Button[]) {
    this.mouse = new Mouse();
    this.mouse.registerOnClick((x, y) => {
      this.buttons.forEach((b) => b.actIfHit(x, y));
    });
  }
  static async initialize() {
    return new Menu([
      new Button(
        "Money Health",
        canvasGraphics.getVerticalCenter(),
        100,
        100,
        20,
        async () => {
          game = await MoneyHealth.initialize();
        }
      ),
      new Button(
        "Jump prince",
        canvasGraphics.getVerticalCenter(),
        130,
        100,
        20,
        async () => {
          console.log("Other game");
        }
      ),
    ]);
  }
  draw(g: MyGraphics) {
    canvasGraphics.clear();
    this.buttons.forEach((b) => b.draw());
  }
  update(dt: number) {}
  handleMouseUp() {
    this.mouse.handleMouseUp();
  }
  handleMouseDown() {
    this.mouse.handleMouseDown();
  }
  handleMouseMove(x: number, y: number) {
    this.mouse.handleMouseMove(x, y);
  }
}
class MoneyHealth implements Game {
  private constructor() {}
  static async initialize() {
    char_run_img = await MyImage.load(CHAR_RUN);
    char_walk_img = await MyImage.load(CHAR_WALK);
    char_idle_img = await MyImage.load(CHAR_IDLE);
    char_hurt_img = await MyImage.load(CHAR_HURT);
    char_jump_img = await MyImage.load(CHAR_JUMP);
    monster_walk_img = await MyImage.load(MONSTER_WALK);
    monster_idle_img = await MyImage.load(MONSTER_IDLE);
    monster_throw_attack_img = await MyImage.load(MONSTER_THROW_ATTACK);
    monster_attack_img = await MyImage.load(MONSTER_ATTACK);

    backgroundLayers = await Promise.all([
      MyImage.load("assets/backgroundLayers/Swamp/1.png"),
      MyImage.load("assets/backgroundLayers/Swamp/2.png"),
      MyImage.load("assets/backgroundLayers/Swamp/3.png"),
      MyImage.load("assets/backgroundLayers/Swamp/4.png"),
      MyImage.load("assets/backgroundLayers/Swamp/5.png"),
    ]);
    foregroundLayers = await Promise.all([]);

    fluffConfiguration = (
      await Promise.all([
        loadObject(
          "assets/objects/Willows/1.png",
          [`...`, `?..`, `?.?`, `?.?`, `##?`],
          Depth.FOREGROUND
        ),
        loadObject(
          "assets/objects/Willows/2.png",
          [`...`, `...`, `?.?`, `?.?`, `...`, `###`],
          Depth.BACKGROUND
        ),
        loadObject(
          "assets/objects/Willows/3.png",
          [`?...?`, `??..?`, `??..?`, `???..`, `??###`],
          Depth.BACKGROUND
        ),
        loadObject("assets/objects/Bushes/1.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Bushes/2.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Bushes/3.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Bushes/4.png", [`.`, `#`], Depth.BACKGROUND),
        loadObject(
          "assets/objects/Bushes/5.png",
          [`...`, `###`],
          Depth.BACKGROUND
        ),
        loadObject("assets/objects/Bushes/6.png", [`.`, `#`], Depth.BACKGROUND),
        loadObject(
          "assets/objects/Bushes/7.png",
          [`...`, `###`],
          Depth.BACKGROUND
        ),
        loadObject(
          "assets/objects/Bushes/8.png",
          [`...`, `###`],
          Depth.BACKGROUND
        ),
        loadObject(
          "assets/objects/Bushes/9.png",
          [`...`, `###`],
          Depth.BACKGROUND
        ),
        loadObject("assets/objects/Grass/1.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/2.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/3.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/4.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/5.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/6.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/7.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/8.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/9.png", [`.`, `#`], Depth.FOREGROUND),
        loadObject("assets/objects/Grass/10.png", [`.`, `#`], Depth.FOREGROUND),
      ])
    ).flat();

    chestImage = await MyImage.load("assets/objects/Chest.png");

    let tiles = await MyImage.load("assets/tiles/Tileset.png");
    tileMap = new TileMap(tiles, 10, 10);

    let h = 4;
    for (let c = 0; c < 3; c++) {
      h = generateChunkRight(c, h);
    }
    Math.seedrandom(5);

    coinImage = new TileMap(
      await MyImage.load("assets/objects/Coin.png"),
      4,
      1
    );
    boltImage = new TileMap(
      await MyImage.load("assets/sprites/BigBloated/Bolt.png"),
      1,
      1
    );

    /*
    for (let i = 0; i < MONSTERS; i++) {
      let monster = await newMonster(
        ~~((Math.random() * map[0].length) / MONSTERS) +
          ((i * map[0].length) / MONSTERS) * TILE_SIZE +
          16,
        5 * TILE_SIZE
      );
      entities.push(monster);
    }
    */

    char = await newCharacter(1.5 * CHUNK_SIZE * TILE_SIZE + 16, 0 * TILE_SIZE);
    entities.push(char);

    return new MoneyHealth();
  }
  draw(g: MyGraphics) {
    if (coins.value < 0) {
      canvasGraphics.clear();
      canvasGraphics.resetTranslate();
      canvasGraphics.drawImage(gImg, 0, 0);
      canvasGraphics.setTranslate(0, 0);
      canvasGraphics.drawTextCentered("Game Over!", 0, 0);
    } else {
      canvasGraphics.clear();
      g.clear();
      drawBackground(g);
      char.setCamera(g);
      drawBackgroundFluff(g);
      drawMap(g);
      drawObjects(g);
      drawEntities(g);
      drawForegroundFluff(g);
      drawForeground(g);
      profile.tick("Draw.SwappingBuffers");
      g.resetTranslate();
      for (let i = 0; i < coins.value; i++)
        coinImage.draw(g, new Point2d(0, 0), 3 * i, 0);
      canvasGraphics.drawImage(gImg, 0, 0);
    }
  }

  update(dt: number) {
    if (coins.value < 0) {
    } else {
      for (let c = 0; c < 3; c++) {
        worldObjects[c].forEach((w) => w.update(dt));
      }
      entities.forEach((k) => {
        k.update(dt);
      });
      entities = entities.filter((k) => k.isActive());
      colliders = colliders.filter((k) => k.isActive());
      px = tile_of_world(char.getX());
      if (px - chunkX < CHUNK_SIZE) chunkSwapLeft();
      else if (px - chunkX >= 2 * CHUNK_SIZE) chunkSwapRight();
    }
  }
  handleMouseUp() {}
  handleMouseDown() {}
  handleMouseMove(x: number, y: number) {}
}

let game: Game;

function isGround(groundMap: boolean[][], x: number, y: number) {
  return (
    groundMap[y] !== undefined &&
    groundMap[y][x] !== undefined &&
    groundMap[y][x]
  );
}

enum Axis {
  X = 1,
  Y = 0,
}

// FIXME: Replace type code with classes
enum Depth {
  BACKGROUND,
  FOREGROUND,
}

export interface TwoWayAnimation<T> {
  left: MyAnimation<T>;
  right: MyAnimation<T>;
}

export interface JumpingAnimations<T> {
  leftRising: MyAnimation<T>;
  rightRising: MyAnimation<T>;
  leftFalling: MyAnimation<T>;
  rightFalling: MyAnimation<T>;
}
function twoWayStaticAnimation<T>(
  rightImg: MyImage,
  facingRight: boolean
): JumpingAnimations<T> {
  let rightMap = new TileMap(rightImg, 6, 1);
  let rightRising = new MyAnimation(
    rightMap,
    new Point2d(3, 0),
    new StillTicker(new FromBeginning())
  );
  let rightFalling = new MyAnimation(
    rightMap,
    new Point2d(4, 0),
    new StillTicker(new FromBeginning())
  );
  let leftImg = rightImg.flipped();
  let leftMap = new TileMap(leftImg, 6, 1);
  let leftRising = new MyAnimation(
    leftMap,
    new Point2d(2, 0),
    new StillTicker(new FromBeginning())
  );
  let leftFalling = new MyAnimation(
    leftMap,
    new Point2d(1, 0),
    new StillTicker(new FromBeginning())
  );
  if (!facingRight)
    [leftRising, leftFalling, rightRising, rightFalling] = [
      rightRising,
      rightFalling,
      leftRising,
      leftFalling,
    ];
  return { leftRising, leftFalling, rightRising, rightFalling };
}

function twoWayAnimation<T>(
  rightImg: MyImage,
  fileLength: number,
  offsetX: number,
  duration: number,
  facingRight: boolean,
  actions: { frameNumber: number; action: (_: T) => void }[]
): TwoWayAnimation<T> {
  let rightMap = new TileMap(rightImg, fileLength, 1);
  let right = new MyAnimation(
    rightMap,
    new Point2d(offsetX, 0),
    new RegularTicker(
      new Right(
        duration,
        fileLength - offsetX,
        new FromBeginning(),
        new WrapAround(),
        actions
      )
    )
  );
  let leftImg = rightImg.flipped();
  let leftMap = new TileMap(leftImg, fileLength, 1);
  let left = new MyAnimation(
    leftMap,
    new Point2d(offsetX, 0),
    new RegularTicker(
      new Left(
        duration,
        fileLength - offsetX,
        new FromBeginning(),
        new WrapAround(),
        actions
      )
    )
  );
  if (!facingRight) [left, right] = [right, left];
  return { left, right };
}

function newCharacter(x: number, y: number) {
  let walk = twoWayAnimation(char_walk_img, 6, 0, 1, true, []);
  let run = twoWayAnimation(char_run_img, 6, 0, 1, true, []);
  let idle = twoWayAnimation(char_idle_img, 4, 0, 1.2, true, []);
  let jump = twoWayStaticAnimation(char_jump_img, true);
  let hurt = twoWayAnimation(char_hurt_img, 3, 1, 0.5, true, [
    {
      frameNumber: 1,
      action: (ge: Character) => {
        coins.value--;
        entities.push(
          new Particle(
            coinImage,
            ge.getX(),
            ge.getY() - TILE_SIZE / 2,
            0,
            -40,
            2
          )
        );
      },
    },
    {
      frameNumber: 2,
      action: (ge: Character) => {
        ge.recover();
      },
    },
  ]);
  return new Character(x, y, walk, run, idle, jump, hurt, 8);
}

function newMonster(x: number, y: number) {
  let walk = twoWayAnimation(monster_walk_img, 6, 0, 1, false, []);
  let idle = twoWayAnimation(monster_idle_img, 4, 0, 2, false, []);
  let attack = twoWayAnimation(
    monster_attack_img,
    4,
    0,
    0.7 + 0.1 * Math.random(),
    false,
    [
      {
        frameNumber: 2,
        action: (m: Monster) => {
          m.spawnDamageRegion();
        },
      },
      {
        frameNumber: 4,
        action: (monster: Monster) => {
          monster.stopAttacking();
        },
      },
    ]
  );
  let throwAttack = twoWayAnimation(
    monster_throw_attack_img,
    6,
    0,
    0.7,
    false,
    [
      {
        frameNumber: 3,
        action: (m: Monster) => {
          m.spawnBolt();
        },
      },
      {
        frameNumber: 6,
        action: (monster: Monster) => {
          monster.stopThrowing();
        },
      },
    ]
  );
  return new Monster(x, y, walk, idle, attack, throwAttack, 8);
}

export function tile_to_world(x: number) {
  return x * TILE_SIZE;
}
export function tile_of_world(x: number) {
  return Math.floor(x / TILE_SIZE);
}
export function point_is_solid(x: number, y: number) {
  return tile_is_solid(tile_of_world(x), tile_of_world(y));
}
export function tile_is_solid(xTile: number, yTile: number) {
  xTile -= chunkX;
  let cx = Math.floor(xTile / CHUNK_SIZE);
  xTile -= cx * CHUNK_SIZE;
  yTile -= chunkY;
  if (cx >= chunk.length || 0 > cx || yTile >= chunk[cx].length || 0 > yTile)
    return undefined;
  if (xTile >= chunk[cx][yTile].length || 0 > xTile) return undefined;
  return chunk[cx][yTile][xTile];
}

function drawLayer(ctx: MyGraphics, img: MyImage, x: number) {
  ctx.setTranslate(0, 150);
  let imgWidth = img.width;
  let ix = (((x % imgWidth) + imgWidth) % imgWidth) - imgWidth;
  ctx.drawImageScaled(img.src, ix, 0, imgWidth, img.height);
  ctx.drawImageScaled(img.src, ix + imgWidth, 0, imgWidth, img.height);
  ctx.drawImageScaled(img.src, ix - imgWidth, 0, imgWidth, img.height);
}

function drawBackground(g: MyGraphics) {
  profile.tick("Draw.Background");
  backgroundLayers.forEach((img, i) => {
    let ix = -px / 2 ** (backgroundLayers.length - i);
    drawLayer(g, img, ix);
  });
}

function drawBackgroundFluff(g: MyGraphics) {
  profile.tick("Draw.BackgroundFluff");
  for (let c = 0; c < 3; c++) backgroundFluff[c].forEach((x) => x.draw(g));
}

function drawMap(g: MyGraphics) {
  profile.tick("Draw.Map");
  let startX = g.getLeftmostTile();
  let endX = g.getRightmostTile();
  for (let y = 0; y < chunk[0].length; y++)
    for (let x = startX; x < endX; x++) {
      tile_is_solid(x, y)?.draw(g, tile_to_world(x), tile_to_world(y));
    }
}

function drawForeground(g: MyGraphics) {
  profile.tick("Draw.Foreground");
  foregroundLayers.forEach((img, i) => {
    let ix = -px * 2 ** (i + 1);
    drawLayer(g, img, ix);
  });
}

function drawObjects(g: MyGraphics) {
  profile.tick("Draw.Objects");
  for (let c = 0; c < 3; c++) {
    worldObjects[c].forEach((w) => w.draw(g));
  }
}

function drawEntities(g: MyGraphics) {
  profile.tick("Draw.Entities");
  entities.forEach((x) => x.draw(g));
}

function drawForegroundFluff(g: MyGraphics) {
  profile.tick("Draw.ForegroundFluff");
  for (let c = 0; c < 3; c++) foregroundFluff[c].forEach((x) => x.draw(g));
}

function loop(g: MyGraphics) {
  profile.tick("Initial");
  let before = Date.now();
  let dt = (before - (lastBefore || before)) / 1000;
  lastBefore = before;
  profile.tick("Update");
  while (dt > SLEEP) {
    game.update(SLEEP);
    dt -= SLEEP;
  }
  game.update(dt);
  profile.tick("Draw");
  game.draw(g);
  profile.tick("Finish");
  let after = Date.now();
  let sleep = SLEEP - (after - before);
  profile.tick();
  if (sleep < 5) {
    profile.print();
  }
  setTimeout(() => loop(g), sleep);
}

function collidesWith(
  signature: string[],
  map: boolean[][],
  x: number,
  y: number
) {
  for (let dy = 0; dy < signature.length; dy++) {
    let mid = ~~(signature[dy].length / 2);
    for (let dx = 0; dx < signature[dy].length; dx++) {
      if (signature[signature.length - 1 - dy].charAt(dx) === "?") continue;
      if (
        signature[signature.length - 1 - dy].charAt(dx) === "." &&
        isGround(map, x - mid + dx, y - dy)
      )
        return false;
      if (
        signature[signature.length - 1 - dy].charAt(dx) === "#" &&
        !isGround(map, x - mid + dx, y - dy)
      )
        return false;
    }
  }
  return true;
}

function loadObject(filename: string, signature: string[], depth: Depth) {
  return MyImage.load(filename).then((img) => [
    {
      img,
      hasSpace: (map: boolean[][], x: number, y: number) =>
        Math.random() < 0.1 && collidesWith(signature, map, x, y),
      foreground: depth === Depth.FOREGROUND,
    },
    {
      img: img.flipped(),
      hasSpace: (map: boolean[][], x: number, y: number) =>
        Math.random() < 0.1 &&
        collidesWith(
          signature.map((x) => x.split("").reverse().join("")),
          map,
          x,
          y
        ),
      foreground: depth === Depth.FOREGROUND,
    },
  ]);
}

function spawnCoins(p: TilePosition) {
  let count = Math.random() * 7 + 3;
  for (let i = 0; i < count; i++) {
    let coin = new Entity(
      new MyAnimation(
        coinImage,
        new Point2d(0, 0),
        new RegularTicker(
          new Right(0.67, 4, new Random(), new WrapAround(), [])
        )
      ),
      p.x * TILE_SIZE + TILE_SIZE / 2,
      (p.y + 1) * TILE_SIZE,
      (Math.random() - Math.random()) * 45,
      -75,
      PLAYER_LAYER,
      true
    );
    entities.push(coin);
    colliders.push(coin);
  }
}

function handleInterior(
  groundMap: boolean[][],
  x: number,
  y: number,
  t: Point2d
) {
  // All faces
  if (t.x === 0 || t.y === 0) {
    return t;
  }

  // No faces
  if (t.x >= 3 && t.y >= 3) {
    return t.plus(calculateDiagonalMask(groundMap, x, y));
  }

  // Some faces
  if (t.x < 3 && t.y < 3) {
    let dx = t.x === 1 ? 1 : -1;
    let dy = t.y === 1 ? 1 : -1;
    if (!isGround(groundMap, x + dx, y + dy)) {
      return posOfBend(dx, dy);
    } else {
      return t;
    }
  } else if (t.x < 3) {
    return new Point2d(t.x, t.y + maskOfSurface(groundMap, x, y, t.x, Axis.X));
  } /* if (t.y < 3) */ else {
    return new Point2d(t.x + maskOfSurface(groundMap, x, y, t.y, Axis.Y), t.y);
  }
}

function calculateMask(
  groundMap: boolean[][],
  x: number,
  y: number,
  a: Axis,
  dy: number
) {
  let mask = 0;
  if (isGround(groundMap, x + a, y + (1 - a) + dy) === (dy === 0)) mask |= 1;
  if (isGround(groundMap, x - a, y - (1 - a) + dy) === (dy === 0)) mask |= 2;
  return mask;
}

function calculateDiagonalMask(groundMap: boolean[][], x: number, y: number) {
  let mx = calculateMask(groundMap, x, y, 1, 1);
  let my = calculateMask(groundMap, x, y, 1, -1);
  return new Point2d(mx, my);
}
function calculateOrthogonalMask(groundMap: boolean[][], x: number, y: number) {
  let mx = calculateMask(groundMap, x, y, Axis.X, 0);
  let my = calculateMask(groundMap, x, y, Axis.Y, 0);
  return new Point2d(mx, my);
}

function posOfBend(dx: number, dy: number) {
  let g = dy === 1 ? 4 : 5;
  return dx === dy ? new Point2d(g, 0) : new Point2d(0, g);
}

function maskOfSurface(
  groundMap: boolean[][],
  x: number,
  y: number,
  t: number,
  a: Axis
) {
  let emptyMask = 0;
  let d = t === 1 ? 1 : -1;
  if (!isGround(groundMap, x + a * d + (1 - a), y + (1 - a) * d + a))
    emptyMask |= 1;
  if (!isGround(groundMap, x + a * d - (1 - a), y + (1 - a) * d - a))
    emptyMask |= 2;
  return emptyMask;
}

function mapKey(key: string) {
  return KEY_CONFIG[key] || key;
}

class MappedKey {
  public readonly key: string;
  constructor(key: string) {
    this.key = mapKey(key);
  }
}

function handleKeyDown(key: MappedKey) {
  if (keyPressed[key.key]) return;
  keyPressed[key.key] = true;

  let thisClickTime = Date.now();
  power = lastClick === key.key && thisClickTime - lastClickTime < 200;
  lastClickTime = thisClickTime;
  lastClick = key.key;

  if (key.key === "ArrowDown") {
    char.act();
  }
}
function handleKeyUp(key: MappedKey) {
  keyPressed[key.key] = false;
}

function clamp(v: number, min: number, max: number) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function findRightHeight() {
  for (let x = CHUNK_SIZE - 1; x >= 0; x--) {
    for (let y = 0; y < 8; y++) {
      if (chunk[1][y][x] !== undefined) return y;
    }
  }
  return 4;
}
function findLeftHeight() {
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let y = 0; y < 8; y++) {
      if (chunk[1][y][x] !== undefined) return y;
    }
  }
  return 4;
}

function slideChunk(from: number, to: number) {
  chunk[to] = chunk[from];
  foregroundFluff[to] = foregroundFluff[from];
  backgroundFluff[to] = backgroundFluff[from];
  worldObjects[to] = worldObjects[from];
}

function chunkSwapRight() {
  slideChunk(1, 0);
  slideChunk(2, 1);
  chunkX += CHUNK_SIZE;
  generateChunkRight(2, findRightHeight()); // FIXME: specialize method
  // TODO: Remove monsters
}
function chunkSwapLeft() {
  slideChunk(1, 2);
  slideChunk(0, 1);
  chunkX -= CHUNK_SIZE;
  generateChunkLeft(0, findLeftHeight()); // FIXME: specialize method
  // TODO: Remove monsters
}

function iterate(start: number, end: number, f: (x: number) => void) {
  let step = Math.sign(end - start);
  for (let x = start; x !== end; x += step) {
    f(x);
  }
}

function generateGroundMap(start: number, end: number, h: number) {
  let groundMap: boolean[][] = [];
  for (let y = 0; y < 8; y++) {
    groundMap.push([]);
  }
  iterate(start, end, (x) => {
    for (let y = h; y < groundMap.length; y++) {
      groundMap[y][x] = true;
    }
    h = clamp(h + ~~((Math.random() - Math.random()) * 3), 0, 7);
  });
  return { groundMap, newH: h };
}

function fillChunk(groundMap: boolean[][], c: number) {
  chunk[c] = [];
  for (let y = 0; y < groundMap.length; y++) {
    chunk[c][y] = [];
    for (let x = 0; x < groundMap[y].length; x++) {
      if (!isGround(groundMap, x, y)) continue;
      let t = handleInterior(
        groundMap,
        x,
        y,
        calculateOrthogonalMask(groundMap, x, y)
      );
      chunk[c][y][x] = new Tile(tileMap, t);
    }
  }
}

function placeFluff(groundMap: boolean[][], c: number) {
  // TODO prevent places same object twice in a row (or within X things)
  backgroundFluff[c] = [];
  foregroundFluff[c] = [];
  for (let y = 0; y < groundMap.length; y++) {
    for (let x = 0; x < groundMap[y].length; x++) {
      if (!isGround(groundMap, x, y)) continue;
      // Find a tree that is happy
      let candidates = fluffConfiguration.filter((tree) =>
        tree.hasSpace(groundMap, x, y)
      );
      if (candidates.length === 0) continue;
      let tree = candidates[~~(Math.random() * candidates.length)];
      if (tree !== undefined) {
        if (tree.foreground) {
          foregroundFluff[c].push(
            new StaticObject(tree.img, x + chunkX + c * CHUNK_SIZE, y)
          );
        } else {
          backgroundFluff[c].push(
            new StaticObject(tree.img, x + chunkX + c * CHUNK_SIZE, y)
          );
        }
      }
    }
  }
}

function spawnMonster(c: number) {
  let monster = newMonster(
    tile_to_world(
      Math.floor(Math.random() * CHUNK_SIZE) + chunkX + c * CHUNK_SIZE
    ),
    -1
  );
  entities.push(monster);
}

function placeDeadChest(x: number, y: number, c: number) {
  let chestMap = new TileMap(chestImage, 4, 1);
  let idleOpen = new MyAnimation(
    chestMap,
    new Point2d(3, 0),
    new StillTicker(new FromBeginning())
  );
  worldObjects[c].push(new GameObject(new TilePosition(x, y), idleOpen, 3));
}

function placeLiveChest(x: number, y: number, c: number) {
  let chestMap = new TileMap(chestImage, 4, 1);
  let idleClosed = new MyAnimation(
    chestMap,
    new Point2d(0, 0),
    new StillTicker(new FromBeginning())
  );
  let action = new MyAnimation(
    chestMap,
    new Point2d(1, 0),
    new RegularTicker(
      new Right(0.5, 3, new FromBeginning(), new PlayOnce(), [
        {
          frameNumber: 3,
          action: (g: GameObject) => spawnCoins(g.getPosition()),
        },
      ])
    )
  );
  worldObjects[c].push(
    new GameObject(new TilePosition(x, y), idleClosed, 3, action)
  );
}

function placeWorldObjects(groundMap: boolean[][], c: number) {
  worldObjects[c] = [];
  let cx = Math.floor(Math.random() * CHUNK_SIZE);
  let ax = cx + chunkX + c * CHUNK_SIZE;
  let y = groundMap.length - 1;
  while (y >= 0 && groundMap[y][cx]) y--;
  if (Math.random() < 0.5) placeLiveChest(ax, y, c);
  else placeDeadChest(ax, y, c);
}

function generateChunk(start: number, end: number, c: number, h: number) {
  let { groundMap, newH } = generateGroundMap(start, end, h);
  fillChunk(groundMap, c);
  placeFluff(groundMap, c);
  spawnMonster(c);
  placeWorldObjects(groundMap, c);
  return newH;
}
function generateChunkRight(c: number, h: number) {
  return generateChunk(0, CHUNK_SIZE, c, h);
}
function generateChunkLeft(c: number, h: number) {
  return generateChunk(CHUNK_SIZE - 1, -1, c, h);
}

window.addEventListener("keydown", (e) => {
  handleKeyDown(new MappedKey(e.key));
});
window.addEventListener("keyup", (e) => {
  handleKeyUp(new MappedKey(e.key));
});
window.addEventListener("mousemove", (e) => {
  game.handleMouseMove(
    e.offsetX / canvasGraphics.getZoom(),
    e.offsetY / canvasGraphics.getZoom()
  );
});
window.addEventListener("mousedown", (e) => {
  game.handleMouseDown();
});
window.addEventListener("mouseup", (e) => {
  game.handleMouseUp();
});

(async () => {
  let canvas = document.getElementById("main") as HTMLCanvasElement;
  let bounds = canvas.getBoundingClientRect();

  canvasGraphics = new MyGraphics(canvas, bounds.width, bounds.height);
  gImg = document.createElement("canvas");
  gImg.width = bounds.width;
  gImg.height = bounds.height;
  let g = new MyGraphics(gImg, bounds.width, bounds.height);

  game = await Menu.initialize();

  loop(g);
})();
