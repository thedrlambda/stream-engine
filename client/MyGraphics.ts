import { TILE_SIZE } from "./index";
import { MyImage } from "./MyImage";

export class Canvas {
  constructor(public readonly img:CanvasImageSource, public readonly graphics: MyGraphics){}
}

export class MyGraphics {
  private ctx: CanvasRenderingContext2D;
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
  setBackgroundColor(color: string) {
    let before = this.ctx.fillStyle;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = before;
  }
  drawText(str: string, x: number, y: number) {
    let before = this.ctx.fillStyle;
    this.ctx.fillStyle = "black";
    this.ctx.fillText(str, x + 2, y + 2);
    this.ctx.fillStyle = before;
    this.ctx.fillText(str, x, y);
  }
  drawTextCentered(str: string, x: number, y: number, zoom: number) {
    this.ctx.font = "bold 30px Arial";
    let w = this.ctx.measureText(str).width / zoom;
    let tx = (x - w / 2 - this.offsetX) * zoom;
    let ty = (y - this.offsetY) * zoom;
    this.drawText(str, tx, ty);
  }
  drawImageFromBaseLine(img: MyImage, x: number, y: number, zoom: number) {
    let tx = (x - img.width / 2 - this.offsetX) * zoom;
    let ty = (y - img.height - this.offsetY) * zoom;
    let tw = img.width * zoom;
    let th = img.height * zoom;
    if (tx > this.width || ty > this.height || tx + tw < 0 || ty + th < 0)
      return;
    this.ctx.drawImage(img.src, tx, ty, tw, th);
  }
  drawImageCentered(
    img: CanvasImageSource,
    x: number,
    y: number,
    zoom: number
  ) {
    let tx = (x - +img.width / 2 - this.offsetX) * zoom;
    let ty = (y - +img.height / 2 - this.offsetY) * zoom;
    let tw = +img.width * zoom;
    let th = +img.height * zoom;
    if (tx > this.width || ty > this.height || tx + tw < 0 || ty + th < 0)
      return;
    this.ctx.drawImage(img, tx, ty, tw, th);
  }
  drawImageScaled(
    src: CanvasImageSource,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number
  ) {
    let tx = (x - this.offsetX) * zoom;
    let ty = (y - this.offsetY) * zoom;
    let tw = w * zoom;
    let th = h * zoom;
    if (tx > this.width || ty > this.height || tx + tw < 0 || ty + th < 0)
      return;
    this.ctx.drawImage(src, tx, ty, tw, th);
  }
  drawImage(src: CanvasImageSource, x: number, y: number, zoom: number) {
    let tx = (x - this.offsetX) * zoom;
    let ty = (y - this.offsetY) * zoom;
    this.ctx.drawImage(src, tx, ty);
  }
  drawRect(x: number, y: number, w: number, h: number, zoom: number) {
    let tx = (x - this.offsetX) * zoom;
    let ty = (y - this.offsetY) * zoom;
    let tw = w * zoom;
    let th = h * zoom;
    if (tx > this.width || ty > this.height || tx + tw < 0 || ty + th < 0)
      return;
    this.ctx.strokeRect(tx, ty, tw, th);
  }
  fillRect(x: number, y: number, w: number, h: number, zoom: number) {
    let tx = (x - this.offsetX) * zoom;
    let ty = (y - this.offsetY) * zoom;
    let tw = w * zoom;
    let th = h * zoom;
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
    dh: number,
    zoom: number
  ) {
    this.ctx.drawImage(
      src,
      sx,
      sy,
      sw,
      sh,
      (dx - this.offsetX) * zoom,
      (dy - this.offsetY) * zoom,
      dw * zoom,
      dh * zoom
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
    dh: number,
    zoom: number
  ) {
    this.ctx.drawImage(
      src,
      sx,
      sy,
      sw,
      sh,
      (dx - sw / 2 - this.offsetX) * zoom,
      (dy - sh - this.offsetY) * zoom,
      dw * zoom,
      dh * zoom
    );
  }
  setTranslate(x: number, y: number, zoom: number) {
    this.offsetX = x - this.width / (2 * zoom);
    this.offsetY = y - this.height / (2 * zoom);
  }
  resetTranslate() {
    this.offsetX = 0;
    this.offsetY = 0;
  }
  getLeftmostTile() {
    return Math.floor(this.offsetX / TILE_SIZE);
  }
  getRightmostTile(zoom: number) {
    return Math.floor((this.offsetX + this.width / zoom) / TILE_SIZE) + 1;
  }
  getVerticalCenter(zoom: number) {
    return this.width / zoom / 2;
  }
  createNewCanvasGraphics() {
    let gImg = document.createElement("canvas");
    gImg.width = this.width;
    gImg.height = this.height;
    let g = new MyGraphics(gImg, this.width, this.height);
    return new Canvas(gImg, g);
  }
}
