from flask import Flask, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from services.routine_reset import perform_routine_reset
from config import Config # Import config
from routes.analytics import analytics_bp

# VALIDATION: Check for env vars before starting
Config.validate()

app = Flask(__name__)
CORS(app)

app.register_blueprint(analytics_bp)

# Initialize Scheduler
scheduler = BackgroundScheduler()
# Check every hour on the dot (minute 0)
scheduler.add_job(func=perform_routine_reset, trigger="cron", minute=0)
scheduler.start()

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "alive", "message": "Chronoa backend is healthy"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)