"use client"

import React, { useEffect, useRef } from 'react';
import useFocusTrap from '@/app/hooks/useFocusTrap';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  dataTest?: string;
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)]',
};

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  dataTest,
  size = 'md'
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // refs and hooks must be called unconditionally to satisfy React Hooks rules
  const modalRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(modalRef, isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 z-60 flex justify-center items-start overflow-y-auto p-2 sm:p-4 md:p-8"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      data-test={dataTest ? `${dataTest}-overlay` : undefined}
    >
      <div
        className={`bg-card text-card-foreground rounded-xl shadow-xl w-full ${sizeClasses[size]} overflow-hidden my-2 sm:my-4 md:my-8 animate-in fade-in-0 zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
        ref={modalRef}
        data-test={dataTest}
      >
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-border sticky top-0 bg-card z-70">
          <h2 id="modal-title" className="text-base sm:text-lg font-semibold text-foreground line-clamp-1 pr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        <div className="p-3 sm:p-4 md:p-6 max-h-[calc(100vh-10rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;