import os
import random
import sys
import threading
from pathlib import Path
from typing import Dict, Optional, Protocol

import chess

from bot_config import BOT_ROOT, BotProfile, difficulty_profile
from uci_engine import UciEngine


class ChessBot(Protocol):
    def best_move(self, board: chess.Board) -> str:
        ...


class Stock1Bot:
    # Adapted from the Unity minimax source in stockfish_bots/stock-1/chess.
    _PIECE_VALUES = {
        chess.PAWN: 100,
        chess.KNIGHT: 320,
        chess.BISHOP: 330,
        chess.ROOK: 500,
        chess.QUEEN: 900,
        chess.KING: 0,
    }
    _OPENING_RESPONSES = {
        "e2e4": "e7e5",
        "d2d4": "d7d5",
        "c2c4": "e7e6",
        "g1f3": "g8f6",
        "b2b3": "d7d5",
        "f2f4": "d7d5",
        "g2g3": "d7d5",
        "b1c3": "b8c6",
        "f1c4": "g8f6",
        "f1b5": "g8f6",
        "a2a3": "d7d5",
        "a2a4": "d7d5",
        "h2h3": "d7d5",
        "h2h4": "d7d5",
        "b2b4": "d7d5",
        "d2d3": "d7d5",
    }
    _FIRST_MOVES = (
        ("d7d5", 45),
        ("e7e5", 30),
        ("f7f5", 7),
        ("b8c6", 18),
    )

    def best_move(self, board: chess.Board) -> str:
        move = self._opening_move(board)
        if move is not None:
            return move

        legal_moves = list(board.legal_moves)
        best_score = None
        best_move = legal_moves[0]
        maximizing = board.turn == chess.WHITE
        for candidate in legal_moves:
            board.push(candidate)
            score = self._search(board, depth=1, alpha=-10**9, beta=10**9, maximizing=not maximizing)
            board.pop()
            if best_score is None or (maximizing and score > best_score) or (not maximizing and score < best_score):
                best_score = score
                best_move = candidate
        return best_move.uci()

    def _opening_move(self, board: chess.Board) -> Optional[str]:
        if len(board.move_stack) == 0 and board.turn == chess.BLACK:
            weighted_moves = []
            for move_uci, weight in self._FIRST_MOVES:
                move = chess.Move.from_uci(move_uci)
                if move in board.legal_moves:
                    weighted_moves.extend([move_uci] * weight)
            if weighted_moves:
                return random.choice(weighted_moves)

        if len(board.move_stack) == 1 and board.turn == chess.BLACK:
            response = self._OPENING_RESPONSES.get(board.move_stack[0].uci())
            if response:
                move = chess.Move.from_uci(response)
                if move in board.legal_moves:
                    return response
        return None

    def _search(self, board: chess.Board, depth: int, alpha: int, beta: int, maximizing: bool) -> int:
        if depth == 0 or board.is_game_over():
            return self._evaluate(board)

        legal_moves = list(board.legal_moves)
        if maximizing:
            score = -10**9
            for move in legal_moves:
                board.push(move)
                score = max(score, self._search(board, depth - 1, alpha, beta, False))
                board.pop()
                alpha = max(alpha, score)
                if beta <= alpha:
                    break
            return score

        score = 10**9
        for move in legal_moves:
            board.push(move)
            score = min(score, self._search(board, depth - 1, alpha, beta, True))
            board.pop()
            beta = min(beta, score)
            if beta <= alpha:
                break
        return score

    def _evaluate(self, board: chess.Board) -> int:
        if board.is_checkmate():
            return -10**7 if board.turn == chess.WHITE else 10**7
        if board.is_stalemate() or board.is_insufficient_material():
            return 0

        material = 0
        for piece_type, value in self._PIECE_VALUES.items():
            material += len(board.pieces(piece_type, chess.WHITE)) * value
            material -= len(board.pieces(piece_type, chess.BLACK)) * value

        mobility = len(list(board.legal_moves))
        return material + (mobility if board.turn == chess.WHITE else -mobility)


class Stock5Bot:
    def __init__(self, source_path: Path) -> None:
        moonfish_root = source_path / "moonfish"
        if str(moonfish_root) not in sys.path:
            sys.path.insert(0, str(moonfish_root))
        from moonfish.lib import search_move  # pylint: disable=import-outside-toplevel

        self._search_move = search_move

    def best_move(self, board: chess.Board) -> str:
        return self._search_move(board, depth=2).uci()


class Stock17Bot:
    def __init__(self, binary_path: Path) -> None:
        self._engine = UciEngine(
            path=str(binary_path),
            parameters={"Threads": max(int(os.getenv("STOCK17_THREADS", "2")), 1), "Hash": max(int(os.getenv("STOCK17_HASH_MB", "64")), 1)},
            move_time_ms=max(int(os.getenv("STOCK17_MOVE_TIME_MS", "250")), 1),
        )

    def best_move(self, board: chess.Board) -> str:
        move = self._engine.best_move(board)
        if not move:
            raise RuntimeError("stock-17 returned no legal move")
        return move


class BotService:
    def __init__(self) -> None:
        self._engines: Dict[str, ChessBot] = {}
        self._lock = threading.RLock()

    def difficulty_profile(self, raw_value: str | None) -> BotProfile:
        return difficulty_profile(raw_value)

    def display_name(self, raw_value: str | None) -> str:
        return difficulty_profile(raw_value).bot_name

    def choose_move(self, board: chess.Board, difficulty: str | None) -> str:
        engine = self._engine_for(difficulty_profile(difficulty))
        return engine.best_move(board.copy(stack=True))

    def _engine_for(self, profile: BotProfile) -> ChessBot:
        with self._lock:
            engine = self._engines.get(profile.key)
            if engine is not None:
                return engine

            if profile.engine_id == "stock-1":
                engine = Stock1Bot()
            elif profile.engine_id == "stock-5":
                engine = Stock5Bot(profile.source_path)
            elif profile.engine_id == "stock-17":
                engine = Stock17Bot(self._resolve_stock17_binary(profile.source_path))
            else:
                raise ValueError(f"Unsupported engine: {profile.engine_id}")

            self._engines[profile.key] = engine
            return engine

    def _resolve_stock17_binary(self, source_path: Path) -> Path:
        candidates = (
            source_path / "Stockfish" / "src" / "stockfish",
            source_path / "Stockfish" / "src" / "stockfish-ubuntu-x86-64",
        )
        for candidate in candidates:
            if candidate.exists():
                return candidate.resolve()
        raise FileNotFoundError(
            "stock-17 binary not found. Build stockfish_bots/stock-17/Stockfish/src/stockfish before running."
        )


bot_service = BotService()
