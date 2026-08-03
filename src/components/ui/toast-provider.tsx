'use client';

import React from 'react';
import { ToastContainer, useToast } from './toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastWrapper />
    </>
  );
}

function ToastWrapper() {
  const { toasts, removeToast } = useToast();
  
  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}