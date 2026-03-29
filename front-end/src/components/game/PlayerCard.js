import React from 'react';

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PlayerCard({ label, name, rating, subtitle, active, accent }) {
  return (
    <div className={`player-card ${active ? 'player-card-active' : ''}`}>
      <div className={`player-avatar player-avatar-${accent}`}>{initials(name)}</div>
      <div className="player-meta">
        <span className="player-label">{label}</span>
        <strong>{name}</strong>
        <small>{subtitle}</small>
      </div>
      <div className="player-rating">{rating}</div>
    </div>
  );
}
