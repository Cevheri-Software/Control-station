"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import VideoFeed from './components/VideoFeed';
import TelemetryData from './components/TelemetryData';
import GPSMap from './components/GPSMap';
import BatteryStatus from './components/BatteryStatus';
import SystemStatus from './components/SystemStatus';

export default function Home() {
  // State for handling UI elements (would be connected to actual data in production)
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [geoError, setGeoError] = useState<string | null>(null);
  
  useEffect(() => {
    getLocation();
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
          <VideoFeed onBombRelease={handleBombRelease} />
          <TelemetryData velocity={velocity} />
        </div>

        {/* Right Column: Map and Battery Status */}
        <div className="flex flex-col lg:w-1/3 gap-4">
          <GPSMap coordinates={coordinates} onCenter={getLocation} />
          <BatteryStatus batteryLevel={batteryLevel} />
          <SystemStatus />
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
