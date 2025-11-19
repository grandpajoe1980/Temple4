
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

const Card: React.FC<CardProps> = ({ children, className, title, description }) => {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden backdrop-blur-sm ${className ?? ''}`}>
      {title && (
        <div className="p-6 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <h3 className="text-lg font-semibold leading-6 text-slate-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
      )}
      <div className="p-6 bg-white">
        {children}
      </div>
    </div>
  );
};

export default Card;
