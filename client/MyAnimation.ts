import { MyGraphics } from "./MyGraphics";
import { Point2d } from "./Point2d";
import { TileMap } from "./TileMap";

interface AnimationActions<T> {
  frameNumber: number;
  action: (_: T) => void;
}

export interface AnimationThing<T> {
  update(dt: number, self: T): void;
  draw(ctx: MyGraphics, x: number, y: number, zoom: number): void;
  drawFromBaseLine(ctx: MyGraphics, x: number, y: number, zoom: number): void;
  reset(): void;
  getCursor(): number;
}

interface LoopingDir<T> {
  handleWrapAround(): number;
  oppositeDirection(): Dir<T>;
  still(): Ticker<T>;
}

interface Dir<T> {
  asNumber(): number;
  reset(): number;
  initialCursor(): number;
  toSwitch(rate: number): number;
  tickRate(): number;
  tick(
    self: T,
    cursor: number,
    ticker: DirHandler<T>,
    ani: TickerHandler<T>
  ): number;
}

interface SuperDir<T> extends Dir<T>, LoopingDir<T> {}

export class Left<T> implements SuperDir<T> {
  constructor(
    private duration: number,
    private len: number,
    private start: StartPosition,
    private shouldLoop: LoopBehavior,
    private frameActions: AnimationActions<T>[]
  ) {}
  oppositeDirection() {
    return new Right(
      this.duration,
      this.len,
      this.start,
      this.shouldLoop,
      this.frameActions
    );
  }
  asNumber() {
    return -1;
  }
  triggerActions(self: T, cursor: number) {
    this.frameActions
      .filter((x) => x.frameNumber + 1 === this.len - cursor)
      .forEach((x) => x.action(self));
  }
  still() {
    return new StillTicker(this.start);
  }
  handleDone(
    cursor: number,
    self: DirHandler<T>,
    ani: TickerHandler<T>
  ): number {
    if (cursor < 0 || cursor >= this.len) {
      return this.shouldLoop.handle(self, this, ani);
    }
    return 0;
  }
  reset() {
    return ((1 - this.asNumber()) / 2) * (this.len - 1);
  }
  handleWrapAround() {
    return -this.asNumber() * this.len;
  }
  initialCursor(): number {
    return this.start.dynamic(this.asNumber(), this.len);
  }
  toSwitch(rate: number) {
    return this.start.toSwitch(rate);
  }
  tickRate() {
    return this.duration / this.len;
  }
  tick(self: T, cursor: number, ticker: DirHandler<T>, ani: TickerHandler<T>) {
    cursor += this.asNumber();
    this.triggerActions(self, cursor);
    cursor += this.handleDone(cursor, ticker, ani);
    return cursor;
  }
}
export class Right<T> implements SuperDir<T> {
  constructor(
    private duration: number,
    private len: number,
    private start: StartPosition,
    private shouldLoop: LoopBehavior,
    private frameActions: AnimationActions<T>[]
  ) {}
  oppositeDirection() {
    return new Left(
      this.duration,
      this.len,
      this.start,
      this.shouldLoop,
      this.frameActions
    );
  }
  asNumber() {
    return 1;
  }
  triggerActions(self: T, cursor: number) {
    this.frameActions
      .filter((x) => x.frameNumber === cursor)
      .forEach((x) => x.action(self));
  }
  still() {
    return new StillTicker(this.start);
  }
  handleDone(
    cursor: number,
    self: DirHandler<T>,
    ani: TickerHandler<T>
  ): number {
    if (cursor < 0 || cursor >= this.len) {
      return this.shouldLoop.handle(self, this, ani);
    }
    return 0;
  }
  reset() {
    return ((1 - this.asNumber()) / 2) * (this.len - 1);
  }
  handleWrapAround() {
    return -this.asNumber() * this.len;
  }
  initialCursor(): number {
    return this.start.dynamic(this.asNumber(), this.len);
  }
  toSwitch(rate: number) {
    return this.start.toSwitch(rate);
  }
  tickRate() {
    return this.duration / this.len;
  }
  tick(self: T, cursor: number, ticker: DirHandler<T>, ani: TickerHandler<T>) {
    cursor += this.asNumber();
    this.triggerActions(self, cursor);
    cursor += this.handleDone(cursor, ticker, ani);
    return cursor;
  }
}

