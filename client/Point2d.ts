export class Point2d {
  constructor(public readonly x: number, public readonly y: number) {}
  plus(other: Point2d) {
    return new Point2d(this.x + other.x, this.y + other.y);
  }
}
