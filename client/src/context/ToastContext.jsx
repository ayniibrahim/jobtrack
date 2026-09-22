import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Notification Deck */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-bounce-in pointer-events-auto bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2.5 transition-all duration-300 border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">
              {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'celebration'}
            </span>
            <span className="font-label-sm text-label-sm text-white font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
