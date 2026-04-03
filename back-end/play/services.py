import os
import time
import threading
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import chess
import chess.pgn
from bot_service import bot_service


def status_text(board: chess.Board) -> str:
    if board.is_checkmate():
        winner = "Black" if board.turn == chess.WHITE else "White"
        return f"Checkmate. {winner} wins."
    if board.is_stalemate():
        return "Draw by stalemate."
    if board.is_insufficient_material():
        return "Draw by insufficient material."
    if board.can_claim_threefold_repetition():
        return "Draw by repetition."
    if board.can_claim_fifty_moves():
        return "Draw by fifty-move rule."
    if board.is_check():
        return f"{'White' if board.turn == chess.WHITE else 'Black'} to move. Check."
    return f"{'White' if board.turn == chess.WHITE else 'Black'} to move."


def result_payload(board: chess.Board) -> Dict[str, Optional[str]]:
    if board.is_checkmate():
        return {
            "finished": True,
            "result": "1-0" if board.turn == chess.BLACK else "0-1",
            "reason": "checkmate",
        }
    if (
        board.is_stalemate()
        or board.is_insufficient_material()
        or board.can_claim_threefold_repetition()
        or board.can_claim_fifty_moves()
    ):
        return {"finished": True, "result": "1/2-1/2", "reason": "draw"}
    return {"finished": False, "result": None, "reason": None}


@dataclass
class GameSession:
    id: str
    owner_key: str
    player_name: str
    player_color: str
    difficulty: str = "pre-intermediate"
    is_guest_game: bool = False
    guest_session_id: Optional[str] = None
    board: chess.Board = field(default_factory=chess.Board)
    move_history: List[str] = field(default_factory=list)
    result: Optional[str] = None
    reason: Optional[str] = None
    winner: Optional[str] = None
    bot_thinking: bool = False

    @property
    def bot_color(self) -> str:
        return "black" if self.player_color == "white" else "white"


class GameManager:
    def __init__(self) -> None:
        self._games: Dict[str, GameSession] = {}
        self._lock = threading.RLock()

    def create_game(
        self,
        owner_key: str,
        player_name: str,
        player_color: str,
        difficulty: str = "pre-intermediate",
        is_guest_game: bool = False,
        guest_session_id: Optional[str] = None,
    ) -> GameSession:
        if player_color not in {"white", "black"}:
            raise ValueError("Player color must be white or black.")
        difficulty_key = bot_service.difficulty_profile(difficulty).key
        game = GameSession(
            id=uuid.uuid4().hex[:8],
            owner_key=owner_key,
            player_name=player_name.strip() or "Player",
            player_color=player_color,
            difficulty=difficulty_key,
            is_guest_game=is_guest_game,
            guest_session_id=guest_session_id,
        )
        with self._lock:
            self._games[game.id] = game
            if game.player_color == "black":
                self._schedule_bot_move(game.id)
        return game

    def get_game(self, game_id: str, owner_key: str) -> GameSession:
        with self._lock:
            game = self._games.get(game_id)
            if not game:
                raise KeyError("Game not found.")
            if game.owner_key != owner_key:
                raise PermissionError("You do not have access to this game.")
            return game

    def restart_game(self, game_id: str, owner_key: str) -> GameSession:
        with self._lock:
            game = self.get_game(game_id, owner_key)
            game.board = chess.Board()
            game.move_history = []
            game.result = None
            game.reason = None
            game.winner = None
            game.bot_thinking = False
            if game.player_color == "black":
                self._schedule_bot_move(game.id)
            return game

    def resign_game(self, game_id: str, owner_key: str) -> GameSession:
        with self._lock:
            game = self.get_game(game_id, owner_key)
            if not game.result:
                game.result = "0-1" if game.player_color == "white" else "1-0"
                game.reason = "resignation"
                game.winner = game.bot_color
            return game

    def make_move(self, game_id: str, owner_key: str, move_uci: str) -> GameSession:
        with self._lock:
            game = self.get_game(game_id, owner_key)
            if game.result:
                return game
            if game.bot_thinking:
                raise ValueError("Bot is thinking. Please wait.")

            turn = "white" if game.board.turn == chess.WHITE else "black"
            if turn != game.player_color:
                raise ValueError("It is not the human player's turn.")

            move = chess.Move.from_uci(move_uci)
            if move not in game.board.legal_moves:
                raise ValueError("Illegal move.")

            game.board.push(move)
            game.move_history.append(move_uci)
            self._sync_result(game)

            if not game.result:
                self._schedule_bot_move(game.id)

            return game

    def _schedule_bot_move(self, game_id: str) -> None:
        game = self._games.get(game_id)
        if not game or game.result or game.bot_thinking:
            return

        turn = "white" if game.board.turn == chess.WHITE else "black"
        if turn != game.bot_color:
            return

        game.bot_thinking = True
        worker = threading.Thread(target=self._run_bot_move, args=(game_id,), daemon=True)
        worker.start()

    def _run_bot_move(self, game_id: str) -> None:
        time.sleep(max(int(os.getenv("BOT_MOVE_DELAY_MS", "2800")), 0) / 1000)
        with self._lock:
            game = self._games.get(game_id)
            if not game:
                return
            if game.result:
                game.bot_thinking = False
                return
            turn = "white" if game.board.turn == chess.WHITE else "black"
            if turn != game.bot_color:
                game.bot_thinking = False
                return

            bot_move = bot_service.choose_move(game.board, game.difficulty)
            game.board.push(chess.Move.from_uci(bot_move))
            game.move_history.append(bot_move)
            game.bot_thinking = False
            self._sync_result(game)

    def _sync_result(self, game: GameSession) -> None:
        result = result_payload(game.board)
        game.result = result["result"]
        game.reason = result["reason"]
        if game.result == "1-0":
            game.winner = "white"
        elif game.result == "0-1":
            game.winner = "black"
        elif game.reason == "draw":
            game.winner = None


def to_move_list(board: chess.Board) -> List[Dict[str, str]]:
    replay = chess.Board()
    moves = []
    for move in board.move_stack:
        san = replay.san(move)
        replay.push(move)
        moves.append(
            {
                "uci": move.uci(),
                "san": san,
                "by": "white" if replay.turn == chess.BLACK else "black",
            }
        )
    return moves


def serialize_game(game: GameSession) -> Dict[str, object]:
    difficulty = bot_service.difficulty_profile(game.difficulty)
    turn = "white" if game.board.turn == chess.WHITE else "black"
    return {
        "id": game.id,
        "playerName": game.player_name,
        "playerColor": game.player_color,
        "isGuestGame": game.is_guest_game,
        "botName": bot_service.display_name(game.difficulty),
        "botColor": game.bot_color,
        "difficulty": difficulty.key,
        "difficultyLabel": difficulty.label,
        "difficultyElo": difficulty.elo,
        "fen": game.board.fen(),
        "turn": turn,
        "statusText": status_text(game.board) if not game.reason == "resignation" else f"{game.player_name} resigned.",
        "inCheck": game.board.is_check(),
        "isFinished": bool(game.result),
        "botThinking": game.bot_thinking,
        "result": game.result,
        "reason": game.reason,
        "winner": game.winner,
        "moves": to_move_list(game.board),
    }


game_manager = GameManager()
