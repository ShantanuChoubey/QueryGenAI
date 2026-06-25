import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

/**
 * Provides toast notifications context down the React tree.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast floating notifications portal container */}
      <div 
        className="fixed top-6 right-6 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none"
        aria-live="assertive"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center space-x-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl pointer-events-auto transition-all duration-300 transform translate-y-0 animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/20 text-rose-300'
            }`}
            role="alert"
          >
            {toast.type === 'success' ? (
              <svg className="h-5 w-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
