import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fadeIn ${
              toast.type === 'success'
                ? 'bg-[#202020] text-white border border-[#333]'
                : 'bg-[#ff682c] text-white border border-[#e05620]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#ff682c] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white shrink-0" />
            )}
            <span className="font-inter text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
