import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

enum ItemType {
  Log = 0,
  Rock = 1,
  Sapling = 2,
  Plank = 3,
}

export class Item {
  constructor(private map: TileMap, private tType: ItemType) {}
  draw(ctx: MyGraphics, x: number, y: number, zoom: number, cursor: number) {
    this.map.drawFromBaseLine(ctx, new Point2d(cursor, this.tType), x, y, zoom);
  }
}
