"use client";

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Image from 'next/image';
import VideoFeed from './components/VideoFeed';
import TelemetryData from './components/TelemetryData';
import GPSMap from './components/GPSMap';
import BatteryStatus from './components/BatteryStatus';
import SystemStatus from './components/SystemStatus';

export default function Home() {
  // State for handling UI elements (would be connected to actual data in production)
  const [battery, setBattery] = useState({ level: 85, voltage: 12.4, temperature: 25 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [geoError, setGeoError] = useState<string | null>(null);
  
  useEffect(() => {
    getLocation();
    const socket = io('http://127.0.0.1:5328', { transports: ['websocket'] });
    socket.on('connect', () => console.log('Socket connected', socket.id));
    socket.on('connect_error', (error) => console.error('Socket connection error', error));
    socket.on('velocity', (data) => setVelocity(data));
    socket.on('battery', (data) => setBattery(data));
    return () => { socket.disconnect(); };
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        setGeoError("Unable to retrieve your location");
        console.error("Geolocation error:", error);
      }
    );
  };

  // Function to handle bomb release (just UI feedback for now)
  const handleBombRelease = () => {
    // This would connect to actual bomb release system in production
    alert("Bomb release command initiated!");
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
          <GPSMap coordinates={coordinates} onCenter={getLocation} />
          <BatteryStatus battery={battery} />
          <SystemStatus />
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
