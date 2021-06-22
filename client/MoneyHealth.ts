import { Character } from "./Character";
import { Game } from "./Game";
import {
  calculateOrthogonalMask,
  CHUNK_SIZE,
  coins,
  handleInterior,
  isGround,
  loadObject,
  MapCollider,
  PLAYER_LAYER,
  profile,
  tile_of_world,
  TILE_SIZE,
  tile_to_world,
  twoWayAnimation,
  twoWayJumpAnimation,
} from "./index";
import { Monster } from "./Monster";
import { Canvas, MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";
import { Particle } from "./Particle";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";
import { Depth } from "./Depth";
import { TilePosition } from "./TilePosition";
import { Coin, Entity } from "./Entity";
import {
  FromBeginning,
  MyAnimation,
  PlayOnce,
  Random,
  RegularTicker,
  Right,
  StillTicker,
  WrapAround,
} from "./MyAnimation";
import { GameObject } from "./GameObject";
import { Fluff } from "./Fluff";
import { StaticObject } from "./StaticObject";
import { Tile } from "./Tile";
import { GameEntity } from "./GameEntity";
import { CollidingThingy } from "./CollidingThingy";
let Background = Depth.Background;
let Foreground = Depth.Foreground;
const CHAR_WALK = "assets/sprites/GraveRobber/GraveRobber_walk.png";
const CHAR_RUN = "assets/sprites/GraveRobber/GraveRobber_run.png";
const CHAR_IDLE = "assets/sprites/GraveRobber/GraveRobber_idle.png";
const CHAR_JUMP = "assets/sprites/GraveRobber/GraveRobber_jump.png";
const CHAR_HURT = "assets/sprites/GraveRobber/GraveRobber_hurt.png";
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
let coinImage: TileMap;
let px = 0;

export let worldObjects: GameObject[][] = [];
export let entities: GameEntity[] = [];
export let colliders: CollidingThingy[] = [];
export let char: Character;
export let boltImage: TileMap;

let fluffConfiguration: Fluff[];
let backgroundFluff: StaticObject[][] = [];
let foregroundFluff: StaticObject[][] = [];
let backgroundLayers: MyImage[];
let foregroundLayers: MyImage[];
let tileMap: TileMap;

let chunk: Tile[][][] = [];
let chunkX = 0;
let chunkY = 0;

let lastClickTime = 0;
let lastClick = "";
export let power = false;

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

export class MoneyHealthMapCollider implements MapCollider {
  point_is_solid(x: number, y: number) {
    return tile_is_solid(tile_of_world(x), tile_of_world(y));
  }
}
let mapCollider = new MoneyHealthMapCollider();

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

function newCharacter(x: number, y: number) {
  let walk = twoWayAnimation(char_walk_img, 6, 0, 1, true, []);
  let run = twoWayAnimation(char_run_img, 6, 0, 1, true, []);
  let idle = twoWayAnimation(char_idle_img, 4, 0, 1.2, true, []);
  let jump = twoWayJumpAnimation(char_jump_img, true);
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

function placeDeadChest(x: number, y: number, c: number) {
  let chestMap = new TileMap(chestImage, 4, 1, 0);
  let idleOpen = new MyAnimation(
    chestMap,
    new Point2d(3, 0),
    new StillTicker(new FromBeginning())
  );
  worldObjects[c].push(new GameObject(new TilePosition(x, y), idleOpen, 3));
}

function placeLiveChest(x: number, y: number, c: number) {
  let chestMap = new TileMap(chestImage, 4, 1, 0);
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
      tree?.foreground?.place(
        foregroundFluff[c],
        backgroundFluff[c],
        tree,
        x + chunkX + c * CHUNK_SIZE,
        y
      );
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
      new Coin()
    );
    entities.push(coin);
    colliders.push(coin);
  }
}

export class MoneyHealth implements Game {
  private zoom = 2;
  private constructor(private canvas: Canvas) {}
  static async initialize(canvasGraphics: MyGraphics) {
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

    chestImage = await MyImage.load("assets/objects/Chest.png");

    let tiles = await MyImage.load("assets/tiles/Tileset.png");
    tileMap = new TileMap(tiles, 10, 10, 0);

    let h = 4;
    for (let c = 0; c < 3; c++) {
      h = generateChunkRight(c, h);
    }

    coinImage = new TileMap(
      await MyImage.load("assets/objects/Coin.png"),
      4,
      1,
      0
    );
    boltImage = new TileMap(
      await MyImage.load("assets/sprites/BigBloated/Bolt.png"),
      1,
      1,
      0
    );

    char = await newCharacter(1.5 * CHUNK_SIZE * TILE_SIZE + 16, 0 * TILE_SIZE);
    entities.push(char);

    return new MoneyHealth(canvasGraphics.createNewCanvasGraphics());
  }

