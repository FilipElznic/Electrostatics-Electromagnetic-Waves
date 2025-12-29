import React from "react";

const INSIGHTS = {
  WAVES:
    "Electromagnetic waves are everywhere, yet invisible. I built this simulation to make the invisible visible. It allows players to experience firsthand how waves propagate, reflect, and can be directed. It’s the most natural way to truly understand wireless communication.",
  ARCADE:
    "I wanted users to not just see physics, but to literally feel it at their fingertips. This game transforms Coulomb’s Law into a core game mechanic. To win, players must instinctively react to changing polarity, mastering how electric charges interact.",
  ELECTROSTATICS:
    "Static textbook images can't explain why matter doesn't collapse. I added this feature to let anyone be an atom architect. It demonstrates the fragile balance between velocity and electric force, allowing users to build stable orbits or unleash chaos.",
};

const InsightCard = ({ mode }) => {
  const text = INSIGHTS[mode];
  if (!text) return null;

  // Split text: First sentence (ending in .) vs the rest.
  const firstSentenceEnd = text.indexOf(".") + 1;
  const preview = text.slice(0, firstSentenceEnd);
  const detail = text.slice(firstSentenceEnd).trim();

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm group font-sans">
      <div className="bg-zinc-800 text-zinc-200 rounded-2xl shadow-xl border border-zinc-700 p-4 transition-all duration-300 ease-out hover:shadow-2xl hover:border-indigo-500/50 cursor-help">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 bg-indigo-500/10 rounded-full text-indigo-400 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-1">
              Creator's Insight
            </h4>
            <p className="text-sm leading-relaxed">
              <span className="font-medium text-zinc-100">{preview}</span>
              <span className="grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 transition-all duration-300 ease-out">
                <span className="overflow-hidden block pt-2 text-zinc-300">
                  {detail}
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
