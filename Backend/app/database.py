import os
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

def connect():
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

DB_PATH = os.environ.get("DB_PATH", str(Path(__file__).resolve().parents[1] / "pau_biziz.db"))


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def query(sql, params=(), one=False):
    """Run a SELECT. Returns a list of dicts (or one dict with one=True)."""
    conn = connect()
    conn.row_factory = sqlite3.Row
    try:
        rows = [dict(r) for r in conn.execute(sql, params).fetchall()]
    finally:
        conn.close()
    if one:
        return rows[0] if rows else None
    return rows


def execute(sql, params=()):
    """Run INSERT / UPDATE / DELETE. Returns the new row id."""
    conn = connect()
    try:
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def init_db():
    execute("""CREATE TABLE IF NOT EXISTS owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        token_hash TEXT,
        token_expires INTEGER)""")
    # whatsapp_number is now OPTIONAL: a business needs WhatsApp OR a website (or both)
    execute("""CREATE TABLE IF NOT EXISTS businesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER UNIQUE NOT NULL REFERENCES owners(id),
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        whatsapp_number TEXT,
        website_url TEXT,
        fulfillment_info TEXT,
        created_at TEXT NOT NULL)""")
    execute("""CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL REFERENCES businesses(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        video_url TEXT,
        website_url TEXT,
        price_mode TEXT NOT NULL,
        price_amount REAL,
        currency TEXT NOT NULL DEFAULT 'NGN',
        availability TEXT NOT NULL DEFAULT 'available',
        publication_status TEXT NOT NULL DEFAULT 'published',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL)""")
    # One like per browser per post (client_id comes from the frontend)
    execute("""CREATE TABLE IF NOT EXISTS likes (
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        client_id TEXT NOT NULL,
        PRIMARY KEY (post_id, client_id))""")
    execute("""CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL)""")

    execute("CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts(publication_status, availability, created_at)")
    execute("CREATE INDEX IF NOT EXISTS idx_posts_business ON posts(business_id)")
    execute("CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)")
    if 'logo_url' not in {r['name'] for r in query('PRAGMA table_info(businesses)')}:
        execute('ALTER TABLE businesses ADD COLUMN logo_url TEXT')
