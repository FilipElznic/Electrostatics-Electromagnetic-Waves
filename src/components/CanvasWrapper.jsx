import React, { useRef, useEffect } from "react";
import { GameLoop } from "../engine/core/GameLoop";

export default function CanvasWrapper({
  simulationType,
  onInit,
  SimulationClass,
}) {
  const canvasRef = useRef(null);
  const simulationRef = useRef(null); // Stores the pure JS class instance

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 0. Set initial size immediately so simulation gets correct dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 1. Initialize the correct simulation based on props
    if (SimulationClass) {
      simulationRef.current = new SimulationClass(
        canvas.width,
        canvas.height,
        canvas
      );
    }

    if (onInit && simulationRef.current) {
      onInit(simulationRef.current);
    }

    // 2. Setup the Game Loop
    const loop = new GameLoop(
      (dt) => simulationRef.current?.update(dt),
      () => {
        if (!simulationRef.current) return;

        // Clear screen with a fade effect for trails
        // Only do fade for electrostatics, Waves draws full screen image
        if (
          simulationType === "electrostatics" ||
          simulationType === "editor"
        ) {
          ctx.fillStyle = "rgba(24, 24, 27, 0.2)"; // Zinc-900 with opacity for trails
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

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
    // handleResize(); // Already sized at start

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
    <canvas
      ref={canvasRef}
      className="block w-full h-full bg-zinc-900"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
