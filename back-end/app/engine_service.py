import random
from typing import Optional

import chess

from .config import settings
from stockfish_config import engine_parameters
from uci_engine import UciEngine


class EngineService:
    def __init__(self) -> None:
        self._stockfish: Optional[UciEngine] = None
        self._load_engine()

    def _load_engine(self) -> None:
        try:
            self._stockfish = UciEngine(
                path=settings.stockfish_path,
                parameters=engine_parameters(),
                move_time_ms=settings.stockfish_move_time_ms,
            )
        except Exception:
            self._stockfish = None

    def best_move(self, board: chess.Board) -> str:
        if self._stockfish:
            best = self._stockfish.best_move(board, settings.stockfish_move_time_ms)
            if best:
                return best
        legal_moves = [str(move) for move in board.legal_moves]
        return random.choice(legal_moves)


engine_service = EngineService()
