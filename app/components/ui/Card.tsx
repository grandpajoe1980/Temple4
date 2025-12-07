import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

const Card: React.FC<CardProps> = ({ children, className, title, description }) => {
  return (
    <div className={`bg-card text-card-foreground overflow-hidden rounded-xl border border-border shadow-sm ${className ?? ''}`}>
      {title && (
        <div className="px-6 py-5 border-b border-border">
          <h3 className="text-lg font-semibold leading-6 text-foreground">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;
