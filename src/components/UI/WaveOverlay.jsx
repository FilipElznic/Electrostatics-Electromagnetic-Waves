import React, { useState } from "react";

export default function WaveOverlay({
  frequency,
  onFrequencyChange,
  signalStrength,
  onReset,
  onNextLevel,
  onMaterialChange,
  onRotate,
}) {
  const [selectedMaterial, setSelectedMaterial] = useState(1); // 1 = Metal, 2 = Absorber

  const handleSelectMaterial = (mat) => {
    setSelectedMaterial(mat);
    onMaterialChange(mat);
  };

  const isLevelComplete = signalStrength >= 100;

  return (
    <>
      {/* Level Complete Modal */}
      {isLevelComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 pointer-events-auto">
          <div className="bg-slate-800 p-8 rounded-2xl border-2 border-green-500 shadow-2xl shadow-green-500/20 text-center max-w-md transform animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Level Complete!
            </h2>
            <p className="text-slate-300 mb-8">
              Target acquired. Signal strength at maximum capacity.
            </p>
            <button
              onClick={onNextLevel}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Next Level ➡️
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-16 right-4 bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-white w-64 backdrop-blur-sm pointer-events-auto">
        <h3 className="font-bold mb-2 text-lg">Signal Bouncer</h3>

        <div className="space-y-4">
          {/* Tools */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tools</label>
            <button
              onClick={onRotate}
              className="w-full mt-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded transition-colors text-xs font-bold flex items-center justify-center gap-2"
              title="Rotate drawing angle (R)"
            >
              <span>Rotate Mirror (R)</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>
          </div>

          {/* Signal Strength Meter */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Signal Strength</span>
              <span className="font-mono text-green-400">
                {Math.round(signalStrength)}%
              </span>
            </div>
            <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
              <div
                className="h-full bg-linear-to-r from-green-600 to-green-400 transition-all duration-200"
                style={{ width: `${signalStrength}%` }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Source Frequency
            </label>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.01"
              value={frequency}
              onChange={(e) => onFrequencyChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <div className="flex justify-between text-xs mt-1 font-mono">
              <span>Low</span>
              <span className="text-green-400">{frequency.toFixed(2)}</span>
              <span>High</span>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-900/50 rounded transition-colors text-sm font-bold"
          >
            Reset Mirrors
          </button>

          <div className="text-xs text-slate-500 italic border-t border-slate-700 pt-2 mt-2">
            <p>Goal: Bounce the signal to the target.</p>
            <p>Left Click: Place Mirror</p>
          </div>
        </div>
      </div>
    </>
  );
}
