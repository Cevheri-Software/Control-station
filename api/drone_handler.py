import random
import asyncio

# Shared state imported by `index.py`
drone_data = {
    "velocity": {"x": 0, "y": 0, "z": 0},
    "battery": {"level": 100, "voltage": 12.4, "temperature": 25},
    "camera": {"last_frame": None, "timestamp": None},
}

async def mock_drone_data():
    """Generate mock drone data for testing."""
    while True:
        drone_data["velocity"] = {
            "x": random.uniform(-5, 5),
            "y": random.uniform(-5, 5),
            "z": random.uniform(0, 2),
        }
        drone_data["battery"] = {
            "level": max(0, drone_data["battery"]["level"] - 0.1),
            "voltage": 12.0 + random.uniform(-0.5, 0.5),
            "temperature": 25 + random.uniform(0, 5),
        }
        await asyncio.sleep(1)

# NOTE: This file retained only mock data generation and shared state to avoid duplicate API routes.
# API routes are now defined in `index.py` using FastAPI.