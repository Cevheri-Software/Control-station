"use client";
import React from "react";

type BatteryStatusProps = {
  batteryLevel: number;
};

export default function BatteryStatus({ batteryLevel }: BatteryStatusProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h2 className="text-lg font-semibold mb-2">Smart Battery</h2>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-green-200 text-green-800">
              {batteryLevel}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-gray-400">
              EST. TIME: 22 MIN
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-700">
          <div
            style={{ width: `${batteryLevel}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
              batteryLevel > 50
                ? "bg-green-500"
                : batteryLevel > 20
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          ></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700 p-2 rounded-lg">
            <p className="text-gray-400 text-xs">VOLTAGE</p>
            <p className="font-mono">11.8 V</p>
          </div>
          <div className="bg-slate-700 p-2 rounded-lg">
            <p className="text-gray-400 text-xs">TEMPERATURE</p>
            <p className="font-mono">32°C</p>
          </div>
        </div>
      </div>
    </div>
  );
} 