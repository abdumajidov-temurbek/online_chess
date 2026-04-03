import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const history = useHistory();
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register({ name, email, password });
      history.replace('/');
    } catch (requestError) {
      const payload = requestError.response?.data || {};
      setError(payload.email?.[0] || payload.password?.[0] || payload.detail || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setLoading(true);
    setError('');

    try {
      await loginWithGoogle(credential);
      history.replace('/');
    } catch (requestError) {
      setError(requestError.response?.data?.credential?.[0] || requestError.response?.data?.detail || 'Google login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-badge">C</span>
          <div>
            <strong>Castle Solo</strong>
            <small>Create your account</small>
          </div>
        </div>
        <div className="auth-copy">
          <span className="eyebrow">Register</span>
          <h1>Start playing with your own account.</h1>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Temur" />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required />
          </label>
          {error ? <p className="error-copy">{error}</p> : null}
          <button type="submit" className="primary-button auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <GoogleSignInButton onCredential={handleGoogle} disabled={loading} />
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
