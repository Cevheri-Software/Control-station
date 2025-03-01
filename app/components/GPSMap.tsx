"use client";
import React from "react";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";

type GPSMapProps = {
  coordinates: { lat: number; lng: number };
  onCenter?: () => void;
};

export default function GPSMap({ coordinates, onCenter }: GPSMapProps) {
  // We'll load the Google Maps script when this component mounts
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  if (!isLoaded) {
    // If the script is still loading, show placeholder
    return (
      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex-grow relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">Loading map...</p>
        </div>

        {/* Coordinates overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/70">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400">COORDINATES</p>
              <p className="font-mono">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-sm"
              onClick={onCenter}
            >
              Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If the script is loaded, render the map
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex-grow relative">
      <GoogleMap
        center={{ lat: coordinates.lat, lng: coordinates.lng }}
        zoom={14}
        mapContainerStyle={{ width: "100%", height: "100%" }}
      >
        <MarkerF position={{ lat: coordinates.lat, lng: coordinates.lng }} />
      </GoogleMap>

      {/* Coordinates overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/70">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">COORDINATES</p>
            <p className="font-mono">
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-sm"
            onClick={onCenter}
          >
            Center
          </button>
        </div>
      </div>
    </div>
  );
} 