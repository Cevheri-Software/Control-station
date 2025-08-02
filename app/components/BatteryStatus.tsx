"use client";
import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

type BatteryData = {
  level: number;
  voltage: number;
  temperature: number;
};

export default function BatteryStatus() {
  const [battery, setBattery] = useState<BatteryData>({ 
    level: 0, 
    voltage: 0, 
    temperature: 0 
  });
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5328");
    setSocket(newSocket);

    // Listen for real-time battery updates
    newSocket.on("battery", (data: BatteryData) => {
      console.log("🔋 Received battery telemetry:", data);
      setBattery(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Calculate estimated time remaining (rough calculation)
  const calculateETA = (level: number) => {
    if (level <= 0) return "00:00:00";
    // Rough estimate: assume 1% = 1 minute of flight time
    const minutesRemaining = level;
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = Math.floor(minutesRemaining % 60);
    const seconds = Math.floor((minutesRemaining % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900 rounded-sm p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">Smart Battery System</h2>
        <div className={`text-xs uppercase font-mono ${
          battery.level > 50 ? "text-green-500" :
          battery.level > 20 ? "text-yellow-500" : "text-red-500"
        }`}>
          {battery.level > 0 ? "Live" : "No Data"}
        </div>
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
              {battery.level.toFixed(1)}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-gray-400">
              ETA: {calculateETA(battery.level)}
            </span>
          </div>
        </div>
        
        <div className="overflow-hidden h-1 mb-4 text-xs flex bg-gray-800 border border-gray-700">
          <div
            style={{ width: `${Math.max(0, Math.min(100, battery.level))}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap justify-center transition-all duration-300 ${
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
            <p className="font-mono text-sm">{battery.voltage.toFixed(2)}V</p>
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