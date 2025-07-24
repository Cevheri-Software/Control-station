"use client";
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

type AttitudeData = {
  roll: number;
  pitch: number;
  yaw: number;
  heading: number;
};

type CompassProps = {
  className?: string;
};

export default function Compass({ className }: CompassProps) {
  const [attitude, setAttitude] = useState<AttitudeData>({
    roll: 0,
    pitch: 0,
    yaw: 0,
    heading: 0
  });
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5328");
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Compass socket connected:", newSocket.id));
    newSocket.on("connect_error", (error) => console.error("Compass socket connect error:", error));
    // Listen for attitude updates
    newSocket.on("attitude", (data: AttitudeData) => {
      console.log("📐 Compass received attitude:", data);
      setAttitude(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Convert radians to degrees if needed
  const toDegrees = (radians: number) => (radians * 180) / Math.PI;

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-sm p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider">Compass & Attitude</h3>
        <div className="text-xs text-green-500 uppercase font-mono">Live</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Compass Display */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto relative">
            {/* Compass background */}
            <div className="absolute inset-0 rounded-full border-2 border-gray-600 bg-gray-800">
              {/* Cardinal directions */}
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-400">N</div>
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-400">S</div>
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-400">E</div>
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-400">W</div>
              
              {/* Degree markings */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30) - 90;
                const isCardinal = i % 3 === 0;
                return (
                  <div
                    key={i}
                    className="absolute w-0.5 bg-gray-500"
                    style={{
                      height: isCardinal ? '12px' : '8px',
                      top: isCardinal ? '2px' : '4px',
                      left: '50%',
                      transformOrigin: 'bottom center',
                      transform: `translateX(-50%) rotate(${angle + 90}deg)`
                    }}
                  />
                );
              })}
              
              {/* Heading arrow */}
              <div
                className="absolute top-1/2 left-1/2 w-1 h-12 bg-red-500 origin-bottom transform -translate-x-1/2 -translate-y-full transition-transform duration-300"
                style={{
                  transform: `translate(-50%, -100%) rotate(${attitude.heading}deg)`
                }}
              >
                <div className="absolute -top-2 -left-1 w-3 h-3 bg-red-500 transform rotate-45"></div>
              </div>
            </div>
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          
          {/* Heading display */}
          <div className="text-center mt-2">
            <div className="text-xs text-gray-400 uppercase font-bold">Heading</div>
            <div className="text-lg font-mono text-red-400">{Math.round(attitude.heading)}°</div>
          </div>
        </div>

        {/* Attitude Indicators */}
        <div className="space-y-3">
          {/* Roll indicator */}
          <div className="bg-gray-800 p-3 border border-gray-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 uppercase font-bold">Roll</span>
              <span className="text-xs font-mono text-blue-400">{attitude.roll.toFixed(1)}°</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded">
              <div
                className="bg-blue-500 h-2 rounded transition-all duration-300"
                style={{
                  width: `${Math.min(Math.abs(attitude.roll) * 2, 100)}%`,
                  marginLeft: attitude.roll < 0 ? `${100 - Math.min(Math.abs(attitude.roll) * 2, 100)}%` : '0'
                }}
              />
            </div>
          </div>

          {/* Pitch indicator */}
          <div className="bg-gray-800 p-3 border border-gray-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 uppercase font-bold">Pitch</span>
              <span className="text-xs font-mono text-green-400">{attitude.pitch.toFixed(1)}°</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded">
              <div
                className="bg-green-500 h-2 rounded transition-all duration-300"
                style={{
                  width: `${Math.min(Math.abs(attitude.pitch) * 2, 100)}%`,
                  marginLeft: attitude.pitch < 0 ? `${100 - Math.min(Math.abs(attitude.pitch) * 2, 100)}%` : '0'
                }}
              />
            </div>
          </div>

          {/* Yaw indicator */}
          <div className="bg-gray-800 p-3 border border-gray-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 uppercase font-bold">Yaw</span>
              <span className="text-xs font-mono text-yellow-400">{attitude.yaw.toFixed(1)}°</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded">
              <div
                className="bg-yellow-500 h-2 rounded transition-all duration-300"
                style={{
                  width: `${Math.min(Math.abs(attitude.yaw) * 0.5, 100)}%`,
                  marginLeft: attitude.yaw < 0 ? `${100 - Math.min(Math.abs(attitude.yaw) * 0.5, 100)}%` : '0'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}