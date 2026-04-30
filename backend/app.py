from flask import Flask, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from services.routine_reset import perform_routine_reset
from routes.analytics import analytics_bp
from routes.auth import auth_bp
from config import Config

# VALIDATION
Config.validate()

app = Flask(__name__)

# 1. Register Blueprints FIRST
app.register_blueprint(analytics_bp)
app.register_blueprint(auth_bp)

# 2. Initialize CORS SECOND (Allowing everything for now to guarantee it works)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=perform_routine_reset, trigger="cron", minute=0)
scheduler.start()

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "alive", "message": "Chronoa backend is healthy"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=Config.PORT)