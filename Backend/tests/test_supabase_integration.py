import base64
import io
import json
from urllib.error import HTTPError
import pytest
from fastapi.testclient import TestClient
from app import database, supabase_auth
from app.main import app
from app.routes import media

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, 'DB_PATH', str(tmp_path / 'integration.db'))
    monkeypatch.setattr(media, 'MEDIA_DIR', tmp_path / 'uploads')
    static = next(route.app for route in app.routes if getattr(route, 'path', '') == '/media')
    monkeypatch.setattr(static, 'directory', str(media.MEDIA_DIR))
    monkeypatch.setattr(static, 'all_directories', [str(media.MEDIA_DIR)])
    monkeypatch.setenv('SEED_DEMO', 'false')
    monkeypatch.setenv('SUPABASE_URL', 'https://test.supabase.co')
    monkeypatch.setenv('SUPABASE_PUBLISHABLE_KEY', 'public-test-key')
    def verify(request, timeout):
        assert request.full_url == 'https://test.supabase.co/auth/v1/user'
        token = request.get_header('Authorization')
        if token == 'Bearer rejected.jwt.token':
            raise HTTPError(request.full_url, 401, 'Rejected', {}, None)
        identity = '00000000-0000-0000-0000-000000000001' if token == 'Bearer alice.jwt.token' else '00000000-0000-0000-0000-000000000002'
        return io.BytesIO(json.dumps({'id': identity}).encode())
    monkeypatch.setattr(supabase_auth, 'urlopen', verify)
    with TestClient(app) as client:
        yield client

def test_supabase_identity_setup_publish_and_isolation(client):
    alice={'Authorization':'Bearer alice.jwt.token'}
    bob={'Authorization':'Bearer bob.jwt.token'}
    assert client.get('/auth/me', headers=alice).json()['has_business'] is False
    profile={'name':'Shop','description':'Campus shop','category':'Tech','website_url':'https://example.com','logo_url':'https://example.com/logo.png'}
    assert client.put('/owner/business', headers=alice,json=profile).status_code==200
    client.put('/owner/business', headers=bob,json=profile)
    offer={'title':'Repair','description':'Phone repair','category':'Tech','price_mode':'amount','price_amount':500}
    post=client.post('/owner/posts',headers=alice,json=offer).json()
    assert post['id'] in [p['id'] for p in client.get('/posts').json()]
    assert client.put(f"/owner/posts/{post['id']}",headers=bob,json=offer).status_code==403
    assert client.get('/auth/me',headers={'Authorization':'Bearer rejected.jwt.token'}).status_code==401
    assert len(database.query('SELECT * FROM owners'))==2

def test_authenticated_upload_and_rejection(client):
    headers={'Authorization':'Bearer alice.jwt.token'}
    body={'data_url':'data:image/webp;base64,'+base64.b64encode(b'RIFF0000WEBPtest').decode()}
    assert client.post('/owner/media',json=body).status_code==401
    result = client.post('/owner/media',headers=headers,json=body)
    assert result.status_code==200
    assert client.get(result.json()['url']).content == b'RIFF0000WEBPtest'
    assert len(list(media.MEDIA_DIR.iterdir()))==1
    assert client.post('/owner/media',headers=headers,json={'data_url':'data:image/png;base64,aGVsbG8='}).status_code==422

def test_browser_cors(client):
    result=client.options('/owner/business',headers={'Origin':'http://localhost:5173','Access-Control-Request-Method':'PUT','Access-Control-Request-Headers':'authorization,content-type'})
    assert result.status_code==200
    assert result.headers['access-control-allow-origin']=='http://localhost:5173'
