import { CollidingThingy } from "./CollidingThingy";
import { GameEntity } from "./GameEntity";
import { coins, GRAVITY, TILE_SIZE } from "./index";
import { char, MoneyHealthMapCollider } from "./MoneyHealth";
import { AnimationThing } from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";
import { Tile } from "./Tile";

interface Type {
  handleHorizontalCollision(
    leftPoint: Tile | undefined,
    rightPoint: Tile | undefined,
    ent: Entity
  ): void;
  handleVerticalCollision(
    ent: Entity,
    basePoint: Tile | undefined,
    dy: number
  ): void;
  activate(ent: Entity): void;
}
export class Coin implements Type {
  handleHorizontalCollision(
    leftPoint: Tile | undefined,
    rightPoint: Tile | undefined,
    ent: Entity
  ) {
    if (leftPoint !== undefined) {
      ent.moveX(TILE_SIZE - ent.getTileDisplacement());
    } else if (rightPoint !== undefined) {
      ent.moveX(-ent.getTileDisplacement());
    }
  }
  handleVerticalCollision(
    ent: Entity,
    basePoint: Tile | undefined,
    dy: number
  ) {
    if (basePoint !== undefined) {
      ent.landOnGround(dy);
    }
  }
  activate(ent: Entity) {
    if (ent.isOnGround()) {
      ent.deactivate();
      coins.value++;
    }
  }
}
export class NotCoin implements Type {
  handleHorizontalCollision(
    leftPoint: Tile | undefined,
    rightPoint: Tile | undefined,
    ent: Entity
  ) {
    if (leftPoint !== undefined || rightPoint !== undefined) {
      ent.deactivate();
    }
  }
  handleVerticalCollision(
    ent: Entity,
    basePoint: Tile | undefined,
    dy: number
  ) {
    if (basePoint !== undefined) {
      ent.deactivate();
    }
  }
  activate(ent: Entity) {
    ent.deactivate();
    char.damage();
  }
}

export class Entity implements CollidingThingy, GameEntity {
  private animation: AnimationThing<Entity>;
  private active = true;
  private onGround = false;
  private halfSize = TILE_SIZE / 8;
  constructor(
    idle: AnimationThing<Entity>,
    private x: number,
    private y: number,
    private velX: number,
    private velY: number,
    private collisionLayer: number,
    private coin: Type
  ) {
    this.animation = idle;
  }
  update(dt: number, mapCollider: MoneyHealthMapCollider) {
    this.updateHorizontalPosition(dt);
    this.horizontalCollisionDetection(mapCollider);

    let dy = this.updateVerticalPosition(dt);
    this.verticalCollisionDetection(mapCollider, dy);

    this.animation.update(dt, this);
  }
  private updateVerticalPosition(dt: number) {
    this.velY += GRAVITY * dt;
    let dy = this.velY * dt;
    this.y += dy;
    return dy;
  }

  private updateHorizontalPosition(dt: number) {
    if (Math.abs(this.velX) < 2) this.velX = 0;
    let dx = this.velX * dt;
    this.x += dx;
  }

  private verticalCollisionDetection(
    mapCollider: MoneyHealthMapCollider,
    dy: number
  ) {
    let basePoint = mapCollider.point_is_solid(this.x, this.y);
    this.coin.handleVerticalCollision(this, basePoint, dy);
  }

  private horizontalCollisionDetection(mapCollider: MoneyHealthMapCollider) {
    let leftPoint = mapCollider.point_is_solid(
      this.x - this.halfSize,
      this.y - this.halfSize
    );
    let rightPoint = mapCollider.point_is_solid(
      this.x + this.halfSize,
      this.y - this.halfSize
    );
    this.coin.handleHorizontalCollision(leftPoint, rightPoint, this);
  }

  draw(ctx: MyGraphics, zoom: number) {
    this.animation.drawFromBaseLine(ctx, this.x, this.y, zoom);
  }
  isActive() {
    return this.active;
  }
  isOnGround() {
    return this.onGround;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  activate() {
    this.coin.activate(this);
  }
  onSameLayer(other: number) {
    return (this.collisionLayer & other) !== 0;
  }
  deactivate() {
    this.active = false;
  }
  moveX(x: number) {
    this.x += x;
    this.velX = 0;
  }
  getTileDisplacement() {
    return (((this.x + this.halfSize) % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
  }
  landOnGround(dy: number) {
    this.y -= dy;
    this.velY = 0;
    this.velX = Math.sign(this.velX) * Math.pow(Math.abs(this.velX), 0.95);
    this.onGround = true;
  }
}
