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
    _, salt, expected = stored.split("$")
    actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return hmac.compare_digest(actual, expected)

def token_digest(token):
    return hashlib.sha256(token.encode()).hexdigest()

def current_owner(authorization):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Please log in")
    owner = query("SELECT id FROM owners WHERE token_hash = ? AND token_expires > ?", (token_digest(authorization[7:]), int(time.time())), one=True)
    if not owner:
        raise HTTPException(401, "Please log in")
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


