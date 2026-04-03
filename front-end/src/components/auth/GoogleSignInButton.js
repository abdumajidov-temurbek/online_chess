import React, { useEffect, useRef } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve(window.google);
        return;
      }
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function GoogleSignInButton({ onCredential, disabled }) {
  const buttonRef = useRef(null);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      return undefined;
    }

    let active = true;

    loadGoogleScript()
      .then((google) => {
        if (!active || !google?.accounts?.id || !buttonRef.current) {
          return;
        }

        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential && !disabled) {
              onCredential(response.credential);
            }
          },
        });

        buttonRef.current.innerHTML = '';
        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 320,
        });
      })
      .catch(() => {
        if (buttonRef.current) {
          buttonRef.current.innerHTML = '<span class="google-inline-error">Google Sign-In unavailable</span>';
        }
      });

    return () => {
      active = false;
    };
  }, [clientId, disabled, onCredential]);

  if (!clientId) {
    return <div className="google-inline-error">Google Sign-In requires `REACT_APP_GOOGLE_CLIENT_ID`.</div>;
  }

  return <div className={`google-button-shell ${disabled ? 'google-button-shell-disabled' : ''}`} ref={buttonRef} />;
}
