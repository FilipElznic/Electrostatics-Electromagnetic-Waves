import { SimulationBase } from "../SimulationBase";
import { Input } from "../../core/Input";
import { Vector2 } from "../../core/Vector2";

// Helper for line intersection
function getLineIntersection(p0, p1, p2, p3) {
  const s1_x = p1.x - p0.x;
  const s1_y = p1.y - p0.y;
  const s2_x = p3.x - p2.x;
  const s2_y = p3.y - p2.y;

  const s =
    (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) /
    (-s2_x * s1_y + s1_x * s2_y);
  const t =
    (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) /
    (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return {
      x: p0.x + t * s1_x,
      y: p0.y + t * s1_y,
      t: t,
    };
  }
  return null;
}

export class WaveFDTD extends SimulationBase {
  constructor(width, height, canvas) {
    super(width, height);
    this.canvas = canvas;
    this.input = new Input(canvas);

    // Simulation Resolution
    this.scale = 2;
    this.cols = Math.ceil(width / this.scale);
    this.rows = Math.ceil(height / this.scale);

    // Laser State
    this.laserPath = [];
    this.maxBounces = 20;
    this.maxDistance = 2000;

    // Source & Target
    this.sourcePos = { x: 50, y: 50 }; // Will be set by maze
    this.targetPos = { x: 100, y: 100 };
    this.targetRadius = 15;
    this.signalStrength = 0;
    this.onSignalUpdate = null;

    // Grid for Walls (Maze)
    // 0 = Air, 1 = Metal (Not used for mirrors anymore), 2 = Wall/Absorber
    this.walls = new Uint8Array(this.cols * this.rows);

    // Mirrors (Vector Objects)
    this.mirrors = [];
    this.onMirrorPlaced = null;

    // Input State
    this.isDrawing = false;
    this.drawAngle = 0; // 0, 45, 90, 135

    // Optimization: Only update laser when needed
    this.needsUpdate = true;

    // Initialize Maze Level
    this.generateMaze();

    // Rendering
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = this.width; // Use full resolution for crisp walls
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d");

    // Render static world once
    this.renderStaticWorld();

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
    this.width = w;
    this.height = h;
    this.cols = Math.ceil(w / this.scale);
    this.rows = Math.ceil(h / this.scale);
    this.walls = new Uint8Array(this.cols * this.rows);

    this.offscreenCanvas.width = w;
    this.offscreenCanvas.height = h;

    this.generateMaze();
    this.renderStaticWorld();
    this.needsUpdate = true;
  }

  setMirrors(mirrors) {
    this.mirrors = mirrors;
    this.needsUpdate = true;
  }

  handleMouseDown(e) {
    this.isDrawing = true;
    if (e.button === 0) {
      this.placeMirror(e.pos);
    }
  }

  handleMouseUp() {
    this.isDrawing = false;
  }

  handleMouseMove(e) {
    // No drag painting
  }

  setMaterial(type) {
    // Not used in raycasting mode
  }

