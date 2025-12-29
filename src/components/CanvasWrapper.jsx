import React, { useRef, useEffect } from "react";
import { GameLoop } from "../engine/core/GameLoop";
import { Electrostatics } from "../engine/simulations/lab/Electrostatics";
import { WaveFDTD } from "../engine/simulations/lab/WaveFDTD";
import { PolarityGame } from "../engine/simulations/arcade/PolarityGame";

export default function CanvasWrapper({ simulationType, onInit }) {
  const canvasRef = useRef(null);
  const simulationRef = useRef(null); // Stores the pure JS class instance

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 0. Set initial size immediately so simulation gets correct dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 1. Initialize the correct simulation based on props
    if (simulationType === "electrostatics" || simulationType === "editor") {
      simulationRef.current = new Electrostatics(
        canvas.width,
        canvas.height,
        canvas
      );
    } else if (simulationType === "waves") {
      simulationRef.current = new WaveFDTD(canvas.width, canvas.height, canvas);
    } else if (simulationType === "arcade") {
      simulationRef.current = new PolarityGame(
        canvas.width,
        canvas.height,
        canvas
      );
    }

    if (onInit) {
      onInit(simulationRef.current);
    }

    // 2. Setup the Game Loop
    const loop = new GameLoop(
      (dt) => simulationRef.current.update(dt),
      () => {
        // Clear screen with a fade effect for trails
        // Only do fade for electrostatics, Waves draws full screen image
        if (
          simulationType === "electrostatics" ||
          simulationType === "editor"
        ) {
          ctx.fillStyle = "rgba(10, 10, 15, 0.2)";
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
      className="block w-full h-full bg-slate-900"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
