import { SimulationBase } from "../SimulationBase";
import { Input } from "../../core/Input";
import { Vector2 } from "../../core/Vector2";

export class Electrostatics extends SimulationBase {
  constructor(width, height, canvas) {
    super(width, height);
    this.canvas = canvas;
    this.input = new Input(canvas);

    // Physics constants
    this.k = 20000; // Visual scaling constant
    this.physicsK = 2000; // Force constant for movement (Reduced to prevent clamping saturation)
    this.isPlaying = false;
    this.initialPositions = [];

    // State
    this.charges = [];

    // Initialize Default Scenario
    this.loadScenario("default");

    this.selectedChargeId = null;
    this.dragOffset = new Vector2(0, 0);
    this.onSelectionChange = null; // Callback for React
    this.visualizationMode = "lines"; // 'vectors' | 'lines'

    // Setup Input Listeners
    this.input.on("mousedown", (e) => this.handleMouseDown(e.pos));
    this.input.on("mouseup", () => this.handleMouseUp());
    this.input.on("mousemove", (pos) => this.handleMouseMove(pos));
  }

  loadScenario(type) {
    this.charges = [];
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    if (type === "default") {
      // 3 Positive, 2 Negative
      this.addCharge(50, cx - 150, cy - 50);
      this.addCharge(50, cx, cy - 100);
      this.addCharge(50, cx + 150, cy - 50);
      this.addCharge(-50, cx - 75, cy + 50);
      this.addCharge(-50, cx + 75, cy + 50);
    } else if (type === "dipole") {
      this.addCharge(50, cx - 100, cy);
      this.addCharge(-50, cx + 100, cy);
    } else if (type === "quadrupole") {
      this.addCharge(50, cx - 50, cy - 50);
      this.addCharge(-50, cx + 50, cy - 50);
      this.addCharge(50, cx + 50, cy + 50);
      this.addCharge(-50, cx - 50, cy + 50);
    } else if (type === "random") {
      for (let i = 0; i < 10; i++) {
        const q = Math.random() > 0.5 ? 50 : -50;
        const x = Math.random() * (w - 100) + 50;
        const y = Math.random() * (h - 100) + 50;
        this.addCharge(q, x, y);
      }
    } else if (type === "line") {
      for (let i = 0; i < 5; i++) {
        this.addCharge(50, cx - 200 + i * 100, cy);
      }
    }

    this.saveInitialPositions();
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    // Clamp charges to new screen size
    this.charges.forEach((c) => {
      c.pos.x = Math.max(c.radius, Math.min(w - c.radius, c.pos.x));
      c.pos.y = Math.max(c.radius, Math.min(h - c.radius, c.pos.y));
    });
  }

  handleMouseDown(mousePos) {
    let clickedId = null;
    // Check collision with charges
    for (let i = 0; i < this.charges.length; i++) {
      const charge = this.charges[i];
      if (mousePos.dist(charge.pos) < charge.radius) {
        charge.isDragging = true;
        clickedId = charge.id;
        this.dragOffset = charge.pos.sub(mousePos);
        break;
      }
    }

    if (clickedId !== this.selectedChargeId) {
      this.selectedChargeId = clickedId;
      if (this.onSelectionChange) {
        this.onSelectionChange(this.getSelectedCharge());
      }
    } else if (clickedId === null && this.selectedChargeId !== null) {
      // Deselect if clicked empty space
      this.selectedChargeId = null;
      if (this.onSelectionChange) {
        this.onSelectionChange(null);
      }
    }
  }

  handleMouseUp() {
    this.charges.forEach((c) => (c.isDragging = false));
  }

  handleMouseMove(mousePos) {
    let needsUpdate = false;
    this.charges.forEach((c) => {
      if (c.isDragging) {
        c.pos = mousePos.add(this.dragOffset);
        c.vel = new Vector2(0, 0); // Reset velocity when dragging

        // Boundary checks
        c.pos.x = Math.max(c.radius, Math.min(this.width - c.radius, c.pos.x));
        c.pos.y = Math.max(c.radius, Math.min(this.height - c.radius, c.pos.y));

        // Clear history when dragging
        c.history = [];

        needsUpdate = true;
      }
    });
  }

