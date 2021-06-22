import { Game } from "./Game";
import { HexMap } from "./HexMap";
import { HexWorker } from "./HexWorker";
import { MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";
import { TileMap } from "./TileMap";

const HEX_TILES = "assets/hex/tileset.png";
const ANIMATIONS = "assets/hex/animations.png";

export class HexCity implements Game {
  private zoom = 2;
  private map: HexMap;
  private workers: HexWorker[] = [];
  private constructor(tileset: TileMap, animations: TileMap) {
    this.map = new HexMap(tileset);
    for (let i = 0; i < 10; i++)
      this.workers.push(new HexWorker(0, 0, animations, this.map));
  }
  static async initialize() {
    let tileset = new TileMap(await MyImage.load(HEX_TILES), 6, 9, 1);
    let animations = new TileMap(await MyImage.load(ANIMATIONS), 7, 10, 1);

    return new HexCity(tileset, animations);
  }
  draw(canvasGraphics: MyGraphics) {
    canvasGraphics.clear();
    this.map.draw(canvasGraphics);
    this.workers.forEach((w) => w.draw(canvasGraphics, this.zoom));
  }

  update(dt: number) {
    this.workers.forEach((w) => w.update(dt));
  }

  handleMouseUp() {}
  handleMouseDown() {}
  handleMouseMove(x: number, y: number) {}
  handleKeyUp(key: string) {}
  handleKeyDown(key: string) {}
}
