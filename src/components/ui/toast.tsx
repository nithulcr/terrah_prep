// ============================================
// TERRAH PREP - TOAST COMPONENT
// ============================================

'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const toastColors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const toastIconColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
};

export const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration ?? 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg',
        'transition-all duration-300 ease-in-out',
        toastColors[toast.type]
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', toastIconColors[toast.type])} />
      <div className="flex-1">
        <p className="font-semibold">{toast.title}</p>
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-2 rounded p-1 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...toast }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showSuccess = (title: string, message: string) => {
    addToast({ type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    addToast({ type: 'error', title, message });
  };

  const showInfo = (title: string, message: string) => {
    addToast({ type: 'info', title, message });
  };

  return {
    toasts,
    ToastContainer: () => <ToastContainer toasts={toasts} onClose={removeToast} />,
    showSuccess,
    showError,
    showInfo,
    removeToast,
  };
}
