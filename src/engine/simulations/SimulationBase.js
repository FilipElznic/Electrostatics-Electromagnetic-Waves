export class SimulationBase {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.entities = [];
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  update(dt) {
    // Override this in child classes
  }

  draw(ctx) {
    // Override this in child classes
  }

  destroy() {
    // Cleanup listeners if needed
  }
}
