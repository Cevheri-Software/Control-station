import asyncio, math, random
from mavsdk import System
from mavsdk.offboard import PositionNedYaw, OffboardError

class DroneController:
    def __init__(self, shared_state: dict,
                 altitude: float = 20,
                 data_rate: float = 0.1,
                 sim_url: str = "udp://:14540"):
        self.shared     = shared_state
        self.altitude   = altitude
        self.rate       = data_rate
        self.url        = sim_url
        # The following now connects to a manually-run mavsdk_server instance
        # as the bundled one was not found.
        self.drone      = System(mavsdk_server_address='localhost', port=50051)

    async def _connect(self):
        await self.drone.connect(system_address=self.url)
        async for state in self.drone.core.connection_state():
            if state.is_connected:
                break

    async def _arm_and_takeoff(self):
        await self.drone.action.arm()
        await self.drone.action.takeoff()
        await asyncio.sleep(4)

    async def _enable_offboard(self):
        try:
            await self.drone.offboard.set_position_ned(
                PositionNedYaw(0, 0, -self.altitude, 0)
            )
            await self.drone.offboard.start()
        except OffboardError as err:
            print("❌  Offboard error:", err)

    async def _telemetry_loop(self):
        async for pos in self.drone.telemetry.position():
            self.shared["position"] = {
                "lat": pos.latitude_deg,
                "lon": pos.longitude_deg,
                "abs_alt": pos.absolute_altitude_m,
            }

    async def _mission_loop(self):
        nx = ex = 0.0
        while True:
            nx += random.uniform(-1.5, 1.5)
            ex += random.uniform(-1.5, 1.5)
            yaw = (math.degrees(math.atan2(ex, nx)) + 360) % 360
            await self.drone.offboard.set_position_ned(
                PositionNedYaw(nx, ex, -self.altitude, yaw)
            )
            await asyncio.sleep(self.rate)

    async def run(self):
        await self._connect()
        await self._arm_and_takeoff()
        await self._enable_offboard()
        await asyncio.gather(self._mission_loop(),
                             self._telemetry_loop()) 