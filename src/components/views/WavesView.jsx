import React from "react";
import CanvasWrapper from "../CanvasWrapper";
import { WaveFDTD } from "../../engine/simulations/lab/WaveFDTD";

export default function WavesView({ onInit }) {
  return (
    <CanvasWrapper
      simulationType="waves"
      SimulationClass={WaveFDTD}
      onInit={onInit}
    />
  );
}
