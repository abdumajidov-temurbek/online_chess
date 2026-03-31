from dataclasses import dataclass
from pathlib import Path
from typing import Dict


BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent
BOT_ROOT = (REPO_ROOT / "stockfish-bots") if (REPO_ROOT / "stockfish-bots").exists() else (REPO_ROOT / "stockfish_bots")


@dataclass(frozen=True)
class BotProfile:
    key: str
    label: str
    engine_id: str
    bot_name: str
    source_path: Path
    elo: int


BOT_PROFILES: Dict[str, BotProfile] = {
    "pre-intermediate": BotProfile(
        key="pre-intermediate",
        label="Pre-Intermediate",
        engine_id="stock-1",
        bot_name="stock-1",
        source_path=BOT_ROOT / "stock-1",
        elo=1200,
    ),
    "intermediate": BotProfile(
        key="intermediate",
        label="Intermediate",
        engine_id="stock-5",
        bot_name="stock-5",
        source_path=BOT_ROOT / "stock-5",
        elo=1800,
    ),
    "advance": BotProfile(
        key="advance",
        label="Advance",
        engine_id="stock-17",
        bot_name="stock-17",
        source_path=BOT_ROOT / "stock-17",
        elo=3000,
    ),
}


def normalize_difficulty(raw_value: str | None) -> str:
    normalized = (raw_value or "").strip().lower()
    aliases = {
        "pre_intermediate": "pre-intermediate",
        "preintermediate": "pre-intermediate",
        "advanced": "advance",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized if normalized in BOT_PROFILES else "pre-intermediate"


def difficulty_profile(raw_value: str | None) -> BotProfile:
    return BOT_PROFILES[normalize_difficulty(raw_value)]
