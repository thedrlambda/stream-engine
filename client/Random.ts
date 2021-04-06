export class Random {
  constructor(private seed: number) {}
  nextNumber() {
    Math.seedrandom(this.seed);
    let result = Math.random();
    this.seed = Math.random();
    return result;
  }
}
