import { Depth } from "./Depth";
import { Game } from "./Game";
import { Menu } from "./Menu";
import {
  FromBeginning,
  Left,
  MyAnimation,
  RegularTicker,
  Right,
  StillTicker,
  WrapAround,
} from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";
import { Point2d } from "./Point2d";
import { Profiler } from "./Profiler";
import { Tile } from "./Tile";
import { TileMap } from "./TileMap";

export const PLAYER_LAYER = 1 << 0;
export const MONSTER_LAYER = 1 << 1;

export const CHUNK_SIZE = 20;
export const GRAVITY = 200;
export const WALK_SPEED = 35;
export const TILE_SIZE = 32;
export const FPS = 30;
export const SLEEP = 1000 / FPS;
export const MONSTERS = 3;

const KEY_CONFIG: { [key: string]: string } = {
  d: "ArrowRight",
  a: "ArrowLeft",
  w: "ArrowUp",
  s: "ArrowDown",
};

class Coins {
  constructor(public value: number) {}
}

export let coins = new Coins(3);
class GameInstance {
  constructor(public value: Game) {}
}
export let game: GameInstance;
export let keyPressed: { [key: string]: boolean } = {};

let lastBefore: number | undefined;
export let profile = new Profiler();

export function worldXOfHexTile(x: number, z: number) {
  let ax = x * (HEX_TILE_WIDTH + 14);
  if (z % 2 === 0) ax += 22;
  return ax;
}
export function worldZOfHexTile(x: number, z: number) {
  return z * HEX_TILE_DEPTH;
}
function hexTileXOfWorld(x: number, z: number) {
  let tz = hexTileZOfWorld(x, z);
  let tx = (x - (1 - (tz % 2)) * 22) / (HEX_TILE_WIDTH + 14);
  return tx;
}
function hexTileZOfWorld(x: number, z: number) {
  let tz = Math.floor(z / HEX_TILE_DEPTH);
  return tz;
}
export const HEX_TILE_WIDTH = 30;
export const HEX_TILE_DEPTH = 7;

export function sign(n: number, epsilon: number) {
  if (Math.abs(n) < epsilon) return 0;
  return Math.sign(n);
}

export function formatTime(ms: number) {
  let s = Math.floor(ms / 1000);
  let m = Math.floor(s / 60);
  s -= m * 60;
  let h = Math.floor(m / 60);
  m -= h * 60;
  let sText = (m !== 0 || h !== 0) && s < 10 ? "0" + s : s;
  let mText =
    m === 0 && h === 0 ? "" : h !== 0 && m < 10 ? "0" + m + ":" : m + ":";
  let hText = h === 0 ? "" : h + ":";
  return hText + mText + sText;
}

