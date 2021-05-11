import { MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";
import { Point2d } from "./Point2d";

export class TileMap {
  private tw: number;
  private th: number;
  constructor(private img: MyImage, private w: number, private h: number) {
    this.tw = ~~(img.width / w);
    this.th = ~~(img.height / h);
  }
  draw(ctx: MyGraphics, t: Point2d, x: number, y: number) {
    ctx.drawImageSubImage(
      this.img.src,
      t.x * this.tw,
      t.y * this.th,
      this.tw,
      this.th,
      x,
      y,
      this.tw,
      this.th
    );
  }
  drawFromBaseLine(ctx: MyGraphics, t: Point2d, x: number, y: number) {
    ctx.drawImageSubImageFromBaseLine(
      this.img.src,
      t.x * this.tw,
      t.y * this.th,
      this.tw,
      this.th,
      x,
      y,
      this.tw,
      this.th
    );
  }
  flip() {
    let img = this.img.flipped();
    return new TileMap(img, this.w, this.h);
  }
  getWidth() {
    return this.w;
  }
}
