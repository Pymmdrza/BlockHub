import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  const variantClasses = {
    default: 'bg-gray-800 text-gray-300 border border-gray-700',
    success: 'badge-success',
    warning: 'badge-warning',
    info: 'badge-info',
    error: 'bg-red-900/20 text-red-400 border border-red-800/30'
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};