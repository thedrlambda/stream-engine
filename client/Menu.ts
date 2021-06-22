import { Button } from "./Button";
import { Game } from "./Game";
import { HexCity } from "./HexCity";
import { game } from "./index";
import { JumpGuy } from "./JumpGuy";
import { MoneyHealth } from "./MoneyHealth";
import { Mouse } from "./Mouse";
import { MyGraphics } from "./MyGraphics";

export class Menu implements Game {
  private mouse: Mouse;
  private constructor(private zoom: number, private buttons: Button[]) {
    this.mouse = new Mouse();
    this.mouse.registerOnClick((x, y) => {
      this.buttons.forEach((b) => b.actIfHit(x, y));
    });
  }
  static async initialize(canvasGraphics: MyGraphics) {
    let zoom = 2;
    return new Menu(2, [
      new Button(
        "Money Health",
        canvasGraphics.getVerticalCenter(zoom),
        100,
        100,
        20,
        async () => {
          game.value = await MoneyHealth.initialize(canvasGraphics);
        }
      ),
      new Button(
        "Jump prince",
        canvasGraphics.getVerticalCenter(zoom),
        130,
        100,
        20,
        async () => {
          game.value = await JumpGuy.initialize(canvasGraphics);
        }
      ),
      new Button(
        "Hex City",
        canvasGraphics.getVerticalCenter(zoom),
        160,
        100,
        20,
        async () => {
          game.value = await HexCity.initialize();
        }
      ),
    ]);
  }
  draw(canvasGraphics: MyGraphics) {
    canvasGraphics.clear();
    canvasGraphics.setColor("teal");
    this.buttons.forEach((b) => b.draw(canvasGraphics, this.zoom));
  }
  update(dt: number) {}
  handleMouseUp() {
    this.mouse.handleMouseUp();
  }
  handleMouseDown() {
    this.mouse.handleMouseDown();
  }
  handleMouseMove(x: number, y: number) {
    this.mouse.handleMouseMove(x / this.zoom, y / this.zoom);
  }
  handleKeyUp(key: string) {}
  handleKeyDown(key: string) {}
}