  update(dt) {
    if (!this.isPlaying) return;

    // Physics Loop
    // 1. Calculate Forces
    for (let i = 0; i < this.charges.length; i++) {
      const c1 = this.charges[i];
      if (c1.isDragging || c1.isFixed) continue;

      let force = new Vector2(0, 0);

      for (let j = 0; j < this.charges.length; j++) {
        if (i === j) continue;
        const c2 = this.charges[j];

        const rVec = c1.pos.sub(c2.pos);
        const distSq = rVec.magSq();
        const dist = Math.sqrt(distSq);

        // Avoid singularity and extreme forces
        if (dist > c1.radius + c2.radius) {
          // F = k * q1 * q2 / r^2
          const forceMag = (this.physicsK * c1.q * c2.q) / distSq;

          // Clamp force to prevent extreme acceleration at contact, but allow range
          const maxForce = 10000;
          const clampedForce = Math.min(
            Math.max(forceMag, -maxForce),
            maxForce
          );

          force = force.add(rVec.normalize().mult(clampedForce));
        }
      }

      // 2. Update Velocity
      // F = ma => a = F/m
      c1.vel = c1.vel.add(force.div(c1.mass).mult(dt));
    }

    // 3. Update Positions & Collisions
    this.charges.forEach((c) => {
      if (c.isDragging || c.isFixed) return;

      // Damping (Friction)
      c.vel = c.vel.mult(0.95);

      // Update Position
      c.pos = c.pos.add(c.vel.mult(dt));

      // Update History
      c.history.push({ x: c.pos.x, y: c.pos.y });
      if (c.history.length > 200) {
        c.history.shift();
      }

      // Screen Boundaries (Bounce)
      if (c.pos.x < c.radius) {
        c.pos.x = c.radius;
        c.vel.x *= -0.8;
      }
      if (c.pos.x > this.width - c.radius) {
        c.pos.x = this.width - c.radius;
        c.vel.x *= -0.8;
      }
      if (c.pos.y < c.radius) {
        c.pos.y = c.radius;
        c.vel.y *= -0.8;
      }
      if (c.pos.y > this.height - c.radius) {
        c.pos.y = this.height - c.radius;
        c.vel.y *= -0.8;
      }
    });

    // Charge-Charge Collisions
    for (let i = 0; i < this.charges.length; i++) {
      for (let j = i + 1; j < this.charges.length; j++) {
        const c1 = this.charges[i];
        const c2 = this.charges[j];

        const dist = c1.pos.dist(c2.pos);
        const minDist = c1.radius + c2.radius;

        if (dist < minDist) {
          // Resolve overlap
          const overlap = minDist - dist;
          const dir = c1.pos.sub(c2.pos).normalize();

          // Move apart
          const move = dir.mult(overlap * 0.5);
          if (!c1.isDragging && !c1.isFixed) c1.pos = c1.pos.add(move);
          if (!c2.isDragging && !c2.isFixed) c2.pos = c2.pos.sub(move);

          // Bounce velocities
          const vRel = c1.vel.sub(c2.vel);
          const velAlongNormal = vRel.x * dir.x + vRel.y * dir.y;

          if (velAlongNormal < 0) {
            const restitution = 0.8;
            const jImpulse = -(1 + restitution) * velAlongNormal;

            const invM1 = c1.isFixed ? 0 : 1 / c1.mass;
            const invM2 = c2.isFixed ? 0 : 1 / c2.mass;

            if (invM1 + invM2 > 0) {
              const impulseMag = jImpulse / (invM1 + invM2);
              const impulse = dir.mult(impulseMag);

              if (!c1.isDragging && !c1.isFixed)
                c1.vel = c1.vel.add(impulse.mult(invM1));
              if (!c2.isDragging && !c2.isFixed)
                c2.vel = c2.vel.sub(impulse.mult(invM2));
            }
          }
        }
      }
    }
  }

