"use client";
import React from "react";

type TelemetryDataProps = {
  velocity: { x: number; y: number; z: number };
};

export default function TelemetryData({ velocity }: TelemetryDataProps) {
  return (
    <div className="bg-gray-900 rounded-sm p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">Telemetry Data</h2>
        <div className="text-xs text-gray-500 uppercase">Secure Channel</div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 p-3 border border-gray-700 flex flex-col">
          <div className="flex justify-between">
            <p className="text-gray-400 text-xs uppercase font-bold">X-Axis</p>
            <p className="text-xs text-gray-500">VECTOR</p>
          </div>
          <p className="text-xl font-mono mt-1">
            {velocity.x} <span className="text-xs">m/s</span>
          </p>
        </div>
        <div className="bg-gray-800 p-3 border border-gray-700 flex flex-col">
          <div className="flex justify-between">
            <p className="text-gray-400 text-xs uppercase font-bold">Y-Axis</p>
            <p className="text-xs text-gray-500">VECTOR</p>
          </div>
          <p className="text-xl font-mono mt-1">
            {velocity.y} <span className="text-xs">m/s</span>
          </p>
        </div>
        <div className="bg-gray-800 p-3 border border-gray-700 flex flex-col">
          <div className="flex justify-between">
            <p className="text-gray-400 text-xs uppercase font-bold">Z-Axis</p>
            <p className="text-xs text-gray-500">VECTOR</p>
          </div>
          <p className="text-xl font-mono mt-1">
            {velocity.z} <span className="text-xs">m/s</span>
          </p>
        </div>
      </div>
    </div>
  );
} 