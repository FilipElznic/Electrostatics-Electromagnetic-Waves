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
    <div className="absolute top-6 right-6 bg-zinc-800 p-6 rounded-3xl border border-zinc-700 text-zinc-100 w-72 shadow-xl font-sans">
      {/* Simulation Controls */}
      <div className="mb-6 border-b border-zinc-700 pb-6">
        <h3 className="font-bold mb-3 text-lg text-zinc-100">Simulation</h3>
        <div className="flex gap-2 mb-3">
          <button
            onClick={onPlayPause}
            className={`flex-1 py-3 px-4 rounded-full text-sm font-bold transition-all shadow-lg hover:scale-105 active:scale-95 ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
            }`}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-3 px-4 rounded-full text-sm font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-all hover:scale-105 active:scale-95"
          >
            Reset
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAddCharge(50)}
            className="flex-1 py-2 px-3 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20"
          >
            + Charge
          </button>
          <button
            onClick={() => onAddCharge(-50)}
            className="flex-1 py-2 px-3 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            - Charge
          </button>
        </div>
      </div>

      {/* Tools */}
      <div className="mb-6 border-b border-zinc-700 pb-6">
        <h3 className="font-bold mb-3 text-lg text-zinc-100">Spawn Tools</h3>
        <button
          onClick={onSpawnAtom}
          className="w-full py-3 px-4 rounded-full text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
        >
          <span>⚛️</span> Spawn Atom
        </button>
      </div>

      {/* Scenarios */}
      <div className="mb-6 border-b border-zinc-700 pb-6">
        <h3 className="font-bold mb-3 text-lg text-zinc-100">Scenarios</h3>
        <select
          onChange={(e) => onScenarioChange(e.target.value)}
          className="w-full bg-zinc-900 text-zinc-300 text-sm rounded-xl p-3 border border-zinc-700 focus:border-indigo-500 outline-none cursor-pointer"
        >
          <option value="default">Default (3+ 2-)</option>
          <option value="dipole">Dipole</option>
          <option value="quadrupole">Quadrupole</option>
          <option value="line">Line</option>
          <option value="random">Random Cloud</option>
        </select>
      </div>

      {/* Global Settings */}
      <div className="mb-6 border-b border-zinc-700 pb-6">
        <h3 className="font-bold mb-3 text-lg text-zinc-100">Visualization</h3>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-700">
          <button
            onClick={() => onVisModeChange("vectors")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              visMode === "vectors"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Vectors
          </button>
          <button
            onClick={() => onVisModeChange("lines")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              visMode === "lines"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Lines
          </button>
        </div>
      </div>

      {/* Charge Properties */}
      {charge ? (
        <div className="space-y-4">
          <h3 className="font-bold mb-2 text-lg text-zinc-100">
            Charge Properties
          </h3>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Charge Magnitude (q)
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              value={charge.q}
              onChange={(e) => onChargeChange(Number(e.target.value))}
              className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs mt-2 font-mono text-zinc-500">
              <span>-100</span>
              <span
                className={
                  charge.q > 0
                    ? "text-rose-400"
                    : charge.q < 0
                    ? "text-blue-400"
                    : "text-zinc-400"
                }
              >
                {charge.q}
              </span>
              <span>+100</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-500 italic text-center bg-zinc-900/50 p-3 rounded-xl">
          Select a charge to edit properties.
        </div>
      )}
    </div>
  );
}
