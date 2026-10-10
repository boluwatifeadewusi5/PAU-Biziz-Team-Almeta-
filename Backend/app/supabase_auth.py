import json
import os
import secrets
from uuid import UUID
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from fastapi import HTTPException
from .database import execute, query

def resolve_owner(token):
    """Ask Supabase Auth to verify the token, rather than trusting client claims."""
    url = os.getenv('SUPABASE_URL', '').rstrip('/')
    key = os.getenv('SUPABASE_PUBLISHABLE_KEY', '')
    if not url or not key or token.count('.') != 2:
        return None
    request = Request(url + '/auth/v1/user', headers={'apikey': key, 'Authorization': 'Bearer ' + token})
    try:
        with urlopen(request, timeout=8) as response:
            user = json.load(response)
    except HTTPError as error:
        if error.code in (401, 403):
            raise HTTPException(401, 'Please log in')
        raise HTTPException(503, 'Account verification is temporarily unavailable')
    except (URLError, TimeoutError, ValueError):
        raise HTTPException(503, 'Account verification is temporarily unavailable')
    try:
        identity = str(UUID(user['id']))
    except (ValueError, KeyError, TypeError):
        raise HTTPException(401, 'Invalid account identity')
    username = 'supabase:' + identity
    owner = query('SELECT id FROM owners WHERE username=?', (username,), one=True)
    if not owner:
        from .security import hash_password
        execute('INSERT INTO owners(username,password_hash) VALUES (?,?) ON CONFLICT(username) DO NOTHING', (username, hash_password(secrets.token_urlsafe(32))))
        owner = query('SELECT id FROM owners WHERE username=?', (username,), one=True)
    return owner['id']
