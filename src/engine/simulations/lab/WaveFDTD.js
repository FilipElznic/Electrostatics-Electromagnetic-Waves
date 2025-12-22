import { SimulationBase } from "../SimulationBase";
import { Input } from "../../core/Input";
import { Vector2 } from "../../core/Vector2";

export class WaveFDTD extends SimulationBase {
  constructor(width, height, canvas) {
    super(width, height);
    this.canvas = canvas;
    this.input = new Input(canvas);

    // Simulation Resolution (Downscale for performance)
    this.scale = 4;
    this.cols = Math.ceil(width / this.scale);
    this.rows = Math.ceil(height / this.scale);

    // Physics Constants
    // Courant number S = c * dt / dx <= 1/sqrt(2) for 2D
    // Let c = 0.5 (simulation units), dx = 1
    // dt <= dx / (c * sqrt(2)) ~= 1 / (0.5 * 1.414) ~= 1.414
    // We choose conservative values
    this.c = 0.5;
    this.dx = 1;
    this.dt = 0.5; // Time step

    // Source
    this.frequency = 0.2;
    this.time = 0;
    this.sourcePos = {
      x: Math.floor(this.cols / 2),
      y: Math.floor(this.rows / 2),
    };

    // Target (Receiver)
    this.targetPos = {
      x: Math.floor(this.cols * 0.8),
      y: Math.floor(this.rows * 0.5),
    };
    this.signalStrength = 0;
    this.onSignalUpdate = null;

    // Arrays (Float32 for performance)
    const size = this.cols * this.rows;
    this.Ez = new Float32Array(size);
    this.Hx = new Float32Array(size);
    this.Hy = new Float32Array(size);

    // Material Grid (0 = Air, 1 = Metal/Wall)
    this.walls = new Uint8Array(size);

    // Rendering
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = this.cols;
    this.offscreenCanvas.height = this.rows;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    this.imageData = this.offscreenCtx.createImageData(this.cols, this.rows);

    // Input State
    this.isDrawing = false;
    this.drawMode = 0; // 0 = None, 1 = Wall, 2 = Erase

    // Setup Listeners
    this.input.on("mousedown", (e) => this.handleMouseDown(e));
    this.input.on("mouseup", () => this.handleMouseUp());
    this.input.on("mousemove", (e) => this.handleMouseMove(e));
  }

  resize(w, h) {
    // Re-initializing on resize is destructive but simplest for grid
    this.width = w;
    this.height = h;
    this.cols = Math.ceil(w / this.scale);
    this.rows = Math.ceil(h / this.scale);

    const size = this.cols * this.rows;
    this.Ez = new Float32Array(size);
    this.Hx = new Float32Array(size);
    this.Hy = new Float32Array(size);
    this.walls = new Uint8Array(size);

    this.offscreenCanvas.width = this.cols;
    this.offscreenCanvas.height = this.rows;
    this.imageData = this.offscreenCtx.createImageData(this.cols, this.rows);

    this.sourcePos = {
      x: Math.floor(this.cols / 2),
      y: Math.floor(this.rows / 2),
    };
    this.targetPos = {
      x: Math.floor(this.cols * 0.8),
      y: Math.floor(this.rows * 0.5),
    };
  }

  handleMouseDown(e) {
    this.isDrawing = true;
    // Left click (0) = Wall, Right click (2) = Erase
    this.drawMode = e.button === 2 ? 2 : 1;
    this.paint(e.pos);
  }

  handleMouseUp() {
    this.isDrawing = false;
    this.drawMode = 0;
  }

  handleMouseMove(e) {
    if (this.isDrawing) {
      this.paint(e);
    }
  }

