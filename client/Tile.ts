import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

export class Tile {
  constructor(private map: TileMap, private t: Point2d) {}
  draw(ctx: MyGraphics, x: number, y: number) {
    this.map.draw(ctx, this.t, x, y);
  }
}
