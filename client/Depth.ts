import { Fluff } from "./Fluff";
import { StaticObject } from "./StaticObject";

export module Depth {
  export interface Type {
    place(
      foregroundFluff: StaticObject[],
      backgroundFluff: StaticObject[],
      tree: Fluff,
      x: number,
      y: number
    ): void;
    place2(
      signs: StaticObject[],
      backgroundFluff: StaticObject[],
      obj: StaticObject
    ): void;
  }
  export class Background implements Type {
    place(
      foregroundFluff: StaticObject[],
      backgroundFluff: StaticObject[],
      tree: Fluff,
      x: number,
      y: number
    ) {
      backgroundFluff.push(new StaticObject(tree.img, x, y));
    }
    place2(
      signs: StaticObject[],
      backgroundFluff: StaticObject[],
      obj: StaticObject
    ) {
      backgroundFluff.push(obj);
    }
  }
  export class Foreground implements Type {
    place(
      foregroundFluff: StaticObject[],
      backgroundFluff: StaticObject[],
      tree: Fluff,
      x: number,
      y: number
    ) {
      foregroundFluff.push(new StaticObject(tree.img, x, y));
    }
    place2(
      signs: StaticObject[],
      backgroundFluff: StaticObject[],
      obj: StaticObject
    ) {
      signs.splice(0, 0, obj);
    }
  }
}
