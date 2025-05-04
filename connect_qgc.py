from pymavlink import mavutil

master = mavutil.mavlink_connection('udp:0.0.0.0:14551')
print("Waiting for heartbeat from QGroundControl...")
master.wait_heartbeat()
print(f"Heartbeat from system {master.target_system}, component {master.target_component}")
for _ in range(5):
    msg = master.recv_match(blocking=True)
    print(msg) 