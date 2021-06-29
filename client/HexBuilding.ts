import { HexWorker } from "./HexWorker";
import { worldXOfHexTile, worldZOfHexTile } from "./index";
import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

interface HexBuildingType {
  draw(ctx: MyGraphics, x: number, y: number, zoom: number): void;
  update(dt: number, x: number, y: number, workers: HexWorker[]): void;
}
export class WoodCutter implements HexBuildingType {
  private delay = 30;
  constructor(private map: TileMap) {}
  draw(ctx: MyGraphics, x: number, y: number, zoom: number) {
    this.map.draw(ctx, new Point2d(0, 1), x, y, zoom);
  }
  update(dt: number, x: number, y: number, workers: HexWorker[]) {
    this.delay -= dt;
    while (this.delay < 0) {
      this.delay += 30;
      // Find free worker
      let closest: HexWorker | null = null;
      let closestDist = Infinity;
      for (let i = 0; i < workers.length; i++) {
        let w = workers[i];
        if (w.isFree()) {
          let d = w.distanceFrom(x, y);
          if (closestDist > d) {
            closestDist = d;
            closest = w;
          }
        }
      }
      if (closest !== null) {
        closest.goto(x, y);
      }
    }
  }
}
export class Sawmill implements HexBuildingType {
  constructor(private map: TileMap) {}
  draw(ctx: MyGraphics, x: number, y: number, zoom: number) {
    this.map.draw(ctx, new Point2d(3, 1), x, y, zoom);
  }
  update(dt: number, x: number, y: number, workers: HexWorker[]) {}
}

export class HexBuilding {
  private x: number;
  private z: number;
  constructor(
    private tx: number,
    private tz: number,
    private tType: HexBuildingType
  ) {
    this.x = worldXOfHexTile(tx, tz);
    this.z = worldZOfHexTile(tx, tz);
  }
  draw(ctx: MyGraphics, zoom: number) {
    this.tType.draw(ctx, this.x, this.z, zoom);
  }
  update(dt: number, workers: HexWorker[]) {
    this.tType.update(dt, this.tx, this.tz, workers);
  }
}
