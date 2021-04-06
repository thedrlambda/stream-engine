export class MyImage {
  constructor(
    public readonly src: CanvasImageSource,
    public readonly width: number,
    public readonly height: number
  ) {}
  flipped() {
    let n = document.createElement("canvas");
    n.width = this.width;
    n.height = this.height;
    let ctx = n.getContext("2d")!;
    ctx.scale(-1, 1);
    ctx.drawImage(this.src, 0, 0, -this.width, this.height);
    return new MyImage(n, this.width, this.height);
  }
}