export function setCookie(cname: string, cvalue: string, exdays: number) {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export function getCookie(cname: string) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export function isGround(groundMap: boolean[][], x: number, y: number) {
  return (
    groundMap[y] !== undefined &&
    groundMap[y][x] !== undefined &&
    groundMap[y][x]
  );
}

export function ajax(
  url: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: any,
  accessToken?: string
) {
  return new Promise<string>((resolve, reject) => {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        resolve(this.responseText);
      }
    };
    xhttp.open(method, url, true);
    xhttp.send();
  });
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
export function twoWayJumpAnimation<T>(
  rightImg: MyImage,
  facingRight: boolean
): JumpingAnimations<T> {
  let rightMap = new TileMap(rightImg, 6, 1, 0);
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
  let leftMap = new TileMap(leftImg, 6, 1, 0);
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

export function twoWayStaticAnimation<T>(
  rightMap: TileMap,
  facingRight: boolean,
  index: number
): TwoWayAnimation<T> {
  let right = new MyAnimation(
    rightMap,
    new Point2d(index, 0),
    new StillTicker(new FromBeginning())
  );
  let leftMap = rightMap.flip();
  let left = new MyAnimation(
    leftMap,
    new Point2d(leftMap.getWidth() - index - 1, 0),
    new StillTicker(new FromBeginning())
  );
  if (!facingRight) [left, right] = [right, left];
  return { left, right };
}
export function twoWayAnimation<T>(
  rightImg: MyImage,
  fileLength: number,
  offsetX: number,
  duration: number,
  facingRight: boolean,
  actions: { frameNumber: number; action: (_: T) => void }[]
): TwoWayAnimation<T> {
  let rightMap = new TileMap(rightImg, fileLength, 1, 0);
  return twoWayAnimationTileMap(
    rightMap,
    new Point2d(offsetX, 0),
    duration,
    fileLength - offsetX,
    facingRight,
    actions
  );
}

export function twoWayAnimationTileMap<T>(
  rightMap: TileMap,
  offset: Point2d,
  duration: number,
  aniLength: number,
  facingRight: boolean,
  actions: { frameNumber: number; action: (_: T) => void }[]
): TwoWayAnimation<T> {
  let right = new MyAnimation(
    rightMap,
    offset,
    new RegularTicker(
      new Right(
        duration,
        aniLength,
        new FromBeginning(),
        new WrapAround(),
        actions
      )
    )
  );
  let leftMap = rightMap.flip();
  let left = new MyAnimation(
    leftMap,
    new Point2d(leftMap.getWidth() - offset.x - aniLength, offset.y),
    new RegularTicker(
      new Left(
        duration,
        aniLength,
        new FromBeginning(),
        new WrapAround(),
        actions
      )
    )
  );
  if (!facingRight) [left, right] = [right, left];
  return { left, right };
}

export function tile_to_world(x: number) {
  return x * TILE_SIZE;
}
export function tile_of_world(x: number) {
  return Math.floor(x / TILE_SIZE);
}

export interface MapCollider {
  point_is_solid(x: number, y: number): Tile | undefined;
}

function loop(g: MyGraphics) {
  profile.tick("Initial");
  let before = Date.now();
  let dt = (before - (lastBefore || before)) / 1000;
  lastBefore = before;
  profile.tick("Update");
  while (dt > SLEEP / 1000) {
    game.value.update(SLEEP / 1000);
    dt -= SLEEP / 1000;
  }
  game.value.update(dt);
  profile.tick("Draw");
  game.value.draw(g);
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

export function loadObject(
  filename: string,
  signature: string[],
  depth: Depth.Type
) {
  return MyImage.load(filename).then((img) => [
    {
      img,
      hasSpace: (map: boolean[][], x: number, y: number) =>
        Math.random() < 0.1 && collidesWith(signature, map, x, y),
      foreground: depth,
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
      foreground: depth,
    },
  ]);
}

enum Axis {
  X = 1,
  Y = 0,
}

export function handleInterior(
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

export function calculateDiagonalMask(
  groundMap: boolean[][],
  x: number,
  y: number
) {
  let mx = calculateMask(groundMap, x, y, 1, 1);
  let my = calculateMask(groundMap, x, y, 1, -1);
  return new Point2d(mx, my);
}
export function calculateOrthogonalMask(
  groundMap: boolean[][],
  x: number,
  y: number
) {
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
  constructor(public readonly key: string) {
    this.key = mapKey(key);
  }
}

function handleKeyDown(key: MappedKey) {
  if (keyPressed[key.key]) return;
  keyPressed[key.key] = true;
  game.value.handleKeyDown(key.key);
}
function handleKeyUp(key: MappedKey) {
  keyPressed[key.key] = false;
  game.value.handleKeyUp(key.key);
}
window.addEventListener("keydown", (e) => {
  handleKeyDown(new MappedKey(e.key));
});
window.addEventListener("keyup", (e) => {
  handleKeyUp(new MappedKey(e.key));
});
window.addEventListener("mousemove", (e) => {
  game.value.handleMouseMove(e.offsetX, e.offsetY);
});
window.addEventListener("mousedown", (e) => {
  game.value.handleMouseDown();
});
window.addEventListener("mouseup", (e) => {
  game.value.handleMouseUp();
});

(async () => {
  let canvas = document.getElementById("main") as HTMLCanvasElement;
  let bounds = canvas.getBoundingClientRect();
  let canvasGraphics = new MyGraphics(canvas, bounds.width, bounds.height);

  game = new GameInstance(await Menu.initialize(canvasGraphics));

  loop(canvasGraphics);
})();
