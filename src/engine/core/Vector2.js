export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  mult(n) {
    return new Vector2(this.x * n, this.y * n);
  }

  div(n) {
    if (n === 0) return new Vector2(0, 0);
    return new Vector2(this.x / n, this.y / n);
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const m = this.mag();
    if (m !== 0) {
      return this.div(m);
    }
    return new Vector2(0, 0);
  }

  dist(v) {
    return v.sub(this).mag();
  }

  static dist(v1, v2) {
    return v1.dist(v2);
  }

  clone() {
    return new Vector2(this.x, this.y);
  }
}
