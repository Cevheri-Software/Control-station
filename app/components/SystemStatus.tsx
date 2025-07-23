"use client";
import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export default function DroneControls() {
  const [droneHealth, setDroneHealth] = useState("starting");
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5328");
    setSocket(newSocket);

    // Listen for drone health updates
    newSocket.on("health", (health: string) => {
      console.log("🏥 Received health status:", health);
      setDroneHealth(health);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const executeCommand = async (endpoint: string, action: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5328/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log(`${action} result:`, result);
      
      // Show user feedback
      if (result.status.includes('successfully') || result.status.includes('initiated') || result.status.includes('triggered')) {
        // Success feedback could be added here
      } else {
        alert(`${action} failed: ${result.status}`);
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      alert(`${action} failed: Network error`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArm = () => executeCommand('arm', 'Arm');
  const handleDisarm = () => executeCommand('disarm', 'Disarm');
  const handleTakeoff = () => executeCommand('takeoff', 'Takeoff');
  const handleLand = () => executeCommand('land', 'Land');
  const handleRTL = () => executeCommand('rtl', 'Return to Launch');

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'connected':
      case 'armed':
      case 'flying':
      case 'offboard':
        return 'text-green-500';
      case 'taking_off':
      case 'landing':
      case 'rtl':
        return 'text-yellow-500';
      case 'error':
      case 'timeout':
      case 'arm_error':
      case 'takeoff_error':
      case 'land_error':
      case 'rtl_error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const isButtonDisabled = (action: string) => {
    if (isLoading) return true;
    
    switch (action) {
      case 'arm':
        return !['connected', 'disarmed'].includes(droneHealth);
      case 'disarm':
        return !['armed', 'flying', 'offboard'].includes(droneHealth);
      case 'takeoff':
        return !['armed'].includes(droneHealth);
      case 'land':
      case 'rtl':
        return !['flying', 'offboard'].includes(droneHealth);
      default:
        return false;
    }
  };

  return (
    <div className="bg-gray-900 rounded-sm p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider">Drone Controls</h2>
        <div className={`text-xs uppercase font-mono ${getHealthColor(droneHealth)}`}>
          {droneHealth.replace('_', ' ')}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {/* Arm/Disarm Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleArm}
            disabled={isButtonDisabled('arm')}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
              isButtonDisabled('arm')
                ? 'border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed'
                : 'border-green-600 text-green-400 bg-green-900/20 hover:bg-green-800/30'
            }`}
          >
            {isLoading ? 'Loading...' : 'ARM'}
          </button>
          
          <button
            onClick={handleDisarm}
            disabled={isButtonDisabled('disarm')}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
              isButtonDisabled('disarm')
                ? 'border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed'
                : 'border-orange-600 text-orange-400 bg-orange-900/20 hover:bg-orange-800/30'
            }`}
          >
            {isLoading ? 'Loading...' : 'DISARM'}
          </button>
        </div>

        {/* Takeoff Button */}
        <button
          onClick={handleTakeoff}
          disabled={isButtonDisabled('takeoff')}
          className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
            isButtonDisabled('takeoff')
              ? 'border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed'
              : 'border-blue-600 text-blue-400 bg-blue-900/20 hover:bg-blue-800/30'
          }`}
        >
          {isLoading ? 'Loading...' : 'TAKEOFF'}
        </button>

        {/* Land/RTL Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleLand}
            disabled={isButtonDisabled('land')}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
              isButtonDisabled('land')
                ? 'border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed'
                : 'border-purple-600 text-purple-400 bg-purple-900/20 hover:bg-purple-800/30'
            }`}
          >
            {isLoading ? 'Loading...' : 'LAND'}
          </button>
          
          <button
            onClick={handleRTL}
            disabled={isButtonDisabled('rtl')}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
              isButtonDisabled('rtl')
                ? 'border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed'
                : 'border-yellow-600 text-yellow-400 bg-yellow-900/20 hover:bg-yellow-800/30'
            }`}
          >
            {isLoading ? 'Loading...' : 'RTL'}
          </button>
        </div>
      </div>
    </div>
  );
}