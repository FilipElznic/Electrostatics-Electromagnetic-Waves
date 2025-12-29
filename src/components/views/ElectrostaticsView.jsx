import React from "react";
import CanvasWrapper from "../CanvasWrapper";
import { Electrostatics } from "../../engine/simulations/lab/Electrostatics";

export default function ElectrostaticsView({ onInit }) {
  return (
    <CanvasWrapper
      simulationType="electrostatics"
      SimulationClass={Electrostatics}
      onInit={onInit}
    />
  );
}
