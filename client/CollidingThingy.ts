export interface CollidingThingy {
  getX(): number;
  getY(): number;
  activate(): void;
  isActive(): boolean;
  onSameLayer(layer: number): boolean;
}
