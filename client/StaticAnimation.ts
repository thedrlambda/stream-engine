import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { AnimationThing, StartPosition } from "./MyAnimation";
import { TileMap } from "./TileMap";

export class StaticAnimation implements AnimationThing<void> {
  private cursor: number;
  private tile: Point2d;
  constructor(
    private map: TileMap,
    initialTile: Point2d,
    randomStart: StartPosition
  ) {
    this.cursor = randomStart.forStatic(1);
    this.tile = new Point2d(initialTile.x + this.cursor, initialTile.y);
  }
  update(dt: number) {}
  draw(ctx: MyGraphics, x: number, y: number) {
    this.map.draw(ctx, this.tile, x, y);
  }
  drawFromBaseLine(ctx: MyGraphics, x: number, y: number) {
    this.map.drawFromBaseLine(ctx, this.tile, x, y);
  }
  reset() {}
}
