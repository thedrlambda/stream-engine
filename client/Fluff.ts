import { Depth } from "./Depth";
import { MyImage } from "./MyImage";

export type Fluff = {
  img: MyImage;
  hasSpace: (_: boolean[][], x: number, y: number) => boolean;
  foreground?: Depth.Type;
};
