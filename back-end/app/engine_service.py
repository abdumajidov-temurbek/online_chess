import chess

from bot_service import bot_service


class EngineService:
    def best_move(self, board: chess.Board, difficulty: str = "advance") -> str:
        return bot_service.choose_move(board, difficulty)


engine_service = EngineService()
