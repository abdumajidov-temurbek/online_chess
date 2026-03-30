import React, { useEffect, useMemo, useState } from 'react';
import Chess from 'chess.js';
import Chessboard from 'chessboardjsx';
import { Link, useHistory, useParams } from 'react-router-dom';

import BotSidebar from '../components/game/BotSidebar';
import PlayerCard from '../components/game/PlayerCard';
import api from '../lib/api';

const pieceTheme = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'].reduce((map, piece) => {
  map[piece] = ({ squareWidth }) => (
    <img
      src={`${process.env.PUBLIC_URL}/chess-themes/pieces/neo/${piece.toLowerCase()}.png`}
      alt={piece}
      style={{ width: squareWidth, height: squareWidth, pointerEvents: 'none' }}
    />
  );
  return map;
}, {});

function outcomeLabel(game) {
  if (!game.result) {
    return game.statusText;
  }
  if (game.reason === 'draw') {
    return 'Game drawn.';
  }
  if (game.reason === 'resignation') {
    return `${game.playerName} resigned.`;
  }
  return game.result === '1-0' ? 'White wins.' : 'Black wins.';
}

function openingName(moves) {
  const first = moves[0]?.san;
  const second = moves[1]?.san;
  if (!first) {
    return 'Opening pending';
  }
  if (first === 'e4' && second === 'e5') return 'Open Game';
  if (first === 'd4' && second === 'd5') return "Queen's Pawn Game";
  if (first === 'e4' && second === 'c5') return 'Sicilian Defence';
  if (first === 'e4' && second === 'e6') return 'French Defence';
  if (first === 'c4') return 'English Opening';
  if (first === 'Nf3') return 'Réti Opening';
  return 'Custom opening';
}

