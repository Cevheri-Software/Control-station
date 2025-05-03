from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
import asyncio
import random
import os
from datetime import datetime

# -----------------------------
# Shared Drone State
# -----------------------------
drone_data = {
    "velocity": {"x": 0.0, "y": 0.0, "z": 0.0},
    "battery": {"level": 100.0, "voltage": 12.4, "temperature": 25.0},
    "camera": {"last_frame": None, "timestamp": None},
}

# -----------------------------
# FastAPI + Socket.IO Setup
# -----------------------------
app = FastAPI(title="Drone Control Station API", version="1.0.0")

# CORS settings (open to everything for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Async Socket.IO server (compatible with the frontend's socket.io-client)
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
# `socket_app` is what we actually run via Uvicorn
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# -----------------------------
# Pydantic Models
# -----------------------------
class Velocity(BaseModel):
    x: float
    y: float
    z: float


class Battery(BaseModel):
    level: float
    voltage: float
    temperature: float


# -----------------------------
# REST Endpoints
# -----------------------------
@app.get("/api/python")
async def hello_world():
    return {"message": "Hello, World!"}


# Velocity ----------------------------------------------------------
@app.post("/api/velocity")
async def post_velocity(payload: Velocity):
    drone_data["velocity"] = payload.dict()
    return {"status": "success"}


@app.get("/api/velocity")
async def get_velocity():
    return drone_data["velocity"]


# Battery -----------------------------------------------------------
@app.post("/api/battery")
async def post_battery(payload: Battery):
    drone_data["battery"] = payload.dict()
    return {"status": "success"}


@app.get("/api/battery")
async def get_battery():
    return drone_data["battery"]


# Camera ------------------------------------------------------------
@app.post("/api/camera")
async def post_camera(frame: UploadFile = File(...)):
    if not frame.filename:
        raise HTTPException(status_code=400, detail="Empty frame")

    filename = f"frame_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.jpg"
    filepath = os.path.join("/tmp", filename)

    # Save uploaded image
    with open(filepath, "wb") as dst:
        dst.write(await frame.read())

    drone_data["camera"] = {"last_frame": filename, "timestamp": datetime.utcnow().isoformat()}
    return {"status": "success"}


@app.get("/api/camera")
async def get_camera():
    return drone_data["camera"]


# -----------------------------
# Socket.IO Handlers & Tasks
# -----------------------------
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")


async def emit_loop():
    """Periodically push telemetry to all connected clients."""
    while True:
        await sio.emit("velocity", drone_data["velocity"])
        await sio.emit("battery", drone_data["battery"])
        await asyncio.sleep(1)  # 1 Hz


async def mock_drone_data():
    """Generate mock data when real drone in not connected."""
    while True:
        drone_data["velocity"] = {
            "x": random.uniform(-5, 5),
            "y": random.uniform(-5, 5),
            "z": random.uniform(0, 2),
        }
        drone_data["battery"] = {
            "level": max(0.0, drone_data["battery"]["level"] - 0.1),
            "voltage": 12.0 + random.uniform(-0.5, 0.5),
            "temperature": 25 + random.uniform(0, 5),
        }
        await asyncio.sleep(1)


# Start background tasks once the API starts up
@app.on_event("startup")
async def _on_startup():
    asyncio.create_task(mock_drone_data())
    asyncio.create_task(emit_loop())


# -----------------------------
# Entrypoint
# -----------------------------
if __name__ == "__main__":
    import uvicorn

    # We pass the ASGI app that includes both FastAPI and Socket.IO layers
    uvicorn.run(socket_app, host="0.0.0.0", port=5328, reload=False)