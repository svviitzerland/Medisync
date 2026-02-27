import os
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from database import supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Dependency to validate the Supabase JWT token and extract user information.
    Uses Supabase's auth.get_user() to securely validate the token against the Auth server.
    """
    token = credentials.credentials
    try:
        # Validate the token by fetching the user from Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
            
        user = user_response.user
        
        # We return a payload structure similar to the decoded JWT for compatibility
        return {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "user_metadata": user.user_metadata,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {str(e)}")
