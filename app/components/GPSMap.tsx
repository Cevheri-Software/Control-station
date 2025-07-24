"use client";
import React, { useEffect, useState } from "react";
import { GoogleMap, MarkerF, PolylineF, useLoadScript } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";

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
  const [flightPath, setFlightPath] = useState<{ lat: number; lng: number }[]>([]);
  const [missionWaypoints, setMissionWaypoints] = useState<MissionWaypoint[]>([
    { id: 1, lat: 47.3977419, lng: 8.5455938, alt: 20, type: 'takeoff', completed: true },
    { id: 2, lat: 47.3979419, lng: 8.5457938, alt: 25, type: 'waypoint', completed: false },
    { id: 3, lat: 47.3981419, lng: 8.5459938, alt: 30, type: 'waypoint', completed: false },
    { id: 4, lat: 47.3983419, lng: 8.5461938, alt: 25, type: 'waypoint', completed: false },
    { id: 5, lat: 47.3977419, lng: 8.5455938, alt: 0, type: 'land', completed: false },
  ]);

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
      
      // Add to flight path (limit to last 100 points for performance)
      if (position.lat !== 0 && position.lon !== 0) {
        setFlightPath(prev => {
          const newPath = [...prev, { lat: position.lat, lng: position.lon }];
          return newPath.slice(-100); // Keep only last 100 points
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  if (!isLoaded) {
    // If the script is still loading, show placeholder
    return (
      <div className={`bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 font-mono text-sm">INITIALIZING MAP...</p>
        </div>
      </div>
    );
  }

  // Enhanced map style for mission planning
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
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  // Use the coordinates passed from parent (which is now drone position from Socket.IO)
  const mapCenter = { lat: coordinates.lat, lng: coordinates.lng };
  const mapZoom = 17;

  const getWaypointIcon = (waypoint: MissionWaypoint) => {
    const colors = {
      takeoff: waypoint.completed ? '#10B981' : '#059669',
      waypoint: waypoint.completed ? '#3B82F6' : '#2563EB', 
      land: waypoint.completed ? '#F59E0B' : '#D97706',
      rtl: waypoint.completed ? '#EF4444' : '#DC2626'
    };

    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="${colors[waypoint.type]}" stroke="#ffffff" stroke-width="2" opacity="${waypoint.completed ? '0.7' : '1'}"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${waypoint.id}</text>
          ${waypoint.completed ? '<path d="M8 12 L11 15 L16 9" stroke="white" stroke-width="2" fill="none"/>' : ''}
        </svg>
      `),
      scaledSize: new google.maps.Size(24, 24),
      anchor: new google.maps.Point(12, 12)
    };
  };

  // If the script is loaded, render the map
  return (
    <div className={`bg-gray-900 rounded-sm overflow-hidden border border-gray-700 flex-grow relative ${className}`}>
      {/* Enhanced header */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-black/90 z-10 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider">Mission Control</h2>
            <div className="flex items-center gap-2">
              <div className="text-xs text-green-500 uppercase font-mono">Live</div>
              {dronePosition && dronePosition.lat !== 0 && dronePosition.lon !== 0 && (
                <div className="text-xs text-blue-400 upperca-fontse font-mono">Tracking</div>
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

      <GoogleMap
        center={mapCenter}
        zoom={mapZoom}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={mapOptions}
      >
        {/* Mission waypoints */}
        {missionWaypoints.map((waypoint) => (
          <MarkerF
            key={waypoint.id}
            position={{ lat: waypoint.lat, lng: waypoint.lng }}
            icon={getWaypointIcon(waypoint)}
            title={`${waypoint.type.toUpperCase()} - Alt: ${waypoint.alt}m ${waypoint.completed ? '(Completed)' : ''}`}
          />
        ))}

        {/* Mission path (planned route) */}
        <PolylineF
          path={missionWaypoints.map(w => ({ lat: w.lat, lng: w.lng }))}
          options={{
            strokeColor: "#10B981",
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />

        {/* Flight path (actual flown route) */}
        {flightPath.length > 1 && (
          <PolylineF
            path={flightPath}
            options={{
              strokeColor: "#EF4444",
              strokeOpacity: 0.9,
              strokeWeight: 3,
            }}
          />
        )}

        {/* Current drone position */}
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
          title={`Current Position - Alt: ${dronePosition?.abs_alt?.toFixed(1) || 'N/A'}m`}
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

      {/* Enhanced bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/95 border-t border-gray-800">
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