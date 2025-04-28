from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from drone_handler import drone_data, mock_drone_data

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins='*')

@app.route("/api/python")
def hello_world():
    return "<p>Hello, World!</p>"

# Websocket connection handler
@socketio.on('connect')
def handle_connect():
    print('Client connected')

def start_emit_loop():
    import threading, time
    def run():
        while True:
            socketio.emit('velocity', drone_data['velocity'])
            socketio.emit('battery', drone_data['battery'])
            time.sleep(1)
    threading.Thread(target=run, daemon=True).start()

if __name__ == '__main__':
    import threading
    threading.Thread(target=mock_drone_data, daemon=True).start()
    start_emit_loop()
    socketio.run(app, port=5328)