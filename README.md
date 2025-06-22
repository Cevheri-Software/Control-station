<p align="center">
  <a href="https://nextjs-flask-starter.vercel.app/">
    <img src="https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png" height="96">
    <h3 align="center">Drone Control Station</h3>
  </a>
</p>

<p align="center">Typescript frontend with FastAPI backend for drone control and telemetry monitoring.</p>

<br/>

## Introduction

This is a hybrid Next.js + Python app that provides a web-based drone control station. It uses Next.js as the frontend interface and Flask with MAVSDK as the API backend for drone communication.

## Features

- Real-time drone telemetry monitoring
- Web-based control interface
- MAVSDK integration for MAVLink communication
- Socket.io for real-time data streaming
- RESTful API endpoints for drone control

## How It Works

The Python/Flask server is mapped into to Next.js app under `/api/`. The drone controller uses MAVSDK to communicate with drone systems via MAVLink protocol.

This is implemented using [`next.config.js` rewrites](https://github.com/vercel/examples/blob/main/python/nextjs-flask/next.config.js) to map any request to `/api/:path*` to the Flask API, which is hosted in the `/api` folder.

On localhost, the rewrite will be made to the `127.0.0.1:5328` port, which is where the Flask server is running.

## QGroundControl Connection

The drone controller connects to **port 14540** (standard drone simulation port) using the connection string `udp://:14540`.

### Connecting QGroundControl:

**Option 1: Auto-Connect**
- QGroundControl should automatically detect and connect to `localhost:14540` if you have a simulator running

**Option 2: Manual Connection**
1. Open QGroundControl
2. Go to **Application Settings** → **Comm Links**
3. Create a new connection with:
   - **Type**: UDP
   - **Listening Port**: `14540`
   - **Target Host**: `127.0.0.1` (localhost)
   - **Target Port**: `14540`

### Simulator Requirements

Before running the application, you need one of the following:
- **PX4 SITL** simulator running on port 14540
- **QGroundControl** with simulation mode
- **MAVSDK server** running manually

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Run the Python API server:

```bash
python -m api.index
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The Flask server will be running on [http://127.0.0.1:5328](http://127.0.0.1:5328) – feel free to change the port in `package.json` (you'll also need to update it in `next.config.js`).

## API Endpoints

- `GET /api/python` - Hello world endpoint
- `GET/POST /api/velocity` - Drone velocity data
- `GET/POST /api/battery` - Battery telemetry
- `GET/POST /api/camera` - Camera feed
- `POST /api/rtl` - Return to launch command

## Troubleshooting

### Import Errors
If you get `ModuleNotFoundError: No module named 'api'`, make sure to run the Python server as a module:
```bash
python -m api.index
```

### MAVSDK Server Issues
If you see "mavsdk_server binary not found", you need to either:
1. Download MAVSDK server from [MAVSDK releases](https://github.com/mavlink/MAVSDK/releases)
2. Run a drone simulator (PX4 SITL, QGroundControl)
3. Use the mock mode (modify `api/drone_controller.py`)

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Flask Documentation](https://flask.palletsprojects.com/en/1.1.x/) - learn about Flask features and API
- [MAVSDK Documentation](https://mavsdk.mavlink.io/) - learn about MAVSDK drone communication
- [MAVLink Protocol](https://mavlink.io/) - drone communication protocol

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
