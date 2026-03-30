import os
from pathlib import Path
from typing import Dict, Optional


BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent
DEFAULT_STOCKFISH_PATH = REPO_ROOT / "fish17" / "Stockfish" / "src" / "stockfish"
LEGACY_STOCKFISH_PATH = BACKEND_DIR / "stockfish" / "stockfish_14_x64"


def _env_bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default).lower()).strip().lower() in {"1", "true", "yes", "on"}


def resolve_stockfish_path(raw_path: Optional[str] = None) -> str:
    configured = (raw_path or os.getenv("STOCKFISH_PATH") or "").strip()
    if configured:
        candidate = Path(configured)
        candidates = [candidate]
        if not candidate.is_absolute():
            candidates.extend([BACKEND_DIR / candidate, REPO_ROOT / candidate])
        for path in candidates:
            if path.exists():
                return str(path.resolve())
        return str((BACKEND_DIR / candidate).resolve())

    if DEFAULT_STOCKFISH_PATH.exists():
        return str(DEFAULT_STOCKFISH_PATH.resolve())
    return str(LEGACY_STOCKFISH_PATH.resolve())


DIFFICULTY_LEVELS: Dict[str, Dict[str, object]] = {
    "beginner": {"label": "Beginner", "elo": 1000, "skill": 4},
    "pre-intermediate": {"label": "Pre-Intermediate", "elo": 1500, "skill": 8},
    "intermediate": {"label": "Intermediate", "elo": 2200, "skill": 14},
    "advanced": {"label": "Advanced", "elo": 3000, "skill": 20},
}


def normalize_difficulty(raw_value: Optional[str]) -> str:
    normalized = (raw_value or "").strip().lower()
    aliases = {
        "pre_intermediate": "pre-intermediate",
        "preintermediate": "pre-intermediate",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized if normalized in DIFFICULTY_LEVELS else "beginner"


def difficulty_profile(raw_value: Optional[str]) -> Dict[str, object]:
    key = normalize_difficulty(raw_value)
    profile = DIFFICULTY_LEVELS[key]
    return {
        "key": key,
        "label": profile["label"],
        "elo": profile["elo"],
        "skill": profile["skill"],
    }


def engine_parameters(raw_difficulty: Optional[str] = None) -> Dict[str, object]:
    profile = difficulty_profile(raw_difficulty)
    return {
        "Threads": max(int(os.getenv("STOCKFISH_THREADS", "2")), 1),
        "Hash": max(int(os.getenv("STOCKFISH_HASH_MB", "64")), 1),
        "Skill Level": int(profile["skill"]),
        "UCI_LimitStrength": True,
        "UCI_Elo": int(profile["elo"]),
    }


def stockfish_display_name(raw_difficulty: Optional[str] = None) -> str:
    profile = difficulty_profile(raw_difficulty)
    version = os.getenv("STOCKFISH_DISPLAY_NAME", "Stockfish 17")
    return f"{version} • {profile['label']}"
