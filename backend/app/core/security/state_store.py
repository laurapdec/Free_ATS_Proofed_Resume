"""Temporary state token storage for OAuth flow.

In production, replace this with Redis or a database implementation.
"""
from datetime import datetime, timedelta
from typing import Dict, Optional
import secrets


class StateStore:
    """Temporary in-memory store for OAuth state tokens.
    
    WARNING: This is for development only. In production, use Redis or a database.
    """
    def __init__(self, expire_minutes: int = 10):
        self._store: Dict[str, datetime] = {}
        self._expire_minutes = expire_minutes
    
    def generate_state(self) -> str:
        """Generate a new state token and store it."""
        state = secrets.token_urlsafe(32)
        self._store[state] = datetime.utcnow()
        self._cleanup_expired()
        return state
    
    def validate_state(self, state: str) -> bool:
        """Validate and consume a state token."""
        if state not in self._store:
            return False
        
        # Check if state has expired
        created_at = self._store[state]
        now = datetime.utcnow()
        if now - created_at > timedelta(minutes=self._expire_minutes):
            del self._store[state]
            return False
        
        # Consume the state token
        del self._store[state]
        return True
    
    def _cleanup_expired(self):
        """Remove expired state tokens."""
        now = datetime.utcnow()
        expired = [
            state for state, created_at in self._store.items()
            if now - created_at > timedelta(minutes=self._expire_minutes)
        ]
        for state in expired:
            del self._store[state]


# Global instance for development
# In production, replace with your preferred storage solution
state_store = StateStore()