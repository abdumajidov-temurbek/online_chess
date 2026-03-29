import React from 'react';
import { Link, useHistory } from 'react-router-dom';

import useAuth from '../hooks/useAuth';

export default function AppShell({ title, eyebrow, actions, children }) {
  const { user, logout } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    await logout();
    history.push('/');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/app" className="brand-mark">
          <span className="brand-mark-icon">C</span>
          <span>
            <strong>Castle</strong>
            <small>Chess platform</small>
          </span>
        </Link>
        <div className="topbar-actions">
          {actions}
          {user && (
            <div className="topbar-user">
              <div>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
              <button type="button" className="ghost-button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="shell-content">
        <div className="page-intro">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
