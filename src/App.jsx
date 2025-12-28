import React, { useState, useCallback } from "react";
import CanvasWrapper from "./components/CanvasWrapper";
import ElectrostaticsOverlay from "./components/UI/ElectrostaticsOverlay";
import WaveOverlay from "./components/UI/WaveOverlay";
import ArcadeOverlay from "./components/UI/ArcadeOverlay";

function App() {
  const [mode, setMode] = useState("electrostatics"); // 'electrostatics' | 'waves' | 'arcade'
  const [simulationInstance, setSimulationInstance] = useState(null);

  // Electrostatics State
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [visMode, setVisMode] = useState("lines"); // 'vectors' | 'lines'
  const [isElectrostaticsPlaying, setIsElectrostaticsPlaying] = useState(false);

  // Waves State
  const [frequency, setFrequency] = useState(0.2);
  const [signalStrength, setSignalStrength] = useState(0);
  const [placedMirrors, setPlacedMirrors] = useState([]);

  const handleSimulationInit = useCallback(
    (sim) => {
      setSimulationInstance(sim);

      if (sim.constructor.name === "Electrostatics") {
        sim.setVisualizationMode(visMode); // Set initial mode
        sim.setPlaying(isElectrostaticsPlaying); // Set initial play state
        sim.onSelectionChange = (charge) => {
          setSelectedCharge(charge ? { ...charge } : null);
        };
      } else if (sim.constructor.name === "WaveFDTD") {
        sim.setFrequency(frequency);
        sim.onSignalUpdate = (strength) => {
          setSignalStrength(strength);
        };
        // Sync mirrors
        sim.setMirrors(placedMirrors);
        sim.onMirrorPlaced = (mirror) => {
          setPlacedMirrors((prev) => {
            const newMirrors = [...prev, mirror];
            sim.setMirrors(newMirrors); // Sync back immediately
            return newMirrors;
          });
        };
      }
      // Arcade mode doesn't need specific state bindings yet
    },
    [frequency, visMode, isElectrostaticsPlaying, placedMirrors]
  );

  // Handle Mode Switching
  const switchMode = (newMode) => {
    setMode(newMode);
    setSimulationInstance(null);
    setSelectedCharge(null);
    setSignalStrength(0);
    setIsElectrostaticsPlaying(false); // Reset play state on mode switch
    // Note: We keep placedMirrors state so it persists if we switch back?
    // Or reset? The prompt implies a level reset button.
    // Let's reset mirrors on mode switch to be safe or keep them.
    // For now, let's keep them unless explicitly reset.
  };

  // Electrostatics Handlers
  const handleChargeChange = (newQ) => {
    if (simulationInstance && mode === "electrostatics") {
      simulationInstance.updateSelectedCharge(newQ);
      setSelectedCharge((prev) => (prev ? { ...prev, q: newQ } : null));
    }
  };

  const handleVisModeChange = (newVisMode) => {
    setVisMode(newVisMode);
    if (simulationInstance && mode === "electrostatics") {
      simulationInstance.setVisualizationMode(newVisMode);
    }
  };

  const handlePlayPause = () => {
    const newState = !isElectrostaticsPlaying;
    setIsElectrostaticsPlaying(newState);
    if (simulationInstance && mode === "electrostatics") {
      simulationInstance.setPlaying(newState);
    }
  };

  const handleResetPositions = () => {
    setIsElectrostaticsPlaying(false);
    if (simulationInstance && mode === "electrostatics") {
      simulationInstance.resetPositions();
    }
  };

  const handleAddCharge = (q) => {
    if (simulationInstance && mode === "electrostatics") {
      simulationInstance.addCharge(q);
    }
  };

  // Wave Handlers
  const handleFrequencyChange = (newFreq) => {
    setFrequency(newFreq);
    if (simulationInstance && mode === "waves") {
      simulationInstance.setFrequency(newFreq);
    }
  };

  const handleMaterialChange = (materialType) => {
    if (simulationInstance && mode === "waves") {
      simulationInstance.setMaterial(materialType);
    }
  };

  const handleRotate = () => {
    if (simulationInstance && mode === "waves") {
      simulationInstance.rotateBrush();
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case "electrostatics":
        return "Electrostatics Lab";
      case "waves":
        return "EM Waves (FDTD)";
      case "arcade":
        return "Polarity Parkour";
      default:
        return "Simulation";
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-slate-900">
      {/* Header & Mode Switcher */}
      <div className="absolute top-0 left-0 z-10 p-4 text-white pointer-events-auto flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold drop-shadow-md">
            Electromagnetism Sandbox
          </h1>
          <p className="text-sm opacity-70 drop-shadow-md">
            Mode: {getModeTitle()}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => switchMode("electrostatics")}
            className={`px-4 py-2 rounded text-sm font-bold transition-colors cursor-pointer ${
              mode === "electrostatics"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Electrostatics
          </button>
          <button
            onClick={() => switchMode("waves")}
            className={`px-4 py-2 rounded text-sm font-bold transition-colors cursor-pointer ${
              mode === "waves"
                ? "bg-green-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            EM Waves
          </button>
          <button
            onClick={() => switchMode("arcade")}
            className={`px-4 py-2 rounded text-sm font-bold transition-colors cursor-pointer ${
              mode === "arcade"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Arcade
          </button>
        </div>
      </div>

      {/* Overlays */}
      {mode === "electrostatics" && (
        <ElectrostaticsOverlay
          charge={selectedCharge}
          onChargeChange={handleChargeChange}
          visMode={visMode}
          onVisModeChange={handleVisModeChange}
          isPlaying={isElectrostaticsPlaying}
          onPlayPause={handlePlayPause}
          onReset={handleResetPositions}
          onAddCharge={handleAddCharge}
        />
      )}

      {mode === "waves" && (
        <WaveOverlay
          frequency={frequency}
          onFrequencyChange={handleFrequencyChange}
          signalStrength={signalStrength}
          onReset={() => {
            setPlacedMirrors([]);
            if (simulationInstance) {
              simulationInstance.setMirrors([]);
              simulationInstance.resetWalls();
            }
          }}
          onMaterialChange={handleMaterialChange}
          onRotate={handleRotate}
        />
      )}

      {mode === "arcade" && <ArcadeOverlay />}

      {/* Simulation Canvas */}
      <CanvasWrapper
        key={mode} // Force re-mount on mode change
        simulationType={mode}
        onInit={handleSimulationInit}
      />
    </div>
  );
}

export default App;
