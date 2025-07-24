#!/bin/bash
# Video Stream Configuration Script for PX4 SITL Gazebo

echo "🎥 PX4 SITL Video Stream Configuration"
echo "======================================"

# Check if GStreamer is installed
if ! command -v gst-launch-1.0 &> /dev/null; then
    echo "❌ GStreamer not found. Installing..."
    sudo apt update
    sudo apt install -y gstreamer1.0-tools gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly
fi

echo "🔧 Available options:"
echo "1. Run with QGroundControl video disabled (recommended)"
echo "2. Run with video splitting (experimental)"
echo "3. Use alternative video port"

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo "🎯 Option 1: Disable QGroundControl video"
        echo "Please disable video in QGroundControl:"
        echo "  1. Open QGroundControl"
        echo "  2. Go to Application Settings → Video"
        echo "  3. Set Video Source to 'Disabled'"
        echo "  4. Restart your Control Station"
        ;;
    2)
        echo "🔄 Option 2: Setting up video splitting..."
        # Kill any existing video processes
        pkill -f "gst-launch.*5600" || true
        
        # Start video splitter
        gst-launch-1.0 udpsrc port=5600 ! \
            application/x-rtp,media=video,clock-rate=90000,encoding-name=H264,payload=96 ! \
            rtph264depay ! h264parse ! tee name=t \
            t. ! queue ! avdec_h264 ! videoconvert ! jpegenc ! multipartmux ! \
            tcpserversink host=0.0.0.0 port=8080 \
            t. ! queue ! rtph264pay ! udpsink host=127.0.0.1 port=5601 &
        
        echo "✅ Video splitter started"
        echo "📺 Control Station: http://localhost:8080"
        echo "📺 QGroundControl: Change video port to 5601"
        ;;
    3)
        echo "🔧 Option 3: Alternative port configuration"
        echo "Set these environment variables before starting PX4:"
        echo "export PX4_SIM_MODEL=gazebo_typhoon_h480"
        echo "export GAZEBO_VIDEO_URI=udp://127.0.0.1:5601"
        ;;
esac

echo ""
echo "🚀 Now start your PX4 SITL:"
echo "make px4_sitl gazebo_typhoon_h480"