import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

export type HexNeighbors = {
  up?: HexTile;
  rightUp?: HexTile;
  rightDown?: HexTile;
  down?: HexTile;
  leftDown?: HexTile;
  leftUp?: HexTile;
};
export interface HexTileType {
  drawBorder(map: TileMap, ctx: MyGraphics, n: HexTile, dir: Direction): void;
  drawBorderOnMountain(map: TileMap, ctx: MyGraphics, dir: Direction): void;
  drawBorderOnWater(map: TileMap, ctx: MyGraphics, dir: Direction): void;
  drawBorderOnSand(map: TileMap, ctx: MyGraphics, dir: Direction): void;
  drawBorderOnSwamp(map: TileMap, ctx: MyGraphics, dir: Direction): void;
}
export class Grass implements HexTileType {
  drawBorder(map: TileMap, ctx: MyGraphics, n: HexTile, dir: Direction) {}
  drawBorderOnMountain(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 5), 0, 0, 1);
  }
  drawBorderOnWater(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 5), 0, 0, 1);
  }
  drawBorderOnSand(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 5), 0, 0, 1);
  }
  drawBorderOnSwamp(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 5), 0, 0, 1);
  }
}
export class Swamp implements HexTileType {
  drawBorder(map: TileMap, ctx: MyGraphics, n: HexTile, dir: Direction) {
    n.getType().drawBorderOnSwamp(map, ctx, dir);
  }
  drawBorderOnMountain(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 6), 0, 0, 1);
  }
  drawBorderOnWater(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 6), 0, 0, 1);
  }
  drawBorderOnSand(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 6), 0, 0, 1);
  }
  drawBorderOnSwamp(map: TileMap, ctx: MyGraphics, dir: Direction) {}
}
export class Sand implements HexTileType {
  drawBorder(map: TileMap, ctx: MyGraphics, n: HexTile, dir: Direction) {
    n.getType().drawBorderOnSand(map, ctx, dir);
  }
  drawBorderOnMountain(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 7), 0, 0, 1);
  }
  drawBorderOnWater(map: TileMap, ctx: MyGraphics, dir: Direction) {
    map.draw(ctx, new Point2d(dir, 7), 0, 0, 1);
  }
  drawBorderOnSand(map: TileMap, ctx: MyGraphics, dir: Direction) {}
  drawBorderOnSwamp(map: TileMap, ctx: MyGraphics, dir: Direction) {}
}
export class Water implements HexTileType {
  drawBorder(map: TileMap, ctx: MyGraphics, n: HexTile, dir: Direction) {
    n.getType().drawBorderOnWater(map, ctx, dir);
  }
  drawBorderOnMountain(map: TileMap, ctx: MyGraphics, dir: Direction) {}
  drawBorderOnWater(map: TileMap, ctx: MyGraphics, dir: Direction) {}
  drawBorderOnSand(map: TileMap, ctx: MyGraphics, dir: Direction) {}
  drawBorderOnSwamp(map: TileMap, ctx: MyGraphics, dir: Direction) {}
}
export class Mountain implements HexTileType {
  drawBorder(map: TileMap, ctx: MyGraphics, n: HexTile, dir: Direction) {
    n.getType().drawBorderOnMountain(map, ctx, dir);
  }
  drawBorderOnMountain(map: TileMap, ctx: MyGraphics, dir: Direction) {}
  drawBorderOnWater(map: TileMap, ctx: MyGraphics, dir: Direction) {}
  drawBorderOnSand(map: TileMap, ctx: MyGraphics, dir: Direction) {}
  drawBorderOnSwamp(map: TileMap, ctx: MyGraphics, dir: Direction) {}
}
enum Direction {
  Up = 0,
  RightUp = 1,
  RightDown = 2,
  Down = 3,
  LeftDown = 4,
  LeftUp = 5,
}

