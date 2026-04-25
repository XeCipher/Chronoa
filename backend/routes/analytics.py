from flask import Blueprint, jsonify, request
from services.db_client import supabase
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/activity-data', methods=['GET'])
def get_activity_data():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    # --- 1. Master Activity Aggregation (Tasks + Journal) ---
    # Fetch all completed tasks
    tasks = supabase.table("tasks").select("completed_at").eq("user_id", user_id).not_.is_("completed_at", "null").execute()
    # Fetch all journal entries
    journals = supabase.table("journal_entries").select("entry_date").eq("user_id", user_id).execute()
    # Fetch all routine completions from history
    routines = supabase.table("routine_history").select("reset_date").eq("user_id", user_id).execute()
    
    activity_map = {}

    # Helper to increment counts in the map
    def add_to_map(date_str):
        if not date_str: return
        date_only = date_str.split('T')[0]
        activity_map[date_only] = activity_map.get(date_only, 0) + 1

    for t in tasks.data: add_to_map(t['completed_at'])
    for j in journals.data: add_to_map(j['entry_date'])
    for r in routines.data: add_to_map(r['reset_date'])

    # Calculate Current Streak (based on map keys)
    streak = 0
    check_date = datetime.now().date()
    while check_date.strftime('%Y-%m-%d') in activity_map:
        streak += 1
        check_date -= timedelta(days=1)
    
    # Format for Heatmap (Scale level 0-4 based on count)
    formatted_activity = []
    for date, count in activity_map.items():
        # Level logic: 1-2 = lvl 1, 3-5 = lvl 2, 6-8 = lvl 3, 9+ = lvl 4
        level = 1 if count <= 2 else 2 if count <= 5 else 3 if count <= 8 else 4
        formatted_activity.append({"date": date, "count": count, "level": level})

    # --- 2. Time Focus Aggregation ---
    sessions = supabase.table("time_sessions").select("duration_seconds, created_at, title").eq("user_id", user_id).execute()
    time_map = {}
    category_map = {}

    for s in sessions.data:
        date = s['created_at'].split('T')[0]
        mins = s['duration_seconds'] // 60
        time_map[date] = time_map.get(date, 0) + mins
        
        cat = s['title'] or "Unfocused"
        category_map[cat] = category_map.get(cat, 0) + mins

    formatted_time = [{"date": k, "count": v, "level": min(v // 30, 4)} for k, v in time_map.items()]
    formatted_categories = [{"name": k, "value": v} for k, v in category_map.items()]

    return jsonify({
        "master_activity": formatted_activity,
        "time_tracking": formatted_time,
        "streak": streak,
        "categories": formatted_categories
    })