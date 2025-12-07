import React from 'react';
import Link from 'next/link';
import Button from './Button';

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

/**
 * Standardized empty state component for consistent UX across the app.
 * Use when a list/grid/section has no content to display.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  const renderAction = (actionConfig: EmptyStateAction, variant: 'primary' | 'secondary') => {
    if (actionConfig.href) {
      return (
        <Link href={actionConfig.href}>
          <Button variant={variant}>{actionConfig.label}</Button>
        </Link>
      );
    }
    return (
      <Button variant={variant} onClick={actionConfig.onClick}>
        {actionConfig.label}
      </Button>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && renderAction(action, 'primary')}
          {secondaryAction && renderAction(secondaryAction, 'secondary')}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
