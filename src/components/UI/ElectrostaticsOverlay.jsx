import React from "react";

export default function ElectrostaticsOverlay({
  charge,
  onChargeChange,
  visMode,
  onVisModeChange,
  isPlaying,
  onPlayPause,
  onReset,
  onAddCharge,
  onScenarioChange,
  onSpawnAtom,
}) {
  return (
    <div className="absolute top-16 right-4 bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-white w-64 backdrop-blur-sm pointer-events-auto max-h-[80vh] overflow-y-auto">
      {/* Simulation Controls */}
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h3 className="font-bold mb-2 text-lg">Simulation</h3>
        <div className="flex gap-2 mb-2">
          <button
            onClick={onPlayPause}
            className={`flex-1 py-2 px-2 rounded text-sm font-bold transition-colors ${
              isPlaying
                ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                : "bg-green-600 hover:bg-green-500 text-white"
            }`}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-2 px-2 rounded text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            Reset
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAddCharge(50)}
            className="flex-1 py-1 px-2 rounded text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            + Charge
          </button>
          <button
            onClick={() => onAddCharge(-50)}
            className="flex-1 py-1 px-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            - Charge
          </button>
        </div>
      </div>

      {/* Tools */}
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h3 className="font-bold mb-2 text-lg">Spawn Tools</h3>
        <button
          onClick={onSpawnAtom}
          className="w-full py-2 px-2 rounded text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center justify-center gap-2"
        >
          <span>⚛️</span> Spawn Atom
        </button>
      </div>

      {/* Scenarios */}
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h3 className="font-bold mb-2 text-lg">Scenarios</h3>
        <select
          onChange={(e) => onScenarioChange(e.target.value)}
          className="w-full bg-slate-700 text-white text-sm rounded p-2 border border-slate-600 focus:border-blue-500 outline-none cursor-pointer"
        >
          <option value="default">Default (3+ 2-)</option>
          <option value="dipole">Dipole</option>
          <option value="quadrupole">Quadrupole</option>
          <option value="line">Line</option>
          <option value="random">Random Cloud</option>
        </select>
      </div>

      {/* Global Settings */}
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h3 className="font-bold mb-2 text-lg">Visualization</h3>
        <div className="flex gap-2 bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => onVisModeChange("vectors")}
            className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${
              visMode === "vectors"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Vector Field
          </button>
          <button
            onClick={() => onVisModeChange("lines")}
            className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${
              visMode === "lines"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Field Lines
          </button>
        </div>
      </div>

      {/* Charge Properties */}
      {charge ? (
        <div className="space-y-4">
          <h3 className="font-bold mb-2 text-lg">Charge Properties</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Charge Magnitude (q)
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              value={charge.q}
              onChange={(e) => onChargeChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs mt-1 font-mono">
              <span>-100</span>
              <span
                className={
                  charge.q > 0
                    ? "text-red-400"
                    : charge.q < 0
                    ? "text-blue-400"
                    : "text-gray-400"
                }
              >
                {charge.q}
              </span>
              <span>+100</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic text-center">
          Select a charge to edit properties.
        </div>
      )}
    </div>
  );
}
