"use client";
import React, { useEffect, useRef, useState } from "react";

type VideoFeedProps = {
  onBombRelease: () => void;
};

export default function VideoFeed({ onBombRelease }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const handleZoomIn = () => {
    setZoom(prev => (prev < 3 ? +(prev + 0.25).toFixed(2) : 3));
  };
  const handleZoomOut = () => {
    setZoom(prev => (prev > 1 ? +(prev - 0.25).toFixed(2) : 1));
  };
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(error => console.error("Error accessing webcam:", error));
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  return (
    <div className="bg-black rounded-sm overflow-hidden border border-gray-700 flex-grow relative">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay muted playsInline style={{transform: `scale(${zoom})`, transformOrigin: "center center"}} />
  
      
      {/* Tactical Overlay */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3">
        <div className="bg-black/80 border border-gray-700 p-2 rounded-sm">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-red-600 mr-2 animate-pulse"></div>
            <p className="text-xs text-gray-300 uppercase tracking-wider">Live Feed - Encrypted</p>
          </div>
        </div>
        <div className="bg-black/80 border border-gray-700 p-2 rounded-sm">
          <p className="text-xs text-gray-300 uppercase">Mission Time: 01:23:45</p>
        </div>
      </div>
      
      {/* Tactical Elements Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="border-2 border-dashed border-yellow-600/30 w-32 h-32 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8">
          <div className="absolute top-0 left-1/2 h-full w-px bg-yellow-600/30"></div>
          <div className="absolute left-0 top-1/2 w-full h-px bg-yellow-600/30"></div>
        </div>
      </div>
      
      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/90 border-t border-gray-800">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button onClick={handleZoomIn} className="border border-gray-700 hover:border-gray-500 p-2 rounded-sm flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196
                     a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <span className="ml-1 text-xs uppercase">Zoom</span>
            </button>
            <button onClick={handleZoomOut} className="border border-gray-700 hover:border-gray-500 p-2 rounded-sm flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 text-gray-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
              </svg>
              <span className="ml-1 text-xs uppercase">Zoom Out</span>
            </button>
          </div>
          <button
            className="bg-red-900 hover:bg-red-800 text-white px-5 py-2 rounded-sm flex items-center gap-2 font-bold tracking-wider border border-red-700 uppercase text-sm"
            onClick={onBombRelease}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374
                   1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949
                   3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12
                   15.75h.007v.008H12v-.008z"
              />
            </svg>
            ARM & DEPLOY
          </button>
        </div>
      </div>
    </div>
  );
} 