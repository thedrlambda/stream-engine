import { CollidingThingy } from "./CollidingThingy";

export enum Persistance {
  SINGLE_FRAME,
  PERMANENT,
  UNTIL_VISITED,
}

export class Region implements CollidingThingy {
  private visited: boolean = false;
  constructor(
    private x: number,
    private y: number,
    private persistance: Persistance,
    private callback: () => void,
    private collisionLayer: number
  ) {}
  isActive() {
    return (
      this.persistance === Persistance.PERMANENT ||
      (this.persistance === Persistance.UNTIL_VISITED && !this.visited)
    );
  }
  activate() {
    this.callback();
    this.visited = true;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  onSameLayer(layer: number) {
    return (this.collisionLayer & layer) !== 0;
  }
}
