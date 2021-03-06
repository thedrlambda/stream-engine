import { Entity, NotCoin } from "./Entity";
import { GameEntity } from "./GameEntity";
import {
  GRAVITY,
  MONSTER_LAYER,
  PLAYER_LAYER,
  TILE_SIZE,
  TwoWayAnimation,
  WALK_SPEED,
} from "./index";
import {
  boltImage,
  char,
  colliders,
  entities,
  MoneyHealthMapCollider,
} from "./MoneyHealth";
import { FromBeginning, MyAnimation, StillTicker } from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { Persistance, Region } from "./Region";

function spawnBolt(x: number, y: number, left: boolean) {
  let bolt = new Entity(
    new MyAnimation(
      boltImage,
      new Point2d(0, 0),
      new StillTicker(new FromBeginning())
    ),
    x,
    y,
    (left ? -1 : 1) * WALK_SPEED * 5,
    0,
    PLAYER_LAYER,
    new NotCoin()
  );
  entities.push(bolt);
  colliders.push(bolt);
}

export class Monster implements GameEntity {
  private velX = 0;
  private velY = 0;
  private facingRight = true;
  private animation: MyAnimation<Monster>;
  private attacking: boolean = false;
  private throwing: boolean = false;
  private collisionLayer = MONSTER_LAYER;
  constructor(
    private x: number,
    private y: number,
    private walk: TwoWayAnimation<Monster>,
    private idle: TwoWayAnimation<Monster>,
    private attack: TwoWayAnimation<Monster>,
    private throwAttack: TwoWayAnimation<Monster>,
    private baselineOffset: number
  ) {
    this.animation = idle.right;
  }
  update(dt: number, mapCollider: MoneyHealthMapCollider) {
    this.velY += GRAVITY * dt;
    let dy = this.velY * dt;
    this.y += dy;
    let basePoint = mapCollider.point_is_solid(this.x, this.y);
    if (basePoint !== undefined) {
      this.y -= this.y % TILE_SIZE;
      this.velY = 0;
    }

    if (Math.abs(char.getX() - this.x) < 1.5 * TILE_SIZE) {
      this.attacking = true;
    } else if (Math.abs(char.getX() - this.x) < 3 * TILE_SIZE) {
      this.throwing = true;
    } else if (this.attacking) {
    } else if (this.throwing) {
    } else {
      if (this.velY === 0) {
        let dist = char.getX() - this.x;
        if (Math.abs(dist) > 300) this.velX = 0;
        else this.velX = Math.sign(dist) * 1.3 * WALK_SPEED;
      }
      let dx = this.velX * dt;
      this.x += dx;
    }

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
      this.velX = 0;
    } else if (rightPoint !== undefined) {
      this.x -=
        (((this.x + TILE_SIZE / 4) % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
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

    this.facingRight = char.getX() > this.x;

    // if (this.velX > 0) this.facingRight = true;
    // else if (this.velX < 0) this.facingRight = false;

    let animationBefore = this.animation;
    if (this.attacking) {
      this.animation = this.facingRight ? this.attack.right : this.attack.left;
    } else if (this.throwing) {
      this.animation = this.facingRight
        ? this.throwAttack.right
        : this.throwAttack.left;
    } else if (this.velX !== 0) {
      this.animation = this.facingRight ? this.walk.right : this.walk.left;
    } else {
      this.animation = this.facingRight ? this.idle.right : this.idle.left;
    }

    if (this.animation !== animationBefore) this.animation.reset();
  }
  draw(ctx: MyGraphics, zoom: number) {
    this.animation.drawFromBaseLine(
      ctx,
      this.x + (this.facingRight ? 1 : -1) * this.baselineOffset,
      this.y,
      zoom
    );
  }
  isActive() {
    return true;
  }
  stopAttacking() {
    this.attacking = false;
  }
  stopThrowing() {
    this.throwing = false;
  }
  spawnDamageRegion() {
    colliders.push(
      new Region(
        (this.facingRight ? 1 : -1) * 38 + this.x,
        this.y,
        Persistance.SINGLE_FRAME,
        () => char.damage(),
        PLAYER_LAYER
      )
    );
  }
  spawnBolt() {
    spawnBolt(
      this.x + (this.facingRight ? 1 : -1) * 20,
      this.y - 28,
      !this.facingRight
    );
  }
}
