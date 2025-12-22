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

    // State
    this.charges = [
      {
        pos: new Vector2(width / 2 - 100, height / 2),
        q: 50,
        color: "#ef4444",
        radius: 20,
        isDragging: false,
      }, // Positive (Red)
      {
        pos: new Vector2(width / 2 + 100, height / 2),
        q: -50,
        color: "#3b82f6",
        radius: 20,
        isDragging: false,
      }, // Negative (Blue)
    ];

    this.selectedChargeIndex = -1;
    this.dragOffset = new Vector2(0, 0);
    this.onSelectionChange = null; // Callback for React

    // Setup Input Listeners
    this.input.on("mousedown", (pos) => this.handleMouseDown(pos));
    this.input.on("mouseup", () => this.handleMouseUp());
    this.input.on("mousemove", (pos) => this.handleMouseMove(pos));
  }

  handleMouseDown(mousePos) {
    let clickedIndex = -1;
    // Check collision with charges
    for (let i = 0; i < this.charges.length; i++) {
      const charge = this.charges[i];
      if (mousePos.dist(charge.pos) < charge.radius) {
        charge.isDragging = true;
        clickedIndex = i;
        this.dragOffset = charge.pos.sub(mousePos);
        break;
      }
    }

    if (clickedIndex !== this.selectedChargeIndex) {
      this.selectedChargeIndex = clickedIndex;
      if (this.onSelectionChange) {
        this.onSelectionChange(this.getSelectedCharge());
      }
    } else if (clickedIndex === -1 && this.selectedChargeIndex !== -1) {
      // Deselect if clicked empty space
      this.selectedChargeIndex = -1;
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

        // Boundary checks
        c.pos.x = Math.max(c.radius, Math.min(this.width - c.radius, c.pos.x));
        c.pos.y = Math.max(c.radius, Math.min(this.height - c.radius, c.pos.y));
        needsUpdate = true;
      }
    });
  }

  update(dt) {
    // Physics updates (if we had moving particles not controlled by mouse)
  }

  draw(ctx) {
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

    // 2. Draw Charges
    this.charges.forEach((c, index) => {
      ctx.beginPath();
      ctx.arc(c.pos.x, c.pos.y, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = c.color;

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = c.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Selection ring
      if (index === this.selectedChargeIndex) {
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

  // API for React
  updateSelectedCharge(newQ) {
    if (this.selectedChargeIndex !== -1) {
      const charge = this.charges[this.selectedChargeIndex];
      charge.q = newQ;
      // Update color based on polarity
      charge.color = newQ > 0 ? "#ef4444" : newQ < 0 ? "#3b82f6" : "#9ca3af";
    }
  }

  getSelectedCharge() {
    if (this.selectedChargeIndex !== -1) {
      return this.charges[this.selectedChargeIndex];
    }
    return null;
  }

  destroy() {
    this.input.destroy();
  }
}
