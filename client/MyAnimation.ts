import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

interface Dir {
  asNumber(): number;
}
export class Left implements Dir {
  asNumber() {
    return -1;
  }
}
export class Right implements Dir {
  asNumber() {
    return 1;
  }
}

interface LoopBehavior {
  handle(handler: LoopBehaviorHandler): void;
}
export class WrapAround implements LoopBehavior {
  handle(handler: LoopBehaviorHandler) {
    handler.handleWrapAround();
  }
}
export class BackAndForth implements LoopBehavior {
  handle(handler: LoopBehaviorHandler) {
    handler.handleBackAndForth();
  }
}

interface PlayMode {
  handle(handler: LoopBehaviorHandler): void;
}
export class PlayOnce implements PlayMode {
  handle(handler: LoopBehaviorHandler) {
    handler.handlePlayOnce();
  }
}
export class Loop implements PlayMode {
  constructor(private reverse: LoopBehavior) {}
  handle(handler: LoopBehaviorHandler) {
    this.reverse.handle(handler);
  }
}

export enum StartPosition {
  FromBeginning,
  Random,
}

interface LoopBehaviorHandler {
  handleBackAndForth(): void;
  handleWrapAround(): void;
  handlePlayOnce(): void;
}

export class MyAnimation<T> implements LoopBehaviorHandler {
  private cursor: number;
  private tickRate: number;
  private toSwitch: number;
  private dir: number;
  private initialDir: number;
  constructor(
    private map: TileMap,
    private t: Point2d,
    private length: number,
    duration: number,
    initial: Dir,
    private shouldLoop: PlayMode,
    randomStart: StartPosition,
    private frameAction: { frameNumber: number; action: (_: T) => void }[]
  ) {
    this.tickRate = duration / length;
    this.initialDir = initial.asNumber();
    this.dir = this.initialDir;
    this.reset();
    this.toSwitch =
      randomStart === StartPosition.Random
        ? this.tickRate * Math.random()
        : this.tickRate;
    this.cursor =
      randomStart === StartPosition.Random
        ? ~~(Math.random() * length)
        : ((1 - this.dir) / 2) * (this.length - 1);
  }
  update(dt: number, self: T) {
    this.toSwitch -= dt;
    while (this.toSwitch < 0) {
      this.cursor += this.dir;
      if (this.dir !== 0)
        this.frameAction
          .filter((x) =>
            this.dir < 0
              ? x.frameNumber + 1 === this.length - this.cursor
              : x.frameNumber === this.cursor
          )
          .forEach((x) => x.action(self));
      if (this.cursor < 0 || this.cursor >= this.length) {
        this.shouldLoop.handle(this);
      }
      this.toSwitch += this.tickRate;
    }
  }
  draw(ctx: MyGraphics, x: number, y: number) {
    this.map.draw(ctx, new Point2d(this.t.x + this.cursor, this.t.y), x, y);
  }
  drawFromBaseLine(ctx: MyGraphics, x: number, y: number) {
    this.map.drawFromBaseLine(
      ctx,
      new Point2d(this.t.x + this.cursor, this.t.y),
      x,
      y
    );
  }
  reset() {
    this.dir = this.initialDir;
    this.cursor = ((1 - this.dir) / 2) * (this.length - 1);
    this.toSwitch = this.tickRate;
  }
  handleBackAndForth() {
    this.dir = -this.dir;
    this.cursor += this.dir * 2;
  }
  handleWrapAround() {
    this.cursor += -this.initialDir * this.length;
  }
  handlePlayOnce() {
    this.cursor -= this.dir;
    this.dir = 0;
  }
  handleLoop() {}
}
