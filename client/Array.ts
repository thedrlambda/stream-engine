interface Array<T> {
  avg(): number;
}
Array.prototype.avg = function () {
  return this.reduce((a, x) => a + x, 0) / this.length;
};
