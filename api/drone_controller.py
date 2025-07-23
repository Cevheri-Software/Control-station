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
        # Connect to the MAVSDK server
        self.drone      = System(mavsdk_server_address='localhost', port=50051)

    async def _connect(self):
        print("Connecting to drone via MAVSDK server...")
        try:
            await self.drone.connect(system_address=self.url)
            print("Waiting for drone connection...")
            
            # Wait for connection with timeout
            timeout = 30  # 30 seconds
            start_time = asyncio.get_event_loop().time()
            
            async for state in self.drone.core.connection_state():
                if state.is_connected:
                    print("✅ Drone connected successfully!")
                    self.shared["health"] = "connected"
                    return True
                    
                # Check timeout
                if asyncio.get_event_loop().time() - start_time > timeout:
                    print("❌ Connection timeout")
                    self.shared["health"] = "timeout"
                    return False
                    
        except Exception as e:
            print(f"Connection error: {e}")
            self.shared["health"] = "error"
            return False

    async def _arm_and_takeoff(self):
        print("Arming and taking off...")
        try:
            await self.drone.action.arm()
            await self.drone.action.takeoff()
            await asyncio.sleep(4)
            self.shared["health"] = "flying"
            return True
        except Exception as e:
            print(f"Takeoff error: {e}")
            self.shared["health"] = "takeoff_error"
            return False

    async def _enable_offboard(self):
        try:
            print("Enabling offboard mode...")
            await self.drone.offboard.set_position_ned(
                PositionNedYaw(0, 0, -self.altitude, 0)
            )
            await self.drone.offboard.start()
            self.shared["health"] = "offboard"
            print("✅ Offboard mode enabled")
            return True
        except OffboardError as err:
            print("❌ Offboard error:", err)
            self.shared["health"] = "offboard_error"
            return False

    async def _telemetry_loop(self):
        """Collect all telemetry data and update shared state"""
        print("🔄 Starting telemetry collection...")
        
        # Start telemetry tasks and handle exceptions
        tasks = [
            asyncio.create_task(self._position_telemetry()),
            asyncio.create_task(self._velocity_telemetry()),
            asyncio.create_task(self._battery_telemetry()),
        ]
        
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as e:
            print(f"Telemetry loop error: {e}")

    async def _position_telemetry(self):
        """Monitor position data"""
        try:
            print("📍 Starting position telemetry...")
            async for pos in self.drone.telemetry.position():
                self.shared["position"] = {
                    "lat": pos.latitude_deg,
                    "lon": pos.longitude_deg,
                    "abs_alt": pos.absolute_altitude_m,
                }
                print(f"📍 Position updated: {self.shared['position']}")
                print(f"Position: {pos.latitude_deg:.6f}, {pos.longitude_deg:.6f}")
        except Exception as e:
            print(f"Position telemetry error: {e}")

    async def _velocity_telemetry(self):
        """Monitor velocity data and update shared state"""
        try:
            print("🏃 Starting velocity telemetry...")
            async for velocity in self.drone.telemetry.velocity_ned():
                self.shared["velocity"] = {
                    "x": round(velocity.north_m_s, 2),
                    "y": round(velocity.east_m_s, 2), 
                    "z": round(velocity.down_m_s, 2)
                }
                print(f"✅ Velocity updated: {self.shared['velocity']}")
        except Exception as e:
            print(f"❌ Velocity telemetry error: {e}")

    async def _battery_telemetry(self):
        """Monitor battery data and update shared state"""
        try:
            print("🔋 Starting battery telemetry...")
            async for battery in self.drone.telemetry.battery():
                self.shared["battery"] = {
                    "level": round(battery.remaining_percent, 1),
                    "voltage": round(battery.voltage_v, 2),
                    "temperature": 25.0  # MAVSDK doesn't provide temperature
                }
                print(f"✅ Battery updated: {self.shared['battery']}")
        except Exception as e:
            print(f"❌ Battery telemetry error: {e}")

    async def _mission_loop(self):
        print("🚁 Starting mission loop...")
        nx = ex = 0.0
        while True:
            try:
                nx += random.uniform(-1.5, 1.5)
                ex += random.uniform(-1.5, 1.5)
                yaw = (math.degrees(math.atan2(ex, nx)) + 360) % 360
                await self.drone.offboard.set_position_ned(
                    PositionNedYaw(nx, ex, -self.altitude, yaw)
                )
                await asyncio.sleep(self.rate)
            except Exception as e:
                print(f"Mission loop error: {e}")
                await asyncio.sleep(1)

    async def run(self):
        print("🚀 Starting DroneController...")
        try:
            # Connect to drone
            if not await self._connect():
                print("❌ Failed to connect to drone")
                return
                
            # Start telemetry immediately after connection
            print("📡 Starting telemetry collection...")
            telemetry_task = asyncio.create_task(self._telemetry_loop())
            
            # Give telemetry a moment to start
            await asyncio.sleep(2)
            
            # Arm and takeoff
            if not await self._arm_and_takeoff():
                print("❌ Failed to arm and takeoff")
                return
                
            # Enable offboard mode
            if not await self._enable_offboard():
                print("❌ Failed to enable offboard mode")
                return
            
            # Run mission loop alongside telemetry
            mission_task = asyncio.create_task(self._mission_loop())
            
            # Wait for both tasks
            await asyncio.gather(telemetry_task, mission_task, return_exceptions=True)
            
        except Exception as e:
            print(f"❌ DroneController error: {e}")
            self.shared["health"] = "error"