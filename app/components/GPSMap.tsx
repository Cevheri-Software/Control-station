"use client";
import React, { useEffect, useState } from "react";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";

type GPSMapProps = {
  coordinates: { lat: number; lng: number };
  onCenter?: () => void;
};

type DronePosition = {
  lat: number;
  lon: number;
  abs_alt: number;
};

export default function GPSMap({ coordinates, onCenter }: GPSMapProps) {
  const [dronePosition, setDronePosition] = useState<DronePosition | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // We'll load the Google Maps script when this component mounts
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // Socket.IO connection for real-time drone position updates
  useEffect(() => {
    const newSocket = io("http://localhost:5328");
    setSocket(newSocket);

    // Listen for drone position updates from QGroundControl
    newSocket.on("position", (position: DronePosition) => {
      console.log("📍 Received detailed drone position:", position);
      setDronePosition(position);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  if (!isLoaded) {
    // If the script is still loading, show placeholder
    return (
      <div className="bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative h-64">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 font-mono text-sm">INITIALIZING MAP...</p>
        </div>

        {/* Coordinates overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/90 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Drone Position</p>
              <p className="font-mono text-sm">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
            <button 
              className="border border-gray-700 hover:border-gray-600 px-3 py-2 text-xs uppercase font-bold tracking-wider"
              onClick={onCenter}
            >
              Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Map style for military look
  const mapOptions = {
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
      },
    ],
  };

  // Use the coordinates passed from parent (which is now drone position from Socket.IO)
  const mapCenter = { lat: coordinates.lat, lng: coordinates.lng };
  const mapZoom = 16;

  // If the script is loaded, render the map
  return (
    <div className="bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative h-64">
      <div className="absolute top-0 left-0 right-0 p-2 bg-black/80 z-10 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider">Drone Tracking</h2>
          <div className="flex items-center gap-2">
            <div className="text-xs text-green-500 uppercase font-mono">Live</div>
            {dronePosition && dronePosition.lat !== 0 && dronePosition.lon !== 0 && (
              <div className="text-xs text-red-400 uppercase font-mono">QGroundControl</div>
            )}
          </div>
        </div>
      </div>

      <GoogleMap
        center={mapCenter}
        zoom={mapZoom}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={mapOptions}
      >
        {/* Main Drone Marker - shows current position */}
        <MarkerF 
          position={{ lat: coordinates.lat, lng: coordinates.lng }}
          icon={{
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
                <path d="M8 16 L16 8 L24 16 L16 24 Z" fill="#ffffff"/>
                <circle cx="16" cy="16" r="3" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }}
          title={`Drone - Alt: ${dronePosition?.abs_alt?.toFixed(1) || 'N/A'}m`}
          animation={google.maps.Animation.DROP}
        />

        {/* Real-time position marker (if different from coordinates) */}
        {dronePosition && dronePosition.lat !== 0 && dronePosition.lon !== 0 && 
         (Math.abs(dronePosition.lat - coordinates.lat) > 0.00001 || 
          Math.abs(dronePosition.lon - coordinates.lng) > 0.00001) && (
          <MarkerF 
            position={{ lat: dronePosition.lat, lng: dronePosition.lon }}
            icon={{
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
                  <circle cx="12" cy="12" r="4" fill="#ffffff"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12)
            }}
            title={`Real-time - Alt: ${dronePosition.abs_alt.toFixed(1)}m`}
            animation={google.maps.Animation.BOUNCE}
          />
        )}
      </GoogleMap>

      {/* Enhanced Coordinates overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/90 border-t border-gray-800">
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Drone Position</p>
              <p className="font-mono text-sm text-red-400">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
            {dronePosition && dronePosition.lat !== 0 && dronePosition.lon !== 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Real-time</p>
                <p className="font-mono text-sm text-blue-400">
                  {dronePosition.lat.toFixed(6)}, {dronePosition.lon.toFixed(6)}
                </p>
                <p className="font-mono text-xs text-gray-300">
                  Alt: {dronePosition.abs_alt.toFixed(1)}m
                </p>
              </div>
            )}
          </div>
          <button 
            className="border border-gray-700 hover:border-gray-600 px-3 py-2 text-xs uppercase font-bold tracking-wider"
            onClick={onCenter}
          >
            Center
          </button>
        </div>
      </div>
    </div>
  );
}