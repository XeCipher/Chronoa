from flask import Blueprint, jsonify, request
from services.db_client import supabase
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/activity-data', methods=['GET'])
def get_activity_data():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    # We want data for the last 365 days
    today = datetime.now()
    start_date = (today - timedelta(days=365)).strftime('%Y-%m-%d')

    # 1. Get Task Completion counts
    tasks = supabase.table("tasks").select("completed_at").eq("user_id", user_id).not_.is_("completed_at", "null").execute()
    
    # 2. Get Routine History counts
    routines = supabase.table("routine_history").select("reset_date").eq("user_id", user_id).execute()
    
    # 3. Get Journal Entry counts
    journals = supabase.table("journal_entries").select("entry_date").eq("user_id", user_id).execute()
    
    # Aggregate Master Activity (Counts)
    activity_map = {}
    
    for t in tasks.data:
        date = t['completed_at'].split('T')[0]
        activity_map[date] = activity_map.get(date, 0) + 1
    for r in routines.data:
        date = r['reset_date']
        activity_map[date] = activity_map.get(date, 0) + 1
    for j in journals.data:
        date = j['entry_date']
        activity_map[date] = activity_map.get(date, 0) + 1

    formatted_activity = [{"date": k, "count": v, "level": min(v, 4)} for k, v in activity_map.items()]

    # 4. Get Time Session data (Sum of seconds per day)
    sessions = supabase.table("time_sessions").select("duration_seconds, created_at").eq("user_id", user_id).execute()
    
    time_map = {}
    for s in sessions.data:
        date = s['created_at'].split('T')[0]
        # Convert seconds to minutes for the heatmap
        mins = s['duration_seconds'] // 60
        time_map[date] = time_map.get(date, 0) + mins

    formatted_time = [{"date": k, "count": v, "level": min(v // 30, 4)} for k, v in time_map.items()]

    return jsonify({
        "master_activity": formatted_activity,
        "time_tracking": formatted_time
    })