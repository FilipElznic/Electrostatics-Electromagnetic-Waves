import { SimulationBase } from "../SimulationBase";
import { Input } from "../../core/Input";
import { Vector2 } from "../../core/Vector2";

export class PolarityGame extends SimulationBase {
  constructor(width, height, canvas) {
    super(width, height);
    this.canvas = canvas;
    this.input = new Input(canvas);

    // Game State
    this.state = "playing"; // playing, won, lost
    this.message = "";

    // Physics Constants
    this.gravity = new Vector2(0, 800);
    this.friction = 0.96; // Reduced friction to allow better magnetic gliding
    this.moveForce = 2500;
    this.k = 60000000; // Coulomb constant (Greatly increased)

    // Magnet Sticking State
    this.stuckToMagnet = null;
    this.jumpCooldown = 0;

    // Visuals
    this.particles = [];
    this.pulseTime = 0;

    // Level Setup
    this.reset();

    // Input
    this.input.on("keydown", (code) => {
      if (code === "Space") {
        if (this.player.grounded) {
          this.player.vel.y = -600; // Jump force
          this.player.grounded = false;
        } else if (this.stuckToMagnet) {
          this.magnetJump();
        }
      }
      if (code === "ShiftLeft" || code === "ShiftRight") {
        this.togglePolarity();
      }
      if (code === "KeyR") {
        this.reset();
      }
      if ((code === "ArrowUp" || code === "KeyW") && this.stuckToMagnet) {
        this.magnetJump();
      }
    });
  }

  magnetJump() {
    if (!this.stuckToMagnet) return;

    // Calculate jump direction (away from magnet center)
    const jumpDir = this.player.pos.sub(this.stuckToMagnet.pos).normalize();

    // Apply strong impulse
    const jumpForce = 1200;
    this.player.vel = jumpDir.mult(jumpForce);

    // Reset state
    this.stuckToMagnet = null;
    this.jumpCooldown = 0.2; // 200ms cooldown before getting sucked back in
  }

  reset() {
    this.state = "playing";
    this.message = "";
    this.stuckToMagnet = null;
    this.jumpCooldown = 0;
    this.particles = [];
    this.pulseTime = 0;

    // Player
    this.player = {
      pos: new Vector2(100, this.height - 100),
      vel: new Vector2(0, 0),
      acc: new Vector2(0, 0),
      radius: 15,
      q: 1, // +1 (Red) or -1 (Blue)
      grounded: false,
    };

    // Level Design - Parkour to the Middle
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.platforms = [
      // Ground (Start)
      { x: 0, y: this.height - 40, w: 300, h: 40 },

      // Floating Islands leading up
      { x: 350, y: this.height - 150, w: 100, h: 20 },
      { x: 150, y: this.height - 300, w: 100, h: 20 },
      { x: 400, y: this.height - 450, w: 120, h: 20 },

      // The Gauntlet (Middle Section)
      { x: cx - 200, y: cy + 100, w: 80, h: 20 },
      { x: cx + 120, y: cy + 100, w: 80, h: 20 },

      // Goal Platform (Top Middle)
      { x: cx - 100, y: 150, w: 200, h: 30 },
    ];

    this.magnets = [
      // 1. The Launcher (Push up)
      { pos: new Vector2(200, this.height - 100), q: 1, radius: 30 },

      // 2. The Swing (Pull to side)
      { pos: new Vector2(50, this.height - 350), q: -1, radius: 25 },

      // 3. The Bridge (Alternating fields)
      { pos: new Vector2(300, this.height - 400), q: 1, radius: 25 },
      { pos: new Vector2(cx, cy), q: -1, radius: 40 }, // Central Hub

      // 4. The Climb (Vertical challenge)
      { pos: new Vector2(cx - 150, cy - 100), q: 1, radius: 25 },
      { pos: new Vector2(cx + 150, cy - 100), q: -1, radius: 25 },

      // 5. Goal Keeper
      { pos: new Vector2(cx, 80), q: 1, radius: 20 },
    ];

    this.goal = {
      x: cx - 60,
      y: 90,
      w: 120,
      h: 60,
    };
  }

  togglePolarity() {
    this.player.q *= -1;
  }

  update(dt) {
    if (this.state !== "playing") return;

    // 1. Input Forces
    if (this.input.isKeyHeld("ArrowLeft") || this.input.isKeyHeld("KeyA")) {
      this.player.acc.x -= this.moveForce;
    }
    if (this.input.isKeyHeld("ArrowRight") || this.input.isKeyHeld("KeyD")) {
      this.player.acc.x += this.moveForce;
    }

    // 2. Gravity
    if (!this.stuckToMagnet) {
      this.player.acc = this.player.acc.add(this.gravity);
    }

    // 3. Magnetic Forces
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= dt;
    }

