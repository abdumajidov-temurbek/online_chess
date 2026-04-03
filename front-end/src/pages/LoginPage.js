import React, { useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';

import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const history = useHistory();
  const location = useLocation();
  const { enterGuestMode, login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nextPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      history.replace(nextPath);
    } catch (requestError) {
      setError(requestError.response?.data?.non_field_errors?.[0] || requestError.response?.data?.detail || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setLoading(true);
    setError('');

    try {
      await loginWithGoogle(credential);
      history.replace(nextPath);
    } catch (requestError) {
      setError(requestError.response?.data?.credential?.[0] || requestError.response?.data?.detail || 'Google login failed.');
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    enterGuestMode();
    history.replace({ pathname: '/', state: { openPlayDialog: true } });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-badge">C</span>
          <div>
            <strong>Castle Solo</strong>
            <small>Sign in to play</small>
          </div>
        </div>
        <div className="auth-copy">
          <span className="eyebrow">Login</span>
          <h1>Continue to your chess board.</h1>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required />
          </label>
          {error ? <p className="error-copy">{error}</p> : null}
          <button type="submit" className="primary-button auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <GoogleSignInButton onCredential={handleGoogle} disabled={loading} />
        <button type="button" className="ghost-button auth-submit" onClick={handleGuestMode} disabled={loading}>
          Play as Guest
        </button>
        <p className="auth-footer">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