export interface HexTilePrice {
  readonly x: number;
  readonly z: number;
  readonly drag: number;
}
export interface HexTilePrices {
  up?: HexTilePrice;
  rightUp?: HexTilePrice;
  rightDown?: HexTilePrice;
  down?: HexTilePrice;
  leftDown?: HexTilePrice;
  leftUp?: HexTilePrice;
}
const ROAD_LIMIT = 20;
const STREET_LIMIT = 40;
const HIGHWAY_LIMIT = 80;
export class HexTile implements HexTilePrice {
  private neighbors: HexNeighbors = {};
  private visitedTime = 0;
  private visited = 0;
  private cachedImage: HTMLCanvasElement;
  private cachedG: MyGraphics;
  constructor(
    public readonly x: number,
    public readonly z: number,
    private map: TileMap,
    private tType: HexTileType,
    private t: Point2d,
    public readonly drag: number
  ) {
    this.cachedImage = map.getBlankTile();
    this.cachedG = new MyGraphics(
      this.cachedImage,
      this.cachedImage.width,
      this.cachedImage.height
    );
  }
  private redraw() {
    this.cachedG.clear();
    this.map.draw(this.cachedG, this.t, 0, 0, 1);
    this.drawExtra(this.cachedG, this.neighbors.up, Direction.Up);
    this.drawExtra(this.cachedG, this.neighbors.rightUp, Direction.RightUp);
    this.drawExtra(this.cachedG, this.neighbors.rightDown, Direction.RightDown);
    this.drawExtra(this.cachedG, this.neighbors.down, Direction.Down);
    this.drawExtra(this.cachedG, this.neighbors.leftDown, Direction.LeftDown);
    this.drawExtra(this.cachedG, this.neighbors.leftUp, Direction.LeftUp);
  }
  visit() {
    let visitedBefore = this.visited;
    let now = Date.now();
    if (now - this.visitedTime < 60000) this.visited++;
    else this.visited *= 0.75;
    this.visitedTime = now;
    let visitedAfter = this.visited;
    if (
      (visitedBefore <= ROAD_LIMIT && visitedAfter > ROAD_LIMIT) ||
      (visitedBefore <= STREET_LIMIT && visitedAfter > STREET_LIMIT) ||
      (visitedBefore <= HIGHWAY_LIMIT && visitedAfter > HIGHWAY_LIMIT)
    ) {
      this.redraw();
      this.neighbors.down?.redraw();
      this.neighbors.leftDown?.redraw();
      this.neighbors.leftUp?.redraw();
      this.neighbors.rightDown?.redraw();
      this.neighbors.rightUp?.redraw();
      this.neighbors.up?.redraw();
    }
  }
  draw(ctx: MyGraphics, x: number, y: number, zoom: number) {
    ctx.drawImageScaled(
      this.cachedImage,
      x,
      y,
      this.cachedImage.width,
      this.cachedImage.height,
      zoom
    );
  }
  private drawExtra(ctx: MyGraphics, n: HexTile | undefined, dir: Direction) {
    if (!n) return;

    this.tType.drawBorder(this.map, ctx, n, dir);

    if (this.visited > HIGHWAY_LIMIT && n.visited > HIGHWAY_LIMIT) {
      this.map.draw(ctx, new Point2d(dir, 2), 0, 0, 1);
    } else if (this.visited > STREET_LIMIT && n.visited > STREET_LIMIT) {
      this.map.draw(ctx, new Point2d(dir, 3), 0, 0, 1);
    } else if (this.visited > ROAD_LIMIT && n.visited > ROAD_LIMIT) {
      this.map.draw(ctx, new Point2d(dir, 4), 0, 0, 1);
    }
  }
  hasType(t: HexTileType) {
    return this.tType === t;
  }
  setUpNeighbor(n: HexTile | undefined) {
    this.neighbors.up = n;
    if (n) {
      n.neighbors.down = this;
      n.redraw();
    }
    this.redraw();
  }
  setRightUpNeighbor(n: HexTile | undefined) {
    this.neighbors.rightUp = n;
    if (n) {
      n.neighbors.leftDown = this;
      n.redraw();
    }
    this.redraw();
  }
  setRightDownNeighbor(n: HexTile | undefined) {
    this.neighbors.rightDown = n;
    if (n) {
      n.neighbors.leftUp = this;
      n.redraw();
    }
    this.redraw();
  }
  setDownNeighbor(n: HexTile | undefined) {
    this.neighbors.down = n;
    if (n) {
      n.neighbors.up = this;
      n.redraw();
    }
    this.redraw();
  }
  setLeftDownNeighbor(n: HexTile | undefined) {
    this.neighbors.leftDown = n;
    if (n) {
      n.neighbors.rightUp = this;
      n.redraw();
    }
    this.redraw();
  }
  setLeftUpNeighbor(n: HexTile | undefined) {
    this.neighbors.leftUp = n;
    if (n) {
      n.neighbors.rightDown = this;
      n.redraw();
    }
    this.redraw();
  }
  getPrices(): HexTilePrices {
    return this.neighbors;
  }
  getType() {
    return this.tType;
  }
}
