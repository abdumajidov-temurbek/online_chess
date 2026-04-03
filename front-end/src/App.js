import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import { useAuth } from './context/AuthContext';
import GamePage from './pages/GamePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  const { ready, canPlay } = useAuth();

  if (!ready) {
    return <div className="auth-shell"><div className="auth-card"><h1>Loading...</h1></div></div>;
  }

  return (
    <Router>
      <Switch>
        <PublicOnlyRoute path="/login" exact component={LoginPage} />
        <PublicOnlyRoute path="/register" exact component={RegisterPage} />
        <ProtectedRoute path="/" exact component={LandingPage} />
        <ProtectedRoute path="/game/:gameId" exact component={GamePage} />
        <Route render={() => <Redirect to={canPlay ? '/' : '/login'} />} />
      </Switch>
    </Router>
  );
}
