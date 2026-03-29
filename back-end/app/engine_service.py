import random
from typing import Optional

import chess
from stockfish import Stockfish

from .config import settings


class EngineService:
    def __init__(self) -> None:
        self._stockfish: Optional[Stockfish] = None
        self._load_engine()

    def _load_engine(self) -> None:
        try:
            self._stockfish = Stockfish(settings.stockfish_path)
            self._stockfish.update_engine_parameters(
                {
                    "UCI_LimitStrength": "true",
                    "UCI_Elo": settings.stockfish_elo,
                    "Skill Level": 8,
                }
            )
        except Exception:
            self._stockfish = None

    def best_move(self, board: chess.Board) -> str:
        if self._stockfish:
            self._stockfish.set_fen_position(board.fen())
            best = self._stockfish.get_best_move_time(settings.stockfish_move_time_ms)
            if best:
                return best
        legal_moves = [str(move) for move in board.legal_moves]
        return random.choice(legal_moves)


engine_service = EngineService()
