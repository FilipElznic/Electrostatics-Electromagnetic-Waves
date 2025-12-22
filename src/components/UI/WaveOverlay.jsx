import React from "react";

export default function WaveOverlay({
  frequency,
  onFrequencyChange,
  signalStrength,
  onReset,
}) {
  return (
    <div className="absolute top-16 right-4 bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-white w-64 backdrop-blur-sm pointer-events-auto">
      <h3 className="font-bold mb-2 text-lg">Signal Bouncer</h3>

      <div className="space-y-4">
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
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-200"
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
            max="0.5"
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
          Reset Walls
        </button>

        <div className="text-xs text-slate-500 italic border-t border-slate-700 pt-2 mt-2">
          <p>Goal: Bounce the signal to the target.</p>
          <p>Left Click: Draw Wall</p>
          <p>Right Click: Erase Wall</p>
        </div>
      </div>
    </div>
  );
}
