"""Provision owner accounts without exposing public registration."""
import argparse
import getpass
import sqlite3
from app.database import init_db, execute
from app.security import hash_password

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Create a PAU biziz owner account')
    parser.add_argument('username')
    args = parser.parse_args()
    username = args.username.strip()
    if not 1 <= len(username) <= 80:
        parser.error('Username must contain 1–80 characters')
    password = getpass.getpass('Password (at least 8 characters): ')
    if len(password) < 8:
        parser.error('Password must contain at least 8 characters')
    init_db()
    try:
        execute('INSERT INTO owners (username, password_hash) VALUES (?, ?)', (username, hash_password(password)))
    except sqlite3.IntegrityError:
        parser.error('Username already exists')
    print('Owner created. Log in, then PUT /owner/business to set up the profile.')
