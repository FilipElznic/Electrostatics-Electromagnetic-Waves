import React from "react";

const InspectorPanel = ({ selectedCharge, onUpdate }) => {
  if (!selectedCharge) return null;

  const handleChange = (field, value) => {
    onUpdate(selectedCharge.id, { [field]: value });
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white/90 shadow-lg p-6 z-20 overflow-y-auto backdrop-blur-sm text-slate-800 transition-transform duration-300 ease-in-out transform translate-x-0">
      <h2 className="text-xl font-bold mb-6 border-b pb-2 border-slate-300">
        Particle Inspector
      </h2>

      <div className="space-y-6">
        {/* Charge */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Charge (Q)
          </label>
          <input
            type="number"
            value={selectedCharge.q}
            onChange={(e) => handleChange("q", parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Mass */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mass (M)
          </label>
          <input
            type="number"
            value={selectedCharge.mass}
            min="0.1"
            step="0.1"
            onChange={(e) => handleChange("mass", parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Radius (R)
          </label>
          <input
            type="number"
            value={selectedCharge.radius}
            min="5"
            max="100"
            onChange={(e) => handleChange("radius", parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Fixed Position */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFixed"
            checked={selectedCharge.isFixed}
            onChange={(e) => handleChange("isFixed", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isFixed"
            className="ml-2 block text-sm text-slate-700"
          >
            Fixed Position
          </label>
        </div>

        {/* Position Editing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pos X
            </label>
            <input
              type="number"
              value={Math.round(selectedCharge.pos.x)}
              onChange={(e) => handleChange("posX", parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pos Y
            </label>
            <input
              type="number"
              value={Math.round(selectedCharge.pos.y)}
              onChange={(e) => handleChange("posY", parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
