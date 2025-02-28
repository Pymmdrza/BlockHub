import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  borderRadius?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  height,
  width,
  borderRadius = '0.375rem',
  animate = true
}) => {
  const style: React.CSSProperties = {
    height,
    width,
    borderRadius
  };

  return (
    <div 
      className={`bg-gray-800/70 ${animate ? 'animate-pulse' : ''} ${className}`}
      style={style}
    />
  );
};

export const SkeletonText: React.FC<SkeletonProps & { lines?: number }> = ({
  className = '',
  height = '1rem',
  width = '100%',
  lines = 1,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={className} 
          height={height} 
          width={typeof width === 'string' ? width : (i === lines - 1 && lines > 1 ? `${Number(width) * 0.7}%` : width)}
          {...props} 
        />
      ))}
    </div>
  );
};