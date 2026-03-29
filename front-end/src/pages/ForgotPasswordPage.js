import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import AuthForm from '../components/AuthForm';
import AuthLayout from '../components/AuthLayout';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { pushToast } = useToast();
  const [email, setEmail] = useState('');
  const [previewLink, setPreviewLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await forgotPassword({ email });
      setPreviewLink(response.data.resetUrl || '');
      pushToast('If the account exists, a reset link is ready.', 'success');
    } catch (error) {
      pushToast(error.response?.data?.error || 'Reset request failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recover access."
      subtitle="Request a reset link and set a fresh password without leaving the product flow."
      footer={
        <p>
          Back to <Link to="/login">sign in</Link>
        </p>
      }
    >
      <AuthForm
        title="Forgot password"
        helper="Enter the account email. In local development the reset link is shown below."
        fields={[
          {
            name: 'email',
            label: 'Email',
            inputProps: { name: 'email', type: 'email', value: email, onChange: (event) => setEmail(event.target.value), required: true },
          },
        ]}
        onSubmit={handleSubmit}
        submitLabel="Send reset link"
        loading={loading}
      >
        {previewLink ? (
          <div className="inline-banner">
            <span>Local preview:</span>
            <a href={previewLink}>{previewLink}</a>
          </div>
        ) : null}
      </AuthForm>
    </AuthLayout>
  );
}
