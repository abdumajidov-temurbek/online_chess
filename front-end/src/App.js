import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import GamePage from './pages/GamePage';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={LandingPage} />
        <Route path="/game/:gameId" exact component={GamePage} />
        <Redirect to="/" />
      </Switch>
    </Router>
  );
}
