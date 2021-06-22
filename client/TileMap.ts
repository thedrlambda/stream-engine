import { MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";
import { Point2d } from "./Point2d";

export class TileMap {
  private tw: number;
  private th: number;
  constructor(
    private img: MyImage,
    private w: number,
    private h: number,
    private margin: number
  ) {
    this.tw = ~~((img.width - margin) / w);
    this.th = ~~((img.height - margin) / h);
  }
  draw(ctx: MyGraphics, t: Point2d, x: number, y: number, zoom: number) {
    ctx.drawImageSubImage(
      this.img.src,
      t.x * this.tw + this.margin,
      t.y * this.th + this.margin,
      this.tw - this.margin,
      this.th - this.margin,
      x,
      y,
      this.tw - this.margin,
      this.th - this.margin,
      zoom
    );
  }
  drawFromBaseLine(
    ctx: MyGraphics,
    t: Point2d,
    x: number,
    y: number,
    zoom: number
  ) {
    ctx.drawImageSubImageFromBaseLine(
      this.img.src,
      t.x * this.tw + this.margin,
      t.y * this.th + this.margin,
      this.tw - this.margin,
      this.th - this.margin,
      x,
      y,
      this.tw - this.margin,
      this.th - this.margin,
      zoom
    );
  }
  flip() {
    let img = this.img.flipped();
    return new TileMap(img, this.w, this.h, this.margin);
  }
  getWidth() {
    return this.w;
  }
  getBlankTile() {
    let result = document.createElement("canvas");
    result.width = this.tw;
    result.height = this.th;
    return result;
  }
}
