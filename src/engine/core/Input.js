import { Vector2 } from "./Vector2";

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mousePos = new Vector2(0, 0);
    this.isMouseDown = false;
    this.keys = {};
    this.listeners = {
      mousedown: [],
      mouseup: [],
      mousemove: [],
      keydown: [],
    };

    this.setupListeners();
  }

  setupListeners() {
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
      this.emit("mousemove", this.mousePos);
    });

    this.canvas.addEventListener("mousedown", (e) => {
      this.isMouseDown = true;
      this.emit("mousedown", { pos: this.mousePos, button: e.button });
    });

    this.canvas.addEventListener("mouseup", (e) => {
      this.isMouseDown = false;
      this.emit("mouseup", { pos: this.mousePos, button: e.button });
    });

    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      this.emit("keydown", e.code);
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  getMousePos() {
    return this.mousePos.clone();
  }

  isKeyHeld(code) {
    return !!this.keys[code];
  }

  destroy() {
    // Remove listeners if necessary, though usually Input lives as long as the canvas
  }
}
