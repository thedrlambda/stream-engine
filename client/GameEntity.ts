import { MyGraphics } from "./MyGraphics";

export interface GameEntity {
  draw(g: MyGraphics): void;
  update(dt: number): void;
  isActive(): boolean;
}
