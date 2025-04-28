"use client";
import React from "react";

export default function SystemStatus() {
  return (
    <div className="bg-gray-900 rounded-sm p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">System Status</h2>
        <div className="text-xs text-green-500 uppercase font-mono">Ready</div>
      </div>
      
      <div className="grid grid-cols-2 gap-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm uppercase">GPS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm uppercase">Comms</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span className="text-sm uppercase">Signal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm uppercase">Targeting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm uppercase">Propulsion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm uppercase">Payload</span>
        </div>
      </div>
    </div>
  );
} 