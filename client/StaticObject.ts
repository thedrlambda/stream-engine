import { TILE_SIZE, tile_to_world } from "./index";
import { MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";

export class StaticObject {
  constructor(private img: MyImage, private x: number, private y: number) {}
  draw(g: MyGraphics) {
    g.drawFromBaseLine(
      this.img,
      tile_to_world(this.x) + TILE_SIZE / 2,
      tile_to_world(this.y)
    );
  }
}
