from datetime import datetime
from services.db_client import supabase

def perform_routine_reset(force=False):
    print(f"[{datetime.now()}] Starting Routine Reset Job (Force={force})...")
    
    current_hour = datetime.now().hour
    
    # 1. Get all users
    users_query = supabase.table("profiles").select("id, routine_reset_hour")
    
    # If not forcing, only get users whose reset hour matches current hour
    if not force:
        users_query = users_query.eq("routine_reset_hour", current_hour)
        
    users = users_query.execute()
    
    for user in users.data:
        user_id = user['id']
        
        # 2. Get all completed routine tasks for this user
        completed_routines = supabase.table("tasks")\
            .select("title")\
            .eq("user_id", user_id)\
            .eq("task_type", "routine")\
            .eq("is_completed", True)\
            .execute()
        
        if completed_routines.data:
            print(f"Archiving {len(completed_routines.data)} tasks for user {user_id}")
            # 3. Move them to history
            history_data = [
                {"user_id": user_id, "task_title": r['title']} 
                for r in completed_routines.data
            ]
            supabase.table("routine_history").insert(history_data).execute()
            
            # 4. Uncheck all routine tasks for the new day
            supabase.table("tasks")\
                .update({"is_completed": False, "completed_at": None})\
                .eq("user_id", user_id)\
                .eq("task_type", "routine")\
                .execute()
                
            print(f"Successfully reset routines for user {user_id}")
        else:
            print(f"User {user_id} has no completed routines to reset.")

    print("Routine Reset Job Finished.")