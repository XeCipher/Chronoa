import os
from dotenv import load_dotenv

# This tells Python to look for the .env file in the current directory
load_dotenv()

class Config:
    # Look for NEXT_PUBLIC_SUPABASE_URL (from frontend copy-paste) OR SUPABASE_URL
    SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    PORT = int(os.environ.get("PORT", 8000))

    @classmethod
    def validate(cls):
        if not cls.SUPABASE_URL:
            raise ValueError("Backend Error: SUPABASE_URL is missing from .env file")
        if not cls.SUPABASE_KEY:
            raise ValueError("Backend Error: SUPABASE_SERVICE_ROLE_KEY is missing from .env file")