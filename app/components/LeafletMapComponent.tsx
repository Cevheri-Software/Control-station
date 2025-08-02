import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

type LeafletMapProps = {
  coordinates: { lat: number; lng: number };
  dronePosition: DronePosition | null;
  flightPath: [number, number][];
  missionWaypoints: MissionWaypoint[];
};

// Custom hook to handle map centering
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
}

const LeafletMapComponent: React.FC<LeafletMapProps> = ({
  coordinates,
  dronePosition,
  flightPath,
  missionWaypoints
}) => {
  // Create custom icons
  const createWaypointIcon = (waypoint: MissionWaypoint) => {
    const colors = {
      takeoff: waypoint.completed ? '#10B981' : '#059669',
      waypoint: waypoint.completed ? '#3B82F6' : '#2563EB', 
      land: waypoint.completed ? '#F59E0B' : '#D97706',
      rtl: waypoint.completed ? '#EF4444' : '#DC2626'
    };

    const svgIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${colors[waypoint.type]}" stroke="#ffffff" stroke-width="2" opacity="${waypoint.completed ? '0.7' : '1'}"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${waypoint.id}</text>
        ${waypoint.completed ? '<path d="M8 12 L11 15 L16 9" stroke="white" stroke-width="2" fill="none"/>' : ''}
      </svg>
    `;

    return new L.DivIcon({
      html: svgIcon,
      className: 'custom-waypoint-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const droneIcon = new L.DivIcon({
    html: `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
        <path d="M8 16 L16 8 L24 16 L16 24 Z" fill="#ffffff"/>
        <circle cx="16" cy="16" r="3" fill="#ffffff"/>
      </svg>
    `,
    className: 'custom-drone-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const realTimeIcon = new L.DivIcon({
    html: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="#ffffff"/>
      </svg>
    `,
    className: 'custom-realtime-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const mapCenter: [number, number] = [coordinates.lat, coordinates.lng];

  return (
    <>
      <MapContainer
        center={mapCenter}
        zoom={17}
        style={{ width: "100%", height: "100%" }}
        className="z-0"
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController center={mapCenter} />

        {/* Mission waypoints */}
        {missionWaypoints.map((waypoint) => (
          <Marker
            key={waypoint.id}
            position={[waypoint.lat, waypoint.lng]}
            icon={createWaypointIcon(waypoint)}
          />
        ))}

        {/* Mission path (planned route) */}
        <Polyline
          positions={missionWaypoints.map(w => [w.lat, w.lng] as [number, number])}
          pathOptions={{
            color: "#10B981",
            opacity: 0.8,
            weight: 2,
          }}
        />

        {/* Flight path (actual flown route) */}
        {flightPath.length > 1 && (
          <Polyline
            positions={flightPath}
            pathOptions={{
              color: "#EF4444",
              opacity: 0.9,
              weight: 3,
            }}
          />
        )}

        {/* Current drone position */}
        <Marker 
          position={[coordinates.lat, coordinates.lng]}
          icon={droneIcon}
        />

        {/* Real-time position marker (if different from coordinates) */}
        {dronePosition && dronePosition.lat !== 0 && dronePosition.lon !== 0 && 
         (Math.abs(dronePosition.lat - coordinates.lat) > 0.00001 || 
          Math.abs(dronePosition.lon - coordinates.lng) > 0.00001) && (
          <Marker 
            position={[dronePosition.lat, dronePosition.lon]}
            icon={realTimeIcon}
          />
        )}
      </MapContainer>

      {/* Custom CSS for icons */}
      <style jsx global>{`
        .custom-waypoint-icon,
        .custom-drone-icon,
        .custom-realtime-icon {
          background: none !important;
          border: none !important;
        }
        
        .leaflet-container {
          background: #1f2937 !important;
        }
      `}
      </style>
    </>
  );
};

export default LeafletMapComponent;