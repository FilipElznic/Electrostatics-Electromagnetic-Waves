import React, { useState, useCallback } from "react";
import CanvasWrapper from "./components/CanvasWrapper";
import ElectrostaticsOverlay from "./components/UI/ElectrostaticsOverlay";

function App() {
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [simulationInstance, setSimulationInstance] = useState(null);

  const handleSimulationInit = useCallback((sim) => {
    setSimulationInstance(sim);
    // Subscribe to selection changes
    sim.onSelectionChange = (charge) => {
      setSelectedCharge(charge ? { ...charge } : null); // Copy to trigger re-render
    };
  }, []);

  const handleChargeChange = (newQ) => {
    if (simulationInstance) {
      simulationInstance.updateSelectedCharge(newQ);
      // Update local state to reflect change immediately in UI
      setSelectedCharge((prev) => (prev ? { ...prev, q: newQ } : null));
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <div className="absolute top-0 left-0 z-10 p-4 text-white pointer-events-none">
        <h1 className="text-2xl font-bold">Electromagnetism Sandbox</h1>
        <p className="text-sm opacity-70">Mode: Electrostatics Lab</p>
      </div>

      <ElectrostaticsOverlay
        charge={selectedCharge}
        onChargeChange={handleChargeChange}
      />

      <CanvasWrapper
        simulationType="electrostatics"
        onInit={handleSimulationInit}
      />
    </div>
  );
}

export default App;
