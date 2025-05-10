from pymavlink import mavutil

master = mavutil.mavlink_connection('udp:0.0.0.0:14551')
print("Waiting for heartbeat from QGroundControl...")
master.wait_heartbeat()
print(f"Heartbeat from system {master.target_system}, component {master.target_component}")
for _ in range(5):
    msg = master.recv_match(blocking=True)
    print(msg)
    
    
# This is a way ill betrying to get relevant data from qground
# Example: request specific data streams at 10Hz and print selected fields
# master.mav.request_data_stream_send(master.target_system, master.target_component, mavutil.mavlink.MAV_DATA_STREAM_ALL, 10, 1)
# while True:
#     msg = master.recv_match(blocking=True)
#     if not msg:
#         continue
#     t = msg.get_type()
#     if t == 'GLOBAL_POSITION_INT':
#         print(msg.lat/1e7, msg.lon/1e7, msg.alt/1000)
#     elif t == 'ATTITUDE':
#         print(msg.roll, msg.pitch, msg.yaw)
#     elif t == 'BATTERY_STATUS':
#         print(msg.battery_remaining)
#     elif t == 'RC_CHANNELS':
#         print(msg.chan1_raw, msg.chan2_raw, msg.chan3_raw, msg.chan4_raw) 