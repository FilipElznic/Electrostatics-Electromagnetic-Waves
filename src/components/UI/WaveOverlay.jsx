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
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm z-50 pointer-events-auto">
          <div className="bg-zinc-800 p-8 rounded-3xl border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 text-center max-w-md transform animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">
              Level Complete!
            </h2>
            <p className="text-zinc-400 mb-8">
              Target acquired. Signal strength at maximum capacity.
            </p>
            <button
              onClick={onNextLevel}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/20"
            >
              Next Level ➡️
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-6 right-6 bg-zinc-800 p-6 rounded-3xl border border-zinc-700 text-zinc-100 w-72 shadow-xl font-sans">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"
              />
            </svg>
          </div>
          <h3 className="font-bold text-lg text-zinc-100">Signal Bouncer</h3>
        </div>

        <div className="space-y-6">
          {/* Signal Strength Meter */}
          <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-700/50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400 font-medium">Signal Strength</span>
              <span className="font-mono text-indigo-400 font-bold">
                {Math.round(signalStrength)}%
              </span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-rose-500 transition-all duration-200"
                style={{ width: `${signalStrength}%` }}
              />
            </div>
          </div>

          {/* Tools */}
          <div>
            <button
              onClick={onRotate}
              className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm font-bold flex items-center justify-center gap-2 shadow-sm border border-zinc-600"
              title="Rotate drawing angle (R)"
            >
              <span>Rotate Mirror (R)</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
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

          <button
            onClick={onReset}
            className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm font-bold flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
              />
            </svg>
            Reset Mirrors
          </button>

          <div className="text-xs text-zinc-400 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-700/50">
            <p className="mb-2 font-bold text-rose-400">Mission Brief:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Bounce the signal to the target.</li>
              <li>Left Click to place mirrors.</li>
              <li>Avoid obstacles.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
