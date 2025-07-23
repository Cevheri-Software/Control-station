"use client";

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Image from 'next/image';
import VideoFeed from './components/VideoFeed';
import TelemetryData from './components/TelemetryData';
import GPSMap from './components/GPSMap';
import BatteryStatus from './components/BatteryStatus';
import DroneControls from './components/SystemStatus';

export default function Home() {
  // State for handling UI elements (would be connected to actual data in production)
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [dronePosition, setDronePosition] = useState<{ lat: number; lng: number } | null>(null); // No default coordinates
  
  useEffect(() => {
    const socket = io('http://127.0.0.1:5328', { transports: ['websocket'] });
    
    socket.on('connect', () => console.log('Socket connected', socket.id));
    socket.on('connect_error', (error) => console.error('Socket connection error', error));
    
    // Listen for telemetry data
    socket.on('velocity', (data) => setVelocity(data));
    // Note: Battery data is now handled directly in BatteryStatus component
    
    // Listen for drone position updates from QGroundControl
    socket.on('position', (data) => {
      console.log('📍 Received drone position from QGroundControl:', data);
      if (data.lat !== 0 && data.lon !== 0) {
        setDronePosition({ lat: data.lat, lng: data.lon });
      }
    });
    
    return () => { socket.disconnect(); };
  }, []);

  // Function to handle bomb release (just UI feedback for now)
  const handleBombRelease = () => {
    // This would connect to actual bomb release system in production
    alert("Bomb release command initiated!");
  };

  // Function to center map on drone position
  const centerOnDrone = () => {
    if (dronePosition) {
      console.log('Centering map on drone position:', dronePosition);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-900 text-white p-4">
      <header className="w-full py-4 border-b border-gray-700 mb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold uppercase tracking-wider">CEVHERI DEFENSE SYSTEMS</h1>
            <div className="ml-2 bg-green-600 h-2 w-2 rounded-full"></div>
          </div>
          <div className="text-sm text-gray-400">MISSION CONTROL STATION</div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 mt-2 h-full flex-grow">
        {/* Left Column: Video Feed and Controls */}
        <div className="flex flex-col lg:w-2/3 gap-4">
          <VideoFeed onBombRelease={handleBombRelease} />
          <TelemetryData velocity={velocity} />
        </div>

        {/* Right Column: Map and Battery Status */}
        <div className="flex flex-col lg:w-1/3 gap-4">
          {dronePosition ? (
            <GPSMap coordinates={dronePosition} onCenter={centerOnDrone} />
          ) : (
            <div className="bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative h-64">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 font-mono text-sm mb-2">WAITING FOR DRONE GPS...</p>
                  <p className="text-gray-600 font-mono text-xs">Connect QGroundControl to view position</p>
                </div>
              </div>
            </div>
          )}
          <BatteryStatus />
          <DroneControls />
        </div>
      </div>
      
      <footer className="mt-4 text-right text-xs text-gray-600 pr-3 pb-2">
        <div className="inline-flex items-center">
          <span className="font-bold uppercase">CEVHERI SYSTEMS</span>
          <span className="ml-1 text-gray-500">// CLASSIFIED</span>
        </div>
      </footer>
    </main>
  );
}
