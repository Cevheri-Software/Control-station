from flask import Flask
from flask_cors import CORS
from drone_handler import app as drone_app

app = Flask(__name__)
CORS(app)  # Enable CORS if needed

# Mount the drone handler blueprint
app.register_blueprint(drone_app)

@app.route("/api/python")
def hello_world():
    return "<p>Hello, World!</p>"