"use client";

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import TelemetryData from './components/TelemetryData';
import dynamic from 'next/dynamic';
// Dynamically load GPSMap on client-side only to fix React context errors
const GPSMap = dynamic(() => import('./components/GPSMap'), { ssr: false });
import BatteryStatus from './components/BatteryStatus';
import DroneControls from './components/SystemStatus';
import Compass from './components/Compass';

export default function Home() {
  // State for handling UI elements
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [dronePosition, setDronePosition] = useState<{ lat: number; lng: number } | null>(null);
  
  useEffect(() => {
    const socket = io('http://127.0.0.1:5328', { transports: ['websocket'] });
    
    socket.on('connect', () => console.log('Socket connected', socket.id));
    socket.on('connect_error', (error) => console.error('Socket connection error', error));
    
    // Listen for telemetry data
    socket.on('velocity', (data) => setVelocity(data));
    
    // Listen for drone position updates from QGroundControl
    socket.on('position', (data) => {
      console.log('📍 Received drone position from QGroundControl:', data);
      if (data.lat !== 0 && data.lon !== 0) {
        setDronePosition({ lat: data.lat, lng: data.lon });
      }
    });
    
    return () => { socket.disconnect(); };
  }, []);

  // Function to center map on drone position
  const centerOnDrone = () => {
    if (dronePosition) {
      console.log('Centering map on drone position:', dronePosition);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-900 text-white p-4">
      <header className="w-full py-4 border-b border-gray-700 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold uppercase tracking-wider">CEVHERI DEFENSE SYSTEMS</h1>
            <div className="ml-2 bg-green-600 h-2 w-2 rounded-full"></div>
          </div>
          <div className="text-sm text-gray-400">MISSION CONTROL STATION</div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow">
        {/* Left Column: Large Map Display */}
        <div className="flex flex-col lg:w-2/3 gap-4">
          {dronePosition ? (
            <GPSMap 
              coordinates={dronePosition} 
              onCenter={centerOnDrone} 
              className="h-[600px]"
            />
          ) : (
            <div className="bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative h-[600px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 font-mono text-sm mb-2">🛰️ WAITING FOR DRONE GPS...</p>
                  <p className="text-gray-600 font-mono text-xs">Connect QGroundControl to view mission</p>
                  <div className="mt-4 animate-pulse">
                    <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Telemetry Data below map */}
          <TelemetryData velocity={velocity} />
        </div>

        {/* Right Column: Controls and Status */}
        <div className="flex flex-col lg:w-1/3 gap-4">
          {/* Compass and Attitude */}
          <Compass />
          
          {/* Battery Status */}
          <BatteryStatus />
          
          {/* Drone Controls */}
          <DroneControls />
          
          {/* Mission Status Panel */}
          <div className="bg-gray-900 border border-gray-700 rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider">Mission Status</h3>
              <div className="text-xs text-green-500 uppercase font-mono">Active</div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-800 p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400 uppercase font-bold">Flight Mode</span>
                  <span className="text-xs font-mono text-blue-400">AUTO.MISSION</span>
                </div>
                <div className="text-sm font-mono text-white">Autonomous Navigation</div>
              </div>
              
              <div className="bg-gray-800 p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400 uppercase font-bold">Home Position</span>
                  <span className="text-xs font-mono text-green-400">SET</span>
                </div>
                <div className="text-xs font-mono text-gray-300">
                  {dronePosition ? 
                    `${dronePosition.lat.toFixed(4)}, ${dronePosition.lng.toFixed(4)}` : 
                    'Waiting for GPS...'
                  }
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400 uppercase font-bold">Safety</span>
                  <span className="text-xs font-mono text-yellow-400">ARMED</span>
                </div>
                <div className="text-xs font-mono text-gray-300">RTL on signal loss</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-4 text-right text-xs text-gray-600 pr-3 pb-2">
        <div className="inline-flex items-center">
          <span className="font-bold uppercase">CEVHERI SYSTEMS</span>
          <span className="ml-1 text-gray-500">// MISSION CONTROL</span>
        </div>
      </footer>
    </main>
  );
}
