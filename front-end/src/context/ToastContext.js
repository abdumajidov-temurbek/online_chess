import React, { createContext, useCallback, useMemo, useState } from 'react';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message, tone = 'info') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      pushToast,
      dismissToast,
    }),
    [pushToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className={`toast toast-${toast.tone}`}
            onClick={() => dismissToast(toast.id)}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
