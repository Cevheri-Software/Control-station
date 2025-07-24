#!/usr/bin/env python3
"""
Simple OpenCV-based Video Viewer for Drone Control Station
Receives UDP video stream from PX4 SITL Gazebo simulation - No Qt conflicts
"""

import cv2
import numpy as np
import time
import argparse
from datetime import datetime
import threading
import sys

class DroneVideoViewer:
    def __init__(self, udp_port=5600):
        self.udp_port = udp_port
        self.running = False
        self.cap = None
        self.frame_count = 0
        self.fps_counter = 0
        self.last_fps_time = time.time()
        self.current_fps = 0
        
        # Create window
        cv2.namedWindow('Drone Video Stream', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Drone Video Stream', 800, 600)
        
    def setup_gstreamer_pipeline(self):
        """Setup GStreamer pipeline to decode H.264 UDP stream"""
        pipelines = [
            # Pipeline 1: Full RTP pipeline with better buffering
            f"udpsrc port={self.udp_port} ! application/x-rtp,media=video,clock-rate=90000,encoding-name=H264,payload=96 ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! appsink drop=1 max-buffers=1 sync=false",
            
            # Pipeline 2: Simplified RTP pipeline
            f"udpsrc port={self.udp_port} ! application/x-rtp ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! appsink max-buffers=1 drop=1",
            
            # Pipeline 3: Direct UDP (for raw H.264)
            f"udpsrc port={self.udp_port} ! h264parse ! avdec_h264 ! videoconvert ! appsink",
            
            # Pipeline 4: Test pattern fallback
            "videotestsrc pattern=ball ! video/x-raw,width=640,height=480,framerate=30/1 ! videoconvert ! appsink"
        ]
        
        for i, pipeline in enumerate(pipelines):
            print(f"🔄 Trying pipeline {i+1}: {pipeline}")
            try:
                # Set environment variable to avoid Qt conflicts
                import os
                os.environ['QT_QPA_PLATFORM_PLUGIN_PATH'] = ''
                
                cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
                if cap.isOpened():
                    # Test if we can actually read a frame
                    ret, frame = cap.read()
                    if ret and frame is not None:
                        print(f"✅ Pipeline {i+1} working! Frame size: {frame.shape}")
                        cap.release()
                        return pipeline
                    else:
                        print(f"⚠️ Pipeline {i+1} opened but no frames received")
                        cap.release()
                else:
                    print(f"❌ Pipeline {i+1} failed to open")
                    if cap:
                        cap.release()
            except Exception as e:
                print(f"❌ Pipeline {i+1} exception: {e}")
                
        print("❌ All pipelines failed, using test pattern")
        return pipelines[-1]  # Return test pattern as fallback
    
    def calculate_fps(self):
        """Calculate and display FPS"""
        self.fps_counter += 1
        current_time = time.time()
        
        if current_time - self.last_fps_time >= 1.0:
            self.current_fps = self.fps_counter
            print(f"📊 FPS: {self.current_fps}, Total frames: {self.frame_count}")
            self.fps_counter = 0
            self.last_fps_time = current_time
    
    def add_overlay(self, frame):
        """Add information overlay to frame"""
        overlay_frame = frame.copy()
        height, width = overlay_frame.shape[:2]
        
        # Add background rectangle for better text visibility
        cv2.rectangle(overlay_frame, (5, 5), (300, 120), (0, 0, 0), -1)
        cv2.rectangle(overlay_frame, (5, 5), (300, 120), (255, 255, 255), 2)
        
        # FPS counter
        cv2.putText(overlay_frame, f"FPS: {self.current_fps}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Frame counter
        cv2.putText(overlay_frame, f"Frames: {self.frame_count}", (10, 55), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # UDP Port
        cv2.putText(overlay_frame, f"UDP: {self.udp_port}", (10, 80), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Status
        cv2.putText(overlay_frame, "STREAMING", (10, 105), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Timestamp (top right)
        timestamp = datetime.now().strftime("%H:%M:%S")
        text_size = cv2.getTextSize(timestamp, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
        cv2.rectangle(overlay_frame, (width - text_size[0] - 15, 5), 
                     (width - 5, 35), (0, 0, 0), -1)
        cv2.putText(overlay_frame, timestamp, (width - text_size[0] - 10, 25), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        return overlay_frame
    
    def run(self):
        """Main video loop"""
        print(f"🎥 Starting video viewer on UDP port {self.udp_port}")
        print("Press 'q' to quit, 's' to save screenshot, 'f' for fullscreen")
        
        # Setup pipeline
        pipeline = self.setup_gstreamer_pipeline()
        print(f"🔧 Using pipeline: {pipeline}")
        
        # Avoid Qt conflicts
        import os
        os.environ['QT_QPA_PLATFORM_PLUGIN_PATH'] = ''
        
        # Create capture object
        self.cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
        
        if not self.cap.isOpened():
            print("❌ Failed to open video capture")
            return False
        
        # Set properties for better performance
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        print("✅ Video capture started successfully")
        self.running = True
        
        consecutive_failures = 0
        max_failures = 30
        fullscreen = False
        
        while self.running:
            ret, frame = self.cap.read()
            
            if ret and frame is not None:
                consecutive_failures = 0
                self.frame_count += 1
                self.calculate_fps()
                
                # Add overlay
                display_frame = self.add_overlay(frame)
                
                # Display frame
                cv2.imshow('Drone Video Stream', display_frame)
                
            else:
                consecutive_failures += 1
                print(f"⚠️ Frame read failed (attempt {consecutive_failures}/{max_failures})")
                
                if consecutive_failures >= max_failures:
                    print("❌ Too many consecutive failures, stopping")
                    break
                
                # Show placeholder frame
                placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(placeholder, "Waiting for video stream...", (100, 200), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                cv2.putText(placeholder, f"UDP Port: {self.udp_port}", (100, 250), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                cv2.putText(placeholder, f"Failures: {consecutive_failures}/{max_failures}", (100, 300), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
                cv2.imshow('Drone Video Stream', placeholder)
            
            # Handle keyboard input
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("👋 Quit requested by user")
                break
            elif key == ord('s'):
                self.save_screenshot(frame if ret else placeholder)
            elif key == ord('f'):
                # Toggle fullscreen
                if fullscreen:
                    cv2.setWindowProperty('Drone Video Stream', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                    fullscreen = False
                    print("📺 Windowed mode")
                else:
                    cv2.setWindowProperty('Drone Video Stream', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
                    fullscreen = True
                    print("🖥️ Fullscreen mode")
            elif key == ord('h'):
                self.show_help()
        
        # Cleanup
        self.cleanup()
        return True
    
    def save_screenshot(self, frame):
        """Save current frame as screenshot"""
        if frame is not None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"drone_screenshot_{timestamp}.jpg"
            
            import os
            os.makedirs("screenshots", exist_ok=True)
            filepath = os.path.join("screenshots", filename)
            
            cv2.imwrite(filepath, frame)
            print(f"📸 Screenshot saved: {filepath}")
        else:
            print("⚠️ No frame available to save")
    
    def show_help(self):
        """Show help information"""
        print("\n" + "="*50)
        print("🎥 DRONE VIDEO VIEWER - CONTROLS")
        print("="*50)
        print("q - Quit application")
        print("s - Save screenshot")
        print("f - Toggle fullscreen")
        print("h - Show this help")
        print("="*50 + "\n")
    
    def cleanup(self):
        """Clean up resources"""
        self.running = False
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        print("🛑 Video viewer stopped")

def check_gstreamer():
    """Check if GStreamer is properly installed"""
    try:
        import subprocess
        result = subprocess.run(['gst-launch-1.0', '--version'], 
                              capture_output=True, text=True, timeout=5, check=False)
        if result.returncode == 0:
            print("✅ GStreamer is available")
            return True
        else:
            print("⚠️ GStreamer not found or not working properly")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ GStreamer not found. Install with:")
        print("   sudo apt install gstreamer1.0-tools gstreamer1.0-plugins-*")
        return False

def test_udp_stream(port):
    """Test if there's actually a stream on the UDP port"""
    print(f"🔍 Testing UDP stream on port {port}...")
    
    try:
        import subprocess
        # Test with timeout
        cmd = [
            'gst-launch-1.0', 
            'udpsrc', f'port={port}', 'timeout=2000000000',
            '!', 'application/x-rtp,media=video,clock-rate=90000,encoding-name=H264,payload=96',
            '!', 'rtph264depay',
            '!', 'h264parse', 
            '!', 'fakesink'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3, check=False)
        
        if "Setting pipeline to PLAYING" in result.stderr:
            print(f"✅ UDP stream detected on port {port}")
            return True
        else:
            print(f"⚠️ No stream detected on port {port}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⚠️ Stream test timed out - this might be normal")
        return True  # Assume stream exists if timeout
    except Exception as e:
        print(f"❌ Stream test failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Simple OpenCV Drone Video Viewer")
    parser.add_argument("--port", type=int, default=5600, 
                       help="UDP port to receive video stream (default: 5600)")
    parser.add_argument("--test-stream", action="store_true",
                       help="Test if stream is available before starting viewer")
    
    args = parser.parse_args()
    
    print("🎥 Simple Drone Video Viewer")
    print("============================")
    print(f"OpenCV version: {cv2.__version__}")
    
    # Check GStreamer
    if not check_gstreamer():
        print("❌ GStreamer is required but not found")
        return 1
    
    # Test stream if requested
    if args.test_stream:
        if not test_udp_stream(args.port):
            print(f"⚠️ No stream detected on port {args.port}, but starting anyway...")
    
    # Create and run viewer
    try:
        viewer = DroneVideoViewer(udp_port=args.port)
        success = viewer.run()
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted by user")
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())