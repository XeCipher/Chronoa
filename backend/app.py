from flask import Flask, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from services.routine_reset import perform_routine_reset
from routes.auth import auth_bp
from config import Config

Config.validate()

app = Flask(__name__)

app.register_blueprint(auth_bp)

CORS(app, resources={r"/*": {"origins": "*"}})

scheduler = BackgroundScheduler()
scheduler.add_job(func=perform_routine_reset, trigger="cron", minute=0)
scheduler.start()

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "alive", "message": "Chronoa backend is healthy"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=Config.PORT)