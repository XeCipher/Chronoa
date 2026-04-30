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
    tasks = supabase.table("tasks").select("completed_at").eq("user_id", user_id).not_.is_("completed_at", "null").execute()
    journals = supabase.table("journal_entries").select("entry_date").eq("user_id", user_id).execute()
    routines = supabase.table("routine_history").select("reset_date").eq("user_id", user_id).execute()
    
    activity_map = {}

    def add_to_map(date_str):
        if not date_str: return
        date_only = date_str.split('T')[0]
        activity_map[date_only] = activity_map.get(date_only, 0) + 1

    today_str = datetime.now().date().strftime('%Y-%m-%d')

    for t in tasks.data: add_to_map(t.get('completed_at'))
    
    # Writing today's journal shouldn't immediately pad the master focus map
    for j in journals.data: 
        if j.get('entry_date') != today_str:
            add_to_map(j.get('entry_date'))
            
    for r in routines.data: add_to_map(r.get('reset_date'))

    # Calculate Current Streak
    streak = 0
    check_date = datetime.now().date()
    
    if check_date.strftime('%Y-%m-%d') not in activity_map:
        check_date -= timedelta(days=1)
        
    while check_date.strftime('%Y-%m-%d') in activity_map:
        streak += 1
        check_date -= timedelta(days=1)
    
    formatted_activity = []
    for date, count in activity_map.items():
        level = 1 if count <= 2 else 2 if count <= 5 else 3 if count <= 8 else 4
        formatted_activity.append({"date": date, "count": count, "level": level})

    # --- 2. Time Focus Aggregation ---
    sessions = supabase.table("time_sessions").select("duration_seconds, created_at, title").eq("user_id", user_id).execute()
    time_map = {}
    category_map = {}

    for s in sessions.data:
        date = s.get('created_at', '').split('T')[0]
        mins = s.get('duration_seconds', 0) // 60
        time_map[date] = time_map.get(date, 0) + mins
        
        cat = s.get('title') or "Unfocused"
        category_map[cat] = category_map.get(cat, 0) + mins

    formatted_time = [{"date": k, "count": v, "level": min(v // 30, 4)} for k, v in time_map.items()]
    formatted_categories = [{"name": k, "value": v} for k, v in category_map.items()]

    return jsonify({
        "master_activity": formatted_activity,
        "time_tracking": formatted_time,
        "streak": streak,
        "categories": formatted_categories
    })