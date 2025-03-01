"use client";
import React from "react";

type TelemetryDataProps = {
  velocity: { x: number; y: number; z: number };
};

export default function TelemetryData({ velocity }: TelemetryDataProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h2 className="text-lg font-semibold mb-2">Velocity Data</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">X-AXIS</p>
          <p className="text-2xl font-mono">
            {velocity.x} <span className="text-sm">m/s</span>
          </p>
        </div>
        <div className="bg-slate-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Y-AXIS</p>
          <p className="text-2xl font-mono">
            {velocity.y} <span className="text-sm">m/s</span>
          </p>
        </div>
        <div className="bg-slate-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Z-AXIS</p>
          <p className="text-2xl font-mono">
            {velocity.z} <span className="text-sm">m/s</span>
          </p>
        </div>
      </div>
    </div>
  );
} 