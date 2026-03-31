import random
import string
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import chess
import chess.pgn

from .database import get_db
from .engine_service import engine_service
from .security import to_iso, utc_now
from bot_service import bot_service


class GameError(Exception):
    pass


@dataclass
class Player:
    user_id: Optional[int]
    name: str
    sid: Optional[str] = None


@dataclass
class ActiveGame:
    id: str
    mode: str
    board: chess.Board = field(default_factory=chess.Board)
    white: Optional[Player] = None
    black: Optional[Player] = None
    created_at: str = field(default_factory=lambda: to_iso(utc_now()))
    status: str = "waiting"
    result: Optional[str] = None
    reason: Optional[str] = None
    bot_side: Optional[str] = None
    bot_name: Optional[str] = None
    last_move: Optional[str] = None


def _game_to_dict(game: ActiveGame) -> Dict[str, Any]:
    status = summarize_board(game.board)
    return {
        "id": game.id,
        "mode": game.mode,
        "status": game.status,
        "white": {"id": game.white.user_id if game.white else None, "name": game.white.name if game.white else None},
        "black": {"id": game.black.user_id if game.black else None, "name": game.black.name if game.black else None},
        "fen": game.board.fen(),
        "pgn": _board_to_pgn(game.board),
        "moveHistory": [move.uci() for move in game.board.move_stack],
        "turn": "white" if game.board.turn == chess.WHITE else "black",
        "inCheck": game.board.is_check(),
        "isCheckmate": game.board.is_checkmate(),
        "isDraw": game.board.is_stalemate() or game.board.is_insufficient_material() or game.board.can_claim_threefold_repetition() or game.board.can_claim_fifty_moves(),
        "lastMove": game.last_move,
        "statusText": status,
        "shareCode": game.id,
        "createdAt": game.created_at,
    }


def _board_to_pgn(board: chess.Board) -> str:
    replay = chess.Board()
    game = chess.pgn.Game()
    node = game
    for move in board.move_stack:
        node = node.add_variation(move)
        replay.push(move)
    return str(game)


def summarize_board(board: chess.Board) -> str:
    if board.is_checkmate():
        return "Checkmate"
    if board.is_stalemate():
        return "Draw by stalemate"
    if board.is_insufficient_material():
        return "Draw by insufficient material"
    if board.can_claim_threefold_repetition():
        return "Draw by repetition"
    if board.can_claim_fifty_moves():
        return "Draw by fifty-move rule"
    if board.is_check():
        return f"{'White' if board.turn == chess.WHITE else 'Black'} to move, check"
    return f"{'White' if board.turn == chess.WHITE else 'Black'} to move"


