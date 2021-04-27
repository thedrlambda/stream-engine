import { TILE_SIZE } from "./index";
import { MyImage } from "./MyImage";

export class MyGraphics {
  private ctx: CanvasRenderingContext2D;
  private zoom: number = 2;
  private offsetX: number = 0;
  private offsetY: number = 0;
  constructor(
    canvasElem: HTMLCanvasElement,
    private width: number,
    private height: number
  ) {
    this.ctx = canvasElem.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  setColor(color: string) {
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
  }
  drawText(str: string, x: number, y: number) {
    this.ctx.strokeStyle = "red";
    this.ctx.strokeText(str, x, y);
  }
  drawTextCentered(str: string, x: number, y: number) {
    this.ctx.font = "bold 30px Arial";
    let w = this.ctx.measureText(str).width / this.zoom;
    let tx = (x - w / 2 - this.offsetX) * this.zoom;
    let ty = (y - this.offsetY) * this.zoom;
    this.ctx.fillStyle = "black";
    this.ctx.fillText(str, tx + 2, ty + 2);
    this.ctx.fillStyle = "red";
    this.ctx.fillText(str, tx, ty);
  }
  drawFromBaseLine(img: MyImage, x: number, y: number) {
    let tx = (x - img.width / 2 - this.offsetX) * this.zoom;
    let ty = (y - img.height - this.offsetY) * this.zoom;
    let tw = img.width * this.zoom;
    let th = img.height * this.zoom;
    if (tx > this.width || ty > this.height || tx + tw < 0 || ty + th < 0)
      return;
    this.ctx.drawImage(img.src, tx, ty, tw, th);
  }
  drawImageScaled(
    src: CanvasImageSource,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    let tx = (x - this.offsetX) * this.zoom;
    let ty = (y - this.offsetY) * this.zoom;
    let tw = w * this.zoom;
    let th = h * this.zoom;
    if (tx > this.width || ty > this.height || tx + tw < 0 || ty + th < 0)
      return;
    this.ctx.drawImage(src, tx, ty, tw, th);
  }
  drawImage(src: CanvasImageSource, x: number, y: number) {
    let tx = (x - this.offsetX) * this.zoom;
    let ty = (y - this.offsetY) * this.zoom;
    this.ctx.drawImage(src, tx, ty);
  }
  drawRect(x: number, y: number, w: number, h: number) {
    let tx = (x - this.offsetX) * this.zoom;
    let ty = (y - this.offsetY) * this.zoom;
    let tw = w * this.zoom;
    let th = h * this.zoom;
    if (tx > this.width || ty > this.height || tx + tw < 0 || ty + th < 0)
      return;
    this.ctx.strokeRect(tx, ty, tw, th);
  }
  fillRect(x: number, y: number, w: number, h: number) {
    let tx = (x - this.offsetX) * this.zoom;
    let ty = (y - this.offsetY) * this.zoom;
    let tw = w * this.zoom;
    let th = h * this.zoom;
    if (tx > this.width || ty > this.height || tx + tw < 0 || ty + th < 0)
      return;
    this.ctx.fillRect(tx, ty, tw, th);
  }
  drawImageSubImage(
    src: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) {
    this.ctx.drawImage(
      src,
      sx,
      sy,
      sw,
      sh,
      (dx - this.offsetX) * this.zoom,
      (dy - this.offsetY) * this.zoom,
      dw * this.zoom,
      dh * this.zoom
    );
  }
  drawImageSubImageFromBaseLine(
    src: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) {
    this.ctx.drawImage(
      src,
      sx,
      sy,
      sw,
      sh,
      (dx - sw / 2 - this.offsetX) * this.zoom,
      (dy - sh - this.offsetY) * this.zoom,
      dw * this.zoom,
      dh * this.zoom
    );
  }
  setTranslate(x: number, y: number) {
    this.offsetX = x - this.width / (2 * this.zoom);
    this.offsetY = y - this.height / (2 * this.zoom);
  }
  resetTranslate() {
    this.offsetX = 0;
    this.offsetY = 0;
  }
  getLeftmostTile() {
    return Math.floor(this.offsetX / TILE_SIZE);
  }
  getRightmostTile() {
    return Math.floor((this.offsetX + this.width / this.zoom) / TILE_SIZE) + 1;
  }
  getVerticalCenter() {
    return this.width / this.zoom / 2;
  }
  // FIXME: Eliminate getter
  getZoom() {
    return this.zoom;
  }
}
