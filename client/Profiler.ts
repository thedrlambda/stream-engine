export class Profiler {
  private sections: { [key: string]: number[] } = {};
  private last = Date.now();
  private lastName: string | undefined;
  constructor() {}
  tick(section?: string) {
    let current = Date.now();
    let duration = current - this.last;
    if (this.lastName !== undefined) {
      if (this.sections[this.lastName] === undefined)
        this.sections[this.lastName] = [];
      this.sections[this.lastName].push(duration);
      if (this.sections[this.lastName].length > 10)
        this.sections[this.lastName].splice(
          0,
          this.sections[this.lastName].length - 10
        );
    }
    this.lastName = section;
    this.last = Date.now();
  }
  print() {
    Object.keys(this.sections).forEach((section) => {
      console.log(section, this.sections[section].avg());
    });
  }
}
