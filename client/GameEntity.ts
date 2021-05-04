import { MapCollider } from "./index";
import { MyGraphics } from "./MyGraphics";

export interface GameEntity {
  draw(g: MyGraphics): void;
  update(dt: number, mapCollider: MapCollider): void;
  isActive(): boolean;
}