  paint(pos) {
    // Convert screen pos to grid pos
    const gx = Math.floor(pos.x / this.scale);
    const gy = Math.floor(pos.y / this.scale);

    if (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows) {
      const idx = gx + gy * this.cols;
      // Draw a small brush
      const brushSize = 2;
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
            const nIdx = nx + ny * this.cols;
            this.walls[nIdx] = this.drawMode === 1 ? 1 : 0;
            // If wall, zero out fields immediately
            if (this.drawMode === 1) {
              this.Ez[nIdx] = 0;
              this.Hx[nIdx] = 0;
              this.Hy[nIdx] = 0;
            }
          }
        }
      }
    }
  }

  update(dt) {
    // FDTD Loop
    // We might run multiple sub-steps per frame for stability/speed
    const steps = 2;

    for (let s = 0; s < steps; s++) {
      this.time += this.dt;

      // 1. Update Magnetic Fields (Hx, Hy)
      // Hx(i, j) depends on Ez(i, j) - Ez(i, j+1)
      // Hy(i, j) depends on Ez(i+1, j) - Ez(i, j)
      for (let y = 0; y < this.rows - 1; y++) {
        for (let x = 0; x < this.cols - 1; x++) {
          const idx = x + y * this.cols;

          // Standard FDTD update
          // Hx += - (dt/dx) * (Ez(y+1) - Ez(y))
          // Hy +=   (dt/dx) * (Ez(x+1) - Ez(x))

          // Simple absorbing boundary (do nothing at edges or handle implicitly)

          const ez_curr = this.Ez[idx];
          const ez_right = this.Ez[idx + 1];
          const ez_down = this.Ez[idx + this.cols];

          this.Hx[idx] -= 0.5 * (ez_down - ez_curr);
          this.Hy[idx] += 0.5 * (ez_right - ez_curr);
        }
      }

      // 2. Update Electric Field (Ez)
      // Ez(i, j) depends on Hy(i, j) - Hy(i-1, j) - (Hx(i, j) - Hx(i, j-1))
      for (let y = 1; y < this.rows - 1; y++) {
        for (let x = 1; x < this.cols - 1; x++) {
          const idx = x + y * this.cols;

          if (this.walls[idx] === 1) {
            this.Ez[idx] = 0;
            continue;
          }

          const hx_curr = this.Hx[idx];
          const hx_up = this.Hx[idx - this.cols];
          const hy_curr = this.Hy[idx];
          const hy_left = this.Hy[idx - 1];

          this.Ez[idx] += 0.5 * (hy_curr - hy_left - (hx_curr - hx_up));
        }
      }

      // 3. Source
      const sourceIdx = this.sourcePos.x + this.sourcePos.y * this.cols;
      this.Ez[sourceIdx] += Math.sin(this.time * this.frequency);

      // 4. Target Detection
      const targetIdx = this.targetPos.x + this.targetPos.y * this.cols;
      const signal = Math.abs(this.Ez[targetIdx]);

      // Smooth accumulation
      if (signal > 0.1) {
        this.signalStrength = Math.min(100, this.signalStrength + 0.5);
      } else {
        this.signalStrength = Math.max(0, this.signalStrength - 0.2);
      }
    }

    if (this.onSignalUpdate) {
      this.onSignalUpdate(this.signalStrength);
    }
  }

  draw(ctx) {
    const data = this.imageData.data;
    const size = this.cols * this.rows;

    for (let i = 0; i < size; i++) {
      const val = this.Ez[i];
      const isWall = this.walls[i] === 1;
      const pixelIdx = i * 4;

      if (isWall) {
        data[pixelIdx] = 100; // R
        data[pixelIdx + 1] = 100; // G
        data[pixelIdx + 2] = 100; // B
        data[pixelIdx + 3] = 255; // A
      } else {
        // Heatmap: Red (+), Blue (-), Black (0)
        // Clamp value for display
        const intensity = Math.min(Math.abs(val) * 200, 255);

        if (val > 0) {
          data[pixelIdx] = intensity; // R
          data[pixelIdx + 1] = 0; // G
          data[pixelIdx + 2] = 0; // B
        } else {
          data[pixelIdx] = 0; // R
          data[pixelIdx + 1] = 0; // G
          data[pixelIdx + 2] = intensity; // B
        }
        data[pixelIdx + 3] = 255; // Alpha
      }
    }

    // Put data to offscreen canvas
    this.offscreenCtx.putImageData(this.imageData, 0, 0);

    // Draw scaled up to main canvas
    ctx.imageSmoothingEnabled = false; // Keep pixels sharp
    ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);

    // Draw Target
    const tx = this.targetPos.x * this.scale;
    const ty = this.targetPos.y * this.scale;

    ctx.beginPath();
    ctx.arc(tx, ty, 10, 0, Math.PI * 2);
    // Glow based on signal
    const glow = this.signalStrength / 100;
    ctx.fillStyle = `rgba(0, 255, 0, ${0.2 + glow * 0.8})`;
    ctx.shadowBlur = 10 + glow * 20;
    ctx.shadowColor = "#00ff00";
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw UI hints
    ctx.fillStyle = "white";
    ctx.font = "14px monospace";
    ctx.fillText(
      "Left Click: Draw Wall | Right Click: Erase",
      20,
      this.height - 20
    );
  }

  setFrequency(f) {
    this.frequency = f;
  }

  resetWalls() {
    this.walls.fill(0);
    // Also clear fields to prevent artifacts
    this.Ez.fill(0);
    this.Hx.fill(0);
    this.Hy.fill(0);
    this.signalStrength = 0;
  }

  destroy() {
    this.input.destroy();
  }
}
