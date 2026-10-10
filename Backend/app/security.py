import hashlib
import hmac
import secrets
import time
from fastapi import HTTPException
from .database import query

def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return f"scrypt${salt}${digest}"

def verify_password(password, stored):
    try:
        algorithm, salt, expected = stored.split("$")
    except (ValueError, AttributeError):
        return False
    if algorithm != "scrypt" or len(salt) != 32 or len(expected) != 128:
        return False
    if any(c not in "0123456789abcdef" for c in salt + expected):
        return False
    actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return hmac.compare_digest(actual, expected)

def token_digest(token):
    return hashlib.sha256(token.encode()).hexdigest()

def current_owner(authorization):
    parts = authorization.split() if authorization else []
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(401, "Please log in", headers={"WWW-Authenticate": "Bearer"})
    owner = query("SELECT id FROM owners WHERE token_hash = ? AND token_expires > ?", (token_digest(parts[1]), int(time.time())), one=True)
    if not owner:
        from .supabase_auth import resolve_owner
        external_owner = resolve_owner(parts[1])
        if external_owner is not None:
            return external_owner
        raise HTTPException(401, "Please log in", headers={"WWW-Authenticate": "Bearer"})
    return owner["id"]


def my_business(owner_id):
    biz = query("SELECT * FROM businesses WHERE owner_id = ?", (owner_id,), one=True)
    if not biz:
        raise HTTPException(400, "Set up your business first")
    return biz


def own_post(owner_id, post_id):
    """Returns the post only if it belongs to this owner's business."""
    post = query("SELECT * FROM posts WHERE id = ?", (post_id,), one=True)
    if not post:
        raise HTTPException(404, "Post not found")
    biz = my_business(owner_id)
    if post["business_id"] != biz["id"]:
        raise HTTPException(403, "This is not your post")
    return post


