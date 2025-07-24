"use client";
import React, { useEffect, useRef, useState } from "react";

type VideoFeedProps = {
  onBombRelease: () => void;
};

export default function VideoFeed({ onBombRelease }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [streamStatus, setStreamStatus] = useState<string>("connecting");
  const [streamSource, setStreamSource] = useState<string>("gazebo_sitl");

  const handleZoomIn = () => {
    setZoom(prev => (prev < 3 ? +(prev + 0.25).toFixed(2) : 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => (prev > 1 ? +(prev - 0.25).toFixed(2) : 1));
  };

  // Check video stream status
  const checkStreamStatus = async () => {
    try {
      const response = await fetch('http://localhost:5328/api/video-status');
      const status = await response.json();
      setStreamStatus(status.status);
      setStreamSource(status.source);
      return status.status === "streaming";
    } catch (error) {
      console.error("Error checking stream status:", error);
      setStreamStatus("error");
      return false;
    }
  };

  useEffect(() => {
    const initializeVideoStream = async () => {
      if (!videoRef.current) return;

      // First check if Gazebo stream is available
      const isStreamAvailable = await checkStreamStatus();
      
      if (isStreamAvailable) {
        console.log("🎥 Connecting to Gazebo SITL MJPEG stream via API...");
        setStreamStatus("loading");

        // Use FastAPI proxy endpoint instead of direct port
        const streamUrl = "http://localhost:5328/api/video-stream";
        videoRef.current.src = streamUrl;
        try {
          videoRef.current.load();
        } catch (e) {
          console.error("Error loading video stream via API:", e);
        }

        videoRef.current.onloadstart = () => {
          console.log("📺 Gazebo MJPEG stream loading...");
          setStreamStatus("loading");
        };
        
        videoRef.current.oncanplay = () => {
          console.log("✅ Gazebo MJPEG stream ready");
          setStreamStatus("streaming");
        };
        
        videoRef.current.onloadeddata = () => {
          console.log("📺 MJPEG stream data loaded");
          setStreamStatus("streaming");
        };
        
        videoRef.current.onerror = (error) => {
          console.error("❌ Gazebo MJPEG stream error:", error);
          setStreamStatus("error");
          // Fallback to webcam if Gazebo stream fails
          setTimeout(fallbackToWebcam, 1000);
        };
        
      } else {
        // Fallback to webcam if Gazebo stream is not available
        console.log("⚠️ Gazebo stream not available, falling back to webcam");
        fallbackToWebcam();
      }
    };

    const fallbackToWebcam = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            console.log("📹 Using webcam as fallback");
            videoRef.current.srcObject = stream;
            setStreamStatus("webcam");
            setStreamSource("webcam");
          }
        })
        .catch(error => {
          console.error("Error accessing webcam:", error);
          setStreamStatus("error");
        });
    };

    initializeVideoStream();

    // Periodically check stream status
    const statusInterval = setInterval(checkStreamStatus, 5000);

    return () => {
      clearInterval(statusInterval);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getStreamStatusColor = () => {
    switch (streamStatus) {
      case "streaming": return "bg-green-600";
      case "loading": return "bg-yellow-600";
      case "webcam": return "bg-blue-600";
      case "error": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const getStreamStatusText = () => {
    switch (streamStatus) {
      case "streaming": return "Gazebo SITL Feed";
      case "loading": return "Loading Stream";
      case "webcam": return "Webcam Fallback";
      case "error": return "Stream Error";
      default: return "Connecting";
    }
  };

  return (
    <div className="bg-black rounded-sm overflow-hidden border border-gray-700 flex-grow relative">
      <video 
        ref={videoRef} 
        className="absolute inset-0 w-full h-full object-cover" 
        autoPlay 
        muted 
        playsInline 
        style={{
          transform: `scale(${zoom})`, 
          transformOrigin: "center center"
        }} 
      />
  
      {/* Tactical Overlay */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3">
        <div className="bg-black/80 border border-gray-700 p-2 rounded-sm">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${getStreamStatusColor()} ${streamStatus === 'streaming' ? 'animate-pulse' : ''}`}></div>
            <p className="text-xs text-gray-300 uppercase tracking-wider">{getStreamStatusText()}</p>
          </div>
        </div>
        <div className="bg-black/80 border border-gray-700 p-2 rounded-sm">
          <p className="text-xs text-gray-300 uppercase">
            Source: {streamSource === 'gazebo_sitl' ? 'PX4 SITL' : (streamSource || 'UNKNOWN').toUpperCase()}
          </p>
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