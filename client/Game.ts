import { MyGraphics } from "./MyGraphics";

export interface Game {
  handleMouseUp(): void;
  handleMouseDown(): void;
  handleMouseMove(x: number, y: number): void;
  handleKeyDown(key: string): void;
  handleKeyUp(key: string): void;
  draw(g: MyGraphics): void;
  update(dt: number): void;
}
