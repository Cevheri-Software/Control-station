'use client'

import { useEffect, useState } from 'react'

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
      console.log('PWA was installed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        console.log('Notification permission granted')
        // You can now send notifications
        new Notification('Drone Control Station', {
          body: 'Notifications enabled for drone telemetry updates',
          icon: '/icon-192x192.png'
        })
      }
    }
  }

  return (
    <div className="pwa-installer">
      {showInstallButton && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
            <h3 className="font-semibold mb-2">Install Drone Control Station</h3>
            <p className="text-sm mb-3">Install this app for a better experience and offline access.</p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallButton(false)}
                className="bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-800"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification permission button - you can style this as needed */}
      <button
        onClick={requestNotificationPermission}
        className="hidden" // Hidden by default, you can show it when needed
        id="enable-notifications"
      >
        Enable Notifications
      </button>
    </div>
  )
}
