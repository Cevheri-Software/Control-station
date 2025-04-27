"use client";
import React from "react";

type BatteryStatusProps = {
  battery: {
    level: number;
    voltage: number;
    temperature: number;
  };
};

export default function BatteryStatus({ battery }: BatteryStatusProps) {
  return (
    <div className="bg-gray-900 rounded-sm p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">Power Systems</h2>
        <div className="text-xs text-gray-500 uppercase">Status: Operational</div>
      </div>
      
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className={`text-xs font-mono inline-block py-1 px-2 border ${
              battery.level > 50
                ? "border-green-700 text-green-500"
                : battery.level > 20
                ? "border-yellow-700 text-yellow-500"
                : "border-red-700 text-red-500"
            }`}>
              {battery.level}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-gray-400">
              ETA: 00:22:15
            </span>
          </div>
        </div>
        
        <div className="overflow-hidden h-1 mb-4 text-xs flex bg-gray-800 border border-gray-700">
          <div
            style={{ width: `${battery.level}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap justify-center ${
              battery.level > 50
                ? "bg-green-700"
                : battery.level > 20
                ? "bg-yellow-700"
                : "bg-red-700"
            }`}
          ></div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 p-2 border border-gray-700">
            <p className="text-gray-400 text-xs uppercase font-bold">Voltage</p>
            <p className="font-mono text-sm">{battery.voltage.toFixed(1)}V</p>
          </div>
          <div className="bg-gray-800 p-2 border border-gray-700">
            <p className="text-gray-400 text-xs uppercase font-bold">Temp</p>
            <p className="font-mono text-sm">{battery.temperature.toFixed(1)}°C</p>
          </div>
        </div>
      </div>
    </div>
  );
} 