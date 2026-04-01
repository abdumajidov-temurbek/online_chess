import React from 'react';

function groupMoves(moves) {
  const rows = [];
  for (let index = 0; index < moves.length; index += 2) {
    rows.push({
      moveNumber: index / 2 + 1,
      white: moves[index] || null,
      black: moves[index + 1] || null,
    });
  }
  return rows;
}

export default function BotSidebar({
  botName,
  difficultyLabel,
  difficultyElo,
  openingName,
  statusText,
  moves,
  lastMoveUci,
  onRestart,
  onResign,
  onNewGame,
  busy,
  finished,
}) {
  const rows = groupMoves(moves);
  const avatarLabel = (botName || 'BOT')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .slice(0, 3)
    .toUpperCase();

  return (
    <aside className="bot-sidebar">
      <section className="sidebar-panel sidebar-hero">
        <span className="sidebar-eyebrow">Play Bots</span>
        <div className="bot-profile">
          <div className="bot-avatar">{avatarLabel}</div>
          <div>
            <h2>{botName}</h2>
            <p>{difficultyLabel ? `${difficultyLabel} level powered by ${botName}.` : 'Local chess bot.'}</p>
          </div>
        </div>
      </section>

      <section className="sidebar-panel sidebar-status">
        <div className="status-block">
          <span className="sidebar-label">Difficulty</span>
          <strong>{difficultyLabel ? `${difficultyLabel} · ${difficultyElo} Elo` : 'Local bot'}</strong>
        </div>
        <div className="status-block">
          <span className="sidebar-label">Opening</span>
          <strong>{openingName}</strong>
        </div>
        <div className="status-block">
          <span className="sidebar-label">Status</span>
          <strong>{statusText}</strong>
        </div>
      </section>

      <section className="sidebar-panel move-panel">
        <div className="move-panel-head">
          <span className="sidebar-eyebrow">Moves</span>
          <small>{moves.length} ply</small>
        </div>
        <div className="move-table">
          <div className="move-table-head">
            <span>#</span>
            <span>White</span>
            <span>Black</span>
          </div>
          <div className="move-table-body">
            {rows.length ? (
              rows.map((row) => (
                <div className="move-table-row" key={row.moveNumber}>
                  <span>{row.moveNumber}</span>
                  <strong className={row.white?.uci === lastMoveUci ? 'move-active' : ''}>{row.white?.san || ''}</strong>
                  <strong className={row.black?.uci === lastMoveUci ? 'move-active' : ''}>{row.black?.san || ''}</strong>
                </div>
              ))
            ) : (
              <p className="empty-moves">Moves appear here as soon as the game starts.</p>
            )}
          </div>
        </div>
      </section>

      <section className="sidebar-panel control-panel">
        <button type="button" className="control-button control-button-primary" onClick={onRestart} disabled={busy}>
          Restart
        </button>
        <button type="button" className="control-button" onClick={onNewGame}>
          New Game
        </button>
        <button type="button" className="control-button control-button-danger" onClick={onResign} disabled={busy || finished}>
          Resign
        </button>
      </section>
    </aside>
  );
}
