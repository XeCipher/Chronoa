from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# The UptimeRobot Keep-Alive Endpoint
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "Chronoa backend is alive and serene."}), 200

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Chronoa API ready"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=8000)