interface LoopBehavior {
  handle<T>(
    dirHandler: DirHandler<T>,
    dir: SuperDir<T>,
    tickerHandler: TickerHandler<T>
  ): number;
}
export class WrapAround implements LoopBehavior {
  handle<T>(
    dirHandler: DirHandler<T>,
    dir: SuperDir<T>,
    tickerHandler: TickerHandler<T>
  ) {
    dirHandler.setDir(dir);
    return dir.handleWrapAround();
  }
}
export class BackAndForth implements LoopBehavior {
  handle<T>(
    dirHandler: DirHandler<T>,
    dir: SuperDir<T>,
    tickerHandler: TickerHandler<T>
  ) {
    dirHandler.setDir(dir.oppositeDirection());
    return dir.asNumber() * 2;
  }
}
export class PlayOnce implements LoopBehavior {
  handle<T>(
    dirHandler: DirHandler<T>,
    dir: SuperDir<T>,
    tickerHandler: TickerHandler<T>
  ) {
    tickerHandler.setTicker(dir.still());
    return -dir.asNumber();
  }
}

export interface StartPosition {
  forStatic(len: number): number;
  dynamic(dirNumber: number, len: number): number;
  toSwitch(rate: number): number;
}
export class FromBeginning implements StartPosition {
  constructor() {}
  forStatic() {
    return 0;
  }
  dynamic(dirNumber: number, len: number) {
    return ((1 - dirNumber) / 2) * (len - 1);
  }
  toSwitch(rate: number) {
    return rate;
  }
}
export class Random implements StartPosition {
  constructor() {}
  forStatic(len: number) {
    return ~~(Math.random() * len);
  }
  dynamic(dirNumber: number, len: number) {
    return ~~(Math.random() * len);
  }
  toSwitch(rate: number) {
    return rate * Math.random();
  }
}

interface DirHandler<T> {
  setDir(newDir: Dir<T>): void;
}

interface TickerHandler<T> {
  setTicker(newTicker: Ticker<T>): void;
}

interface Ticker<T> {
  initialCursor(): number;
  update(dt: number, self: T, cursor: number, ani: TickerHandler<T>): number;
  reset(): number;
}
export class RegularTicker<T> implements Ticker<T>, DirHandler<T> {
  private tickRate: number;
  private toSwitch: number;
  private dir: Dir<T>;
  constructor(private initialDir: Dir<T>) {
    this.dir = this.initialDir;
    this.tickRate = this.dir.tickRate();
    this.toSwitch = this.dir.toSwitch(this.tickRate);
  }
  initialCursor() {
    return this.dir.initialCursor();
  }
  update(dt: number, self: T, cursor: number, ani: TickerHandler<T>) {
    this.toSwitch -= dt;
    while (this.toSwitch < 0) {
      cursor = this.dir.tick(self, cursor, this, ani);
      this.toSwitch += this.tickRate;
    }
    return cursor;
  }
  reset() {
    this.dir = this.initialDir;
    this.toSwitch = this.tickRate;
    return this.dir.reset();
  }
  setDir(newDir: Dir<T>) {
    this.dir = newDir;
  }
}
export class StillTicker<T> implements Ticker<T> {
  constructor(private start: StartPosition) {}
  initialCursor() {
    return this.start.dynamic(0, 1);
  }
  update(dt: number, self: T, cursor: number, ani: TickerHandler<T>) {
    return cursor;
  }
  reset() {
    return 0;
  }
}

export class MyAnimation<T> implements AnimationThing<T>, TickerHandler<T> {
  private cursor: number;
  constructor(
    private map: TileMap,
    private t: Point2d,
    private ticker: Ticker<T>
  ) {
    this.cursor = this.ticker.initialCursor();
  }
  update(dt: number, self: T) {
    this.cursor = this.ticker.update(dt, self, this.cursor, this);
  }
  draw(ctx: MyGraphics, x: number, y: number, zoom: number) {
    this.map.draw(
      ctx,
      new Point2d(this.t.x + this.cursor, this.t.y),
      x,
      y,
      zoom
    );
  }
  drawFromBaseLine(ctx: MyGraphics, x: number, y: number, zoom: number) {
    this.map.drawFromBaseLine(
      ctx,
      new Point2d(this.t.x + this.cursor, this.t.y),
      x,
      y,
      zoom
    );
  }
  reset() {
    this.cursor = this.ticker.reset();
  }
  setTicker(newTicker: Ticker<T>) {
    this.ticker = newTicker;
  }
  getCursor() {
    return this.cursor;
  }
}
