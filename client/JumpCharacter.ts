import { GameEntity } from "./GameEntity";
import {
  GRAVITY,
  JumpingAnimations,
  keyPressed,
  MapCollider,
  tile_of_world,
  TILE_SIZE,
  TwoWayAnimation,
  WALK_SPEED,
  worldObjects,
} from "./index";
import { AnimationThing } from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";

export class JumpCharacter implements GameEntity {
  private velX = 0;
  private velY = 0;
  private facingRight = true;
  private animation: AnimationThing<JumpCharacter>;
  private desiredJump: number = 0;
  private recovery: number = 0;
  constructor(
    private x: number,
    private y: number,
    private run: TwoWayAnimation<JumpCharacter>,
    private idle: TwoWayAnimation<JumpCharacter>,
    private jump: JumpingAnimations<JumpCharacter>,
    private charging: TwoWayAnimation<JumpCharacter>,
    private recovering: TwoWayAnimation<JumpCharacter>,
    private baselineOffset: number
  ) {
    this.animation = idle.right;
  }
  update(dt: number, mapCollider: MapCollider) {
    // FIXME a bit too long
    let topPoint = mapCollider.point_is_solid(this.x, this.y - TILE_SIZE);
    if (topPoint !== undefined) {
      this.y += TILE_SIZE - ((this.y - TILE_SIZE) % TILE_SIZE);
      this.velY = Math.max(0, this.velY);
    }

    this.recovery -= dt;
    this.velY += GRAVITY * dt;
    let dy = this.velY * dt;
    this.y += dy;
    let basePoint = mapCollider.point_is_solid(this.x, this.y);
    if (basePoint !== undefined) {
      if (this.velY > 300) {
        this.recovery = 3;
      }
      this.y -= this.y % TILE_SIZE;
      if (this.recovery <= 0) {
        this.velY = this.desiredJump;
        if (!keyPressed["ArrowUp"])
          this.velX =
            3 *
            ((keyPressed["ArrowRight"] ? 1 : 0) -
              (keyPressed["ArrowLeft"] ? 1 : 0)) *
            WALK_SPEED;
        else this.velX = 0;
      } else {
        this.velX = 0;
        this.velY = 0;
      }
    }
    this.desiredJump = 0;

    let dx = this.velX * dt;
    this.x += dx;

    let leftPoint = mapCollider.point_is_solid(
      this.x - TILE_SIZE / 4,
      this.y - TILE_SIZE / 2
    );
    let rightPoint = mapCollider.point_is_solid(
      this.x + TILE_SIZE / 4,
      this.y - TILE_SIZE / 2
    );
    if (leftPoint !== undefined) {
      this.x +=
        TILE_SIZE -
        ((((this.x - TILE_SIZE / 4) % TILE_SIZE) + TILE_SIZE) % TILE_SIZE);
      this.velX = WALK_SPEED;
    } else if (rightPoint !== undefined) {
      this.x -=
        (((this.x + TILE_SIZE / 4) % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
      this.velX = -WALK_SPEED;
    }

    this.animation.update(dt, this);

    if (this.velX > 0) this.facingRight = true;
    else if (this.velX < 0) this.facingRight = false;

    let animationBefore = this.animation;
    if (this.velY < 0) {
      this.animation = this.facingRight
        ? this.jump.rightRising
        : this.jump.leftRising;
    } else if (this.velY > 0) {
      this.animation = this.facingRight
        ? this.jump.rightFalling
        : this.jump.leftFalling;
    } else if (this.recovery > 0) {
      this.animation = this.facingRight
        ? this.recovering.right
        : this.recovering.left;
    } else if (Math.abs(this.velX) > 50) {
      this.animation = this.facingRight ? this.run.right : this.run.left;
    } else if (keyPressed["ArrowUp"]) {
      this.animation = this.facingRight
        ? this.charging.right
        : this.charging.left;
    } else {
      this.animation = this.facingRight ? this.idle.right : this.idle.left;
    }

    if (this.animation !== animationBefore) this.animation.reset();
  }
  draw(ctx: MyGraphics) {
    this.animation.drawFromBaseLine(
      ctx,
      this.x + (this.facingRight ? 1 : -1) * this.baselineOffset,
      this.y
    );
  }
  act() {
    let tx = tile_of_world(this.x);
    let ty = tile_of_world(this.y - 5);
    worldObjects[1]
      .find((w) => w.getPosition().x === tx && w.getPosition().y === ty)
      ?.activate();
  }
  setCamera(g: MyGraphics) {
    g.setTranslate(this.x, this.y - 2 * TILE_SIZE);
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  isActive() {
    return true;
  }
  reqJump(time: number) {
    this.desiredJump = Math.max(time * -400, -250);
  }
}
