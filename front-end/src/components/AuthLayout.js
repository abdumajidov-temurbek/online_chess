import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <Link to="/" className="brand-mark brand-mark-light">
          <span className="brand-mark-icon">C</span>
          <span>
            <strong>Castle</strong>
            <small>Tactical play, polished delivery</small>
          </span>
        </Link>
        <div className="auth-hero-copy">
          <span className="eyebrow">Modern Chess Workspace</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="hero-stats">
            <div>
              <strong>1500</strong>
              <span>Stockfish target</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Realtime rooms</span>
            </div>
            <div>
              <strong>History</strong>
              <span>Saved results</span>
            </div>
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}
