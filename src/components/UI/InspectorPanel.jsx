import React from "react";

const InspectorPanel = ({ selectedCharge, onUpdate }) => {
  if (!selectedCharge) return null;

  const handleChange = (field, value) => {
    onUpdate(selectedCharge.id, { [field]: value });
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-zinc-800 shadow-2xl p-8 z-20 overflow-y-auto text-zinc-300 border-l border-zinc-700 transition-transform duration-300 ease-in-out transform translate-x-0 font-sans">
      <h2 className="text-2xl font-bold mb-8 border-b pb-4 border-zinc-700 text-zinc-100">
        Particle Inspector
      </h2>

      <div className="space-y-8">
        {/* Charge */}
        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-2">
            Charge (Q)
          </label>
          <input
            type="number"
            value={selectedCharge.q}
            onChange={(e) => handleChange("q", parseFloat(e.target.value))}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        {/* Mass */}
        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-2">
            Mass (M)
          </label>
          <input
            type="number"
            value={selectedCharge.mass}
            min="0.1"
            step="0.1"
            onChange={(e) => handleChange("mass", parseFloat(e.target.value))}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-2">
            Radius (R)
          </label>
          <input
            type="number"
            value={selectedCharge.radius}
            min="5"
            max="100"
            onChange={(e) => handleChange("radius", parseFloat(e.target.value))}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        {/* Fixed Position */}
        <div className="flex items-center bg-zinc-900 p-4 rounded-xl border border-zinc-700">
          <input
            type="checkbox"
            id="isFixed"
            checked={selectedCharge.isFixed}
            onChange={(e) => handleChange("isFixed", e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-zinc-600 rounded bg-zinc-800"
          />
          <label
            htmlFor="isFixed"
            className="ml-3 block text-sm font-bold text-zinc-300"
          >
            Fixed Position
          </label>
        </div>

        {/* Position Editing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">
              Pos X
            </label>
            <input
              type="number"
              value={Math.round(selectedCharge.pos.x)}
              onChange={(e) => handleChange("posX", parseFloat(e.target.value))}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">
              Pos Y
            </label>
            <input
              type="number"
              value={Math.round(selectedCharge.pos.y)}
              onChange={(e) => handleChange("posY", parseFloat(e.target.value))}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Velocity Editing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Vel X
            </label>
            <input
              type="number"
              value={Math.round(selectedCharge.vel.x)}
              onChange={(e) => handleChange("velX", parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Vel Y
            </label>
            <input
              type="number"
              value={Math.round(selectedCharge.vel.y)}
              onChange={(e) => handleChange("velY", parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 text-xs text-slate-500 border-t border-slate-200 mt-4">
          <p>ID: {Math.floor(selectedCharge.id)}</p>
        </div>
      </div>
    </div>
  );
};

export default InspectorPanel;
