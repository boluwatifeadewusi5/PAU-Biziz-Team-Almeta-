import pytest
from fastapi.testclient import TestClient

from app import database
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", str(tmp_path / "engagement-test.db"))
    monkeypatch.setenv("SEED_DEMO", "true")
    with TestClient(app) as test_client:
        yield test_client


def owner_headers(client):
    response = client.post(
        "/auth/login", json={"username": "demo_cakes", "password": "pass123"}
    )
    assert response.status_code == 200
    return {"Authorization": "Bearer " + response.json()["token"]}


def test_browser_likes_toggle_and_report_per_client(client):
    post_id = client.get("/posts").json()[0]["id"]
    initial = client.get(f"/posts/{post_id}").json()["likes"]
    browser_a = {"x-client-id": "student-browser-a"}
    browser_b = {"x-client-id": "student-browser-b"}

    assert client.post(f"/posts/{post_id}/like").status_code == 400
    assert client.post(
        f"/posts/{post_id}/like", headers={"x-client-id": "   "}
    ).status_code == 400
    assert client.post(
        f"/posts/{post_id}/like", headers={"x-client-id": "x" * 129}
    ).status_code == 400

    liked = client.post(f"/posts/{post_id}/like", headers=browser_a).json()
    assert liked == {"liked": True, "likes": initial + 1}
    detail_a = client.get(f"/posts/{post_id}", headers=browser_a).json()
    detail_b = client.get(f"/posts/{post_id}", headers=browser_b).json()
    assert detail_a["liked_by_me"] is True
    assert detail_a["likes"] == initial + 1
    assert detail_b["liked_by_me"] is False

    second_like = client.post(f"/posts/{post_id}/like", headers=browser_b).json()
    assert second_like == {"liked": True, "likes": initial + 2}
    unliked = client.post(f"/posts/{post_id}/like", headers=browser_a).json()
    assert unliked == {"liked": False, "likes": initial + 1}
    assert client.get(f"/posts/{post_id}", headers=browser_a).json()["liked_by_me"] is False
    assert client.get(f"/posts/{post_id}", headers=browser_b).json()["liked_by_me"] is True


def test_comments_are_public_ordered_and_validated(client):
    post_id = client.get("/posts").json()[0]["id"]
    comments_path = f"/posts/{post_id}/comments"
    assert client.get(comments_path).status_code == 200
    assert client.get(comments_path).json() == []

    invalid_comments = [
        {},
        {"author": " ", "text": "Useful comment"},
        {"author": "Student", "text": " "},
        {"author": "A" * 41, "text": "Useful comment"},
        {"author": "Student", "text": "x" * 501},
        {"author": "Student", "text": "Useful comment", "unexpected": True},
    ]
    for payload in invalid_comments:
        assert client.post(comments_path, json=payload).status_code == 422

    first = client.post(
        comments_path, json={"author": "Student A", "text": "Helpful offer"}
    )
    second = client.post(
        comments_path, json={"author": "Student B", "text": "Thanks for sharing"}
    )
    assert first.status_code == second.status_code == 200
    listed = client.get(comments_path).json()
    assert [comment["id"] for comment in listed] == [
        second.json()["id"],
        first.json()["id"],
    ]
    assert set(listed[0]) == {"id", "author", "text", "created_at"}
    assert listed[0]["author"] == "Student B"
    assert client.get(f"/posts/{post_id}").json()["comment_count"] == 2


def test_draft_posts_are_hidden_from_like_and_comment_routes(client):
    headers = owner_headers(client)
    response = client.post(
        "/owner/posts",
        headers=headers,
        json={
            "title": "Engagement private draft",
            "description": "Do not expose its reactions",
            "category": "Food",
            "price_mode": "amount",
            "price_amount": 500,
            "publication_status": "draft",
        },
    )
    assert response.status_code == 200
    post_id = response.json()["id"]

    assert client.post(
        f"/posts/{post_id}/like", headers={"x-client-id": "reader"}
    ).status_code == 404
    assert client.get(f"/posts/{post_id}/comments").status_code == 404
    assert client.post(
        f"/posts/{post_id}/comments", json={"author": "Reader", "text": "Hello"}
    ).status_code == 404
    assert database.query("SELECT * FROM likes WHERE post_id = ?", (post_id,)) == []
    assert database.query("SELECT * FROM comments WHERE post_id = ?", (post_id,)) == []