  saveInitialPositions() {
    this.initialPositions = this.charges.map((c) => ({
      pos: c.pos.clone(),
      q: c.q,
    }));
  }
  addCharge(q, x, y) {
    // Add new charge at a random position near center if x,y not provided
    let pos;
    if (x !== undefined && y !== undefined) {
      pos = new Vector2(x, y);
    } else {
      const offset = new Vector2(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
      );
      pos = new Vector2(this.width / 2, this.height / 2).add(offset);
    }

    const newCharge = {
      id: Date.now() + Math.random(),
      pos: pos,
      vel: new Vector2(0, 0),
      q: q,
      mass: 1,
      isFixed: false,
      color: q > 0 ? "#ef4444" : "#3b82f6",
      radius: 20,
      isDragging: false,
      history: [],
    };

    this.charges.push(newCharge);

    // If not playing, update initial positions so reset works correctly for new layout
    if (!this.isPlaying) {
      this.saveInitialPositions();
    }
  }

  spawnAtom() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const r = 150;

    // Proton (Heavy, Fixed)
    const proton = {
      id: Date.now() + Math.random(),
      pos: new Vector2(cx, cy),
      vel: new Vector2(0, 0),
      q: 50,
      mass: 100,
      isFixed: true,
      color: "#ef4444",
      radius: 25,
      isDragging: false,
      history: [],
    };
    this.charges.push(proton);

    // Electron (Light, Orbiting)
    const q1 = proton.q;
    const q2 = -10;
    const m = 1;

    // v = sqrt(k * |q1 * q2| / (m * r))
    const vMag = Math.sqrt((this.physicsK * Math.abs(q1 * q2)) / (m * r));

    const electron = {
      id: Date.now() + Math.random() + 1,
      pos: new Vector2(cx + r, cy),
      vel: new Vector2(0, vMag), // Perpendicular velocity
      q: q2,
      mass: m,
      isFixed: false,
      color: "#3b82f6",
      radius: 10,
      isDragging: false,
      history: [],
    };
    this.charges.push(electron);

