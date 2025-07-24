#!/bin/bash
# PyQt Drone Video Viewer Launcher Script

echo "🎥 PyQt Drone Video Viewer Launcher"
echo "===================================="

# Check if Python virtual environment exists
if [ -d "venv" ]; then
    echo "🐍 Activating virtual environment..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "🐍 Activating virtual environment..."
    source .venv/bin/activate
else
    echo "⚠️  No virtual environment found. Using system Python."
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Check if GStreamer is installed
if ! command -v gst-launch-1.0 &> /dev/null; then
    echo "❌ GStreamer not found. Installing..."
    sudo apt update
    sudo apt install -y gstreamer1.0-tools gstreamer1.0-plugins-base \
                        gstreamer1.0-plugins-good gstreamer1.0-plugins-bad \
                        gstreamer1.0-plugins-ugly gstreamer1.0-libav
fi

# Check if PyQt5 system dependencies are available
echo "🔧 Checking PyQt5 system dependencies..."
if ! dpkg -l | grep -q "libqt5gui5"; then
    echo "⚠️  Installing PyQt5 system dependencies..."
    sudo apt install -y python3-pyqt5 python3-pyqt5.qtmultimedia \
                        qtmultimedia5-dev libqt5multimedia5-plugins
fi

echo ""
echo "🚀 Starting PyQt Video Viewer..."
echo "📺 Make sure your PX4 SITL is running with video enabled"
echo "💡 Use 'python video_viewer.py --help' for more options"
echo ""
echo "Features:"
echo "• 🖥️  Professional GUI interface"
echo "• 📸 Screenshot capture (Ctrl+S)"
echo "• 🔧 Configurable settings"
echo "• 📊 Real-time statistics"
echo "• ⌨️  Keyboard shortcuts"
echo ""

# Set display for GUI applications
export DISPLAY=${DISPLAY:-:0}

# Run the PyQt video viewer
python3 video_viewer.py "$@"