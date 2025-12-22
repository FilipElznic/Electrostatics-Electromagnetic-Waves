import React from "react";

export default function ElectrostaticsOverlay({ charge, onChargeChange }) {
  if (!charge) return null;

  return (
    <div className="absolute top-16 right-4 bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-white w-64 backdrop-blur-sm pointer-events-auto">
      <h3 className="font-bold mb-2 text-lg">Charge Properties</h3>

      <div className="space-y-4">
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

        <div className="text-xs text-slate-500 italic">
          Drag charges to move them.
        </div>
      </div>
    </div>
  );
}
