import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

interface AnimationActions<T> {
  frameNumber: number;
  action: (_: T) => void;
}

export interface AnimationThing<T> {
  update(dt: number, self: T): void;
  draw(ctx: MyGraphics, x: number, y: number): void;
  drawFromBaseLine(ctx: MyGraphics, x: number, y: number): void;
  reset(): void;
}

interface LoopingDir {
  handleWrapAround(): number;
  oppositeDirection(): Dir;
  still(): Dir;
}

interface Dir {
  asNumber(): number;
  triggerActions<T>(
    self: T,
    frameAction: AnimationActions<T>[],
    cursor: number
  ): void;
  handleDone(cursor: number, self: LoopBehaviorHandler): void;
  reset(): number;
  initialCursor(): number;
  toSwitch(rate: number): number;
  tickRate(): number;
}

interface SuperDir extends Dir, LoopingDir {}

export class Left implements SuperDir {
  constructor(
    private len: number,
    private start: StartPosition,
    private shouldLoop: LoopBehavior
  ) {}
  oppositeDirection() {
    return new Right(this.len, this.start, this.shouldLoop);
  }
  asNumber() {
    return -1;
  }
  triggerActions<T>(
    self: T,
    frameAction: AnimationActions<T>[],
    cursor: number
  ) {
    frameAction
      .filter((x) => x.frameNumber + 1 === this.len - cursor)
      .forEach((x) => x.action(self));
  }
  still() {
    return new Still(this.start);
  }
  handleDone(cursor: number, self: LoopBehaviorHandler) {
    if (cursor < 0 || cursor >= this.len) {
      this.shouldLoop.handle(self, this);
    }
  }
  reset() {
    return ((1 - this.asNumber()) / 2) * (this.len - 1);
  }
  handleWrapAround() {
    return -this.asNumber() * this.len;
  }
  initialCursor(): number {
    return this.start.dynamic(this, this.len);
  }
  toSwitch(rate: number) {
    return this.start.toSwitch(rate);
  }
  tickRate() {
    return this.start.tickRate(this.len);
  }
}
export class Still implements Dir {
  constructor(private start: StartPosition) {}
  asNumber() {
    return 0;
  }
  triggerActions<T>(
    self: T,
    frameAction: AnimationActions<T>[],
    cursor: number
  ) {}
  handleDone(cursor: number, self: LoopBehaviorHandler) {}
  reset() {
    return 0;
  }
  initialCursor() {
    return this.start.dynamic(this, 1);
  }
  toSwitch(rate: number) {
    return this.start.toSwitch(rate);
  }
  tickRate() {
    return this.start.tickRate(1);
  }
}
export class Right implements SuperDir {
  constructor(
    private len: number,
    private start: StartPosition,
    private shouldLoop: LoopBehavior
  ) {}
  oppositeDirection() {
    return new Left(this.len, this.start, this.shouldLoop);
  }
  asNumber() {
    return 1;
  }
  triggerActions<T>(
    self: T,
    frameAction: AnimationActions<T>[],
    cursor: number
  ) {
    frameAction
      .filter((x) => x.frameNumber === cursor)
      .forEach((x) => x.action(self));
  }
  still() {
    return new Still(this.start);
  }
  handleDone(cursor: number, self: LoopBehaviorHandler) {
    if (cursor < 0 || cursor >= this.len) {
      this.shouldLoop.handle(self, this);
    }
  }
  reset() {
    return ((1 - this.asNumber()) / 2) * (this.len - 1);
  }
  handleWrapAround() {
    return -this.asNumber() * this.len;
  }
  initialCursor() {
    return this.start.dynamic(this, this.len);
  }
  toSwitch(rate: number) {
    return this.start.toSwitch(rate);
  }
  tickRate() {
    return this.start.tickRate(this.len);
  }
}

interface LoopBehavior {
  handle(handler: LoopBehaviorHandler, dir: SuperDir): void;
}
export class WrapAround implements LoopBehavior {
  handle(handler: LoopBehaviorHandler, dir: SuperDir) {
    handler.setDirAndCursor(dir, dir.handleWrapAround());
  }
}
export class BackAndForth implements LoopBehavior {
  handle(handler: LoopBehaviorHandler, dir: SuperDir) {
    handler.setDirAndCursor(dir.oppositeDirection(), dir.asNumber() * 2);
  }
}
export class PlayOnce implements LoopBehavior {
  handle(handler: LoopBehaviorHandler, dir: SuperDir) {
    handler.setDirAndCursor(dir.still(), -dir.asNumber());
  }
}

export interface StartPosition {
  forStatic(len: number): number;
  dynamic(dir: Dir, len: number): number;
  toSwitch(rate: number): number;
  tickRate(len: number): number;
}
export class FromBeginning implements StartPosition {
  constructor(private duration: number) {}
  forStatic() {
    return 0;
  }
  dynamic(dir: Dir, len: number) {
    return ((1 - dir.asNumber()) / 2) * (len - 1);
  }
  toSwitch(rate: number) {
    return rate;
  }
  tickRate(len: number) {
    return this.duration / len;
  }
}
export class Random implements StartPosition {
  constructor(private duration: number) {}
  forStatic(len: number) {
    return ~~(Math.random() * len);
  }
  dynamic(dir: Dir, len: number) {
    return ~~(Math.random() * len);
  }
  toSwitch(rate: number) {
    return rate * Math.random();
  }
  tickRate(len: number) {
    return this.duration / len;
  }
}

interface LoopBehaviorHandler {
  setDirAndCursor(newDir: Dir, cursorOffset: number): void;
}

export class MyAnimation<T> implements AnimationThing<T>, LoopBehaviorHandler {
  private tickRate: number;
  private toSwitch: number;

  private cursor: number;
  private dir: Dir;
  constructor(
    private map: TileMap,
    private t: Point2d,
    private initialDir: Dir,
    private frameActions: AnimationActions<T>[]
  ) {
    this.dir = this.initialDir;
    this.cursor = this.dir.initialCursor();
    this.tickRate = this.dir.tickRate();
    this.toSwitch = this.dir.toSwitch(this.tickRate);
  }
  update(dt: number, self: T) {
    this.toSwitch -= dt;
    while (this.toSwitch < 0) {
      this.cursor += this.dir.asNumber();
      this.dir.triggerActions(self, this.frameActions, this.cursor);
      this.dir.handleDone(this.cursor, this);
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
    this.cursor = this.dir.reset();
    this.toSwitch = this.tickRate;
  }
  setDirAndCursor(newDir: Dir, cursorOffset: number) {
    this.dir = newDir;
    this.cursor += cursorOffset;
  }
}
