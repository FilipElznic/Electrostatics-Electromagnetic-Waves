import React from "react";

export default function ArcadeOverlay() {
  return (
    <div className="absolute top-6 right-6 bg-zinc-800 p-6 rounded-3xl border border-zinc-700 text-zinc-100 w-72 shadow-xl font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
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
              d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-lg text-zinc-100">Polarity Parkour</h3>
      </div>

      <div className="space-y-4 text-sm text-zinc-300">
        <div className="flex justify-between items-center border-b border-zinc-700 pb-3">
          <span className="font-medium">Jump</span>
          <kbd className="px-3 py-1.5 bg-zinc-700 rounded-lg border-b-2 border-zinc-600 font-mono text-xs text-zinc-200 shadow-sm">
            Space
          </kbd>
        </div>
        <div className="flex justify-between items-center border-b border-zinc-700 pb-3">
          <span className="font-medium">Toggle Polarity</span>
          <kbd className="px-3 py-1.5 bg-zinc-700 rounded-lg border-b-2 border-zinc-600 font-mono text-xs text-zinc-200 shadow-sm">
            Shift
          </kbd>
        </div>
        <div className="flex justify-between items-center border-b border-zinc-700 pb-3">
          <span className="font-medium">Magnet Jump</span>
          <kbd className="px-3 py-1.5 bg-zinc-700 rounded-lg border-b-2 border-zinc-600 font-mono text-xs text-zinc-200 shadow-sm">
            W / ↑
          </kbd>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Reset Level</span>
          <kbd className="px-3 py-1.5 bg-zinc-700 rounded-lg border-b-2 border-zinc-600 font-mono text-xs text-zinc-200 shadow-sm">
            R
          </kbd>
        </div>
      </div>

      <div className="mt-6 text-xs text-zinc-400 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-700/50">
        <p className="mb-2 font-bold text-indigo-400">Pro Tips:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Opposites attract (Green Line).</li>
          <li>Likes repel (Red Line).</li>
          <li>Use repulsion to launch yourself!</li>
        </ul>
      </div>
    </div>
  );
}
