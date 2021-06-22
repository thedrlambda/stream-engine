import { MyGraphics } from "./MyGraphics";

export class Button {
  private left: number;
  private top: number;
  constructor(
    private text: string,
    private x: number,
    private y: number,
    private w: number,
    private h: number,
    private act: () => void
  ) {
    this.left = x - w / 2;
    this.top = y + (-3 / 4) * h;
  }
  draw(canvasGraphics: MyGraphics, zoom: number) {
    canvasGraphics.drawRect(this.left, this.top, this.w, this.h, zoom);
    canvasGraphics.drawTextCentered(this.text, this.x, this.y, zoom);
  }
  actIfHit(x: number, y: number) {
    if (
      this.left <= x &&
      x <= this.left + this.w &&
      this.top <= y &&
      y <= this.top + this.h
    )
      this.act();
  }
}
