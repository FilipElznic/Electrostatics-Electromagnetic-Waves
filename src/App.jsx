import React, { useState, useCallback, Suspense } from "react";
// import CanvasWrapper from "./components/CanvasWrapper"; // Removed in favor of lazy loaded views
import ElectrostaticsOverlay from "./components/UI/ElectrostaticsOverlay";
import WaveOverlay from "./components/UI/WaveOverlay";
import ArcadeOverlay from "./components/UI/ArcadeOverlay";
import InspectorPanel from "./components/UI/InspectorPanel";
import MainMenu from "./components/UI/MainMenu";
import InfoModal from "./components/UI/InfoModal";
import InsightCard from "./components/UI/InsightCard";

// Lazy Load Simulation Views
const ElectrostaticsView = React.lazy(() =>
  import("./components/views/ElectrostaticsView")
);
const WavesView = React.lazy(() => import("./components/views/WavesView"));
const ArcadeView = React.lazy(() => import("./components/views/ArcadeView"));

function App() {
  const [currentView, setCurrentView] = useState("MENU"); // 'MENU' | 'ELECTROSTATICS' | 'WAVES' | 'ARCADE'
  const [simulationInstance, setSimulationInstance] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });

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

  // Handle Navigation
  const handleNavigate = (view) => {
    setCurrentView(view);
    setSimulationInstance(null);
    setSelectedCharge(null);
    setSignalStrength(0);
    setIsElectrostaticsPlaying(false);

    // Set Modal Content based on view
    if (view === "ELECTROSTATICS") {
      setModalContent({
        title: "Electrostatics Lab",
        description: `Welcome to the Electrostatics Lab! Here you can experiment with electric charges and fields.
        
• Left Click to select or move charges.
• Right Click to open the context menu.
• Use the Inspector Panel to modify charge properties like magnitude and mass.
• Try the Spawn Atom tool to see orbital mechanics in action!
• Toggle between Field Lines and Vector Field visualizations to see the invisible forces at work.`,
      });
      setShowInfoModal(true);
    } else if (view === "WAVES") {
      setModalContent({
        title: "Signal Bouncer Mission",
        description: `Mission: Signal Routing.
        
• Your goal is to guide the Wi-Fi signal from the source to the target area.
• Left Click to place mirrors.
• Right Click to rotate the mirror brush.
• Watch out for walls that block the signal!
• The signal strength meter will tell you when you've established a stable connection. Good luck!`,
      });
      setShowInfoModal(true);
    } else if (view === "ARCADE") {
      setModalContent({
        title: "Polarity Parkour",
        description: `Welcome to Polarity Parkour!
        
• You control a charged particle in a magnetic world.
• Arrow Keys / A & D: Move Left/Right.
• Space: Jump.
• SHIFT: Switch Polarity (Positive/Negative).
• Mechanics: Opposite charges attract (Green Line), Like charges repel (Red Line).
• Use these forces to swing across gaps and climb walls. Reach the yellow goal to win!`,
      });
      setShowInfoModal(true);
    }
  };

  // Electrostatics Handlers
  const handleChargeChange = (newQ) => {
    if (simulationInstance && currentView === "ELECTROSTATICS") {
      if (selectedCharge) {
        simulationInstance.updateChargeProperties(selectedCharge.id, {
          q: newQ,
        });
        setSelectedCharge((prev) => (prev ? { ...prev, q: newQ } : null));
      }
    }
  };

  const handleChargeUpdate = (id, props) => {
    if (simulationInstance) {
      simulationInstance.updateChargeProperties(id, props);
      if (selectedCharge && selectedCharge.id === id) {
        setSelectedCharge((prev) => ({ ...prev, ...props }));
      }
    }
  };

  const handleVisModeChange = (newVisMode) => {
    setVisMode(newVisMode);
    if (simulationInstance && currentView === "ELECTROSTATICS") {
      simulationInstance.setVisualizationMode(newVisMode);
    }
  };

  const handlePlayPause = () => {
    const newState = !isElectrostaticsPlaying;
    setIsElectrostaticsPlaying(newState);
    if (simulationInstance && currentView === "ELECTROSTATICS") {
      simulationInstance.setPlaying(newState);
    }
  };

  const handleResetPositions = () => {
    setIsElectrostaticsPlaying(false);
    if (simulationInstance && currentView === "ELECTROSTATICS") {
      simulationInstance.resetPositions();
    }
  };

  const handleAddCharge = (q) => {
    if (simulationInstance && currentView === "ELECTROSTATICS") {
      simulationInstance.addCharge(q);
    }
  };

  const handleScenarioChange = (scenario) => {
    if (simulationInstance && currentView === "ELECTROSTATICS") {
      simulationInstance.loadScenario(scenario);
    }
  };

  const handleSpawnAtom = () => {
    if (simulationInstance && currentView === "ELECTROSTATICS") {
      simulationInstance.spawnAtom();
    }
  };

  // Wave Handlers
  const handleFrequencyChange = (newFreq) => {
    setFrequency(newFreq);
    if (simulationInstance && currentView === "WAVES") {
      simulationInstance.setFrequency(newFreq);
    }
  };

  const handleMaterialChange = (materialType) => {
    if (simulationInstance && currentView === "WAVES") {
      simulationInstance.setMaterial(materialType);
    }
  };

  const handleRotate = () => {
    if (simulationInstance && currentView === "WAVES") {
      simulationInstance.rotateBrush();
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-zinc-900 font-sans">
      {/* Main Menu */}
      {currentView === "MENU" && <MainMenu onNavigate={handleNavigate} />}

      {/* Info Modal */}
      {showInfoModal && (
        <InfoModal
          title={modalContent.title}
          description={modalContent.description}
          onClose={() => setShowInfoModal(false)}
        />
      )}

      {/* Back Navigation - Floating Island */}
      {currentView !== "MENU" && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => handleNavigate("MENU")}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border border-zinc-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-medium tracking-wide">Back to Menu</span>
          </button>
        </div>
      )}

      {/* Overlays */}
      {currentView === "ELECTROSTATICS" && (
        <>
          <ElectrostaticsOverlay
            charge={selectedCharge}
            onChargeChange={handleChargeChange}
            visMode={visMode}
            onVisModeChange={handleVisModeChange}
            isPlaying={isElectrostaticsPlaying}
            onPlayPause={handlePlayPause}
            onReset={handleResetPositions}
            onAddCharge={handleAddCharge}
            onScenarioChange={handleScenarioChange}
            onSpawnAtom={handleSpawnAtom}
          />
          <InspectorPanel
            selectedCharge={selectedCharge}
            onUpdate={handleChargeUpdate}
          />
          {/* Drag Hint */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-3 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-full shadow-xl text-zinc-300 pointer-events-none animate-pulse">
            <svg
              className="w-5 h-5 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
              />
            </svg>
            <span className="font-medium text-sm">
              Drag charges to move them
            </span>
          </div>
        </>
      )}

      {currentView === "WAVES" && (
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
          onNextLevel={() => {
            setPlacedMirrors([]);
            if (simulationInstance) {
              simulationInstance.setMirrors([]);
              simulationInstance.regenerateLevel();
            }
          }}
          onMaterialChange={handleMaterialChange}
          onRotate={handleRotate}
        />
      )}

      {currentView === "ARCADE" && <ArcadeOverlay />}

      {/* Creator's Insight */}
      {currentView !== "MENU" && <InsightCard mode={currentView} />}

      {/* Simulation Canvas with Suspense */}
      {currentView !== "MENU" && (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-400 font-sans">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p>Loading physics engine...</p>
              </div>
            </div>
          }
        >
          {currentView === "ELECTROSTATICS" && (
            <ElectrostaticsView onInit={handleSimulationInit} />
          )}
          {currentView === "WAVES" && (
            <WavesView onInit={handleSimulationInit} />
          )}
          {currentView === "ARCADE" && (
            <ArcadeView onInit={handleSimulationInit} />
          )}
        </Suspense>
      )}
    </div>
  );
}

export default App;
