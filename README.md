<p align="center">
  <a href="https://nextjs-flask-starter.vercel.app/">
    <img src="/icon-192x192.png" height="96" alt="cevheri">
    <h3 align="center">cevheri</h3>
  </a>
</p>

<p align="center">Control station for drone monitoring.</p>

<br/>

## Introduction

This is a progressive web application drone station. It uses typescript as the frontend interface and FastAPI with MAVSDK as the API backend for drone communication.

## Features

- Real-time drone telemetry monitoring
- Web-based control interface
- MAVSDK integration for MAVLink communication
- Socket.io for real-time data streaming
- RESTful API endpoints for drone control
- Real-time GPS tracking with Google Maps integration

## How It Works

The Python/FastAPI server is mapped into to Next.js app under `/api/`. The drone controller uses MAVSDK to communicate with drone systems via MAVLink protocol.

This is implemented using [`next.config.js` rewrites](https://github.com/vercel/examples/blob/main/python/nextjs-flask/next.config.js) to map any request to `/api/:path*` to the FastAPI server, which is hosted in the `/api` folder.

On localhost, the rewrite will be made to the `127.0.0.1:5328` port, which is where the FastAPI server is running.

## Prerequisites

Before getting started, ensure you have the following installed on your Linux system:

- **Node.js** (v16 or higher) and **pnpm**
- **Python 3.8+** and **pip**
- **Git**
- **QGroundControl** (for ground control station)
- **PX4 SITL** (for drone simulation)

### Installing Prerequisites on Linux

```bash
# Install Node.js and pnpm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Install Python and pip (usually pre-installed)
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Install Git
sudo apt install git
```

## Complete Setup Guide for Linux

### Step 1: Clone and Setup the Project

```bash
# Clone the repository
git clone <your-repo-url>
cd Control-station

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
pnpm install
```

### Step 2: Download and Setup MAVSDK Server

```bash
# Create a directory for MAVSDK server
mkdir -p ~/mavsdk

# Download MAVSDK server (replace with latest version)
cd ~/mavsdk
wget https://github.com/mavlink/MAVSDK/releases/download/v2.12.2/mavsdk_server_linux-x64-musl
chmod +x mavsdk_server_linux-x64-musl

# Create a symlink in your project directory
cd ~/Control-station
ln -sf ~/mavsdk/mavsdk_server_linux-x64-musl mavsdk_server

# OR copy it directly to your project
cp ~/mavsdk/mavsdk_server_linux-x64-musl ./mavsdk_server
chmod +x ./mavsdk_server
```

### Step 3: Install and Setup QGroundControl

```bash
# Download QGroundControl AppImage
cd ~/Downloads
wget https://d176tv9ibo4jno.cloudfront.net/latest/QGroundControl.AppImage
chmod +x QGroundControl.AppImage

# Move to applications directory (optional)
sudo mv QGroundControl.AppImage /opt/
sudo ln -sf /opt/QGroundControl.AppImage /usr/local/bin/qgroundcontrol

# Now you can run QGroundControl from anywhere
qgroundcontrol
```

### Step 4: Install and Setup PX4 SITL (Simulation)

```bash
# Clone PX4 repository
cd ~
git clone https://github.com/PX4/PX4-Autopilot.git --recursive
cd PX4-Autopilot

# Install PX4 dependencies
bash ./Tools/setup/ubuntu.sh

# Build PX4 for simulation
make px4_sitl_default gazebo-classic

# Or build without Gazebo (lighter)
make px4_sitl_default
```

## Running the Control Station

Follow these steps **in order** to run the complete system:

### Terminal 1: Start PX4 SITL Simulator

```bash
cd ~/PX4-Autopilot
make px4_sitl_default gazebo-classic

# Or without Gazebo (lighter, terminal-only)
make px4_sitl_default
```

**Wait for the simulator to fully start** (you'll see "INFO [commander] Ready for takeoff!")

### Terminal 2: Start MAVSDK Server (Optional - if not auto-started)

```bash
cd ~/Control-station
./mavsdk_server -p 50051 udp://:14540
```

**Note:** The drone controller will automatically start MAVSDK server if needed.

### Terminal 3: Start QGroundControl

```bash
qgroundcontrol
```

**Configure QGroundControl:**
1. Go to **Application Settings** → **Comm Links**
2. Create a new connection:
   - **Type**: UDP
   - **Listening Port**: `14540`
   - **Target Host**: `127.0.0.1`
   - **Target Port**: `14540`
3. Connect to the link

### Terminal 4: Start the Python API Server

```bash
cd ~/Control-station

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server
python -m api.index
```

**You should see:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5328
```

### Terminal 5: Start the Next.js Frontend

```bash
cd ~/Control-station

# Start the development server
pnpm dev
```

**You should see:**
```
ready - started server on 0.0.0.0:3000
```

### Step 5: Access the Control Station

Open your web browser and navigate to:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Documentation**: [http://localhost:5328/docs](http://localhost:5328/docs)

## QGroundControl Connection

The drone controller connects to **port 14540** (standard drone simulation port) using the connection string `udp://:14540`.

### Connecting QGroundControl:

**Option 1: Auto-Connect**
- QGroundControl should automatically detect and connect to `localhost:14540` if you have PX4 SITL running

**Option 2: Manual Connection**
1. Open QGroundControl
2. Go to **Application Settings** → **Comm Links**
3. Create a new connection with:
   - **Type**: UDP
   - **Listening Port**: `14540`
   - **Target Host**: `127.0.0.1` (localhost)
   - **Target Port**: `14540`

## API Endpoints

- `GET /api/python` - Hello world endpoint
- `GET/POST /api/velocity` - Drone velocity data
- `GET/POST /api/battery` - Battery telemetry
- `GET/POST /api/camera` - Camera feed
- `POST /api/rtl` - Return to launch command

## Troubleshooting

### Common Issues and Solutions

#### 1. Python Module Errors
```bash
# Error: ModuleNotFoundError: No module named 'api'
# Solution: Always run as module and ensure virtual environment is active
source venv/bin/activate
python -m api.index
```

#### 2. MAVSDK Server Not Found
```bash
# Error: mavsdk_server binary not found
# Solution: Download and make executable
wget https://github.com/mavlink/MAVSDK/releases/download/v2.12.2/mavsdk_server_linux-x64-musl
chmod +x mavsdk_server_linux-x64-musl
```

#### 3. Port Already in Use
```bash
# Error: Port 5328 already in use
# Solution: Kill existing processes
sudo lsof -ti:5328 | xargs kill -9
sudo lsof -ti:3000 | xargs kill -9
```

#### 4. PX4 SITL Won't Start
```bash
# Error: Build failures or missing dependencies
# Solution: Clean build and reinstall dependencies
cd ~/PX4-Autopilot
make clean
make distclean
bash ./Tools/setup/ubuntu.sh
make px4_sitl_default
```

#### 5. QGroundControl Connection Issues
- Ensure PX4 SITL is running first
- Check that port 14540 is not blocked by firewall
- Try restarting QGroundControl
- Verify UDP connection settings

#### 6. Socket.IO Connection Failed
- Check that both frontend (port 3000) and backend (port 5328) are running
- Verify CORS settings in the API
- Check browser console for connection errors

### Development Tips

```bash
# Monitor all processes
# Terminal 1: PX4 SITL
make px4_sitl_default

# Terminal 2: Python API (with auto-reload)
source venv/bin/activate
uvicorn api.index:socket_app --host 0.0.0.0 --port 5328 --reload

# Terminal 3: Next.js (with auto-reload)
pnpm dev

# Terminal 4: QGroundControl
qgroundcontrol
```

### Stopping All Services

```bash
# Stop all processes
pkill -f "px4"
pkill -f "python -m api.index"
pkill -f "pnpm dev"
pkill -f "qgroundcontrol"
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [FastAPI Documentation](https://fastapi.tiangolo.com/) - learn about FastAPI features and API
- [MAVSDK Documentation](https://mavsdk.mavlink.io/) - learn about MAVSDK drone communication
- [MAVLink Protocol](https://mavlink.io/) - drone communication protocol
- [PX4 Documentation](https://docs.px4.io/) - PX4 autopilot documentation
- [QGroundControl User Guide](https://docs.qgroundcontrol.com/) - ground control station documentation

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
