import { GameEntity } from "./GameEntity";
import { GRAVITY } from "./index";
import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

export class Particle implements GameEntity {
  constructor(
    private image: TileMap, // TODO should probably be an animation
    private x: number,
    private y: number,
    private velX: number,
    private velY: number,
    private lifeTime: number
  ) {}
  update(dt: number) {
    this.x += this.velX * dt;
    this.velY += GRAVITY * dt;
    this.y += this.velY * dt;
    this.lifeTime -= dt;
  }
  draw(g: MyGraphics, zoom: number) {
    this.image.draw(g, new Point2d(0, 0), this.x, this.y, zoom);
  }
  isActive() {
    return this.lifeTime > 0;
  }
}
