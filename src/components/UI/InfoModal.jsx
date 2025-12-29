import React from "react";

const InfoModal = ({ title, description, onClose }) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-zinc-800 border border-zinc-700 rounded-3xl p-10 max-w-2xl w-full shadow-2xl transform transition-all scale-100">
        <h2 className="text-4xl font-bold text-zinc-100 mb-8 border-b border-zinc-700 pb-6">
          {title}
        </h2>

        <div className="text-zinc-300 text-lg leading-relaxed space-y-4 mb-10">
          {description.split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-3 hover:scale-105 active:scale-95"
          >
            <span>Start Simulation</span>
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
