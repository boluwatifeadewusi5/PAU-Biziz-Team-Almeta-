import pytest
from fastapi.testclient import TestClient
from app import database
from app.main import app
from app.security import hash_password, verify_password


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, 'DB_PATH', str(tmp_path / 'merge.db'))
    monkeypatch.setenv('SEED_DEMO', 'false')
    with TestClient(app) as client:
        database.execute('INSERT INTO owners(username,password_hash) VALUES (?,?)', ('seller', hash_password('password123')))
        yield client


def test_corrupted_hash_returns_login_failure(client):
    corrupt = 'scrypt$' + 'a' * 32 + '$' + '\u00e9' * 128
    assert verify_password('password123', corrupt) is False
    database.execute('UPDATE owners SET password_hash=?', (corrupt,))
    result = client.post('/auth/login', json={'username': 'seller', 'password': 'password123'})
    assert result.status_code == 401


@pytest.mark.parametrize('url', ['https://.', 'https://..', 'https://exa\\mple.com', 'https://exam\nple.com', 'https://example.com:99999'])
def test_invalid_contact_url_does_not_save(client, url):
    token = client.post('/auth/login', json={'username': 'seller', 'password': 'password123'}).json()['token']
    result = client.put('/owner/business', headers={'Authorization': 'Bearer ' + token}, json={
        'name': 'Shop', 'description': 'Campus shop', 'category': 'Food', 'website_url': url})
    assert result.status_code == 422
    assert database.query('SELECT * FROM businesses') == []
