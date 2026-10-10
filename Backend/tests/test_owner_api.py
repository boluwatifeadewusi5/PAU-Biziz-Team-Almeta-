import pytest
from fastapi.testclient import TestClient
from app import database
from app.main import app
from app.security import hash_password, verify_password


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, 'DB_PATH', str(tmp_path / 'owner.db'))
    monkeypatch.setenv('SEED_DEMO', 'false')
    with TestClient(app) as client:
        for name in ('alice', 'bob'):
            database.execute('INSERT INTO owners(username,password_hash) VALUES (?,?)', (name, hash_password('password123')))
        yield client


def login(client, name='alice'):
    result = client.post('/auth/login', json={'username': name, 'password': 'password123'})
    assert result.status_code == 200
    return {'Authorization': 'Bearer ' + result.json()['token']}


def business(client, headers, name='My shop'):
    return client.put('/owner/business', headers=headers, json={
        'name': name, 'category': 'Tech', 'description': 'Campus services',
        'website_url': 'https://example.com'})


def test_setup_and_session_restore(client):
    headers = login(client)
    assert client.get('/auth/me', headers=headers).json()['has_business'] is False
    assert client.get('/owner/posts', headers=headers).status_code == 400
    first = business(client, headers).json()
    second = business(client, headers, 'Updated shop').json()
    assert second['id'] == first['id']
    assert second['created_at'] == first['created_at']
    assert second['name'] == 'Updated shop'
    assert len(database.query('SELECT * FROM businesses')) == 1
    assert client.get('/auth/me', headers=headers).json()['business_id'] == first['id']
    assert client.get('/owner/posts', headers=headers).json() == []


def test_login_rotation_and_bearer_parsing(client):
    old = login(client)
    new = login(client)
    assert client.get('/auth/me', headers=old).status_code == 401
    lower = {'Authorization': new['Authorization'].replace('Bearer', 'bearer')}
    assert client.get('/auth/me', headers=lower).status_code == 200
    assert set(client.get('/auth/me', headers=new).json()) == {'id', 'username', 'has_business', 'business_id'}
    assert client.post('/auth/logout', headers=new).status_code == 200
    assert client.get('/auth/me', headers=new).status_code == 401
    for value in ('Bearer', 'Basic xyz', 'Bearer a b'):
        response = client.get('/auth/me', headers={'Authorization': value})
        assert response.status_code == 401
        assert response.headers['www-authenticate'] == 'Bearer'


def test_draft_edit_availability_and_owner_isolation(client):
    alice, bob = login(client), login(client, 'bob')
    business(client, alice)
    business(client, bob)
    payload = {'title': 'Repair', 'description': 'Phone repairs', 'category': 'Tech',
               'price_mode': 'contact', 'publication_status': 'draft'}
    result = client.post('/owner/posts', headers=alice, json=payload)
    assert result.status_code == 200
    pid = result.json()['id']
    assert client.get('/owner/posts', headers=bob).json() == []
    assert client.put(f'/owner/posts/{pid}', headers=bob, json=payload).status_code == 403
    assert client.patch(f'/owner/posts/{pid}/availability', headers=bob).status_code == 403
    payload.update(publication_status='published', title='Updated repair')
    assert client.put(f'/owner/posts/{pid}', headers=alice, json=payload).json()['title'] == 'Updated repair'
    for expected in ('unavailable', 'available'):
        assert client.patch(f'/owner/posts/{pid}/availability', headers=alice).json()['availability'] == expected
    assert client.get('/posts/999999').status_code == 404


def test_malformed_stored_password_fails_closed(client):
    assert not verify_password('secret', 'invalid')
    assert not verify_password('secret', 'unknown$salt$digest')
    database.execute("UPDATE owners SET password_hash='invalid' WHERE username='alice'")
    assert client.post('/auth/login', json={'username': 'alice', 'password': 'password123'}).status_code == 401
