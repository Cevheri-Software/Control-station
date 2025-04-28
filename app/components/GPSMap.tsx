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
      <div className="bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative h-64">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 font-mono text-sm">INITIALIZING MAP...</p>
        </div>

        {/* Coordinates overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/90 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Coordinates</p>
              <p className="font-mono text-sm">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
            <button 
              className="border border-gray-700 hover:border-gray-600 px-3 py-2 text-xs uppercase font-bold tracking-wider"
              onClick={onCenter}
            >
              Acquire
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

  // If the script is loaded, render the map
  return (
    <div className="bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative h-64">
      <div className="absolute top-0 left-0 right-0 p-2 bg-black/80 z-10 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider">Tactical Map</h2>
          <div className="text-xs text-green-500 uppercase font-mono">Active</div>
        </div>
      </div>

      <GoogleMap
        center={{ lat: coordinates.lat, lng: coordinates.lng }}
        zoom={14}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={mapOptions}
      >
        <MarkerF position={{ lat: coordinates.lat, lng: coordinates.lng }} />
      </GoogleMap>

      {/* Coordinates overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/90 border-t border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">Coordinates</p>
            <p className="font-mono text-sm">
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
          </div>
          <button 
            className="border border-gray-700 hover:border-gray-600 px-3 py-2 text-xs uppercase font-bold tracking-wider"
            onClick={onCenter}
          >
            Acquire
          </button>
        </div>
      </div>
    </div>
  );
} 