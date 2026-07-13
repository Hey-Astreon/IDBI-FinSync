import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  let shapeClass = 'rounded-sq-sm';
  if (variant === 'circle') {
    shapeClass = 'rounded-full';
  } else if (variant === 'text') {
    shapeClass = 'h-4 w-3/4 rounded';
  }

  return <div className={`animate-pulse bg-text-muted/10 ${shapeClass} ${className}`} />;
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-sq-md border border-border-light bg-bg-surface p-6 flex flex-col gap-3"
          >
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-2/3 h-8" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        ))}
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-sq-md border border-border-light bg-bg-surface p-6 flex flex-col gap-4">
          <Skeleton variant="text" className="w-1/4 h-6" />
          <Skeleton className="w-full h-64" />
        </div>
        <div className="rounded-sq-md border border-border-light bg-bg-surface p-6 flex flex-col gap-4">
          <Skeleton variant="text" className="w-1/3 h-6" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center gap-3">
              <Skeleton variant="circle" className="w-10 h-10" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton variant="text" className="w-2/3" />
                <Skeleton variant="text" className="w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
