from pymavlink import mavutil

# Connect to the same port as PX4/MAVSDK (14540)
master = mavutil.mavlink_connection('udp:0.0.0.0:14540')
print("Waiting for heartbeat from PX4...")
master.wait_heartbeat()
print(f"Heartbeat from system {master.target_system}, component {master.target_component}")

# Request telemetry data streams
print("Requesting data streams...")
master.mav.request_data_stream_send(
    master.target_system, 
    master.target_component, 
    mavutil.mavlink.MAV_DATA_STREAM_ALL, 
    10,  # 10 Hz
    1    # Start streaming
)

# Continuous telemetry monitoring
print("Starting telemetry monitoring...")
while True:
    msg = master.recv_match(blocking=True)
    if not msg:
        continue
    
    t = msg.get_type()
    if t == 'GLOBAL_POSITION_INT':
        print(f"Position: {msg.lat/1e7:.6f}, {msg.lon/1e7:.6f}, Alt: {msg.alt/1000:.1f}m")
    elif t == 'ATTITUDE':
        print(f"Attitude: Roll={msg.roll:.2f}, Pitch={msg.pitch:.2f}, Yaw={msg.yaw:.2f}")
    elif t == 'BATTERY_STATUS':
        print(f"Battery: {msg.battery_remaining}%")
    elif t == 'LOCAL_POSITION_NED':
        print(f"Velocity: vx={msg.vx:.2f}, vy={msg.vy:.2f}, vz={msg.vz:.2f}")
    elif t == 'RC_CHANNELS':
        print(f"RC: {msg.chan1_raw}, {msg.chan2_raw}, {msg.chan3_raw}, {msg.chan4_raw}")