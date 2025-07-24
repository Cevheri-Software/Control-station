#!/usr/bin/env python3
"""
PyQt-based Native Video Viewer for Drone Control Station
Receives UDP video stream from PX4 SITL Gazebo simulation with a proper GUI
"""

import sys
import cv2
import numpy as np
import time
import argparse
from datetime import datetime
import subprocess
import os

# Force use of system Qt plugins and xcb platform to avoid conflicts with OpenCV's Qt
os.environ['QT_QPA_PLATFORM_PLUGIN_PATH'] = '/usr/lib/qt5/plugins'
os.environ.setdefault('QT_QPA_PLATFORM', 'xcb')

from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                           QHBoxLayout, QLabel, QPushButton, QStatusBar,
                           QMenuBar, QAction, QMessageBox, QFrame,
                           QGridLayout, QGroupBox, QSpinBox, QCheckBox)
from PyQt5.QtCore import QTimer, QThread, pyqtSignal, Qt
from PyQt5.QtGui import QImage, QPixmap

class VideoStreamThread(QThread):
    """Thread for handling video stream reception and processing"""
    frameReady = pyqtSignal(np.ndarray)
    statusChanged = pyqtSignal(str)
    fpsChanged = pyqtSignal(int)
    
    def __init__(self, udp_port=5600):
        super().__init__()
        self.udp_port = udp_port
        self.running = False
        self.cap = None
        self.frame_count = 0
        self.fps_counter = 0
        self.last_fps_time = time.time()
        
    def setup_gstreamer_pipeline(self):
        """Setup GStreamer pipeline to decode H.264 UDP stream"""
        # Try multiple pipeline configurations
        pipelines = [
            # Pipeline 1: Full RTP pipeline
            f"udpsrc port={self.udp_port} ! application/x-rtp,media=video,clock-rate=90000,encoding-name=H264,payload=96 ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! appsink drop=1 max-buffers=1",
            
            # Pipeline 2: Simplified pipeline
            f"udpsrc port={self.udp_port} ! application/x-rtp ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! appsink",
            
            # Pipeline 3: Raw UDP approach
            f"udpsrc port={self.udp_port} ! h264parse ! avdec_h264 ! videoconvert ! appsink",
            
            # Pipeline 4: Test pattern fallback
            "videotestsrc pattern=ball ! videoconvert ! appsink"
        ]
        
        for i, pipeline in enumerate(pipelines):
            print(f"🔄 Trying pipeline {i+1}: {pipeline}")
            try:
                cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
                if cap.isOpened():
                    # Test if we can actually read a frame
                    ret, frame = cap.read()
                    if ret and frame is not None:
                        print(f"✅ Pipeline {i+1} working!")
                        cap.release()
                        return pipeline
                    else:
                        print(f"⚠️ Pipeline {i+1} opened but no frames")
                        cap.release()
                else:
                    print(f"❌ Pipeline {i+1} failed to open")
            except Exception as e:
                print(f"❌ Pipeline {i+1} exception: {e}")
        
        print("❌ All pipelines failed, using fallback")
        return pipelines[-1]  # Return test pattern as fallback
    
    def run(self):
        """Main video capture loop"""
        self.statusChanged.emit("Initializing video capture...")
        
        try:
            pipeline = self.setup_gstreamer_pipeline()
            print(f"🎥 Using pipeline: {pipeline}")
            
            self.cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
            
            if not self.cap.isOpened():
                self.statusChanged.emit("Failed to open video pipeline")
                print("❌ Failed to open video capture")
                return
                
            # Set buffer size to reduce latency
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                
            self.statusChanged.emit("Video capture started")
            print("✅ Video capture started successfully")
            self.running = True
            
            consecutive_failures = 0
            max_failures = 30  # Allow 30 consecutive failures before giving up
            
            while self.running:
                ret, frame = self.cap.read()
                
                if ret and frame is not None:
                    consecutive_failures = 0
                    self.frame_count += 1
                    self.calculate_fps()
                    self.frameReady.emit(frame)
                else:
                    consecutive_failures += 1
                    print(f"⚠️ Frame read failed (attempt {consecutive_failures})")
                    
                    if consecutive_failures >= max_failures:
                        print("❌ Too many consecutive failures, stopping")
                        break
                    
                    # Emit a placeholder frame
                    empty_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                    cv2.putText(empty_frame, "Waiting for video stream...", 
                               (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                    cv2.putText(empty_frame, f"Listening on UDP port {self.udp_port}", 
                               (50, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    cv2.putText(empty_frame, f"Failures: {consecutive_failures}/{max_failures}", 
                               (50, 320), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                    self.frameReady.emit(empty_frame)
                
                self.msleep(33)  # ~30 FPS max
                
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            print(f"❌ Video thread error: {error_msg}")
            self.statusChanged.emit(error_msg)
        finally:
            if self.cap:
                self.cap.release()
            self.statusChanged.emit("Video capture stopped")
            print("🛑 Video capture stopped")
    
    def calculate_fps(self):
        """Calculate FPS"""
        self.fps_counter += 1
        current_time = time.time()
        
        if current_time - self.last_fps_time >= 1.0:
            self.fpsChanged.emit(self.fps_counter)
            self.fps_counter = 0
            self.last_fps_time = current_time
    
    def stop(self):
        """Stop the video thread"""
        self.running = False
        self.wait()

class DroneVideoViewer(QMainWindow):
    """Main PyQt application window for drone video viewer"""
    
    def __init__(self, udp_port=5600):
        super().__init__()
        self.udp_port = udp_port
        self.current_frame = None
        self.current_fps = 0
        self.frame_count = 0
        self.recording = False
        
        # Initialize video thread
        self.video_thread = VideoStreamThread(udp_port)
        self.video_thread.frameReady.connect(self.update_frame)
        self.video_thread.statusChanged.connect(self.update_status)
        self.video_thread.fpsChanged.connect(self.update_fps)
        
        self.init_ui()
        self.setup_timer()
        
        # Auto-start video stream
        self.start_video()
    
    def init_ui(self):
        """Initialize the user interface"""
        self.setWindowTitle("🎥 Drone Video Viewer")
        self.setGeometry(100, 100, 1000, 700)
        
        # Set application icon and style
        self.setStyleSheet("""
            QMainWindow {
                background-color: #2b2b2b;
                color: #ffffff;
            }
            QLabel {
                color: #ffffff;
                font-family: 'Consolas', 'Monaco', monospace;
            }
            QPushButton {
                background-color: #404040;
                color: #ffffff;
                border: 1px solid #555555;
                padding: 8px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #505050;
            }
            QPushButton:pressed {
                background-color: #303030;
            }
            QGroupBox {
                color: #ffffff;
                border: 2px solid #555555;
                border-radius: 5px;
                margin-top: 10px;
                font-weight: bold;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
        """)
        
        # Create central widget and layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        
        # Left side - Video display
        video_layout = QVBoxLayout()
        
        # Video display label
        self.video_label = QLabel()
        self.video_label.setMinimumSize(640, 480)
        self.video_label.setStyleSheet("""
            QLabel {
                border: 2px solid #555555;
                background-color: #1a1a1a;
            }
        """)
        self.video_label.setAlignment(Qt.AlignCenter)
        self.video_label.setText("🎥 Initializing Video Stream...")
        
        video_layout.addWidget(self.video_label)
        
        # Video controls
        controls_layout = QHBoxLayout()
        
        self.start_btn = QPushButton("▶ Start")
        self.start_btn.clicked.connect(self.start_video)
        self.stop_btn = QPushButton("⏹ Stop")
        self.stop_btn.clicked.connect(self.stop_video)
        self.screenshot_btn = QPushButton("📸 Screenshot")
        self.screenshot_btn.clicked.connect(self.take_screenshot)
        self.fullscreen_btn = QPushButton("🖥️ Fullscreen")
        self.fullscreen_btn.clicked.connect(self.toggle_fullscreen)
        
        controls_layout.addWidget(self.start_btn)
        controls_layout.addWidget(self.stop_btn)
        controls_layout.addWidget(self.screenshot_btn)
        controls_layout.addWidget(self.fullscreen_btn)
        controls_layout.addStretch()
        
        video_layout.addLayout(controls_layout)
        main_layout.addLayout(video_layout, stretch=3)
        
        # Right side - Information panel
        info_panel = QVBoxLayout()
        
        # Stream information
        stream_group = QGroupBox("📡 Stream Information")
        stream_layout = QGridLayout(stream_group)
        
        self.port_label = QLabel(f"UDP Port: {self.udp_port}")
        self.fps_label = QLabel("FPS: 0")
        self.frame_label = QLabel("Frames: 0")
        self.status_label = QLabel("Status: Initializing")
        self.time_label = QLabel("Time: --:--:--")
        
        stream_layout.addWidget(self.port_label, 0, 0)
        stream_layout.addWidget(self.fps_label, 1, 0)
        stream_layout.addWidget(self.frame_label, 2, 0)
        stream_layout.addWidget(self.status_label, 3, 0)
        stream_layout.addWidget(self.time_label, 4, 0)
        
        info_panel.addWidget(stream_group)
        
        # Settings group
        settings_group = QGroupBox("⚙️ Settings")
        settings_layout = QGridLayout(settings_group)
        
        # Port setting
        port_label = QLabel("UDP Port:")
        self.port_spinbox = QSpinBox()
        self.port_spinbox.setRange(1000, 65535)
        self.port_spinbox.setValue(self.udp_port)
        self.port_spinbox.valueChanged.connect(self.change_port)
        
        # Auto-reconnect checkbox
        self.auto_reconnect_cb = QCheckBox("Auto Reconnect")
        self.auto_reconnect_cb.setChecked(True)
        
        # Show overlay checkbox
        self.show_overlay_cb = QCheckBox("Show Overlay")
        self.show_overlay_cb.setChecked(True)
        
        settings_layout.addWidget(port_label, 0, 0)
        settings_layout.addWidget(self.port_spinbox, 0, 1)
        settings_layout.addWidget(self.auto_reconnect_cb, 1, 0, 1, 2)
        settings_layout.addWidget(self.show_overlay_cb, 2, 0, 1, 2)
        
        info_panel.addWidget(settings_group)
        
        # Statistics group
        stats_group = QGroupBox("📊 Statistics")
        stats_layout = QGridLayout(stats_group)
        
        self.total_frames_label = QLabel("Total Frames: 0")
        self.uptime_label = QLabel("Uptime: 00:00:00")
        self.data_rate_label = QLabel("Data Rate: 0 KB/s")
        
        stats_layout.addWidget(self.total_frames_label, 0, 0)
        stats_layout.addWidget(self.uptime_label, 1, 0)
        stats_layout.addWidget(self.data_rate_label, 2, 0)
        
        info_panel.addWidget(stats_group)
        
        info_panel.addStretch()
        main_layout.addLayout(info_panel, stretch=1)
        
        # Status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready to connect to video stream")
        
        # Menu bar
        self.create_menu_bar()
        
        # Track application start time
        self.start_time = time.time()
    
    def create_menu_bar(self):
        """Create menu bar"""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu('📁 File')
        
        screenshot_action = QAction('📸 Take Screenshot', self)
        screenshot_action.setShortcut('Ctrl+S')
        screenshot_action.triggered.connect(self.take_screenshot)
        file_menu.addAction(screenshot_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction('❌ Exit', self)
        exit_action.setShortcut('Ctrl+Q')
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # View menu
        view_menu = menubar.addMenu('👁️ View')
        
        fullscreen_action = QAction('🖥️ Toggle Fullscreen', self)
        fullscreen_action.setShortcut('F11')
        fullscreen_action.triggered.connect(self.toggle_fullscreen)
        view_menu.addAction(fullscreen_action)
        
        # Help menu
        help_menu = menubar.addMenu('❓ Help')
        
        about_action = QAction('ℹ️ About', self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def setup_timer(self):
        """Setup timer for UI updates"""
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_ui)
        self.timer.start(1000)  # Update every second
    
    def update_frame(self, frame):
        """Update video frame display"""
        self.current_frame = frame.copy()
        self.frame_count += 1
        
        # Add overlay if enabled
        if self.show_overlay_cb.isChecked():
            frame = self.add_overlay(frame)
        
        # Convert frame to Qt format
        height, width, channel = frame.shape
        bytes_per_line = 3 * width
        q_image = QImage(frame.data, width, height, bytes_per_line, QImage.Format_RGB888).rgbSwapped()
        
        # Scale image to fit label while maintaining aspect ratio
        pixmap = QPixmap.fromImage(q_image)
        scaled_pixmap = pixmap.scaled(self.video_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation)
        
        self.video_label.setPixmap(scaled_pixmap)
    
    def add_overlay(self, frame):
        """Add information overlay to frame"""
        overlay_frame = frame.copy()
        height, width = overlay_frame.shape[:2]
        
        # Semi-transparent background for text
        overlay = overlay_frame.copy()
        
        # FPS counter
        cv2.putText(overlay, f"FPS: {self.current_fps}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Frame counter
        cv2.putText(overlay, f"Frame: {self.frame_count}", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Timestamp
        timestamp = datetime.now().strftime("%H:%M:%S")
        cv2.putText(overlay, timestamp, (width - 120, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Connection status
        status_text = "CONNECTED"
        cv2.putText(overlay, status_text, (10, height - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        return overlay
    
    def update_status(self, status):
        """Update status message"""
        self.status_label.setText(f"Status: {status}")
        self.status_bar.showMessage(status)
    
    def update_fps(self, fps):
        """Update FPS counter"""
        self.current_fps = fps
        self.fps_label.setText(f"FPS: {fps}")
    
    def update_ui(self):
        """Update UI elements periodically"""
        # Update time
        current_time = datetime.now().strftime("%H:%M:%S")
        self.time_label.setText(f"Time: {current_time}")
        
        # Update frame counter
        self.frame_label.setText(f"Frames: {self.frame_count}")
        self.total_frames_label.setText(f"Total Frames: {self.frame_count}")
        
        # Update uptime
        uptime_seconds = int(time.time() - self.start_time)
        hours = uptime_seconds // 3600
        minutes = (uptime_seconds % 3600) // 60
        seconds = uptime_seconds % 60
        uptime_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        self.uptime_label.setText(f"Uptime: {uptime_str}")
    
    def start_video(self):
        """Start video stream"""
        if not self.video_thread.running:
            self.video_thread.start()
            self.start_btn.setEnabled(False)
            self.stop_btn.setEnabled(True)
    
    def stop_video(self):
        """Stop video stream"""
        if self.video_thread.running:
            self.video_thread.stop()
            self.start_btn.setEnabled(True)
            self.stop_btn.setEnabled(False)
            self.video_label.setText("🎥 Video Stream Stopped")
    
    def change_port(self, port):
        """Change UDP port"""
        self.udp_port = port
        self.port_label.setText(f"UDP Port: {port}")
        
        # Restart video thread with new port
        if self.video_thread.running:
            self.stop_video()
            self.video_thread = VideoStreamThread(port)
            self.video_thread.frameReady.connect(self.update_frame)
            self.video_thread.statusChanged.connect(self.update_status)
            self.video_thread.fpsChanged.connect(self.update_fps)
            self.start_video()
    
    def take_screenshot(self):
        """Save current frame as screenshot"""
        if self.current_frame is not None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"drone_screenshot_{timestamp}.jpg"
            
            # Create screenshots directory
            os.makedirs("screenshots", exist_ok=True)
            filepath = os.path.join("screenshots", filename)
            
            cv2.imwrite(filepath, self.current_frame)
            self.status_bar.showMessage(f"Screenshot saved: {filepath}", 3000)
            
            QMessageBox.information(self, "Screenshot Saved", 
                                  f"Screenshot saved successfully:\n{filepath}")
        else:
            QMessageBox.warning(self, "No Frame", "No video frame available to save.")
    
    def toggle_fullscreen(self):
        """Toggle fullscreen mode"""
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()
    
    def show_about(self):
        """Show about dialog"""
        QMessageBox.about(self, "About Drone Video Viewer", 
                         "🎥 Drone Video Viewer v2.0\n\n"
                         "A PyQt-based video viewer for drone control stations.\n"
                         "Receives UDP video streams from PX4 SITL Gazebo simulation.\n\n"
                         "Features:\n"
                         "• Real-time H.264 video decoding\n"
                         "• Screenshot capture\n"
                         "• Fullscreen mode\n"
                         "• Stream statistics\n"
                         "• Configurable settings")
    
    def closeEvent(self, event):
        """Handle application close"""
        if self.video_thread.running:
            self.video_thread.stop()
        event.accept()

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import cv2
        print(f"✅ OpenCV version: {cv2.__version__}")
    except ImportError:
        print("❌ OpenCV not found. Install with: pip install opencv-python")
        return False
    
    try:
        from PyQt5.QtWidgets import QApplication
        print("✅ PyQt5 found")
    except ImportError:
        print("❌ PyQt5 not found. Install with: pip install PyQt5")
        return False
    
    # Check GStreamer
    try:
        result = subprocess.run(['gst-launch-1.0', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("✅ GStreamer found")
        else:
            print("⚠️  GStreamer not found. Install with: sudo apt install gstreamer1.0-tools gstreamer1.0-plugins-*")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("⚠️  GStreamer not found. Install with: sudo apt install gstreamer1.0-tools gstreamer1.0-plugins-*")
    
    return True

def main():
    parser = argparse.ArgumentParser(description="PyQt Drone Video Viewer")
    parser.add_argument("--port", type=int, default=5600, 
                       help="UDP port to receive video stream (default: 5600)")
    
    args = parser.parse_args()
    
    print("🎥 PyQt Drone Video Viewer")
    print("=========================")
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Missing dependencies. Please install them and try again.")
        return 1
    
    # Create Qt application
    app = QApplication(sys.argv)
    app.setApplicationName("Drone Video Viewer")
    app.setApplicationVersion("2.0")
    
    # Set application style
    app.setStyle('Fusion')
    
    # Create and show main window
    viewer = DroneVideoViewer(udp_port=args.port)
    viewer.show()
    
    # Run application
    try:
        return app.exec_()
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
        return 0

if __name__ == "__main__":
    sys.exit(main())