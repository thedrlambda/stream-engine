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
export const CHAR_RUN = "assets/sprites/GraveRobber/GraveRobber_run.png";
export const CHAR_WALK = "assets/sprites/GraveRobber/GraveRobber_walk.png";
export const CHAR_IDLE = "assets/sprites/GraveRobber/GraveRobber_idle.png";
export const CHAR_HURT = "assets/sprites/GraveRobber/GraveRobber_hurt.png";
export const CHAR_JUMP = "assets/sprites/GraveRobber/GraveRobber_jump.png";
export const MONSTER_WALK = "assets/sprites/BigBloated/Big_bloated_walk.png";
export const MONSTER_IDLE = "assets/sprites/BigBloated/Big_bloated_idle.png";
export const MONSTER_THROW_ATTACK =
  "assets/sprites/BigBloated/Big_bloated_attack1.png";
export const MONSTER_ATTACK =
  "assets/sprites/BigBloated/Big_bloated_attack3.png";
export const MONSTERS = 3;
const KEY_CONFIG: { [key: string]: string } = {
  d: "ArrowRight",
  a: "ArrowLeft",
  w: "ArrowUp",
  s: "ArrowDown",
};

export let worldObjects: { [pos: string]: GameObject } = {};
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
let backgroundFluff: StaticObject[] = [];
let foregroundFluff: StaticObject[] = [];
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
let canvasGraphics: MyGraphics;

