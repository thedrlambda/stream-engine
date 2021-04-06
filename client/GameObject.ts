import { tile_to_world } from "./index";
import { AnimationThing, MyAnimation } from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";
import { TilePosition } from "./TilePosition";

export class GameObject {
  private animation: AnimationThing<GameObject>;
  constructor(
    private pos: TilePosition,
    idle: AnimationThing<GameObject>,
    private baselineOffset: number,
    private action?: AnimationThing<GameObject>
  ) {
    this.animation = idle;
  }
  update(dt: number) {
    this.animation.update(dt, this);
  }
  draw(ctx: MyGraphics, x: number, y: number) {
    this.animation.draw(
      ctx,
      tile_to_world(x) + this.baselineOffset,
      tile_to_world(y)
    );
  }
  activate() {
    if (this.action !== undefined) this.animation = this.action;
  }
  getPosition() {
    return this.pos;
  }
}