export default function GamePage() {
  const { gameId } = useParams();
  const history = useHistory();
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState('');
  const [squareStyles, setSquareStyles] = useState({});

  useEffect(() => {
    const loadGame = async () => {
      try {
        const response = await api.get(`/games/${gameId}`);
        setGame(response.data.game);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Game not found.');
      }
    };

    loadGame();
  }, [gameId]);

  useEffect(() => {
    if (!game?.botThinking) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = await api.get(`/games/${gameId}`);
        setGame(response.data.game);
      } catch (_error) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [game?.botThinking, gameId]);

  const board = useMemo(() => {
    const instance = new Chess();
    if (game?.fen) {
      instance.load(game.fen);
    }
    return instance;
  }, [game]);

  const lastMove = game?.moves?.[game.moves.length - 1]?.uci || '';
  const boardHighlights = useMemo(() => {
    const styles = { ...squareStyles };
    if (lastMove) {
      styles[lastMove.slice(0, 2)] = {
        ...(styles[lastMove.slice(0, 2)] || {}),
        boxShadow: 'inset 0 0 0 9999px rgba(238, 198, 92, 0.24)',
      };
      styles[lastMove.slice(2, 4)] = {
        ...(styles[lastMove.slice(2, 4)] || {}),
        boxShadow: 'inset 0 0 0 9999px rgba(238, 198, 92, 0.24)',
      };
    }
    return styles;
  }, [lastMove, squareStyles]);

  const highlightMoves = (square) => {
    const moves = board.moves({ square, verbose: true });
    if (!moves.length) {
      setSelectedSquare('');
      setSquareStyles({});
      return;
    }
    const nextStyles = moves.reduce(
      (styles, move) => ({
        ...styles,
        [move.to]: { boxShadow: 'inset 0 0 0 9999px rgba(238, 198, 92, 0.18)' },
      }),
      { [square]: { boxShadow: 'inset 0 0 0 9999px rgba(238, 198, 92, 0.26)' } }
    );
    setSelectedSquare(square);
    setSquareStyles(nextStyles);
  };

  const clearHighlights = () => {
    setSelectedSquare('');
    setSquareStyles({});
  };

  const submitMove = async (sourceSquare, targetSquare) => {
    if (!game || game.isFinished || busy || game.botThinking) {
      return;
    }
    const probe = new Chess();
    probe.load(game.fen);
    const move = probe.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (!move) {
      clearHighlights();
      return;
    }

    setBusy(true);
    setError('');
    try {
      const response = await api.post(`/games/${game.id}/move`, { move: move.from + move.to + (move.promotion || '') });
      setGame(response.data.game);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Move rejected.');
    } finally {
      setBusy(false);
      clearHighlights();
    }
  };

  const handleSquareClick = (square) => {
    if (game?.botThinking) {
      return;
    }
    if (!selectedSquare) {
      highlightMoves(square);
      return;
    }
    submitMove(selectedSquare, square);
  };

  const handleRestart = async () => {
    setBusy(true);
    try {
      const response = await api.post(`/games/${game.id}/restart`);
      setGame(response.data.game);
      setError('');
      clearHighlights();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to restart game.');
    } finally {
      setBusy(false);
    }
  };

  const handleResign = async () => {
    setBusy(true);
    try {
      const response = await api.post(`/games/${game.id}/resign`);
      setGame(response.data.game);
      setError('');
      clearHighlights();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to resign.');
    } finally {
      setBusy(false);
    }
  };

  if (error && !game) {
    return (
      <div className="game-shell">
        <div className="missing-state">
          <p>{error}</p>
          <Link to="/" className="primary-button">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  if (!game) {
    return <div className="game-shell loading-state">Loading game...</div>;
  }

  const playerActive = game.turn === game.playerColor && !game.isFinished;
  const botActive = game.turn === game.botColor && !game.isFinished;
  const statusMessage = game.botThinking ? 'Bot is thinking...' : outcomeLabel(game);

  return (
    <div className="game-shell">
      <header className="game-topbar">
        <Link to="/" className="brand-lockup">
          <span className="brand-badge">C</span>
          <div>
            <strong>Castle Solo</strong>
            <small>Premium bot arena</small>
          </div>
        </Link>
        <div className="topbar-status">
          <span className="status-pill">{statusMessage}</span>
        </div>
      </header>

      <main className="game-layout">
        <section className="arena-column">
          <PlayerCard
            label="Opponent"
            name={game.botName}
            rating={3000}
            subtitle="Stockfish 17 running at full strength"
            active={botActive}
            accent="bot"
          />

          <div className="arena-board-card">
            <div className="board-wrap">
              <Chessboard
                id="castle-solo-board"
                width={Math.min(window.innerWidth < 900 ? window.innerWidth - 48 : 720, 720)}
                position={game.fen}
                orientation={game.playerColor}
                pieces={pieceTheme}
                boardStyle={{ borderRadius: '22px', overflow: 'hidden', boxShadow: '0 32px 90px rgba(0, 0, 0, 0.38)' }}
                lightSquareStyle={{ backgroundColor: '#ede5cd' }}
                darkSquareStyle={{ backgroundColor: '#7f9a68' }}
                squareStyles={boardHighlights}
                onSquareClick={handleSquareClick}
                onDrop={({ sourceSquare, targetSquare }) => {
                  if (game.botThinking) {
                    return;
                  }
                  submitMove(sourceSquare, targetSquare);
                }}
                showNotation
              />
            </div>
            <div className="board-footnote">
              <span>{openingName(game.moves)}</span>
              <span>{game.botThinking ? 'Bot is thinking...' : game.turn === game.playerColor ? 'Your move' : 'Bot to move'}</span>
            </div>
          </div>

          <PlayerCard
            label="You"
            name={game.playerName}
            rating={1240}
            subtitle={`Playing as ${game.playerColor}`}
            active={playerActive}
            accent="human"
          />

          {error ? <p className="error-copy arena-error">{error}</p> : null}
        </section>

        <BotSidebar
          botName={game.botName}
          openingName={openingName(game.moves)}
          statusText={statusMessage}
          moves={game.moves}
          lastMoveUci={lastMove}
          onRestart={handleRestart}
          onResign={handleResign}
          onNewGame={() => history.push('/')}
          busy={busy}
          finished={game.isFinished}
        />
      </main>
    </div>
  );
}