    if (!this.isPlaying) {
      this.saveInitialPositions();
    }
  }

  setPlaying(playing) {
    this.isPlaying = playing;
  }

  resetPositions() {
    this.isPlaying = false;
    this.charges.forEach((c, i) => {
      if (this.initialPositions[i]) {
        c.pos = this.initialPositions[i].pos.clone();
        c.vel = new Vector2(0, 0);
        c.history = [];
      }
    });
  }

  draw(ctx) {
    if (this.visualizationMode === "lines") {
      this.drawFieldLines(ctx);
    } else {
      this.drawVectorField(ctx);
    }

    // Draw Trails
    this.charges.forEach((c) => {
      if (c.history.length < 2) return;

      for (let i = 0; i < c.history.length - 1; i++) {
        const p1 = c.history[i];
        const p2 = c.history[i + 1];
        const alpha = i / c.history.length; // 0 to 1

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // 2. Draw Charges
    this.charges.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.pos.x, c.pos.y, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = c.color;

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = c.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Selection ring
      if (c.id === this.selectedChargeId) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = "white";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.q > 0 ? "+" : "-", c.pos.x, c.pos.y);
    });
  }

  drawVectorField(ctx) {
    // 1. Visualize Field (Vector Grid)
    const gridSize = 30;
    ctx.lineWidth = 1;

    for (let x = 0; x < this.width; x += gridSize) {
      for (let y = 0; y < this.height; y += gridSize) {
        const point = new Vector2(x, y);
        let E = new Vector2(0, 0);

        // Calculate E at this point
        this.charges.forEach((charge) => {
          const rVec = point.sub(charge.pos);
          const r = rVec.mag();

          if (r > 10) {
            // Avoid singularity
            // E = k * q / r^2 * r_hat
            const E_mag = (this.k * charge.q) / (r * r);
            E = E.add(rVec.normalize().mult(E_mag));
          }
        });

        const mag = E.mag();
        if (mag > 0.5) {
          // Heatmap coloring
          // Map magnitude to color: Blue (weak) -> Red (strong)
          // Clamp magnitude for color mapping
          const t = Math.min(mag / 10, 1);
          const r = Math.floor(255 * t);
          const b = Math.floor(255 * (1 - t));
          ctx.strokeStyle = `rgb(${r}, 50, ${b})`;

          // Draw vector
          const scale = Math.min(mag, gridSize * 0.8); // Cap length
          const end = point.add(E.normalize().mult(scale));

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(end.x, end.y);

          // Arrow head
          const angle = Math.atan2(E.y, E.x);
          const headLen = 3;
          ctx.lineTo(
            end.x - headLen * Math.cos(angle - Math.PI / 6),
            end.y - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle + Math.PI / 6),
            end.y - headLen * Math.sin(angle + Math.PI / 6)
          );

          ctx.stroke();
        }
      }
    }
  }

  drawFieldLines(ctx) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";

    // Spawn lines from positive charges
    this.charges.forEach((source) => {
      if (source.q <= 0) return; // Only start from positive

      const numLines = Math.floor(Math.abs(source.q) / 2); // Proportional to charge
      const stepSize = 10;
      const maxSteps = 500;

      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2;
        let pos = source.pos.add(
          new Vector2(Math.cos(angle), Math.sin(angle)).mult(source.radius + 2)
        );

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);

        for (let step = 0; step < maxSteps; step++) {
          let E = new Vector2(0, 0);
          let hitNegative = false;

          // Calculate E at current pos
          this.charges.forEach((c) => {
            const rVec = pos.sub(c.pos);
            const rSq = rVec.magSq();
            const r = Math.sqrt(rSq);

            // Check termination (hit negative charge)
            if (c.q < 0 && r < c.radius) {
              hitNegative = true;
            }

            if (r > 1) {
              const E_mag = (this.k * c.q) / rSq;
              E = E.add(rVec.normalize().mult(E_mag));
            }
          });

          if (hitNegative) break;

          // Normalize E to get direction
          const mag = E.mag();
          if (mag === 0) break;

          const dir = E.normalize();
          pos = pos.add(dir.mult(stepSize));

          ctx.lineTo(pos.x, pos.y);

          // Check bounds
          if (
            pos.x < 0 ||
            pos.x > this.width ||
            pos.y < 0 ||
            pos.y > this.height
          ) {
            break;
          }
        }
        ctx.stroke();
      }
    });
  }

  // API for React
  setVisualizationMode(mode) {
    this.visualizationMode = mode;
  }

  updateChargeProperties(id, props) {
    const charge = this.charges.find((c) => c.id === id);
    if (charge) {
      if (props.q !== undefined) {
        charge.q = props.q;
        charge.color =
          charge.q > 0 ? "#ef4444" : charge.q < 0 ? "#3b82f6" : "#9ca3af";
      }
      if (props.mass !== undefined) charge.mass = props.mass;
      if (props.radius !== undefined) charge.radius = props.radius;
      if (props.isFixed !== undefined) charge.isFixed = props.isFixed;

      if (props.velX !== undefined) charge.vel.x = props.velX;
      if (props.velY !== undefined) charge.vel.y = props.velY;

      if (props.posX !== undefined) {
        charge.pos.x = props.posX;
        charge.history = []; // Clear history on teleport
      }
      if (props.posY !== undefined) {
        charge.pos.y = props.posY;
        charge.history = []; // Clear history on teleport
      }
    }
  }

  getSelectedCharge() {
    return this.charges.find((c) => c.id === this.selectedChargeId) || null;
  }

  destroy() {
    this.input.destroy();
  }
}
