"""Auth dependency for growth routes.

Reads StrategyGrowth's Bearer JWT, then upserts the user into growth's
SQLAlchemy `users` table so FK constraints on CRM tables resolve.
"""
from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.security import require_user as _require_user_jwt
from app.core.growth_database import get_db
from app.db.models import User


def get_current_user(
    token_data: dict = Depends(_require_user_jwt),
    db: Session = Depends(get_db),
) -> User:
    """Returns the growth `User` row matching the JWT, creating it if needed."""
    user_id = token_data["sub"]
    email = token_data.get("email", "")
    user = db.get(User, user_id)
    if user is None:
        user = User(id=user_id, email=email, hashed_password="external")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# Alias kept so copied GrowthMind routes still import this name.
get_current_user_with_cookie = get_current_user
