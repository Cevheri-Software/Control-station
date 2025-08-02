"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { io, Socket } from "socket.io-client";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Dynamically import the entire map component to prevent SSR issues
const LeafletMap = dynamic(() => import("./LeafletMapComponent"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><div className="text-gray-400 text-sm">Loading map...</div></div>
});

type GPSMapProps = {
  coordinates: { lat: number; lng: number };
  onCenter?: () => void;
  className?: string;
};

type DronePosition = {
  lat: number;
  lon: number;
  abs_alt: number;
};

type MissionWaypoint = {
  id: number;
  lat: number;
  lng: number;
  alt: number;
  type: 'takeoff' | 'waypoint' | 'land' | 'rtl';
  completed: boolean;
};

export default function GPSMap({ coordinates, onCenter, className }: GPSMapProps) {
  const [dronePosition, setDronePosition] = useState<DronePosition | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [flightPath, setFlightPath] = useState<[number, number][]>([]);
  const [missionWaypoints, setMissionWaypoints] = useState<MissionWaypoint[]>([
    { id: 1, lat: 47.3977419, lng: 8.5455938, alt: 20, type: 'takeoff', completed: true },
    { id: 2, lat: 47.3979419, lng: 8.5457938, alt: 25, type: 'waypoint', completed: false },
    { id: 3, lat: 47.3981419, lng: 8.5459938, alt: 30, type: 'waypoint', completed: false },
    { id: 4, lat: 47.3983419, lng: 8.5461938, alt: 25, type: 'waypoint', completed: false },
    { id: 5, lat: 47.3977419, lng: 8.5455938, alt: 0, type: 'land', completed: false },
  ]);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Socket.IO connection for real-time drone position updates
  useEffect(() => {
    if (!isClient) return;

    const newSocket = io("http://localhost:5328");
    setSocket(newSocket);

    // Listen for drone position updates from QGroundControl
    newSocket.on("position", (position: DronePosition) => {
      console.log("📍 Received detailed drone position:", position);
      setDronePosition(position);
      
      // Add to flight path (limit to last 100 points for performance)
      if (position.lat !== 0 && position.lon !== 0) {
        setFlightPath(prev => {
          const newPath = [...prev, [position.lat, position.lon] as [number, number]];
          return newPath.slice(-100); // Keep only last 100 points
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isClient]);

  // Show loading state during SSR or while client is initializing
  if (!isClient) {
    return (
      <div className={`bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative ${className}`}>
      {/* Enhanced header */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-black/90 z-[1000] border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider">Mission Control</h2>
            <div className="flex items-center gap-2">
              <div className="text-xs text-green-500 uppercase font-mono">Live</div>
              {dronePosition && dronePosition.lat !== 0 && dronePosition.lon !== 0 && (
                <div className="text-xs text-blue-400 uppercase font-mono">Tracking</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400">
              Waypoints: {missionWaypoints.filter(w => w.completed).length}/{missionWaypoints.length}
            </div>
            <button 
              className="border border-gray-600 hover:border-gray-500 px-2 py-1 text-xs uppercase font-bold tracking-wider transition-colors"
              onClick={onCenter}
            >
              Center
            </button>
          </div>
        </div>
      </div>

      <LeafletMap 
        coordinates={coordinates}
        dronePosition={dronePosition}
        flightPath={flightPath}
        missionWaypoints={missionWaypoints}
      />

      {/* Enhanced bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/95 border-t border-gray-800 z-[1000]">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-gray-400 uppercase font-bold mb-1">Current Position</p>
            <p className="font-mono text-red-400">
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
            <p className="font-mono text-gray-300">
              Alt: {dronePosition?.abs_alt?.toFixed(1) || 'N/A'}m
            </p>
          </div>
          
          <div>
            <p className="text-gray-400 uppercase font-bold mb-1">Mission Status</p>
            <p className="font-mono text-green-400">
              {missionWaypoints.filter(w => w.completed).length} / {missionWaypoints.length} Complete
            </p>
            <p className="font-mono text-gray-300">
              Path Length: {flightPath.length} points
            </p>
          </div>
          
          <div>
            <p className="text-gray-400 uppercase font-bold mb-1">Next Waypoint</p>
            {(() => {
              const nextWaypoint = missionWaypoints.find(w => !w.completed);
              return nextWaypoint ? (
                <>
                  <p className="font-mono text-blue-400">
                    WP{nextWaypoint.id} - {nextWaypoint.type.toUpperCase()}
                  </p>
                  <p className="font-mono text-gray-300">
                    Alt: {nextWaypoint.alt}m
                  </p>
                </>
              ) : (
                <p className="font-mono text-yellow-400">Mission Complete</p>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}