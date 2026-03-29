import React, { useEffect, useRef } from 'react';

const GOOGLE_SCRIPT_ID = 'google-identity-script';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let active = true;
    if (!clientId) {
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (!active || !window.google || !buttonRef.current) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => onCredential(credential),
        });
        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          shape: 'pill',
          size: 'large',
          width: 320,
          text: 'continue_with',
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [clientId, onCredential]);

  if (!clientId) {
    return <p className="muted-copy">Google sign-in appears when `REACT_APP_GOOGLE_CLIENT_ID` is configured.</p>;
  }

  return <div ref={buttonRef} className="google-button-slot" />;
}
