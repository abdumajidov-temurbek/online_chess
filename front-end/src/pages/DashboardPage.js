import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import AppShell from '../components/AppShell';
import api from '../lib/api';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

function resultLabel(match, userId) {
  if (match.result === '1/2-1/2') {
    return 'Draw';
  }
  if (match.winner_user_id === userId) {
    return 'Win';
  }
  return 'Loss';
}

export default function DashboardPage() {
  const history = useHistory();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [joiningCode, setJoiningCode] = useState('');
  const [matches, setMatches] = useState([]);
  const [loadingAction, setLoadingAction] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get('/matches/history');
        setMatches(response.data.matches);
      } catch (error) {
        pushToast('Unable to load match history.', 'error');
      }
    };

    loadHistory();
  }, [pushToast]);

  const createGame = async (path) => {
    setLoadingAction(path);
    try {
      const response = await api.post(path);
      history.push(`/game/${response.data.game.id}`);
    } catch (error) {
      pushToast(error.response?.data?.error || 'Unable to create a game.', 'error');
    } finally {
      setLoadingAction('');
    }
  };

  const joinGame = async (event) => {
    event.preventDefault();
    setLoadingAction('join');
    try {
      const response = await api.post('/games/multiplayer/join', { gameId: joiningCode.trim().toLowerCase() });
      history.push(`/game/${response.data.game.id}`);
    } catch (error) {
      pushToast(error.response?.data?.error || 'Unable to join that room.', 'error');
    } finally {
      setLoadingAction('');
    }
  };

  const wins = matches.filter((match) => match.winner_user_id === user.id).length;
  const draws = matches.filter((match) => match.result === '1/2-1/2').length;

  return (
    <AppShell eyebrow="Dashboard" title="Command center">
      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <span className="eyebrow">Profile</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <div className="stat-row">
            <div>
              <strong>{matches.length}</strong>
              <span>Tracked games</span>
            </div>
            <div>
              <strong>{wins}</strong>
              <span>Wins</span>
            </div>
            <div>
              <strong>{draws}</strong>
              <span>Draws</span>
            </div>
          </div>
        </article>

        <article className="panel action-panel">
          <span className="eyebrow">Quick Start</span>
          <h2>Play now</h2>
          <p>Launch a polished training game or open a live room for another player.</p>
          <div className="action-list">
            <button type="button" className="primary-button" disabled={loadingAction === '/games/bot'} onClick={() => createGame('/games/bot')}>
              {loadingAction === '/games/bot' ? 'Starting bot...' : 'Play local bot'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={loadingAction === '/games/multiplayer'}
              onClick={() => createGame('/games/multiplayer')}
            >
              {loadingAction === '/games/multiplayer' ? 'Creating room...' : 'Create live room'}
            </button>
          </div>
          <form className="join-form" onSubmit={joinGame}>
            <label className="field">
              <span>Join by code</span>
              <input
                value={joiningCode}
                onChange={(event) => setJoiningCode(event.target.value)}
                placeholder="Enter room code"
                maxLength={6}
              />
            </label>
            <button type="submit" className="ghost-button" disabled={!joiningCode || loadingAction === 'join'}>
              {loadingAction === 'join' ? 'Joining...' : 'Join room'}
            </button>
          </form>
        </article>

        <article className="panel history-panel">
          <span className="eyebrow">Recent Matches</span>
          <h2>Saved results</h2>
          <div className="history-table">
            {matches.length === 0 ? (
              <p className="muted-copy">No finished games yet. Start a match to populate history.</p>
            ) : (
              matches.map((match) => (
                <div className="history-row" key={match.id}>
                  <div>
                    <strong>{match.white_name} vs {match.black_name}</strong>
                    <small>{match.mode} • {match.reason}</small>
                  </div>
                  <span className={`result-pill result-${resultLabel(match, user.id).toLowerCase()}`}>{resultLabel(match, user.id)}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