  draw(canvasGraphics: MyGraphics) {
    if (coins.value < 0) {
      canvasGraphics.clear();
      canvasGraphics.resetTranslate();
      canvasGraphics.drawImage(this.canvas.img, 0, 0, this.zoom);
      canvasGraphics.setTranslate(0, 0, this.zoom);
      canvasGraphics.drawTextCentered("Game Over!", 0, 0, this.zoom);
    } else {
      canvasGraphics.clear();
      this.canvas.graphics.clear();
      this.drawBackground(this.canvas.graphics);
      char.setCamera(this.canvas.graphics, this.zoom);
      this.drawBackgroundFluff(this.canvas.graphics);
      this.drawMap(this.canvas.graphics);
      this.drawObjects(this.canvas.graphics);
      this.drawEntities(this.canvas.graphics);
      this.drawForegroundFluff(this.canvas.graphics);
      this.drawForeground(this.canvas.graphics);
      profile.tick("Draw.SwappingBuffers");
      this.canvas.graphics.resetTranslate();
      for (let i = 0; i < coins.value; i++)
        coinImage.draw(
          this.canvas.graphics,
          new Point2d(0, 0),
          3 * i,
          0,
          this.zoom
        );
      canvasGraphics.drawImage(this.canvas.img, 0, 0, this.zoom);
    }
  }

  private drawBackground(g: MyGraphics) {
    profile.tick("Draw.Background");
    backgroundLayers.forEach((img, i) => {
      let ix = -px / 2 ** (backgroundLayers.length - i);
      this.drawLayer(g, img, ix);
    });
  }

  private drawLayer(ctx: MyGraphics, img: MyImage, x: number) {
    ctx.setTranslate(0, 150, this.zoom);
    let imgWidth = img.width;
    let ix = (((x % imgWidth) + imgWidth) % imgWidth) - imgWidth;
    ctx.drawImageScaled(img.src, ix, 0, imgWidth, img.height, this.zoom);
    ctx.drawImageScaled(
      img.src,
      ix + imgWidth,
      0,
      imgWidth,
      img.height,
      this.zoom
    );
    ctx.drawImageScaled(
      img.src,
      ix - imgWidth,
      0,
      imgWidth,
      img.height,
      this.zoom
    );
  }

  private drawForeground(g: MyGraphics) {
    profile.tick("Draw.Foreground");
    foregroundLayers.forEach((img, i) => {
      let ix = -px * 2 ** (i + 1);
      this.drawLayer(g, img, ix);
    });
  }

  private drawObjects(g: MyGraphics) {
    profile.tick("Draw.Objects");
    for (let c = 0; c < 3; c++) {
      worldObjects[c].forEach((w) => w.draw(g, this.zoom));
    }
  }

  private drawEntities(g: MyGraphics) {
    profile.tick("Draw.Entities");
    entities.forEach((x) => x.draw(g, this.zoom));
  }

  private drawForegroundFluff(g: MyGraphics) {
    profile.tick("Draw.ForegroundFluff");
    for (let c = 0; c < 3; c++)
      foregroundFluff[c].forEach((x) => x.draw(g, this.zoom));
  }

  private drawBackgroundFluff(g: MyGraphics) {
    profile.tick("Draw.BackgroundFluff");
    for (let c = 0; c < 3; c++)
      backgroundFluff[c].forEach((x) => x.draw(g, this.zoom));
  }

  private drawMap(g: MyGraphics) {
    profile.tick("Draw.Map");
    let startX = g.getLeftmostTile();
    let endX = g.getRightmostTile(this.zoom);
    for (let y = 0; y < chunk[0].length; y++)
      for (let x = startX; x < endX; x++) {
        tile_is_solid(x, y)?.draw(
          g,
          tile_to_world(x),
          tile_to_world(y),
          this.zoom
        );
      }
  }

  update(dt: number) {
    if (coins.value < 0) {
    } else {
      for (let c = 0; c < 3; c++) {
        worldObjects[c].forEach((w) => w.update(dt));
      }
      entities.forEach((k) => {
        k.update(dt, mapCollider, colliders);
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
  handleKeyDown(key: string) {
    let thisClickTime = Date.now();
    power = lastClick === key && thisClickTime - lastClickTime < 200;
    lastClickTime = thisClickTime;
    lastClick = key;

    if (key === "ArrowDown") {
      char.act();
    }
  }
  handleKeyUp(key: string) {}
}