let chunk: Tile[][][] = [];
let chunkX = 0;
let chunkY = 0;

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
async function twoWayStaticAnimation<T>(
  image: string,
  facingRight: boolean
): Promise<JumpingAnimations<T>> {
  let rightImg = await MyImage.load(image);
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

async function twoWayAnimation<T>(
  image: string,
  fileLength: number,
  offsetX: number,
  duration: number,
  facingRight: boolean,
  actions: { frameNumber: number; action: (_: T) => void }[]
): Promise<TwoWayAnimation<T>> {
  let rightImg = await MyImage.load(image);
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

async function newCharacter(x: number, y: number) {
  let walk = await twoWayAnimation(CHAR_WALK, 6, 0, 1, true, []);
  let run = await twoWayAnimation(CHAR_RUN, 6, 0, 1, true, []);
  let idle = await twoWayAnimation(CHAR_IDLE, 4, 0, 1.2, true, []);
  let jump = await twoWayStaticAnimation(CHAR_JUMP, true);
  let hurt = await twoWayAnimation(CHAR_HURT, 3, 1, 0.5, true, [
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

async function newMonster(x: number, y: number) {
  let walk = await twoWayAnimation(MONSTER_WALK, 6, 0, 1, false, []);
  let idle = await twoWayAnimation(MONSTER_IDLE, 4, 0, 2, false, []);
  let attack = await twoWayAnimation(MONSTER_ATTACK, 4, 0, 0.7, false, [
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
  ]);
  let throwAttack = await twoWayAnimation(
    MONSTER_THROW_ATTACK,
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
  backgroundFluff.forEach((x) => x.draw(g));
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
  Object.keys(worldObjects).forEach((k) => {
    let p = k.split(",");
    worldObjects[k].draw(g, +p[0], +p[1]);
  });
}

function drawEntities(g: MyGraphics) {
  profile.tick("Draw.Entities");
  entities.forEach((x) => x.draw(g));
}

function drawForegroundFluff(g: MyGraphics) {
  profile.tick("Draw.ForegroundFluff");
  foregroundFluff.forEach((x) => x.draw(g));
}

function draw(g: MyGraphics) {
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

function update(dt: number) {
  if (coins.value < 0) {
  } else {
    Object.keys(worldObjects).forEach((k) => {
      worldObjects[k].update(dt);
    });
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

function loop(g: MyGraphics) {
  profile.tick("Initial");
  let before = Date.now();
  let dt = (before - (lastBefore || before)) / 1000;
  lastBefore = before;
  profile.tick("Update");
  update(dt);
  profile.tick("Draw");
  draw(g);
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

async function initializeWorldObjects() {
  let chestImage = await MyImage.load("assets/objects/Chest.png");
  let chestMap = new TileMap(chestImage, 4, 1);
  let idleClosed = new MyAnimation(
    chestMap,
    new Point2d(0, 0),
    new StillTicker(new FromBeginning())
  );
  let idleOpen = new MyAnimation(
    chestMap,
    new Point2d(3, 0),
    new StillTicker(new FromBeginning())
  );

  worldObjects["6,4"] = new GameObject(new TilePosition(6, 4), idleOpen, 3);
  /*
  for (let i = 0; i < MONSTERS; i++) {
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

    let x =
      ~~((Math.random() * map[0].length) / MONSTERS) +
      (i * map[0].length) / MONSTERS;
    let y = 4;
    worldObjects[x + "," + y] = new GameObject(
      new TilePosition(x, y),
      idleClosed,
      3,
      action
    );
  }
  */
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

window.addEventListener("keydown", (e) => {
  handleKeyDown(new MappedKey(e.key));
});
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
window.addEventListener("keyup", (e) => {
  handleKeyUp(new MappedKey(e.key));
});
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

function chunkSwapRight() {
  chunk[0] = chunk[1];
  chunk[1] = chunk[2];
  chunkX += CHUNK_SIZE;
  generateChunkRight(2, findRightHeight()); // FIXME: specialize method
  // TODO: Remove fluff
}
function chunkSwapLeft() {
  chunk[2] = chunk[1];
  chunk[1] = chunk[0];
  chunkX -= CHUNK_SIZE;
  generateChunkLeft(0, findLeftHeight()); // FIXME: specialize method
  // TODO: Remove fluff
}

// FIXME: unify methods
function generateChunkRight(c: number, h: number) {
  let groundMap: boolean[][] = [];
  for (let y = 0; y < 8; y++) {
    groundMap.push([]);
  }
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let y = h; y < groundMap.length; y++) {
      groundMap[y][x] = true;
    }
    h = clamp(h + ~~((Math.random() - Math.random()) * 3), 0, 7);
  }

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

  // TODO prevent places same object twice in a row (or within X things)
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
          foregroundFluff.push(
            new StaticObject(tree.img, x + chunkX + c * CHUNK_SIZE, y)
          );
        } else {
          backgroundFluff.push(
            new StaticObject(tree.img, x + chunkX + c * CHUNK_SIZE, y)
          );
        }
      }
    }
  }
}

function generateChunkLeft(c: number, h: number) {
  let groundMap: boolean[][] = [];
  for (let y = 0; y < 8; y++) {
    groundMap.push([]);
  }
  for (let x = CHUNK_SIZE - 1; x >= 0; x--) {
    for (let y = h; y < groundMap.length; y++) {
      groundMap[y][x] = true;
    }
    h = clamp(h + ~~((Math.random() - Math.random()) * 3), 0, 7);
  }

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

  // TODO prevent places same object twice in a row (or within X things)
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
          foregroundFluff.push(
            new StaticObject(tree.img, x + chunkX + c * CHUNK_SIZE, y)
          );
        } else {
          backgroundFluff.push(
            new StaticObject(tree.img, x + chunkX + c * CHUNK_SIZE, y)
          );
        }
      }
    }
  }
}

(async () => {
  let canvas = document.getElementById("main") as HTMLCanvasElement;
  let bounds = canvas.getBoundingClientRect();
  canvasGraphics = new MyGraphics(canvas, bounds.width, bounds.height);
  gImg = document.createElement("canvas");
  gImg.width = bounds.width;
  gImg.height = bounds.height;
  let g = new MyGraphics(gImg, bounds.width, bounds.height);
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
  let tiles = await MyImage.load("assets/tiles/Tileset.png");
  tileMap = new TileMap(tiles, 10, 10);

  let h = 4;
  for (let c = 0; c < 3; c++) {
    generateChunkRight(c, h);
  }
  Math.seedrandom(5);

  await initializeWorldObjects();

  coinImage = new TileMap(await MyImage.load("assets/objects/Coin.png"), 4, 1);
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

  loop(g);
})();
