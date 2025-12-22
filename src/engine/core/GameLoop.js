export class GameLoop {
  constructor(updateFn, drawFn) {
    this.updateFn = updateFn;
    this.drawFn = drawFn;
    this.lastTime = 0;
    this.isRunning = false;
    this.animationId = null;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }

  loop = (timestamp) => {
    if (!this.isRunning) return;

    // Calculate delta time in seconds
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Cap dt to prevent explosions if tab is inactive
    const safeDt = Math.min(dt, 0.05);

    this.updateFn(safeDt);
    this.drawFn();

    this.animationId = requestAnimationFrame(this.loop);
  };
}
