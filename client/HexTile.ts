import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

export enum HexDir {
  Up,
  RightUp,
  RightDown,
  Down,
  LeftDown,
  LeftUp,
}
export type HexNeighbors = {
  up?: HexTile;
  rightUp?: HexTile;
  rightDown?: HexTile;
  down?: HexTile;
  leftDown?: HexTile;
  leftUp?: HexTile;
};
export enum HexTileType {
  Grass,
  Swamp,
  Sand,
  Water,
  Mountain,
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
const ROAD_LIMIT = 10;
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
    this.cachedG.setZoom(1);
    let x = 0;
    let y = 0;
    this.map.draw(this.cachedG, this.t, x, y);
    this.drawUp(this.cachedG, x, y);
    this.drawRightUp(this.cachedG, x, y);
    this.drawRightDown(this.cachedG, x, y);
    this.drawDown(this.cachedG, x, y);
    this.drawLeftDown(this.cachedG, x, y);
    this.drawLeftUp(this.cachedG, x, y);
  }
  visit() {
    let visitedBefore = this.visited;
    let now = Date.now();
    if (now - this.visitedTime < 60000) this.visited++;
    else this.visited *= 0.75;
    this.visitedTime = now;
    let visitedAfter = this.visited;
    if (visitedBefore <= ROAD_LIMIT && visitedAfter > ROAD_LIMIT) {
      this.redraw();
      this.neighbors.down?.redraw();
      this.neighbors.leftDown?.redraw();
      this.neighbors.leftUp?.redraw();
      this.neighbors.rightDown?.redraw();
      this.neighbors.rightUp?.redraw();
      this.neighbors.up?.redraw();
    }
  }
  draw(ctx: MyGraphics, x: number, y: number) {
    ctx.drawImageScaled(
      this.cachedImage,
      x,
      y,
      this.cachedImage.width,
      this.cachedImage.height
    );
  }
  // FIXME: unify all these
  drawUp(ctx: MyGraphics, x: number, y: number) {
    let n = this.neighbors.up;
    if (!n) return;

    if (this.tType === HexTileType.Grass) {
    } else if (n.hasType(HexTileType.Grass))
      this.map.draw(ctx, new Point2d(4, 5), x, y);
    else if (this.tType === HexTileType.Swamp) {
    } else if (n.hasType(HexTileType.Swamp))
      this.map.draw(ctx, new Point2d(4, 6), x, y);
    else if (this.tType === HexTileType.Sand) {
    } else if (n.hasType(HexTileType.Sand))
      this.map.draw(ctx, new Point2d(4, 7), x, y);

    if (this.visited > ROAD_LIMIT && n.visited > ROAD_LIMIT) {
      this.map.draw(ctx, new Point2d(0, 4), x, y);
    }
  }
  drawRightUp(ctx: MyGraphics, x: number, y: number) {
    let n = this.neighbors.rightUp;
    if (!n) return;

    if (this.tType === HexTileType.Grass) {
    } else if (n.hasType(HexTileType.Grass))
      this.map.draw(ctx, new Point2d(2, 5), x, y);
    else if (this.tType === HexTileType.Swamp) {
    } else if (n.hasType(HexTileType.Swamp))
      this.map.draw(ctx, new Point2d(2, 6), x, y);
    else if (this.tType === HexTileType.Sand) {
    } else if (n.hasType(HexTileType.Sand))
      this.map.draw(ctx, new Point2d(2, 7), x, y);

    if (this.visited > ROAD_LIMIT && n.visited > ROAD_LIMIT) {
      this.map.draw(ctx, new Point2d(3, 4), x, y);
    }
  }
  drawRightDown(ctx: MyGraphics, x: number, y: number) {
    let n = this.neighbors.rightDown;
    if (!n) return;

    if (this.tType === HexTileType.Grass) {
    } else if (n.hasType(HexTileType.Grass))
      this.map.draw(ctx, new Point2d(3, 5), x, y);
    else if (this.tType === HexTileType.Swamp) {
    } else if (n.hasType(HexTileType.Swamp))
      this.map.draw(ctx, new Point2d(3, 6), x, y);
    else if (this.tType === HexTileType.Sand) {
    } else if (n.hasType(HexTileType.Sand))
      this.map.draw(ctx, new Point2d(3, 7), x, y);

    if (this.visited > ROAD_LIMIT && n.visited > ROAD_LIMIT) {
      this.map.draw(ctx, new Point2d(2, 4), x, y);
    }
  }
  drawDown(ctx: MyGraphics, x: number, y: number) {
    let n = this.neighbors.down;
    if (!n) return;

    if (this.tType === HexTileType.Grass) {
    } else if (n.hasType(HexTileType.Grass))
      this.map.draw(ctx, new Point2d(5, 5), x, y);
    else if (this.tType === HexTileType.Swamp) {
    } else if (n.hasType(HexTileType.Swamp))
      this.map.draw(ctx, new Point2d(5, 6), x, y);
    else if (this.tType === HexTileType.Sand) {
    } else if (n.hasType(HexTileType.Sand))
      this.map.draw(ctx, new Point2d(5, 7), x, y);

    if (this.visited > ROAD_LIMIT && n.visited > ROAD_LIMIT) {
      this.map.draw(ctx, new Point2d(1, 4), x, y);
    }
  }
  drawLeftDown(ctx: MyGraphics, x: number, y: number) {
    let n = this.neighbors.leftDown;
    if (!n) return;

    if (this.tType === HexTileType.Grass) {
    } else if (n.hasType(HexTileType.Grass))
      this.map.draw(ctx, new Point2d(1, 5), x, y);
    else if (this.tType === HexTileType.Swamp) {
    } else if (n.hasType(HexTileType.Swamp))
      this.map.draw(ctx, new Point2d(1, 6), x, y);
    else if (this.tType === HexTileType.Sand) {
    } else if (n.hasType(HexTileType.Sand))
      this.map.draw(ctx, new Point2d(1, 7), x, y);

    if (this.visited > ROAD_LIMIT && n.visited > ROAD_LIMIT) {
      this.map.draw(ctx, new Point2d(4, 4), x, y);
    }
  }
  drawLeftUp(ctx: MyGraphics, x: number, y: number) {
    let n = this.neighbors.leftUp;
    if (!n) return;

    if (this.tType === HexTileType.Grass) {
    } else if (n.hasType(HexTileType.Grass))
      this.map.draw(ctx, new Point2d(0, 5), x, y);
    else if (this.tType === HexTileType.Swamp) {
    } else if (n.hasType(HexTileType.Swamp))
      this.map.draw(ctx, new Point2d(0, 6), x, y);
    else if (this.tType === HexTileType.Sand) {
    } else if (n.hasType(HexTileType.Sand))
      this.map.draw(ctx, new Point2d(0, 7), x, y);

    if (this.visited > ROAD_LIMIT && n.visited > ROAD_LIMIT) {
      this.map.draw(ctx, new Point2d(5, 4), x, y);
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
}
