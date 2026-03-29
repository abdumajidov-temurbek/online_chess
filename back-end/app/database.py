import sqlite3
from contextlib import contextmanager
from typing import Iterator

from .config import settings


def create_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(settings.database_path)
    connection.row_factory = sqlite3.Row
    return connection


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    connection = create_connection()
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialize_database() -> None:
    with get_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT,
                name TEXT NOT NULL,
                avatar_url TEXT,
                google_sub TEXT UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                used_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT NOT NULL UNIQUE,
                mode TEXT NOT NULL,
                white_user_id INTEGER,
                black_user_id INTEGER,
                white_name TEXT NOT NULL,
                black_name TEXT NOT NULL,
                result TEXT NOT NULL,
                reason TEXT NOT NULL,
                winner_user_id INTEGER,
                pgn TEXT NOT NULL,
                created_at TEXT NOT NULL,
                finished_at TEXT NOT NULL,
                FOREIGN KEY(white_user_id) REFERENCES users(id),
                FOREIGN KEY(black_user_id) REFERENCES users(id),
                FOREIGN KEY(winner_user_id) REFERENCES users(id)
            );
            """
        )
