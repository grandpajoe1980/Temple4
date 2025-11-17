
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

const Card: React.FC<CardProps> = ({ children, className, title, description }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
        {title && (
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">{title}</h3>
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
        )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
