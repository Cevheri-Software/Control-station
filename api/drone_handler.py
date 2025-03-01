from flask import Flask, request, jsonify
import random
from datetime import datetime
import time
import os

app = Flask(__name__)

# Mock drone data storage
drone_data = {
    'velocity': {'x': 0, 'y': 0, 'z': 0},
    'battery': {'level': 100, 'voltage': 12.4, 'temperature': 25},
    'camera': {'last_frame': None, 'timestamp': None}
}

@app.route('/api/velocity', methods=['POST', 'GET'])
def handle_velocity():
    if request.method == 'POST':
        data = request.get_json()
        try:
            drone_data['velocity'] = {
                'x': data['x'],
                'y': data['y'],
                'z': data['z']
            }
            return jsonify({'status': 'success'}), 200
        except KeyError as e:
            return jsonify({'error': f'Missing field: {e}'}), 400
    else:
        # GET method for testing/mock data
        return jsonify(drone_data['velocity'])

@app.route('/api/battery', methods=['POST', 'GET'])
def handle_battery():
    if request.method == 'POST':
        data = request.get_json()
        try:
            drone_data['battery'] = {
                'level': data['level'],
                'voltage': data['voltage'],
                'temperature': data['temperature']
            }
            return jsonify({'status': 'success'}), 200
        except KeyError as e:
            return jsonify({'error': f'Missing field: {e}'}), 400
    else:
        # GET method for testing/mock data
        return jsonify(drone_data['battery'])

@app.route('/api/camera', methods=['POST', 'GET'])
def handle_camera():
    if request.method == 'POST':
        if 'frame' not in request.files:
            return jsonify({'error': 'No frame provided'}), 400
            
        frame = request.files['frame']
        if frame.filename == '':
            return jsonify({'error': 'Empty frame'}), 400
            
        try:
            # Save frame temporarily (in real use, process or stream this)
            filename = f"frame_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
            frame.save(os.path.join('/tmp', filename))
            
            drone_data['camera'] = {
                'last_frame': filename,
                'timestamp': datetime.now().isoformat()
            }
            return jsonify({'status': 'success'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        # GET method for testing/mock data
        return jsonify(drone_data['camera'])

def mock_drone_data():
    """Generate mock drone data for testing"""
    while True:
        drone_data['velocity'] = {
            'x': random.uniform(-5, 5),
            'y': random.uniform(-5, 5),
            'z': random.uniform(0, 2)
        }
        drone_data['battery'] = {
            'level': max(0, drone_data['battery']['level'] - 0.1),
            'voltage': 12.0 + random.uniform(-0.5, 0.5),
            'temperature': 25 + random.uniform(0, 5)
        }
        time.sleep(1)

if __name__ == '__main__':
    # Start mock data thread in background for testing
    import threading
    mock_thread = threading.Thread(target=mock_drone_data, daemon=True)
    mock_thread.start()
    
    app.run(port=5328) 
    
    
#     note: To use this:
# The drone can POST data to these endpoints:
# POST /api/velocity with JSON payload {x, y, z}
# POST /api/battery with JSON payload {level, voltage, temperature}
# POST /api/camera with multipart form containing frame=image.jpg
# For development/testing:
# GET /api/velocity - returns current velocity data
# GET /api/battery - returns current battery data
# GET /api/camera - returns last received camera frame info
 # The mock data generator will automatically decrease battery level and generate random sensor values until the drone is ready to send real data.
    # When integrating with the frontend, youll need to:
    # Update your React components to fetch data from these endpoints
    # Set up WebSocket or polling for real-time updates
    # Add proper authentication/security measures for production