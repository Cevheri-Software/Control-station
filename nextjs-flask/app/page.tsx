"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  // State for handling UI elements (would be connected to actual data in production)
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [coordinates, setCoordinates] = useState({ lat: 37.7749, lng: -122.4194 });
  
  // Function to handle bomb release (just UI feedback for now)
  const handleBombRelease = () => {
    // This would connect to actual bomb release system in production
    alert("Bomb release command initiated!");
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-900 text-white p-4">
      <header className="w-full py-4 border-b border-slate-700">
        <div className="flex justify-center items-center">
          <div className="relative">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              CEVHERI
            </div>
            <div className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
          <h1 className="text-2xl font-bold ml-3">Drone Control Station</h1>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 mt-4 h-full flex-grow">
        {/* Left Column: Video Feed and Controls */}
        <div className="flex flex-col lg:w-2/3 gap-4">
          {/* Video Feed */}
          <div className="bg-black rounded-lg overflow-hidden border border-slate-700 flex-grow relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Live Camera Feed</p>
              {/* In a real implementation, this would be replaced with actual video streaming component */}
            </div>
            {/* Overlay for data */}
            <div className="absolute top-0 left-0 p-4">
              <div className="bg-black/70 p-2 rounded">
                <p className="text-xs text-green-400">RECORDING</p>
              </div>
            </div>
            {/* Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button className="bg-slate-800 hover:bg-slate-700 p-2 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </button>
                  <button className="bg-slate-800 hover:bg-slate-700 p-2 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                  </button>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded flex items-center gap-2 font-medium" onClick={handleBombRelease}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  RELEASE BOMB
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Data */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h2 className="text-lg font-semibold mb-2">Velocity Data</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-gray-400 text-sm">X-AXIS</p>
                <p className="text-2xl font-mono">{velocity.x} <span className="text-sm">m/s</span></p>
              </div>
              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-gray-400 text-sm">Y-AXIS</p>
                <p className="text-2xl font-mono">{velocity.y} <span className="text-sm">m/s</span></p>
              </div>
              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-gray-400 text-sm">Z-AXIS</p>
                <p className="text-2xl font-mono">{velocity.z} <span className="text-sm">m/s</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Map and Battery Status */}
        <div className="flex flex-col lg:w-1/3 gap-4">
          {/* GPS Map */}
          <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex-grow relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">GPS Map View</p>
              {/* In a real implementation, this would be replaced with an actual map component */}
            </div>
            {/* Coordinates overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/70">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">COORDINATES</p>
                  <p className="font-mono">{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-sm">
                  Center
                </button>
              </div>
            </div>
          </div>

          {/* Battery Status */}
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
                <div style={{ width: `${batteryLevel}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  batteryLevel > 50 ? 'bg-green-500' : batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
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

          {/* Status Indicators */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h2 className="text-lg font-semibold mb-2">System Status</h2>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>GPS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Comms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Signal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-4 text-right text-xs text-slate-500 pr-3 pb-2">
        <div className="inline-block relative">
          <span className="font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">CEVHERI</span>
          <span className="ml-1">SYSTEMS</span>
          <div className="absolute -top-1 -right-4 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
        </div>
      </footer>
    </main>
  );
}
