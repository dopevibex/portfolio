export class Loop {
  constructor(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.isRunning = false;
    this.isPaused = false;
    this.animationFrameId = null;
    this.lastTime = 0;

    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.isRunning) {
      this.start();
      return;
    }
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  tick(currentTime) {
    if (!this.isRunning || this.isPaused) return;

    const deltaMs = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Delta time in seconds, clamped to max 0.1s to prevent frame spiral
    const dt = Math.min(deltaMs / 1000, 0.1);

    if (this.updateFn) {
      this.updateFn(dt);
    }

    if (this.renderFn) {
      this.renderFn();
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  }
}
