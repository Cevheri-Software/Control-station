import asyncio, random
import subprocess
from mavsdk import System
from mavsdk.offboard import PositionNedYaw, OffboardError

class VideoStreamBridge:
    def __init__(self):
        self.process = None
        self.is_running = False
        
    def start_stream_bridge(self):
        """Start GStreamer bridge to convert UDP to HTTP stream"""
        if self.is_running:
            return
            
        try:
            # Simplified approach: Direct UDP to MJPEG HTTP stream
            gst_pipeline = [
                'gst-launch-1.0', '-v',
                'udpsrc', 'port=5600', 'caps=application/x-rtp,encoding-name=H264,payload=96',
                '!', 'rtph264depay',
                '!', 'h264parse',
                '!', 'avdec_h264',
                '!', 'videoconvert',
                '!', 'videoscale',
                '!', 'video/x-raw,width=640,height=480',
                '!', 'jpegenc', 'quality=90',
                '!', 'multipartmux', 'boundary=spionisto',
                '!', 'tcpserversink', 'host=0.0.0.0', 'port=8080'
            ]
            
            print("🎥 Starting simplified video stream bridge...")
            self.process = subprocess.Popen(
                gst_pipeline,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Give it a moment to start
            import time
            time.sleep(2)
            
            # Check if process is still running
            if self.process.poll() is None:
                self.is_running = True
                print("✅ Video stream bridge started on port 8080")
                return True
            else:
                stderr_output = self.process.stderr.read().decode()
                print(f"❌ Video bridge failed: {stderr_output}")
                self.is_running = False
                return False
                
        except Exception as e:
            print(f"❌ Failed to start video bridge: {e}")
            self.is_running = False
            return False

    def _start_direct_udp_bridge(self):
        """Fallback: Direct UDP approach without multicast"""
        try:
            gst_pipeline = [
                'gst-launch-1.0',
                'udpsrc', 'port=5600',
                '!', 'application/x-rtp,media=video,clock-rate=90000,encoding-name=H264,payload=96',
                '!', 'rtph264depay',
                '!', 'h264parse',
                '!', 'avdec_h264',
                '!', 'videoconvert',
                '!', 'jpegenc', 'quality=80',
                '!', 'multipartmux',
                '!', 'tcpserversink', 'host=0.0.0.0', 'port=8080'
            ]
            
            self.process = subprocess.Popen(
                gst_pipeline,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            import time
            time.sleep(1)
            
            if self.process.poll() is None:
                self.is_running = True
                print("✅ Video stream bridge started (direct UDP mode)")
            else:
                print("❌ Both video bridge approaches failed")
                self.is_running = False
                
        except Exception as e:
            print(f"❌ Direct UDP bridge failed: {e}")
            self.is_running = False

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
        # Initialize video bridge
        self.video_bridge = VideoStreamBridge()

    async def _connect(self):
        print("Connecting to drone via MAVSDK server...")
        try:
            await self.drone.connect(system_address=self.url)
            print("Waiting for drone connection...")
            
            # Start video bridge when drone connects
            self.video_bridge.start_stream_bridge()
            
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
            asyncio.create_task(self._attitude_telemetry()),
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

    async def _attitude_telemetry(self):
        """Monitor attitude data and update shared state"""
        try:
            print("🧭 Starting attitude telemetry...")
            async for attitude in self.drone.telemetry.attitude_euler():
                # Read euler angles in degrees
                roll_deg = attitude.roll_deg
                pitch_deg = attitude.pitch_deg
                yaw_deg = attitude.yaw_deg
                # Normalize heading to 0-360 degrees
                heading = (yaw_deg + 360) % 360
                # Update shared state
                self.shared["attitude"] = {
                    "roll": round(roll_deg, 2),
                    "pitch": round(pitch_deg, 2),
                    "yaw": round(yaw_deg, 2),
                    "heading": round(heading, 1)
                }
                print(f"🧭 Attitude updated: {self.shared['attitude']}")
        except Exception as e:
            print(f"❌ Attitude telemetry error: {e}")

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

    async def arm_drone(self):
        """Arm the drone"""
        try:
            print("🔧 Arming drone...")
            await self.drone.action.arm()
            self.shared["health"] = "armed"
            print("✅ Drone armed successfully")
            return True
        except Exception as e:
            print(f"❌ Arm error: {e}")
            self.shared["health"] = "arm_error"
            return False

    async def disarm_drone(self):
        """Disarm the drone"""
        try:
            print("🔧 Disarming drone...")
            await self.drone.action.disarm()
            self.shared["health"] = "disarmed"
            print("✅ Drone disarmed successfully")
            return True
        except Exception as e:
            print(f"❌ Disarm error: {e}")
            self.shared["health"] = "disarm_error"
            return False

    async def takeoff_drone(self):
        """Takeoff the drone"""
        try:
            print("🚁 Taking off...")
            await self.drone.action.takeoff()
            self.shared["health"] = "taking_off"
            print("✅ Takeoff initiated")
            return True
        except Exception as e:
            print(f"❌ Takeoff error: {e}")
            self.shared["health"] = "takeoff_error"
            return False

    async def land_drone(self):
        """Land the drone"""
        try:
            print("🛬 Landing...")
            await self.drone.action.land()
            self.shared["health"] = "landing"
            print("✅ Landing initiated")
            return True
        except Exception as e:
            print(f"❌ Land error: {e}")
            self.shared["health"] = "land_error"
            return False

    async def return_to_launch(self):
        """Return to launch position"""
        try:
            print("🏠 Returning to launch...")
            await self.drone.action.return_to_launch()
            self.shared["health"] = "rtl"
            print("✅ RTL initiated")
            return True
        except Exception as e:
            print(f"❌ RTL error: {e}")
            self.shared["health"] = "rtl_error"
            return False