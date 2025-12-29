import React from "react";
import CanvasWrapper from "../CanvasWrapper";
import { PolarityGame } from "../../engine/simulations/arcade/PolarityGame";

export default function ArcadeView({ onInit }) {
  return (
    <CanvasWrapper
      simulationType="arcade"
      SimulationClass={PolarityGame}
      onInit={onInit}
    />
  );
}
