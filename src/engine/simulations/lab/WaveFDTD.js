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
    this.dt = 0.1; // Time step (Slowed down)

    // Source
    this.frequency = 0.3; // Higher frequency for "Laser" look
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

    // Mirror Objects
    this.mirrors = [];
    this.onMirrorPlaced = null;

    // Initialize Maze Level
    this.generateMaze();

    // Rendering
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = this.cols;
    this.offscreenCanvas.height = this.rows;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    this.imageData = this.offscreenCtx.createImageData(this.cols, this.rows);

    // Input State
    this.isDrawing = false;
    this.drawMode = 0; // 0 = None, 1 = Paint, 2 = Erase
    this.currentMaterial = 1; // 1 = Metal, 2 = Absorber
    this.drawAngle = 0; // 0, 45, 90, 135

    // Setup Listeners
    this.input.on("mousedown", (e) => this.handleMouseDown(e));
    this.input.on("mouseup", () => this.handleMouseUp());
    this.input.on("mousemove", (e) => this.handleMouseMove(e));
    this.input.on("keydown", (code) => {
      if (code === "KeyR") {
        this.rotateBrush();
      }
    });
  }

  rotateBrush() {
    this.drawAngle = (this.drawAngle + 45) % 180;
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

    this.generateMaze();
  }

  setMirrors(mirrors) {
    this.mirrors = mirrors;
  }

  handleMouseDown(e) {
    this.isDrawing = true;
    // Left click (0) = Place Mirror, Right click (2) = Erase (Not implemented yet)
    if (e.button === 0) {
      this.placeMirror(e.pos);
    }
  }

  handleMouseUp() {
    this.isDrawing = false;
  }

  handleMouseMove(e) {
    // No drag painting for mirrors
  }

  setMaterial(type) {
    this.currentMaterial = type;
  }

  placeMirror(pos) {
    // Convert screen pos to grid pos
    const gx = Math.floor(pos.x / this.scale);
    const gy = Math.floor(pos.y / this.scale);

    if (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows) {
      const newMirror = {
        id: Date.now(),
        x: gx,
        y: gy,
        angle: this.drawAngle,
        length: 15, // Fixed size
      };

      if (this.onMirrorPlaced) {
        this.onMirrorPlaced(newMirror);
      }
    }
  }

  // Removed paintBrush and paint logic as we use objects now

  drawLine(x0, y0, x1, y1, mat) {
    // Bresenham's Line Algorithm
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.drawThickPoint(x0, y0, mat);

      if (x0 === x1 && y0 === y1) break;
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  drawThickPoint(gx, gy, mat) {
    const brushSize = 1; // 3x3 block for thicker walls
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
          const nIdx = nx + ny * this.cols;
          // Constraint: Cannot overwrite Absorber (2)
          if (this.walls[nIdx] !== 2) {
            this.walls[nIdx] = mat;
            if (mat === 1) {
              this.Ez[nIdx] = 0;
              this.Hx[nIdx] = 0;
              this.Hy[nIdx] = 0;
            }
          }
        }
      }
    }
  }

  update() {
    const steps = 1;

    // 0. Rasterize Mirrors
    // Clear Metal (1) cells first
    for (let i = 0; i < this.walls.length; i++) {
      if (this.walls[i] === 1) {
        this.walls[i] = 0;
      }
    }

    // Draw all placed mirrors
    for (const mirror of this.mirrors) {
      const angleRad = (mirror.angle * Math.PI) / 180;
      const dx = Math.cos(angleRad) * (mirror.length / 2);
      const dy = Math.sin(angleRad) * (mirror.length / 2);

      const x0 = Math.round(mirror.x - dx);
      const y0 = Math.round(mirror.y - dy);
      const x1 = Math.round(mirror.x + dx);
      const y1 = Math.round(mirror.y + dy);

      this.drawLine(x0, y0, x1, y1, 1); // 1 = Metal
    }

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
          const mat = this.walls[idx];

          if (mat === 1) {
            // Metal: Perfect reflection
            this.Ez[idx] = 0;
            continue;
          }

          const hx_curr = this.Hx[idx];
          const hx_up = this.Hx[idx - this.cols];
          const hy_curr = this.Hy[idx];
          const hy_left = this.Hy[idx - 1];

          this.Ez[idx] += 0.5 * (hy_curr - hy_left - (hx_curr - hx_up));

          if (mat === 2) {
            // Absorber: Damping
            this.Ez[idx] *= 0.9;
          }
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
      const mat = this.walls[i];
      const pixelIdx = i * 4;

      if (mat === 1) {
        // Metal: Silver/White
        data[pixelIdx] = 200; // R
        data[pixelIdx + 1] = 200; // G
        data[pixelIdx + 2] = 200; // B
        data[pixelIdx + 3] = 255; // A
      } else if (mat === 2) {
        // Absorber: Dark Grey
        data[pixelIdx] = 50; // R
        data[pixelIdx + 1] = 50; // G
        data[pixelIdx + 2] = 50; // B
        data[pixelIdx + 3] = 255; // A
      } else {
        // Heatmap: Green Laser Look
        // Map intensity to Green channel
        const intensity = Math.min(Math.abs(val) * 1200, 255);

        data[pixelIdx] = 0; // R
        data[pixelIdx + 1] = intensity; // G (Bright Green)
        data[pixelIdx + 2] = intensity * 0.2; // B (Slight tint)
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

    // Draw Ghost Line (Preview)
    const mousePos = this.input.getMousePos();
    if (mousePos.x > 0 && mousePos.y > 0) {
      const length = 15 * this.scale; // Fixed size 15
      const angleRad = (this.drawAngle * Math.PI) / 180;
      const dx = Math.cos(angleRad) * (length / 2);
      const dy = Math.sin(angleRad) * (length / 2);

      ctx.beginPath();
      ctx.moveTo(mousePos.x - dx, mousePos.y - dy);
      ctx.lineTo(mousePos.x + dx, mousePos.y + dy);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw UI hints
    ctx.fillStyle = "white";
    ctx.font = "14px monospace";
    ctx.fillText(
      `Left Click: Place Mirror | 'R': Rotate (${this.drawAngle}°) | Mirrors: ${this.mirrors.length}`,
      20,
      this.height - 20
    );
  }

  setFrequency(f) {
    this.frequency = f;
  }

  resetWalls() {
    // Only clear user-placed Metal (1), keep Maze (2)
    for (let i = 0; i < this.walls.length; i++) {
      if (this.walls[i] === 1) {
        this.walls[i] = 0;
      }
    }
    // Also clear fields to prevent artifacts
    this.Ez.fill(0);
    this.Hx.fill(0);
    this.Hy.fill(0);
    this.signalStrength = 0;
  }

  generateMaze() {
    // Clear grid
    this.walls.fill(0);

    // Define Play Area (Centered Box)
    const marginX = Math.floor(this.cols * 0.2);
    const marginY = Math.floor(this.rows * 0.2);
    const playW = this.cols - 2 * marginX;
    const playH = this.rows - 2 * marginY;

    // Draw Outer Walls (Absorber) - Fill everything outside play area
    // Top Block
    this.drawRect(0, 0, this.cols, marginY, 2);
    // Bottom Block
    this.drawRect(0, this.rows - marginY, this.cols, marginY, 2);
    // Left Block
    this.drawRect(0, marginY, marginX, playH, 2);
    // Right Block
    this.drawRect(this.cols - marginX, marginY, marginX, playH, 2);

    // Generate Recursive Division Maze inside the Play Area
    this.recursiveDivision(marginX, marginY, playW, playH);

    // Set Source (Top-Left of Play Area) and Target (Bottom-Right of Play Area)
    this.sourcePos = { x: marginX + 10, y: marginY + 10 };
    this.targetPos = {
      x: this.cols - marginX - 10,
      y: this.rows - marginY - 10,
    };

    // Clear areas around Source and Target
    this.drawRect(marginX + 2, marginY + 2, 20, 20, 0);
    this.drawRect(
      this.cols - marginX - 22,
      this.rows - marginY - 22,
      20,
      20,
      0
    );
  }

  recursiveDivision(x, y, w, h) {
    // Stop if the area is too small (Increased threshold for simpler maze)
    if (w < 40 || h < 40) return;

    // Decide split direction
    let splitHorizontal = Math.random() > 0.5;
    if (w > h * 1.5) splitHorizontal = false;
    else if (h > w * 1.5) splitHorizontal = true;

    if (splitHorizontal) {
      // Horizontal Wall
      const wallY = Math.floor(y + 10 + Math.random() * (h - 20));
      this.drawRect(x, wallY, w, 2, 2); // Thickness 2

      // Create a Gap
      const gapX = Math.floor(x + Math.random() * (w - 15));
      this.drawRect(gapX, wallY, 15, 2, 0); // Clear gap (Air)

      // Recurse
      this.recursiveDivision(x, y, w, wallY - y);
      this.recursiveDivision(x, wallY + 2, w, y + h - wallY - 2);
    } else {
      // Vertical Wall
      const wallX = Math.floor(x + 10 + Math.random() * (w - 20));
      this.drawRect(wallX, y, 2, h, 2); // Thickness 2

      // Create a Gap
      const gapY = Math.floor(y + Math.random() * (h - 15));
      this.drawRect(wallX, gapY, 2, 15, 0); // Clear gap (Air)

      // Recurse
      this.recursiveDivision(x, y, wallX - x, h);
      this.recursiveDivision(wallX + 2, y, x + w - wallX - 2, h);
    }
  }

  drawRect(x, y, w, h, mat) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const px = x + i;
        const py = y + j;
        if (px >= 0 && px < this.cols && py >= 0 && py < this.rows) {
          this.walls[px + py * this.cols] = mat;
        }
      }
    }
  }

  destroy() {
    this.input.destroy();
  }
}
