import { aStarNode, reversePath } from "./AStarNode";
import { Grass, HexTile, HexTileType, Sand } from "./HexTile";
import { worldXOfHexTile, worldZOfHexTile } from "./index";
import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

export class HexMap {
  private zoom = 2;
  private map: HexTile[][];
  private pathMap: number[][] = [];
  constructor(tileset: TileMap) {
    this.map = [];
    for (let x = 0; x < 5; x++) {
      this.map[x] = [];
      for (let z = 0; z < 46; z++) {
        if (Math.random() < 0.5)
          this.setTile(
            x,
            z,
            new HexTile(x, z, tileset, new Grass(), new Point2d(1, 0), 1)
          );
        else
          this.setTile(
            x,
            z,
            new HexTile(x, z, tileset, new Sand(), new Point2d(3, 0), 2)
          );
      }
    }
  }
  private getTileOrUndefined(x: number, z: number) {
    return this.map[x] && this.map[x][z];
  }
  setTile(x: number, z: number, tile: HexTile) {
    this.map[x][z] = tile;
    tile.setUpNeighbor(this.getTileOrUndefined(x, z - 2));
    tile.setRightUpNeighbor(
      z % 2 === 0
        ? this.getTileOrUndefined(x + 1, z - 1)
        : this.getTileOrUndefined(x, z - 1)
    );
    tile.setRightDownNeighbor(
      z % 2 === 0
        ? this.getTileOrUndefined(x + 1, z + 1)
        : this.getTileOrUndefined(x, z + 1)
    );
    tile.setDownNeighbor(this.getTileOrUndefined(x, z + 2));
    tile.setLeftDownNeighbor(
      z % 2 === 0
        ? this.getTileOrUndefined(x, z + 1)
        : this.getTileOrUndefined(x - 1, z + 1)
    );
    tile.setLeftUpNeighbor(
      z % 2 === 0
        ? this.getTileOrUndefined(x, z - 1)
        : this.getTileOrUndefined(x - 1, z - 1)
    );
  }
  draw(canvasGraphics: MyGraphics) {
    for (let x = 0; x < this.map.length; x++) {
      for (let z = 0; z < this.map[x].length; z++) {
        this.map[x][z]?.draw(
          canvasGraphics,
          worldXOfHexTile(x, z),
          worldZOfHexTile(x, z),
          this.zoom
        );
      }
    }
  }
  pathFind(
    sx: number,
    sz: number,
    tx: number,
    tz: number
  ): aStarNode | undefined {
    // TODO make queue a min-heap
    let queue: aStarNode[] = [];
    this.pathMap = [];
    for (let x = 0; x < this.map.length; x++) {
      this.pathMap[x] = [];
      for (let z = 0; z < this.map[x].length; z++) {
        this.pathMap[x][z] = Infinity;
      }
    }
    let path: aStarNode | undefined = undefined;
    let visit = (x: number, z: number, e: aStarNode) => {
      if (x < 0 || x >= this.pathMap.length) return;
      if (z < 0 || z >= this.pathMap[x].length) return;
      let nPrice = e.price + this.map[x][z].drag;
      if (this.pathMap[x][z] <= nPrice) return;
      this.pathMap[x][z] = nPrice;
      if (x === tx && z === tz)
        path = {
          x,
          z,
          price: nPrice,
          est: 0,
          prev: e,
        };
      if (nPrice >= this.pathMap[tx][tz]) return;
      queue.push({
        x,
        z,
        price: nPrice,
        est: Math.abs(tx - x) + Math.abs(tz - z),
        prev: e,
      });
    };
    this.pathMap[sx][sz] = 0;
    queue.push({
      x: sx,
      z: sz,
      price: 0,
      est: Math.abs(tx - sx) + Math.abs(tz - sz),
    });
    while (queue.length > 0) {
      let e = queue.pop()!;
      visit(e.x, e.z - 2, e);
      visit(e.x, e.z - 1, e);
      visit(e.x, e.z + 1, e);
      visit(e.x, e.z + 2, e);
      if (e.z % 2 === 0) {
        visit(e.x + 1, e.z - 1, e);
        visit(e.x + 1, e.z + 1, e);
      } else {
        visit(e.x - 1, e.z + 1, e);
        visit(e.x - 1, e.z - 1, e);
      }
      queue.sort((a, b) => a.est - b.est);
    }
    return reversePath(path);
  }
  visit(x: number, z: number) {
    this.map[x][z].visit();
  }
  getPrices(x: number, z: number) {
    return this.map[x][z].getPrices();
  }
}
