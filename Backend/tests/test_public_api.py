import pytest
from fastapi.testclient import TestClient

from app import database
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", str(tmp_path / "public-test.db"))
    monkeypatch.setenv("SEED_DEMO", "true")
    with TestClient(app) as test_client:
        yield test_client


def owner_headers(client, username="demo_cakes"):
    response = client.post(
        "/auth/login", json={"username": username, "password": "pass123"}
    )
    assert response.status_code == 200
    return {"Authorization": "Bearer " + response.json()["token"]}


def create_post(client, headers, **changes):
    payload = {
        "title": "Public API test offer",
        "description": "Freshly prepared for students",
        "category": "Food",
        "price_mode": "amount",
        "price_amount": 1000,
        **changes,
    }
    response = client.post("/owner/posts", headers=headers, json=payload)
    assert response.status_code == 200
    return response.json()


def test_feed_search_and_profiles_respect_publication_and_availability(client):
    headers = owner_headers(client)
    business = client.get("/owner/business", headers=headers).json()
    draft = create_post(
        client,
        headers,
        title="Secret Nebula Draft",
        description="Private preview keyword",
        publication_status="draft",
    )

    feed = client.get("/posts").json()
    assert feed
    assert all(
        post["publication_status"] == "published"
        and post["availability"] == "available"
        for post in feed
    )
    assert draft["id"] not in {post["id"] for post in feed}
    food_feed = client.get("/posts", params={"category": "Food"}).json()
    assert food_feed
    assert all(post["category"] == "Food" for post in food_feed)

    matching_posts = client.get(
        "/search", params={"q": "VANILLA BIRTHDAY", "category": "Food"}
    ).json()
    assert matching_posts["posts"]
    assert all(post["category"] == "Food" for post in matching_posts["posts"])
    assert any("Vanilla birthday" in post["title"] for post in matching_posts["posts"])
    assert matching_posts["category"] == "Food"
    description_matches = client.get(
        "/search", params={"q": "soft vanilla sponge", "category": "Food"}
    ).json()
    assert any(post["title"] == "Vanilla birthday cake" for post in description_matches["posts"])

    business_name_matches = client.get(
        "/search", params={"q": "sweet crumbs", "category": "Food"}
    ).json()
    assert any(item["id"] == business["id"] for item in business_name_matches["businesses"])
    assert business_name_matches["posts"]

    business_text_matches = client.get(
        "/search", params={"q": "fictional demo bakery", "category": "Food"}
    ).json()
    assert any(item["id"] == business["id"] for item in business_text_matches["businesses"])
    assert business_text_matches["posts"]  # business description can match offer search
    wrong_category = client.get(
        "/search", params={"q": "fictional demo bakery", "category": "Tech"}
    ).json()
    assert wrong_category["posts"] == []
    assert wrong_category["businesses"] == []

    hidden_search = client.get(
        "/search", params={"q": "Secret Nebula", "category": "Food"}
    ).json()
    assert hidden_search["posts"] == []
    assert client.get(f"/posts/{draft['id']}").status_code == 404

    profile = client.get(f"/businesses/{business['id']}").json()
    profile_posts = {post["id"]: post for post in profile["posts"]}
    assert draft["id"] not in profile_posts
    unavailable = next(
        post for post in profile["posts"] if post["availability"] == "unavailable"
    )
    assert unavailable["publication_status"] == "published"
    assert unavailable["id"] not in {post["id"] for post in feed}
    assert unavailable["id"] not in {
        post["id"]
        for post in client.get("/search", params={"q": unavailable["title"]}).json()["posts"]
    }

    unavailable_detail = client.get(f"/posts/{unavailable['id']}")
    assert unavailable_detail.status_code == 200
    assert unavailable_detail.json()["whatsapp_link"] is None
    assert unavailable_detail.json()["website_link"] is None


def test_public_contact_links_use_post_site_then_business_site(client):
    tech_headers = owner_headers(client, "demo_tech")
    business = client.get("/owner/business", headers=tech_headers).json()
    profile = client.get(f"/businesses/{business['id']}").json()
    fallback_post = next(post for post in profile["posts"] if post["title"] == "Phone screen repair")
    assert fallback_post["website_link"] == "https://example.com"
    assert fallback_post["whatsapp_link"].startswith("https://wa.me/")

    override = create_post(
        client,
        tech_headers,
        title="Offer-specific contact page",
        category="Tech",
        website_url="https://offer.example/contact",
    )
    detail = client.get(f"/posts/{override['id']}").json()
    assert detail["website_link"] == "https://offer.example/contact"
    assert detail["whatsapp_link"].startswith("https://wa.me/")

    website_only = next(
        item for item in client.get("/businesses").json() if item["name"] == "StudyHub (demo)"
    )
    website_profile = client.get(f"/businesses/{website_only['id']}").json()
    available_website_post = next(
        post for post in website_profile["posts"] if post["availability"] == "available"
    )
    assert available_website_post["whatsapp_link"] is None
    assert available_website_post["website_link"] == "https://example.org"
