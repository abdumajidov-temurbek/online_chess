import React, { useMemo, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';

import AuthForm from '../components/AuthForm';
import AuthLayout from '../components/AuthLayout';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

function useQuery() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

export default function ResetPasswordPage() {
  const history = useHistory();
  const query = useQuery();
  const token = query.get('token') || '';
  const { resetPassword } = useAuth();
  const { pushToast } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await resetPassword({ token, password });
      pushToast('Password updated. You can sign in now.', 'success');
      history.push('/login');
    } catch (error) {
      pushToast(error.response?.data?.error || 'Reset failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password."
      subtitle="Finalize the reset flow and get back to the board."
      footer={
        <p>
          Need a fresh link? <Link to="/forgot-password">Request another reset</Link>
        </p>
      }
    >
      <AuthForm
        title="Reset password"
        helper={token ? 'Choose a strong password with at least 8 characters.' : 'This reset link is missing a token.'}
        fields={[
          {
            name: 'password',
            label: 'New password',
            inputProps: {
              name: 'password',
              type: 'password',
              minLength: 8,
              value: password,
              onChange: (event) => setPassword(event.target.value),
              required: true,
              disabled: !token,
            },
          },
        ]}
        onSubmit={handleSubmit}
        submitLabel="Update password"
        loading={loading}
      />
    </AuthLayout>
  );
}