    this.magnets.forEach((mag) => {
      const rVec = this.player.pos.sub(mag.pos);
      const dist = rVec.mag();
      const combinedRadius = this.player.radius + mag.radius;

      // Check for Magnet Collision (Sticking)
      // Only stick if:
      // 1. We are colliding
      // 2. We are attracted (opposite polarity)
      // 3. Jump cooldown is over
      if (
        dist < combinedRadius &&
        this.player.q * mag.q < 0 &&
        this.jumpCooldown <= 0
      ) {
        this.stuckToMagnet = mag;

        // Snap to surface to prevent clipping
        const surfacePos = mag.pos.add(rVec.normalize().mult(combinedRadius));
        this.player.pos = surfacePos;

        // Kill velocity
        this.player.vel = new Vector2(0, 0);
        this.player.acc = new Vector2(0, 0);
        return; // Skip force calculation for this magnet
      }

      // If stuck to THIS magnet, skip forces
      if (this.stuckToMagnet === mag) return;

      // Distance Clamping (Softening)
      // Ensure distance never goes below minDistance to avoid singularity
      const minDistance = 25;
      const clampedDist = Math.max(dist, minDistance);
      const clampedDistSq = clampedDist * clampedDist;

      // F = k * q1 * q2 / r^2
      const forceMag = (this.k * this.player.q * mag.q) / clampedDistSq;

      // Force Clamping
      const maxForce = 4000;
      const clampedForceMag = Math.min(Math.max(forceMag, -maxForce), maxForce);

      // Apply force
      const forceVec = rVec.normalize().mult(clampedForceMag);
      this.player.acc = this.player.acc.add(forceVec);
    });

    // 4. Integration (Euler)
    if (!this.stuckToMagnet) {
      this.player.vel = this.player.vel.add(this.player.acc.mult(dt));

      // Damping (Air Resistance)
      this.player.vel = this.player.vel.mult(0.98);

      // Ground Friction
      if (this.player.grounded) {
        this.player.vel.x *= 0.85;
      }

      // Terminal Velocity Cap
      const maxSpeed = 1000;
      if (this.player.vel.mag() > maxSpeed) {
        this.player.vel = this.player.vel.normalize().mult(maxSpeed);
      }

      this.player.pos = this.player.pos.add(this.player.vel.mult(dt));
    }
    // Reset acceleration
    this.player.acc = new Vector2(0, 0);

    // 5. Collision Detection
    this.player.grounded = false;

    // Screen Boundaries
    if (this.player.pos.x < this.player.radius) {
      this.player.pos.x = this.player.radius;
      this.player.vel.x *= -0.5;
    }
    if (this.player.pos.x > this.width - this.player.radius) {
      this.player.pos.x = this.width - this.player.radius;
      this.player.vel.x *= -0.5;
    }
    // Death / Reset if falling off bottom
    if (this.player.pos.y > this.height + 100) {
      this.reset();
    }
    // Ceiling collision
    if (this.player.pos.y < this.player.radius) {
      this.player.pos.y = this.player.radius;
      this.player.vel.y *= -0.5;
    }

    // Platforms
    this.platforms.forEach((plat) => {
      // Simple AABB vs Circle (treating circle as box for simplicity or just checking center)
      // Check if player is within horizontal bounds
      if (this.player.pos.x > plat.x && this.player.pos.x < plat.x + plat.w) {
        // Check vertical collision (landing on top)
        if (
          this.player.pos.y + this.player.radius > plat.y &&
          this.player.pos.y - this.player.radius < plat.y + plat.h
        ) {
          // Determine if landing from top
          if (this.player.vel.y > 0 && this.player.pos.y < plat.y + 10) {
            this.player.pos.y = plat.y - this.player.radius;
            this.player.vel.y = 0;
            this.player.grounded = true;
          }
          // Hitting from bottom
          else if (
            this.player.vel.y < 0 &&
            this.player.pos.y > plat.y + plat.h - 10
          ) {
            this.player.pos.y = plat.y + plat.h + this.player.radius;
            this.player.vel.y = 0;
          }
        }
      }
    });

