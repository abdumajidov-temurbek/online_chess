import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import AuthForm from '../components/AuthForm';
import AuthLayout from '../components/AuthLayout';
import GoogleSignInButton from '../components/GoogleSignInButton';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

export default function RegisterPage() {
  const history = useHistory();
  const { register, googleLogin } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', rememberMe: true });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      history.push('/app');
    } catch (error) {
      pushToast(error.response?.data?.error || 'Unable to create your account.', 'error');
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
      title="Create your workspace."
      subtitle="Private games, saved results, and a polished board experience start with a real user account."
      footer={
        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <AuthForm
        title="Create account"
        helper="Use email and password or bootstrap the account with Google."
        fields={[
          {
            name: 'name',
            label: 'Display name',
            inputProps: { name: 'name', type: 'text', value: form.name, onChange: handleChange, required: true },
          },
          {
            name: 'email',
            label: 'Email',
            inputProps: { name: 'email', type: 'email', value: form.email, onChange: handleChange, required: true },
          },
          {
            name: 'password',
            label: 'Password',
            inputProps: { name: 'password', type: 'password', minLength: 8, value: form.password, onChange: handleChange, required: true },
          },
        ]}
        onSubmit={handleSubmit}
        submitLabel="Create account"
        loading={loading}
        alternateAction={
          <label className="checkbox">
            <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
            <span>Keep me signed in on this device</span>
          </label>
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
