import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import AuthForm from '../components/AuthForm';
import AuthLayout from '../components/AuthLayout';
import GoogleSignInButton from '../components/GoogleSignInButton';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

export default function LoginPage() {
  const history = useHistory();
  const { login, googleLogin } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      history.push('/app');
    } catch (error) {
      pushToast(error.response?.data?.error || 'Unable to sign in right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    try {
      await googleLogin({ credential, rememberMe: form.rememberMe });
      history.push('/app');
    } catch (error) {
      pushToast(error.response?.data?.error || 'Google sign-in failed.', 'error');
    }
  };

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Step into a board that feels tighter, faster, and more intentional than the original project."
      footer={
        <p>
          New here? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      <AuthForm
        title="Sign in"
        helper="Use your account email and password, or continue with Google."
        fields={[
          {
            name: 'email',
            label: 'Email',
            inputProps: { name: 'email', type: 'email', value: form.email, onChange: handleChange, required: true },
          },
          {
            name: 'password',
            label: 'Password',
            inputProps: { name: 'password', type: 'password', value: form.password, onChange: handleChange, required: true },
          },
        ]}
        onSubmit={handleSubmit}
        submitLabel="Sign in"
        loading={loading}
        alternateAction={
          <div className="inline-actions">
            <label className="checkbox">
              <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-link">
              Forgot password?
            </Link>
          </div>
        }
      >
        <div className="divider">
          <span>or</span>
        </div>
        <GoogleSignInButton onCredential={handleGoogle} />
      </AuthForm>
    </AuthLayout>
  );
}
