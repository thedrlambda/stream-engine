import { CollidingThingy } from "./CollidingThingy";
import { GameEntity } from "./GameEntity";
import { char, coins, GRAVITY, map, tile_of_world } from "./index";
import { AnimationThing } from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";

export class Entity implements CollidingThingy, GameEntity {
  private animation: AnimationThing<Entity>;
  private active = true;
  private onGround = false;
  constructor(
    idle: AnimationThing<Entity>,
    private x: number,
    private y: number,
    private velX: number,
    private velY: number,
    private collisionLayer: number,
    private coin: boolean
  ) {
    this.animation = idle;
  }
  update(dt: number) {
    if (Math.abs(this.velX) < 2) this.velX = 0;
    let dx = this.velX * dt;
    this.x += dx;
    this.velY += GRAVITY * dt;
    let dy = this.velY * dt;
    this.y += dy;

    let basePoint = map[tile_of_world(this.y)][tile_of_world(this.x)];
    if (basePoint !== undefined) {
      if (this.coin) {
        this.y -= dy;
        this.velY = 0;
        this.velX = Math.sign(this.velX) * Math.pow(Math.abs(this.velX), 0.95);
        this.onGround = true;
      } else {
        this.active = false;
      }
    }

    this.animation.update(dt, this);
  }
  draw(ctx: MyGraphics) {
    this.animation.drawFromBaseLine(ctx, this.x, this.y);
  }
  isActive() {
    return this.active;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  activate() {
    if (this.coin) {
      if (this.onGround) {
        this.active = false;
        coins.value++;
      }
    } else {
      this.active = false;
      char.damage();
    }
  }
  onSameLayer(other: number) {
    return (this.collisionLayer & other) !== 0;
  }
}
