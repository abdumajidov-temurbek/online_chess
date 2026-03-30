import subprocess
import threading
from pathlib import Path
from typing import Dict, Optional

import chess


class UciEngine:
    def __init__(self, path: str, parameters: Dict[str, object], move_time_ms: int) -> None:
        self._path = str(Path(path).resolve())
        self._cwd = str(Path(self._path).parent)
        self._parameters = parameters
        self._move_time_ms = move_time_ms
        self._process: Optional[subprocess.Popen[str]] = None
        self._lock = threading.Lock()
        self._load_engine()

    def _load_engine(self) -> None:
        self._shutdown_locked()
        self._process = subprocess.Popen(
            [self._path],
            cwd=self._cwd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        self._send("uci")
        self._read_until("uciok")
        for name, value in self._parameters.items():
            self._send(f"setoption name {name} value {self._option_value(value)}")
        self._send("isready")
        self._read_until("readyok")

    def best_move(self, board: chess.Board, move_time_ms: Optional[int] = None) -> Optional[str]:
        with self._lock:
            try:
                self._ensure_process()
                self._send(f"position fen {board.fen()}")
                self._send(f"go movetime {max(move_time_ms or self._move_time_ms, 1)}")
                while True:
                    line = self._readline()
                    if line.startswith("bestmove "):
                        parts = line.split()
                        return parts[1] if len(parts) > 1 and parts[1] != "(none)" else None
            except Exception:
                self._load_engine()
                self._send(f"position fen {board.fen()}")
                self._send(f"go movetime {max(move_time_ms or self._move_time_ms, 1)}")
                while True:
                    line = self._readline()
                    if line.startswith("bestmove "):
                        parts = line.split()
                        return parts[1] if len(parts) > 1 and parts[1] != "(none)" else None

    def _ensure_process(self) -> None:
        if self._process is None or self._process.poll() is not None:
            self._load_engine()

    def _send(self, command: str) -> None:
        if self._process is None or self._process.stdin is None:
            raise RuntimeError("UCI engine is not available")
        self._process.stdin.write(f"{command}\n")
        self._process.stdin.flush()

    def _read_until(self, token: str) -> None:
        while True:
            line = self._readline()
            if line == token:
                return

    def _readline(self) -> str:
        if self._process is None or self._process.stdout is None:
            raise RuntimeError("UCI engine is not available")
        line = self._process.stdout.readline()
        if not line:
            raise RuntimeError("UCI engine terminated unexpectedly")
        return line.strip()

    def _option_value(self, value: object) -> str:
        if isinstance(value, bool):
            return "true" if value else "false"
        return str(value)

    def _shutdown_locked(self) -> None:
        if self._process is None:
            return
        try:
            if self._process.stdin is not None:
                self._process.stdin.write("quit\n")
                self._process.stdin.flush()
        except Exception:
            pass
        try:
            self._process.wait(timeout=2)
        except Exception:
            self._process.kill()
            self._process.wait(timeout=2)
        self._process = None

    def close(self) -> None:
        with self._lock:
            self._shutdown_locked()
