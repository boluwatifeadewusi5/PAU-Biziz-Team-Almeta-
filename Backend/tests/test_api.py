import pytest
from fastapi.testclient import TestClient
from app import database
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, 'DB_PATH', str(tmp_path / 'test.db'))
    monkeypatch.setenv('SEED_DEMO', 'true')
    with TestClient(app) as client:
        yield client


def login(client, username='demo_cakes'):
    response = client.post('/auth/login', json={'username': username, 'password': 'pass123'})
    assert response.status_code == 200
    return {'Authorization': 'Bearer ' + response.json()['token']}


def post(**changes):
    return {'title': 'Test cake', 'description': 'Fresh cake', 'category': 'Food',
            'price_mode': 'amount', 'price_amount': 2000, **changes}


def test_discovery_and_contacts(client):
    assert client.get('/health').json() == {'status': 'ok'}
    assert len(client.get('/categories').json()) == 5
    feed = client.get('/posts').json()
    assert len(feed) == 13
    assert all(p['availability'] == 'available' for p in feed)
    results = client.get('/search?q=CAKE&category=Food').json()
    assert results['posts'] and results['businesses']
    detail = client.get('/posts/1').json()
    assert detail['whatsapp_link'].startswith('https://wa.me/')
    profile = client.get('/businesses/1').json()
    unavailable = next(p for p in profile['posts'] if p['availability'] == 'unavailable')
    assert unavailable['whatsapp_link'] is None and unavailable['website_link'] is None
    assert client.get('/posts/13').json()['website_link'] == 'https://example.org'


def test_owner_lifecycle_and_permissions(client):
    headers = login(client)
    assert client.post('/owner/posts', json=post()).status_code == 401
    assert client.put('/owner/posts/1', headers=login(client, 'demo_style'), json=post()).status_code == 403
    created = client.post('/owner/posts', headers=headers, json=post(publication_status='draft')).json()
    pid = created['id']
    assert client.get(f'/posts/{pid}').status_code == 404
    assert client.post(f'/posts/{pid}/comments', json={'author': 'A', 'text': 'Hi'}).status_code == 404
    assert client.put(f'/owner/posts/{pid}', headers=headers, json=post()).status_code == 200
    assert client.get(f'/posts/{pid}').status_code == 200
    assert client.patch(f'/owner/posts/{pid}/availability', headers=headers).json()['availability'] == 'unavailable'
    assert pid not in [p['id'] for p in client.get('/posts').json()]
    assert client.get(f'/posts/{pid}').json()['whatsapp_link'] is None
    assert client.post('/auth/logout', headers=headers).status_code == 200
    assert client.get('/owner/posts', headers=headers).status_code == 401


def test_validation_and_engagement(client):
    headers = login(client)
    for bad in (post(price_amount=-1), post(price_amount=None), post(category='Other'), post(image_url='javascript:alert(1)'), post(title='  ')):
        assert client.post('/owner/posts', headers=headers, json=bad).status_code == 422
    assert client.put('/owner/business', headers=headers, json={'name': 'Shop', 'description': 'Test', 'category': 'Food'}).status_code == 422
    assert client.post('/posts/1/like').status_code == 400
    browser = {'x-client-id': 'test-browser'}
    assert client.post('/posts/1/like', headers=browser).json()['liked'] is True
    assert client.get('/posts/1', headers=browser).json()['liked_by_me'] is True
    assert client.post('/posts/1/like', headers=browser).json()['liked'] is False
    comment = client.post('/posts/1/comments', json={'author': 'Student', 'text': 'Hello'}).json()
    path = f"/owner/comments/{comment['id']}"
    assert client.delete(path, headers=login(client, 'demo_style')).status_code == 403
    assert client.delete(path, headers=headers).status_code == 200


def test_passwords_sessions_and_persistence(client):
    owner = database.query('SELECT * FROM owners WHERE id=1', one=True)
    assert owner['password_hash'].startswith('scrypt$')
    assert client.post('/auth/login', json={'username': 'demo_cakes', 'password': 'wrong'}).status_code == 401
    headers = login(client)
    stored = database.query('SELECT * FROM owners WHERE id=1', one=True)
    assert stored['token_hash'] not in headers['Authorization']
    database.execute('UPDATE owners SET token_expires=0 WHERE id=1')
    assert client.get('/owner/posts', headers=headers).status_code == 401
    headers = login(client)
    pid = client.post('/owner/posts', headers=headers, json=post()).json()['id']
    with TestClient(app) as restarted:
        assert restarted.get(f'/posts/{pid}').json()['title'] == 'Test cake'
        assert len(database.query('SELECT * FROM owners')) == 4
