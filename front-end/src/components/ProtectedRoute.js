import React from 'react';
import { Redirect, Route } from 'react-router-dom';

import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ component: Component, ...rest }) {
  const { user, loading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading) {
          return <div className="screen-center">Loading workspace...</div>;
        }

        if (!user) {
          return <Redirect to="/login" />;
        }

        return <Component {...props} />;
      }}
    />
  );
}
