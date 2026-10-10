import base64
import binascii
import os
import secrets
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field
from ..security import current_owner

MEDIA_DIR = Path(os.getenv('MEDIA_DIR', str(Path(__file__).resolve().parents[2] / 'uploads')))
router = APIRouter()

class ImageIn(BaseModel):
    data_url: str = Field(max_length=3_000_000)

@router.post('/owner/media')
def upload(body: ImageIn, request: Request, authorization: Optional[str] = Header(None)):
    current_owner(authorization)
    try:
        prefix, encoded = body.data_url.split(',', 1)
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(422, 'Invalid image data')
    formats = {'data:image/jpeg;base64': ('jpg', raw.startswith(b'\xff\xd8\xff')),
               'data:image/png;base64': ('png', raw.startswith(b'\x89PNG\r\n\x1a\n')),
               'data:image/webp;base64': ('webp', raw.startswith(b'RIFF') and raw[8:12] == b'WEBP')}
    if prefix not in formats or not formats[prefix][1] or not 0 < len(raw) <= 2_000_000:
        raise HTTPException(422, 'Choose a JPG, PNG or WebP image under 2 MB after resizing')
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    filename = secrets.token_hex(20) + '.' + formats[prefix][0]
    (MEDIA_DIR / filename).write_bytes(raw)
    return {'url': str(request.base_url).rstrip('/') + '/media/' + filename}
