import React, { useRef, useEffect } from "react";
import { GameLoop } from "../engine/core/GameLoop";
import { Electrostatics } from "../engine/simulations/lab/Electrostatics";

export default function CanvasWrapper({ simulationType, onInit }) {
  const canvasRef = useRef(null);
  const simulationRef = useRef(null); // Stores the pure JS class instance

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 1. Initialize the correct simulation based on props
    // (For now, we default to Electrostatics)
    simulationRef.current = new Electrostatics(
      canvas.width,
      canvas.height,
      canvas
    );

    if (onInit) {
      onInit(simulationRef.current);
    }

    // 2. Setup the Game Loop
    const loop = new GameLoop(
      (dt) => simulationRef.current.update(dt),
      () => {
        // Clear screen with a fade effect for trails
        ctx.fillStyle = "rgba(10, 10, 15, 0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        simulationRef.current.draw(ctx);
      }
    );

    loop.start();

    // 3. Handle Resizing
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (simulationRef.current) {
        simulationRef.current.resize(canvas.width, canvas.height);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Trigger once

    // Cleanup
    return () => {
      loop.stop();
      window.removeEventListener("resize", handleResize);
      if (simulationRef.current) {
        simulationRef.current.destroy();
      }
    };
  }, [simulationType]); // Re-run if simulationType changes

  return (
    <canvas ref={canvasRef} className="block w-full h-full bg-slate-900" />
  );
}
