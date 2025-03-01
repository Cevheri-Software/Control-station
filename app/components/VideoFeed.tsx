"use client";
import React from "react";

type VideoFeedProps = {
  onBombRelease: () => void;
};

export default function VideoFeed({ onBombRelease }: VideoFeedProps) {
  return (
    <div className="bg-black rounded-lg overflow-hidden border border-slate-700 flex-grow relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-500">Live Camera Feed</p>
        {/* In a real implementation, this would be replaced with actual video streaming component */}
      </div>
      {/* Overlay for data */}
      <div className="absolute top-0 left-0 p-4">
        <div className="bg-black/70 p-2 rounded">
          <p className="text-xs text-green-400">RECORDING</p>
        </div>
      </div>
      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="bg-slate-800 hover:bg-slate-700 p-2 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196
                     a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 p-2 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3
                     0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75
                     0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3
                     0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5
                     0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75
                     0h9.75"
                />
              </svg>
            </button>
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded flex items-center gap-2 font-medium"
            onClick={onBombRelease}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
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
            RELEASE BOMB
          </button>
        </div>
      </div>
    </div>
  );
} 