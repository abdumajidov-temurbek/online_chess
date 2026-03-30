import React, { useEffect, useMemo, useState } from 'react';
import Chess from 'chess.js';
import { Link, useHistory, useParams } from 'react-router-dom';

import AnimatedChessBoard from '../components/game/AnimatedChessBoard';
import BotSidebar from '../components/game/BotSidebar';
import PlayerCard from '../components/game/PlayerCard';
import useChessSounds from '../hooks/useChessSounds';
import api from '../lib/api';

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
  const [possibleMoves, setPossibleMoves] = useState([]);

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

  useChessSounds(game);

  const board = useMemo(() => {
    const instance = new Chess();
    if (game?.fen) {
      instance.load(game.fen);
    }
    return instance;
  }, [game]);

  const lastMove = game?.moves?.[game.moves.length - 1]?.uci || '';

  const highlightMoves = (square) => {
    const moves = board.moves({ square, verbose: true });
    if (!moves.length) {
      setSelectedSquare('');
      setPossibleMoves([]);
      return;
    }
    setSelectedSquare(square);
    setPossibleMoves(moves.map((move) => move.to));
  };

  const clearHighlights = () => {
    setSelectedSquare('');
    setPossibleMoves([]);
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
    if (!game || game.botThinking || busy || game.isFinished || game.turn !== game.playerColor) {
      return;
    }
    if (!selectedSquare) {
      highlightMoves(square);
      return;
    }
    if (square === selectedSquare) {
      clearHighlights();
      return;
    }
    if (!possibleMoves.includes(square)) {
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
  const checkmateColor =
    game.isFinished && game.reason === 'checkmate'
      ? game.winner === 'white'
        ? 'black'
        : game.winner === 'black'
          ? 'white'
          : ''
      : '';
  const checkColor =
    !game.isFinished && game.inCheck
      ? game.turn
      : '';

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
            rating={game.difficultyElo || 1000}
            subtitle={`${game.difficultyLabel || 'Beginner'} training level`}
            active={botActive}
            accent="bot"
          />

          <div className="arena-board-card">
            <div className="board-wrap">
              <AnimatedChessBoard
                fen={game.fen}
                orientation={game.playerColor}
                playerColor={game.playerColor}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves}
                lastMoveUci={lastMove}
                checkColor={checkColor}
                checkmateColor={checkmateColor}
                disabled={game.botThinking || busy || game.isFinished}
                onSquareClick={handleSquareClick}
                onMove={submitMove}
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
          difficultyLabel={game.difficultyLabel}
          difficultyElo={game.difficultyElo}
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
