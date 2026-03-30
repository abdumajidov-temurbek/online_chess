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


def engine_parameters() -> Dict[str, object]:
    limit_strength = _env_bool("STOCKFISH_LIMIT_STRENGTH", False)
    parameters: Dict[str, object] = {
        "Threads": max(int(os.getenv("STOCKFISH_THREADS", "2")), 1),
        "Hash": max(int(os.getenv("STOCKFISH_HASH_MB", "64")), 1),
        "Skill Level": min(max(int(os.getenv("STOCKFISH_SKILL_LEVEL", "20")), 0), 20),
        "UCI_LimitStrength": limit_strength,
    }
    if limit_strength:
        parameters["UCI_Elo"] = max(int(os.getenv("STOCKFISH_ELO", "3000")), 1320)
    return parameters


def stockfish_display_name() -> str:
    version = os.getenv("STOCKFISH_DISPLAY_NAME", "Stockfish 17")
    skill = min(max(int(os.getenv("STOCKFISH_SKILL_LEVEL", "20")), 0), 20)
    if _env_bool("STOCKFISH_LIMIT_STRENGTH", False):
        return f"{version} ({os.getenv('STOCKFISH_ELO', '3000')} Elo)"
    if skill == 20:
        return f"{version} Max"
    return f"{version} Skill {skill}"
