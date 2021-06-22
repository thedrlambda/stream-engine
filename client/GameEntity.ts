import { CollidingThingy } from "./CollidingThingy";
import { MapCollider } from "./index";
import { MyGraphics } from "./MyGraphics";

export interface GameEntity {
  draw(g: MyGraphics, zoom: number): void;
  update(
    dt: number,
    mapCollider: MapCollider,
    colliders: CollidingThingy[]
  ): void;
  isActive(): boolean;
}
