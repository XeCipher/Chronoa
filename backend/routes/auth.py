from flask import Blueprint, jsonify, request
from services.db_client import supabase

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/delete-account', methods=['DELETE'])
def delete_account():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    
    # Using admin API to securely delete the user completely
    try:
        supabase.auth.admin.delete_user(user_id)
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400