class GameManager:
    def __init__(self) -> None:
        self.games: Dict[str, ActiveGame] = {}

    def _new_id(self) -> str:
        while True:
            game_id = "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(6))
            if game_id not in self.games:
                return game_id

    def create_bot_game(self, user_id: int, name: str) -> Dict[str, Any]:
        bot_name = bot_service.display_name("advance")
        game = ActiveGame(
            id=self._new_id(),
            mode="bot",
            white=Player(user_id=user_id, name=name),
            black=Player(user_id=None, name=bot_name),
            status="ongoing",
            bot_side="black",
            bot_name=bot_name,
        )
        self.games[game.id] = game
        return _game_to_dict(game)

    def create_multiplayer_game(self, user_id: int, name: str) -> Dict[str, Any]:
        game = ActiveGame(
            id=self._new_id(),
            mode="multiplayer",
            white=Player(user_id=user_id, name=name),
            status="waiting",
        )
        self.games[game.id] = game
        return _game_to_dict(game)

    def join_multiplayer_game(self, game_id: str, user_id: int, name: str) -> Dict[str, Any]:
        game = self.games.get(game_id)
        if not game or game.mode != "multiplayer":
            raise GameError("Game not found.")
        if game.black and game.black.user_id != user_id:
            raise GameError("Game is full.")
        if game.white and game.white.user_id == user_id:
            raise GameError("You are already seated in this game.")
        game.black = Player(user_id=user_id, name=name)
        game.status = "ongoing"
        return _game_to_dict(game)

    def get_game(self, game_id: str) -> Dict[str, Any]:
        game = self.games.get(game_id)
        if not game:
            raise GameError("Game not found.")
        return _game_to_dict(game)

    def assign_connection(self, game_id: str, user_id: int, sid: str) -> Dict[str, Any]:
        game = self.games.get(game_id)
        if not game:
            raise GameError("Game not found.")
        if game.white and game.white.user_id == user_id:
            game.white.sid = sid
        if game.black and game.black.user_id == user_id:
            game.black.sid = sid
        return _game_to_dict(game)

    def player_color(self, game_id: str, user_id: int) -> str:
        game = self.games.get(game_id)
        if not game:
            raise GameError("Game not found.")
        if game.white and game.white.user_id == user_id:
            return "white"
        if game.black and game.black.user_id == user_id:
            return "black"
        raise GameError("You are not part of this game.")

    def make_move(self, game_id: str, user_id: int, move_uci: str) -> Dict[str, Any]:
        game = self.games.get(game_id)
        if not game:
            raise GameError("Game not found.")
        if game.status not in {"ongoing", "waiting"}:
            raise GameError("Game is not active.")
        if game.mode == "multiplayer" and not game.black:
            raise GameError("Waiting for an opponent to join.")

        color = self.player_color(game_id, user_id)
        is_white_turn = game.board.turn == chess.WHITE
        if (color == "white" and not is_white_turn) or (color == "black" and is_white_turn):
            raise GameError("It is not your turn.")

        move = chess.Move.from_uci(move_uci)
        if move not in game.board.legal_moves:
            raise GameError("Illegal move.")

        game.board.push(move)
        game.status = "ongoing"
        game.last_move = move_uci

        if self._is_finished(game):
            return self._finalize_game(game)

        if game.mode == "bot" and game.bot_side == ("white" if game.board.turn == chess.WHITE else "black"):
            bot_move = engine_service.best_move(game.board, "advance")
            game.board.push(chess.Move.from_uci(bot_move))
            game.last_move = bot_move
            if self._is_finished(game):
                return self._finalize_game(game)

        return {"game": _game_to_dict(game), "finished": False}

    def resign(self, game_id: str, user_id: int) -> Dict[str, Any]:
        game = self.games.get(game_id)
        if not game:
            raise GameError("Game not found.")
        color = self.player_color(game_id, user_id)
        game.status = "finished"
        game.reason = "resignation"
        game.result = "0-1" if color == "white" else "1-0"
        self._persist_match(game)
        return {"game": _game_to_dict(game), "finished": True, "result": game.result, "reason": game.reason}

    def restart(self, game_id: str, user_id: int) -> Dict[str, Any]:
        game = self.games.get(game_id)
        if not game:
            raise GameError("Game not found.")
        self.player_color(game_id, user_id)
        game.board = chess.Board()
        game.status = "ongoing" if game.mode == "bot" or game.black else "waiting"
        game.result = None
        game.reason = None
        game.last_move = None
        return _game_to_dict(game)

    def list_matches_for_user(self, user_id: int) -> List[Dict[str, Any]]:
        with get_db() as db:
            rows = db.execute(
                """
                SELECT * FROM matches
                WHERE white_user_id = ? OR black_user_id = ?
                ORDER BY id DESC
                LIMIT 20
                """,
                (user_id, user_id),
            ).fetchall()
        return [dict(row) for row in rows]

    def _is_finished(self, game: ActiveGame) -> bool:
        return (
            game.board.is_checkmate()
            or game.board.is_stalemate()
            or game.board.is_insufficient_material()
            or game.board.can_claim_threefold_repetition()
            or game.board.can_claim_fifty_moves()
        )

    def _finalize_game(self, game: ActiveGame) -> Dict[str, Any]:
        game.status = "finished"
        if game.board.is_checkmate():
            game.reason = "checkmate"
            game.result = "1-0" if game.board.turn == chess.BLACK else "0-1"
        else:
            game.reason = "draw"
            game.result = "1/2-1/2"
        self._persist_match(game)
        return {"game": _game_to_dict(game), "finished": True, "result": game.result, "reason": game.reason}

    def _persist_match(self, game: ActiveGame) -> None:
        winner_user_id = None
        if game.result == "1-0" and game.white:
            winner_user_id = game.white.user_id
        elif game.result == "0-1" and game.black:
            winner_user_id = game.black.user_id

        with get_db() as db:
            db.execute(
                """
                INSERT OR REPLACE INTO matches (
                    game_id, mode, white_user_id, black_user_id, white_name, black_name,
                    result, reason, winner_user_id, pgn, created_at, finished_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    game.id,
                    game.mode,
                    game.white.user_id if game.white else None,
                    game.black.user_id if game.black else None,
                    game.white.name if game.white else "White",
                    game.black.name if game.black else "Black",
                    game.result or "1/2-1/2",
                    game.reason or "draw",
                    winner_user_id,
                    _board_to_pgn(game.board),
                    game.created_at,
                    to_iso(utc_now()),
                ),
            )


game_manager = GameManager()
