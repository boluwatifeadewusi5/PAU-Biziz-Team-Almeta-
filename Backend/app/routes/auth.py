import secrets
import time
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from ..schemas import LoginIn
from ..database import query, execute
from ..security import verify_password, token_digest, current_owner

router = APIRouter()

@router.post("/auth/login")
def login(body: LoginIn):
    owner = query("SELECT * FROM owners WHERE username = ?", (body.username,), one=True)
    if not owner or not verify_password(body.password, owner["password_hash"]):
        raise HTTPException(401, "Wrong username or password")
    token = secrets.token_urlsafe(32)
    execute("UPDATE owners SET token_hash=?, token_expires=? WHERE id=?", (token_digest(token), int(time.time()) + 28800, owner["id"]))
    has_business = query("SELECT id FROM businesses WHERE owner_id=?", (owner["id"],), one=True) is not None
    return {"token": token, "token_type": "bearer", "expires_in": 28800, "has_business": has_business}

@router.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    owner_id = current_owner(authorization)
    execute("UPDATE owners SET token_hash=NULL, token_expires=NULL WHERE id=?", (owner_id,))
    return {"logged_out": True}
