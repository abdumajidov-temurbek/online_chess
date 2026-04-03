import React, { useEffect, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { BOT_DIFFICULTIES } from '../lib/botDifficulty';
import { ensureGuestSession, setGuestSessionId } from '../lib/guestStorage';

export default function LandingPage() {
  const history = useHistory();
  const location = useLocation();
  const { exitGuestMode, isGuest, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState('white');
  const [difficulty, setDifficulty] = useState('pre-intermediate');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !playerName) {
      setPlayerName(user.name || user.email.split('@')[0]);
    }
  }, [playerName, user]);

  useEffect(() => {
    if (isGuest && !playerName) {
      setPlayerName('Guest');
    }
  }, [isGuest, playerName]);

  useEffect(() => {
    if (location.state?.openPlayDialog) {
      setOpen(true);
      history.replace({ ...location, state: {} });
    }
  }, [history, location]);

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
      const requestConfig = {};

      if (isGuest) {
        const guestSessionId = ensureGuestSession();
        requestConfig.headers = {
          'X-Guest-Session': guestSessionId,
        };
      }

      const response = await api.post(
        '/games',
        { playerName, playerColor, difficulty, is_guest: isGuest },
        requestConfig
      );

      if (isGuest && response.data.guest_session_id) {
        setGuestSessionId(response.data.guest_session_id);
      }
      history.push(`/game/${response.data.game.id}`);
    } catch (requestError) {
      console.error(requestError.response?.data || requestError.message);
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
            <small>{isGuest ? 'Guest solo chess' : 'Authenticated solo chess'}</small>
          </div>
        </div>
        <div className="topbar-auth">
          <div className="user-chip">
            <strong>{isGuest ? 'Playing as Guest' : user?.name || 'Player'}</strong>
            <span>{isGuest ? 'Guest session only' : user?.email}</span>
          </div>
          {isGuest ? (
            <Link
              to="/login"
              className="ghost-button"
              onClick={() => {
                exitGuestMode();
              }}
            >
              Sign in
            </Link>
          ) : (
            <button type="button" className="ghost-button" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="hero-layout">
        <section className="hero-copy">
          <span className="eyebrow">Instant Bot Match</span>
          <h1>Press play, choose your side, and start a real chess game immediately.</h1>
          <p>
            {isGuest
              ? 'You are in guest mode. This session is temporary and will not be attached to an account.'
              : 'Sign in once, keep your identity attached to the session, choose white or black, pick a local engine, and start the game.'}
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={() => setOpen(true)}>
              Play
            </button>
            <div className="pill-note">stock-1 • stock-5 • stock-17</div>
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
              <span>{isGuest ? 'Guest games stay temporary.' : 'Your account unlocks the board immediately.'}</span>
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
                <p>{isGuest ? 'Choose a temporary guest name for this session.' : 'Use your account name or customize how it appears inside the game.'}</p>
                <label className="field">
                  <span>Player name</span>
                  <input
                    autoFocus
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    placeholder={isGuest ? 'e.g. Guest Temur' : 'e.g. Temur'}
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
            ) : step === 2 ? (
              <>
                <span className="eyebrow">Step 2</span>
                <h2>Choose your side</h2>
                <p>Choose White or Black. If you pick Black, the bot opens the game after a short think.</p>
                <div className="color-grid">
                  <button
                    type="button"
                    className={`color-card ${playerColor === 'white' ? 'color-card-active' : ''}`}
                    onClick={() => {
                      setPlayerColor('white');
                      setStep(3);
                    }}
                  >
                    <strong>White</strong>
                    <span>You move first.</span>
                  </button>
                  <button
                    type="button"
                    className={`color-card ${playerColor === 'black' ? 'color-card-active' : ''}`}
                    onClick={() => {
                      setPlayerColor('black');
                      setStep(3);
                    }}
                  >
                    <strong>Black</strong>
                    <span>Bot opens after a short delay.</span>
                  </button>
                </div>
                {error ? <p className="error-copy">{error}</p> : null}
                <div className="dialog-actions">
                  <button type="button" className="ghost-button" onClick={() => setStep(1)}>
                    Back
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">Step 3</span>
                <h2>Choose difficulty level</h2>
                <p>Select one of the three local engines.</p>
                <div className="difficulty-block">
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
                        <small>{option.value === 'pre-intermediate' ? 'stock-1' : option.value === 'intermediate' ? 'stock-5' : 'stock-17'}</small>
                      </button>
                    ))}
                  </div>
                </div>
                {error ? <p className="error-copy">{error}</p> : null}
                <div className="dialog-actions">
                  <button type="button" className="ghost-button" onClick={() => setStep(2)}>
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
