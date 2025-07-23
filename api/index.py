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
# to do: Consider using asynchronous file I/O (for example, using aiofiles) to avoid blocking the event loop when saving uploaded files.
# -----------------------------
drone_data = {
    "velocity": {"x": 0.0, "y": 0.0, "z": 0.0},
    "battery": {"level": 100.0, "voltage": 12.4, "temperature": 25.0},
    "camera": {"last_frame": None, "timestamp": None},
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
    await controller.drone.action.return_to_launch()
    return {"status": "RTL triggered"}


# -----------------------------
# Socket.IO Handlers & Tasks
# -----------------------------
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")


async def emit_loop():
    """Periodically push telemetry to all connected clients."""
    while True:
        # Add debug logging to see what's being emitted
        print(f"📡 Emitting velocity: {drone_data['velocity']}")
        print(f"🔋 Emitting battery: {drone_data['battery']}")
        print(f"🏥 Health status: {drone_data['health']}")
        
        await sio.emit("velocity", drone_data["velocity"])
        await sio.emit("battery", drone_data["battery"])
        await sio.emit("health", drone_data["health"])
        await asyncio.sleep(1)  # 1 Hz


# Start background tasks once the API starts up
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

    # We pass the ASGI app that includes both FastAPI and Socket.IO layers
    uvicorn.run(socket_app, host="0.0.0.0", port=5328, reload=False)