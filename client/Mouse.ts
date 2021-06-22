export class Mouse {
  private x: number = -1;
  private y: number = -1;
  private drawStartX: number = -1;
  private drawStartY: number = -1;
  private onClickObservers: ((x: number, y: number) => void)[] = [];
  constructor() {}
  handleMouseUp() {
    if (Math.hypot(this.x - this.drawStartX, this.y - this.drawStartY) < 10) {
      this.onClickObservers.forEach((f) => f(this.x, this.y));
    }
  }
  handleMouseDown() {
    this.drawStartX = this.x;
    this.drawStartY = this.y;
  }
  handleMouseMove(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  registerOnClick(f: (x: number, y: number) => void) {
    this.onClickObservers.push(f);
  }
}
