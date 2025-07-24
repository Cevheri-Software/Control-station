from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
import asyncio
import random
import os
from datetime import datetime
from api.drone_controller import DroneController

# -----------------------------
# Shared Drone State
# -----------------------------
drone_data = {
    "velocity": {"x": 0.0, "y": 0.0, "z": 0.0},
    "battery": {"level": 100.0, "voltage": 12.4, "temperature": 25.0},
    "camera": {"last_frame": None, "timestamp": None},
    "position": {"lat": 0.0, "lon": 0.0, "abs_alt": 0.0},
    "attitude": {"roll": 0.0, "pitch": 0.0, "yaw": 0.0, "heading": 0.0},
    "health": "starting"
}
controller: DroneController | None = None

# -----------------------------
# FastAPI + Socket.IO Setup
# -----------------------------
app = FastAPI(title="Drone Control Station API", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

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


# RTL ------------------------------------------------------------
@app.post("/api/rtl")
async def return_to_launch():
    if controller:
        success = await controller.return_to_launch()
        return {"status": "RTL triggered" if success else "RTL failed"}
    return {"status": "Controller not available"}

# Drone Control Endpoints ----------------------------------------
@app.post("/api/arm")
async def arm_drone():
    if controller:
        success = await controller.arm_drone()
        return {"status": "Armed successfully" if success else "Arm failed"}
    return {"status": "Controller not available"}

@app.post("/api/disarm")
async def disarm_drone():
    if controller:
        success = await controller.disarm_drone()
        return {"status": "Disarmed successfully" if success else "Disarm failed"}
    return {"status": "Controller not available"}

@app.post("/api/takeoff")
async def takeoff_drone():
    if controller:
        success = await controller.takeoff_drone()
        return {"status": "Takeoff initiated" if success else "Takeoff failed"}
    return {"status": "Controller not available"}

@app.post("/api/land")
async def land_drone():
    if controller:
        success = await controller.land_drone()
        return {"status": "Landing initiated" if success else "Landing failed"}
    return {"status": "Controller not available"}

# Video Status Endpoint (for UI compatibility) -----------------
@app.get("/api/video-status")
async def get_video_status():
    """Return video status - now handled by native Python viewer"""
    return {
        "status": "native_viewer", 
        "message": "Use native Python video viewer: ./run_video_viewer.sh",
        "port": 5600
    }

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
        await sio.emit("health", drone_data["health"])
        await sio.emit("position", drone_data["position"])
        await sio.emit("attitude", drone_data["attitude"])
        await asyncio.sleep(1)  # 1 Hz


# -----------------------------
# FastAPI Startup
# -----------------------------
@app.on_event("startup")
async def _on_startup():
    global controller
    controller = DroneController(drone_data)
    asyncio.create_task(controller.run())
    asyncio.create_task(emit_loop())

# -----------------------------
# Entrypoint
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=5328, reload=False)