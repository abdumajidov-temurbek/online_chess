import React from 'react';
import { Redirect, Route } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

export default function PublicOnlyRoute({ component: Component, ...rest }) {
  const { canPlay } = useAuth();

  return (
    <Route
      {...rest}
      render={(routeProps) => (!canPlay ? <Component {...routeProps} /> : <Redirect to="/" />)}
    />
  );
}
