import { Game } from "./Game";
import { HexBuilding, Sawmill, WoodCutter } from "./HexBuilding";
import { HexMap } from "./HexMap";
import { HexWorker } from "./HexWorker";
import { MyGraphics } from "./MyGraphics";
import { MyImage } from "./MyImage";
import { TileMap } from "./TileMap";

const HEX_TILES = "assets/hex/tileset.png";
const ANIMATIONS = "assets/hex/animations.png";
const ITEMS = "assets/hex/items.png";

export class HexCity implements Game {
  private zoom = 2;
  private map: HexMap;
  private workers: HexWorker[] = [];
  private buildings: HexBuilding[] = [];
  private constructor(tileSet: TileMap, animations: TileMap, items: TileMap) {
    this.map = new HexMap(tileSet);
    for (let i = 0; i < 10; i++)
      this.workers.push(new HexWorker(0, 0, animations, this.map, items));
    this.buildings.push(new HexBuilding(1, 5, new WoodCutter(tileSet)));
    this.buildings.push(new HexBuilding(4, 25, new Sawmill(tileSet)));
  }
  static async initialize() {
    let tileSet = new TileMap(await MyImage.load(HEX_TILES), 6, 9, 1);
    let animations = new TileMap(await MyImage.load(ANIMATIONS), 7, 10, 1);
    let items = new TileMap(await MyImage.load(ITEMS), 4, 4, 1);

    return new HexCity(tileSet, animations, items);
  }
  draw(canvasGraphics: MyGraphics) {
    canvasGraphics.clear();
    this.map.draw(canvasGraphics);
    this.workers.forEach((w) => w.draw(canvasGraphics, this.zoom));
    this.buildings.forEach((w) => w.draw(canvasGraphics, this.zoom));
  }

  update(dt: number) {
    this.workers.forEach((w) => w.update(dt));
    this.buildings.forEach((w) => w.update(dt, this.workers));
  }

  handleMouseUp() {}
  handleMouseDown() {}
  handleMouseMove(x: number, y: number) {}
  handleKeyUp(key: string) {}
  handleKeyDown(key: string) {}
}
