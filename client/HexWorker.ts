import {
  aStarNode,
  HexMap,
  HEX_TILE_DEPTH,
  HEX_TILE_WIDTH,
  sign,
  TwoWayAnimation,
  twoWayAnimationTileMap,
  worldXOfHexTile,
  worldZOfHexTile,
} from "./index";
import {
  AnimationThing,
  FromBeginning,
  MyAnimation,
  RegularTicker,
  Right,
  WrapAround,
} from "./MyAnimation";
import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

export class HexWorker {
  private sideDown: TwoWayAnimation<HexWorker>;
  private down: MyAnimation<HexWorker>;
  private up: MyAnimation<HexWorker>;
  private animation: AnimationThing<HexWorker>;
  private path: aStarNode | undefined;
  private walkSpeed: number;
  constructor(
    private x: number,
    private z: number,
    animations: TileMap,
    private map: HexMap
  ) {
    this.sideDown = twoWayAnimationTileMap(
      animations,
      new Point2d(0, 1),
      1,
      4,
      true,
      []
    );
    this.down = new MyAnimation(
      animations,
      new Point2d(0, 4),
      new RegularTicker(
        new Right(1, 4, new FromBeginning(), new WrapAround(), [])
      )
    );
    this.up = new MyAnimation(
      animations,
      new Point2d(0, 5),
      new RegularTicker(
        new Right(1, 4, new FromBeginning(), new WrapAround(), [])
      )
    );
    this.animation = this.down;
    this.path = this.map.pathFind(0, 0, 1, 1);
    this.walkSpeed = Math.random() * 0.05 - 0.025 + 0.4;
  }
  draw(ctx: MyGraphics, zoom: number) {
    this.animation.drawFromBaseLine(
      ctx,
      this.x + HEX_TILE_WIDTH / 2,
      this.z + (3 * HEX_TILE_DEPTH) / 2 + 12,
      zoom
    );
  }
  update(dt: number) {
    let dx = 0;
    if (this.path !== undefined) {
      let wx = worldXOfHexTile(this.path.x, this.path.z);
      let wz = worldZOfHexTile(this.path.x, this.path.z);
      dx = sign(wx - this.x, 1) * 2.875;
      let dz = sign(wz - this.z, 1);
      let n = Math.hypot(dx, dz);
      this.x += (dx / n) * this.walkSpeed;
      this.z += (dz / n) * this.walkSpeed;
      if (sign(wx - this.x, 1) === 0 && sign(wz - this.z, 1) === 0) {
        let x = this.path.x;
        let z = this.path.z;
        this.map.visit(x, z);
        this.path = this.path.prev;
        while (this.path === undefined) {
          let tx, tz: number;
          do {
            tx = Math.floor(Math.random() * 4);
            tz = Math.floor(Math.random() * 40);
          } while (x === tx && z === tz);
          this.path = this.map.pathFind(x, z, tx, tz);
          if (this.path !== undefined) this.path = this.path.prev;
        }
      }
    }

    this.animation.update(dt, this);

    let animationBefore = this.animation;
    if (dx < 0) {
      this.animation = this.sideDown.left;
    } else if (dx > 0) {
      this.animation = this.sideDown.right;
    } else if (dx === 0) {
      this.animation = this.down;
    }

    if (this.animation !== animationBefore) this.animation.reset();
  }
}