  placeMirror(pos) {
    const gx = Math.floor(pos.x / this.scale);
    const gy = Math.floor(pos.y / this.scale);

    if (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows) {
      // Check if placing on wall
      if (this.walls[gx + gy * this.cols] === 2) return;

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

  resetWalls() {
    // Only clear user-placed mirrors (handled by App.jsx via setMirrors([]))
    this.signalStrength = 0;
    this.needsUpdate = true;
  }

  regenerateLevel() {
    this.generateMaze();
    this.renderStaticWorld();
    this.signalStrength = 0;
    this.needsUpdate = true;
  }

  renderStaticWorld() {
    // Draw static walls to offscreen canvas
    const ctx = this.offscreenCtx;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "#444";
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.walls[x + y * this.cols] === 2) {
          ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
        }
      }
    }
  }

  update() {
    if (!this.needsUpdate) return;

    this.calculateLaser();
    this.needsUpdate = false;
  }

  calculateLaser() {
    // 1. Clear previous path
    this.laserPath = [];

    // 2. Calculate Ray
    // Start slightly offset from source to avoid self-collision if source was a mirror
    let rayOrigin = {
      x: this.sourcePos.x * this.scale,
      y: this.sourcePos.y * this.scale,
    };
    let rayDir = { x: 1, y: 0 }; // Initial direction (Right)

    // Add start point
    this.laserPath.push({ ...rayOrigin });

    let hitTarget = false;

    for (let b = 0; b < this.maxBounces; b++) {
      // Find closest hit
      let hit = this.castRay(rayOrigin, rayDir);

      if (hit) {
        this.laserPath.push(hit.point);

        // Check if this segment hits target
        if (this.checkTargetHit(rayOrigin, hit.point)) {
          hitTarget = true;
        }

        if (hit.type === "mirror") {
          // Reflect: R = D - 2(D.N)N
          const dot = rayDir.x * hit.normal.x + rayDir.y * hit.normal.y;
          rayDir = {
            x: rayDir.x - 2 * dot * hit.normal.x,
            y: rayDir.y - 2 * dot * hit.normal.y,
          };

          // Normalize (just in case)
          const len = Math.sqrt(rayDir.x * rayDir.x + rayDir.y * rayDir.y);
          rayDir.x /= len;
          rayDir.y /= len;

          rayOrigin = hit.point;
          // Nudge slightly
          rayOrigin.x += rayDir.x * 0.1;
          rayOrigin.y += rayDir.y * 0.1;
        } else {
          // Wall - Stop
          break;
        }
      } else {
        // No hit - extend to max dist
        const endPoint = {
          x: rayOrigin.x + rayDir.x * this.maxDistance,
          y: rayOrigin.y + rayDir.y * this.maxDistance,
        };
        this.laserPath.push(endPoint);

        if (this.checkTargetHit(rayOrigin, endPoint)) {
          hitTarget = true;
        }
        break;
      }
    }

    // Update Signal
    if (hitTarget) {
      this.signalStrength = 100;
    } else {
      this.signalStrength = 0;
    }

    if (this.onSignalUpdate) {
      this.onSignalUpdate(this.signalStrength);
    }
  }

  checkTargetHit(p1, p2) {
    // Distance from point to line segment
    const tx = this.targetPos.x * this.scale;
    const ty = this.targetPos.y * this.scale;

    const l2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
    if (l2 === 0) return false;

    let t = ((tx - p1.x) * (p2.x - p1.x) + (ty - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const px = p1.x + t * (p2.x - p1.x);
    const py = p1.y + t * (p2.y - p1.y);

    const dist = Math.sqrt((tx - px) ** 2 + (ty - py) ** 2);
    return dist < this.targetRadius;
  }

  castRay(origin, dir) {
    let closestHit = null;
    let minDist = Infinity;

    // 1. Check Mirrors (Line Segments)
    for (const m of this.mirrors) {
      const angleRad = (m.angle * Math.PI) / 180;
      const dx = Math.cos(angleRad) * (m.length / 2) * this.scale; // Scale length
      const dy = Math.sin(angleRad) * (m.length / 2) * this.scale;

      const mx = m.x * this.scale;
      const my = m.y * this.scale;

      const p1 = { x: mx - dx, y: my - dy };
      const p2 = { x: mx + dx, y: my + dy };

      // Normal vector (-dy, dx) normalized
      let nx = -dy;
      let ny = dx;
      const len = Math.sqrt(nx * nx + ny * ny);
      nx /= len;
      ny /= len;

      // Ray is infinite line for intersection check, but we limit t
      // p3 = origin + dir * maxDist
      const p3 = { x: origin.x + dir.x * 2000, y: origin.y + dir.y * 2000 };

      const hit = getLineIntersection(p1, p2, origin, p3);
      if (hit) {
        // Calculate distance
        const d = Math.sqrt((hit.x - origin.x) ** 2 + (hit.y - origin.y) ** 2);
        if (d < minDist && d > 0.1) {
          // Avoid self-intersection
          minDist = d;
          closestHit = {
            point: { x: hit.x, y: hit.y },
            normal: { x: nx, y: ny },
            type: "mirror",
          };
        }
      }
    }

    // 2. Check Walls (Grid DDA)
    // Simplified Ray Marching for Grid
    let rayUnitStepSize = {
      x: Math.sqrt(1 + (dir.y / dir.x) ** 2),
      y: Math.sqrt(1 + (dir.x / dir.y) ** 2),
    };
    let mapCheck = {
      x: Math.floor(origin.x / this.scale),
      y: Math.floor(origin.y / this.scale),
    };
    let rayLength1D = { x: 0, y: 0 };
    let step = { x: 0, y: 0 };

    if (dir.x < 0) {
      step.x = -1;
      rayLength1D.x = (origin.x / this.scale - mapCheck.x) * rayUnitStepSize.x;
    } else {
      step.x = 1;
      rayLength1D.x =
        (mapCheck.x + 1 - origin.x / this.scale) * rayUnitStepSize.x;
    }

    if (dir.y < 0) {
      step.y = -1;
      rayLength1D.y = (origin.y / this.scale - mapCheck.y) * rayUnitStepSize.y;
    } else {
      step.y = 1;
      rayLength1D.y =
        (mapCheck.y + 1 - origin.y / this.scale) * rayUnitStepSize.y;
    }

    let bTileFound = false;
    let dist = 0;

    // Only march as far as the closest mirror hit
    const maxGridDist = minDist === Infinity ? 2000 : minDist / this.scale;

    while (!bTileFound && dist < maxGridDist) {
      if (rayLength1D.x < rayLength1D.y) {
        mapCheck.x += step.x;
        dist = rayLength1D.x;
        rayLength1D.x += rayUnitStepSize.x;
      } else {
        mapCheck.y += step.y;
        dist = rayLength1D.y;
        rayLength1D.y += rayUnitStepSize.y;
      }

      if (
        mapCheck.x >= 0 &&
        mapCheck.x < this.cols &&
        mapCheck.y >= 0 &&
        mapCheck.y < this.rows
      ) {
        if (this.walls[mapCheck.x + mapCheck.y * this.cols] === 2) {
          bTileFound = true;
        }
      } else {
        // Out of bounds is a wall
        bTileFound = true;
      }
    }

    if (bTileFound) {
      // Calculate exact hit point
      const hitX = origin.x + dir.x * dist * this.scale;
      const hitY = origin.y + dir.y * dist * this.scale;

      // If wall hit is closer than mirror hit (which we limited loop by), return wall
      // Actually we already limited the loop, so if we found a tile, it IS closer
      return {
        point: { x: hitX, y: hitY },
        normal: { x: 0, y: 0 }, // Normal doesn't matter for absorption
        type: "wall",
      };
    }

    return closestHit;
  }

  draw(ctx) {
    // 1. Draw Static World (Walls & Background)
    ctx.drawImage(this.offscreenCanvas, 0, 0);

    // 3. Draw Mirrors
    ctx.strokeStyle = "#AAF";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const m of this.mirrors) {
      const angleRad = (m.angle * Math.PI) / 180;
      const dx = Math.cos(angleRad) * (m.length / 2) * this.scale;
      const dy = Math.sin(angleRad) * (m.length / 2) * this.scale;

      const mx = m.x * this.scale;
      const my = m.y * this.scale;

      ctx.beginPath();
      ctx.moveTo(mx - dx, my - dy);
      ctx.lineTo(mx + dx, my + dy);
      ctx.stroke();
    }

    // 4. Draw Laser Path
    if (this.laserPath.length > 1) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#0F0";
      ctx.strokeStyle = "#0F0";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(this.laserPath[0].x, this.laserPath[0].y);
      for (let i = 1; i < this.laserPath.length; i++) {
        ctx.lineTo(this.laserPath[i].x, this.laserPath[i].y);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;
    }

    // 5. Draw Source
    const sx = this.sourcePos.x * this.scale;
    const sy = this.sourcePos.y * this.scale;
    ctx.fillStyle = "#0F0";
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();

    // 6. Draw Target
    const tx = this.targetPos.x * this.scale;
    const ty = this.targetPos.y * this.scale;

    ctx.beginPath();
    ctx.arc(tx, ty, this.targetRadius, 0, Math.PI * 2);
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

    // 7. Draw Ghost Mirror (Preview)
    const mousePos = this.input.getMousePos();
    if (mousePos.x > 0 && mousePos.y > 0) {
      const length = 15 * this.scale; // Fixed size 15
      const angleRad = (this.drawAngle * Math.PI) / 180;
      const dx = Math.cos(angleRad) * (length / 2);
      const dy = Math.sin(angleRad) * (length / 2);

      ctx.beginPath();
      ctx.moveTo(mousePos.x - dx, mousePos.y - dy);
      ctx.lineTo(mousePos.x + dx, mousePos.y + dy);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 8. Draw UI hints
    ctx.fillStyle = "white";
    ctx.font = "14px monospace";
    ctx.fillText(
      `Left Click: Place Mirror | 'R': Rotate (${this.drawAngle}°) | Mirrors: ${this.mirrors.length}`,
      20,
      this.height - 20
    );
  }

  setFrequency(f) {
    // Not used in raycasting
  }

  resetWalls() {
    // Only clear user-placed mirrors (handled by App.jsx via setMirrors([]))
    this.signalStrength = 0;
  }

  generateMaze() {
    // Clear grid
    this.walls.fill(0);

    // Define Play Area (Centered Box)
    // Smaller area: 25% margin on each side
    const marginX = Math.floor(this.cols * 0.25);
    const marginY = Math.floor(this.rows * 0.25);
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
    this.drawRect(marginX + 2, marginY + 2, 40, 40, 0);
    this.drawRect(
      this.cols - marginX - 42,
      this.rows - marginY - 42,
      40,
      40,
      0
    );
  }

  recursiveDivision(x, y, w, h) {
    // Stop if the area is too small (Larger threshold = Easier/Simpler maze)
    if (w < 100 || h < 100) return;

    // Decide split direction
    let splitHorizontal = Math.random() > 0.5;
    if (w > h * 1.5) splitHorizontal = false;
    else if (h > w * 1.5) splitHorizontal = true;

    const wallThickness = 5; // Thicker walls

    if (splitHorizontal) {
      // Horizontal Wall
      const wallY = Math.floor(y + 20 + Math.random() * (h - 40));
      this.drawRect(x, wallY, w, wallThickness, 2);

      // Create a Gap (Larger gap = Easier)
      const gapSize = 30;
      const gapX = Math.floor(x + Math.random() * (w - gapSize));
      this.drawRect(gapX, wallY, gapSize, wallThickness, 0); // Clear gap (Air)

      // Recurse
      this.recursiveDivision(x, y, w, wallY - y);
      this.recursiveDivision(
        x,
        wallY + wallThickness,
        w,
        y + h - wallY - wallThickness
      );
    } else {
      // Vertical Wall
      const wallX = Math.floor(x + 20 + Math.random() * (w - 40));
      this.drawRect(wallX, y, wallThickness, h, 2);

      // Create a Gap
      const gapSize = 30;
      const gapY = Math.floor(y + Math.random() * (h - gapSize));
      this.drawRect(wallX, gapY, wallThickness, gapSize, 0); // Clear gap (Air)

      // Recurse
      this.recursiveDivision(x, y, wallX - x, h);
      this.recursiveDivision(
        wallX + wallThickness,
        y,
        x + w - wallX - wallThickness,
        h
      );
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