    // 6. Win Condition
    if (this.state === "playing") {
      this.pulseTime += dt;

      if (
        this.player.pos.x > this.goal.x &&
        this.player.pos.x < this.goal.x + this.goal.w &&
        this.player.pos.y > this.goal.y &&
        this.player.pos.y < this.goal.y + this.goal.h
      ) {
        this.state = "won";
        this.message = "LEVEL COMPLETE!";
        // Spawn particles
        for (let i = 0; i < 50; i++) {
          this.particles.push({
            pos: this.player.pos.clone(),
            vel: new Vector2(
              (Math.random() - 0.5) * 500,
              (Math.random() - 0.5) * 500
            ),
            life: 1.0,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
          });
        }
      }
    } else if (this.state === "won") {
      // Update particles
      this.particles.forEach((p) => {
        p.pos = p.pos.add(p.vel.mult(dt));
        p.life -= dt;
      });
      this.particles = this.particles.filter((p) => p.life > 0);
    }
  }

  draw(ctx) {
    // Background (Zinc-900)
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, this.width, this.height);

    // Platforms (Zinc-700)
    this.platforms.forEach((p) => {
      // Main body
      ctx.fillStyle = "#3f3f46";
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Top Highlight (Zinc-600)
      ctx.fillStyle = "#52525b";
      ctx.fillRect(p.x, p.y, p.w, 4);

      // Subtle Border
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    });

    // Goal
    const pulseOpacity = 0.3 + 0.2 * Math.sin(this.pulseTime * 5);

    // Goal Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(234, 179, 8, 0.5)";

    ctx.fillStyle = `rgba(234, 179, 8, ${pulseOpacity})`; // Yellow-500
    ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);

    ctx.strokeStyle = "#facc15"; // Yellow-400
    ctx.lineWidth = 2;
    ctx.strokeRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);

    ctx.shadowBlur = 0; // Reset shadow

    ctx.fillStyle = "#fef08a"; // Yellow-200
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "GOAL",
      this.goal.x + this.goal.w / 2,
      this.goal.y + this.goal.h / 2 + 6
    );

    // Particles
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Magnets
    this.magnets.forEach((m) => {
      // Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor =
        m.q > 0 ? "rgba(244, 63, 94, 0.5)" : "rgba(99, 102, 241, 0.5)";

      ctx.beginPath();
      ctx.arc(m.pos.x, m.pos.y, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = m.q > 0 ? "#f43f5e" : "#6366f1"; // Rose-500 : Indigo-500
      ctx.fill();

      ctx.shadowBlur = 0;

      // Field influence ring
      ctx.beginPath();
      ctx.arc(m.pos.x, m.pos.y, m.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle =
        m.q > 0 ? "rgba(244, 63, 94, 0.3)" : "rgba(99, 102, 241, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Symbol
      ctx.fillStyle = "white";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(m.q > 0 ? "+" : "-", m.pos.x, m.pos.y + 1);
    });

    // Player
    const pColor = this.player.q > 0 ? "#f43f5e" : "#6366f1"; // Rose-500 : Indigo-500

    // Glow Effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = pColor;

    // Main Body
    ctx.beginPath();
    ctx.arc(
      this.player.pos.x,
      this.player.pos.y,
      this.player.radius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = pColor;
    ctx.fill();

    // White Border
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Player Face
    ctx.fillStyle = "white";
    ctx.beginPath();
    // Eyes
    ctx.arc(this.player.pos.x - 5, this.player.pos.y - 2, 3, 0, Math.PI * 2);
    ctx.arc(this.player.pos.x + 5, this.player.pos.y - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Smile/Mouth based on state
    ctx.beginPath();
    if (this.stuckToMagnet) {
      // O face when stuck
      ctx.arc(this.player.pos.x, this.player.pos.y + 6, 3, 0, Math.PI * 2);
    } else {
      // Smile
      ctx.arc(
        this.player.pos.x,
        this.player.pos.y + 2,
        8,
        0.2 * Math.PI,
        0.8 * Math.PI
      );
    }
    ctx.stroke();

    // Force Tether Lines
    this.magnets.forEach((mag) => {
      const dist = this.player.pos.dist(mag.pos);
      const cutoff = 400;

      if (dist < cutoff) {
        const isAttracting = this.player.q * mag.q < 0;
        const thickness = Math.max(1, 6 * (1 - dist / cutoff));

        ctx.beginPath();
        ctx.moveTo(this.player.pos.x, this.player.pos.y);
        ctx.lineTo(mag.pos.x, mag.pos.y);

        ctx.lineWidth = thickness;
        if (isAttracting) {
          // Emerald-400 solid line (Safe/Pull)
          ctx.strokeStyle = "rgba(52, 211, 153, 0.6)";
          ctx.setLineDash([]);
        } else {
          // Rose-400 dashed line (Danger/Push)
          ctx.strokeStyle = "rgba(251, 113, 133, 0.6)";
          ctx.setLineDash([10, 10]);
        }

        ctx.stroke();
        ctx.setLineDash([]); // Reset
      }
    });

    // UI / HUD
    if (this.state === "won") {
      ctx.fillStyle = "rgba(24, 24, 27, 0.8)"; // Zinc-900 fade
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "white";
      ctx.font = "40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(this.message, this.width / 2, this.height / 2);
      ctx.font = "20px sans-serif";
      ctx.fillText(
        "Press 'R' to Restart",
        this.width / 2,
        this.height / 2 + 40
      );
    }
  }

  destroy() {
    this.input.destroy();
  }
}
