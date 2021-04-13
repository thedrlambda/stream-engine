import { GameEntity } from "./GameEntity";
import {
  colliders,
  GRAVITY,
  JumpingAnimations,
  keyPressed,
  PLAYER_LAYER,
  power,
  tile_is_solid,
  tile_of_world,
  TILE_SIZE,
  TwoWayAnimation,
  WALK_SPEED,
  worldObjects,
} from "./index";
import { AnimationThing, MyAnimation } from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";

export class Character implements GameEntity {
  private velX = 0;
  private velY = 0;
  private stamina: number;
  private maxStamina = Infinity;
  private running = false;
  private facingRight = true;
  private takingDamage = false;
  private animation: AnimationThing<Character>;
  private collisionLayer = PLAYER_LAYER;
  constructor(
    private x: number,
    private y: number,
    private walk: TwoWayAnimation<Character>,
    private run: TwoWayAnimation<Character>,
    private idle: TwoWayAnimation<Character>,
    private jump: JumpingAnimations<Character>,
    private hurt: TwoWayAnimation<Character>,
    private baselineOffset: number
  ) {
    this.animation = idle.right;
    this.stamina = this.maxStamina;
  }
  update(dt: number) {
    // FIXME a bit too long
    if (power) this.running = true;

    let topPoint = tile_is_solid(this.x, this.y - TILE_SIZE);
    if (topPoint !== undefined) {
      this.y += TILE_SIZE - ((this.y - TILE_SIZE) % TILE_SIZE);
      this.velY = 0;
    }

    this.velY += GRAVITY * dt;
    let dy = this.velY * dt;
    this.y += dy;
    let basePoint = tile_is_solid(this.x, this.y);
    if (basePoint !== undefined) {
      this.y -= this.y % TILE_SIZE;
      let desiredJump =
        (Math.abs(this.velX) / WALK_SPEED + 2) *
        -40 *
        (keyPressed["ArrowUp"] && !this.takingDamage ? 1 : 0);
      let staminaPrice = -desiredJump * dt;
      if (staminaPrice <= this.stamina) {
        this.velY = desiredJump;
        this.stamina -= staminaPrice;
      } else {
        this.velY = 0;
      }
    }

    if (this.velY === 0 && this.takingDamage) {
      this.velX = 0;
    } else if (this.velY === 0) {
      if (!keyPressed["ArrowRight"] && !keyPressed["ArrowLeft"])
        this.running = false;

      if (
        (!keyPressed["ArrowRight"] && !keyPressed["ArrowLeft"]) ||
        !this.running
      ) {
        this.stamina +=
          2 *
          (!keyPressed["ArrowRight"] && !keyPressed["ArrowLeft"] ? dt : dt / 2);
        if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
      } else if (this.running) {
        this.stamina -= 2 * dt;
        if (this.stamina < 0) this.stamina = 0;
      }
      this.velX =
        (this.running && this.stamina > 0 ? 3 : 1) *
        ((keyPressed["ArrowRight"] ? 1 : 0) -
          (keyPressed["ArrowLeft"] ? 1 : 0)) *
        WALK_SPEED;
    }
    let dx = this.velX * dt;
    this.x += dx;

    let leftPoint = tile_is_solid(
      this.x - TILE_SIZE / 4,
      this.y - TILE_SIZE / 2
    );
    let rightPoint = tile_is_solid(
      this.x + TILE_SIZE / 4,
      this.y - TILE_SIZE / 2
    );
    if (leftPoint !== undefined) {
      this.x += TILE_SIZE - ((this.x - TILE_SIZE / 4) % TILE_SIZE);
      this.velX = 0;
    } else if (rightPoint !== undefined) {
      this.x -= (this.x + TILE_SIZE / 4) % TILE_SIZE;
      this.velX = 0;
    }

    colliders.forEach((e) => {
      if (
        this.x - TILE_SIZE / 4 <= e.getX() &&
        e.getX() <= this.x + TILE_SIZE / 4 &&
        this.y - TILE_SIZE <= e.getY() &&
        e.getY() <= this.y &&
        e.onSameLayer(this.collisionLayer)
      )
        e.activate();
    });

    this.animation.update(dt, this);

    if (this.velX > 0) this.facingRight = true;
    else if (this.velX < 0) this.facingRight = false;

    let animationBefore = this.animation;
    if (this.takingDamage) {
      this.animation = this.facingRight ? this.hurt.right : this.hurt.left;
    } else if (this.velY < 0) {
      this.animation = this.facingRight
        ? this.jump.rightRising
        : this.jump.leftRising;
    } else if (this.velY > 0) {
      this.animation = this.facingRight
        ? this.jump.rightFalling
        : this.jump.leftFalling;
    } else if (Math.abs(this.velX) > 50) {
      this.animation = this.facingRight ? this.run.right : this.run.left;
    } else if (this.velX !== 0) {
      this.animation = this.facingRight ? this.walk.right : this.walk.left;
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
    ctx.setColor("rgb(200,200,200,0.5)");
    ctx.fillRect(
      this.x - TILE_SIZE / 2,
      this.y,
      (this.stamina / this.maxStamina) * TILE_SIZE,
      6
    );
    ctx.setColor("rgb(255, 255, 255,1)");
    ctx.drawRect(this.x - TILE_SIZE / 2, this.y, TILE_SIZE, 6);
  }
  act() {
    worldObjects[
      `${tile_of_world(this.x)},${tile_of_world(this.y - 5)}`
    ]?.activate();
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
  damage() {
    this.takingDamage = true;
  }
  recover() {
    this.takingDamage = false;
  }
}
