import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import api from '../lib/api';
import { BOT_DIFFICULTIES } from '../lib/botDifficulty';

export default function LandingPage() {
  const history = useHistory();
  const [open, setOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState('white');
  const [difficulty, setDifficulty] = useState('beginner');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const closeDialog = () => {
    setOpen(false);
    setStep(1);
    setError('');
    setLoading(false);
  };

  const handleCreateGame = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/games', { playerName, playerColor, difficulty });
      history.push(`/game/${response.data.game.id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to start a game.');
      setLoading(false);
    }
  };

  return (
    <div className="landing-screen">
      <header className="hero-header">
        <div className="brand-lockup">
          <span className="brand-badge">C</span>
          <div>
            <strong>Castle Solo</strong>
            <small>Clean chess against a ready bot</small>
          </div>
        </div>
      </header>

      <main className="hero-layout">
        <section className="hero-copy">
          <span className="eyebrow">Instant Bot Match</span>
          <h1>Press play, choose your side, and start a real chess game immediately.</h1>
          <p>
            This version strips away authentication and lobby noise. You land, enter your name, pick white or black,
            and the game begins against a Stockfish-powered opponent running a full-strength Stockfish 17 build.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={() => setOpen(true)}>
              Play
            </button>
            <div className="pill-note">Stockfish 17 • Strong engine • Immediate start</div>
          </div>
        </section>

        <section className="hero-visual">
          <div className="visual-panel">
            <div className="board-preview">
              {Array.from({ length: 64 }).map((_, index) => (
                <span key={index} className={index % 2 === Math.floor(index / 8) % 2 ? 'board-light' : 'board-dark'} />
              ))}
            </div>
            <div className="visual-caption">
              <strong>Focused solo flow</strong>
              <span>No sign-up. No waiting room. Just chess.</span>
            </div>
          </div>
        </section>
      </main>

      {open ? (
        <div className="dialog-backdrop">
          <div className="dialog-card">
            <button type="button" className="dialog-close" onClick={closeDialog}>
              Close
            </button>
            {step === 1 ? (
              <>
                <span className="eyebrow">Step 1</span>
                <h2>What should we call you?</h2>
                <p>Enter a player name before the board opens.</p>
                <label className="field">
                  <span>Player name</span>
                  <input
                    autoFocus
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    placeholder="e.g. Temur"
                  />
                </label>
                {error ? <p className="error-copy">{error}</p> : null}
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      if (!playerName.trim()) {
                        setError('Player name is required.');
                        return;
                      }
                      setError('');
                      setStep(2);
                    }}
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">Step 2</span>
                <h2>Choose your side</h2>
                <p>The bot takes the opposite color and moves immediately if you start as Black.</p>
                <div className="color-grid">
                  <button
                    type="button"
                    className={`color-card ${playerColor === 'white' ? 'color-card-active' : ''}`}
                    onClick={() => setPlayerColor('white')}
                  >
                    <strong>Play as White</strong>
                    <span>You move first.</span>
                  </button>
                  <button
                    type="button"
                    className={`color-card ${playerColor === 'black' ? 'color-card-active' : ''}`}
                    onClick={() => setPlayerColor('black')}
                  >
                    <strong>Play as Black</strong>
                    <span>Bot opens instantly.</span>
                  </button>
                </div>
                <div className="difficulty-block">
                  <div className="difficulty-header">
                    <div>
                      <strong>Bot difficulty</strong>
                      <span>Friendly labels with tuned engine strength behind them.</span>
                    </div>
                  </div>
                  <div className="difficulty-grid">
                    {BOT_DIFFICULTIES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`difficulty-card ${difficulty === option.value ? 'difficulty-card-active' : ''}`}
                        onClick={() => setDifficulty(option.value)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                        <small>Approx. {option.elo} Elo</small>
                      </button>
                    ))}
                  </div>
                </div>
                {error ? <p className="error-copy">{error}</p> : null}
                <div className="dialog-actions">
                  <button type="button" className="ghost-button" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="button" className="primary-button" onClick={handleCreateGame} disabled={loading}>
                    {loading ? 'Starting game...' : 'Start game'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
