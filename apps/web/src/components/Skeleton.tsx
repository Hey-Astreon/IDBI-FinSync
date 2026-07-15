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

export const PageSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Title */}
      <Skeleton variant="text" className="w-1/4 h-8" />
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-sq-md border border-border-light bg-bg-surface p-6 flex flex-col gap-3"
          >
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-2/3 h-8" />
          </div>
        ))}
      </div>
      {/* Content */}
      <div className="rounded-sq-md border border-border-light bg-bg-surface p-6 flex flex-col gap-4">
        <Skeleton variant="text" className="w-1/4 h-6" />
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-32" />
      </div>
    </div>
  );
};

export const FullAppSkeleton: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-bg-base transition-colors duration-300 animate-pulse">
      {/* Mock Sidebar */}
      <div className="w-64 border-r border-border-light bg-bg-surface p-6 flex flex-col gap-8 shrink-0 hidden md:flex">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-8 h-8" />
          <Skeleton variant="text" className="w-1/2 h-5" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="circle" className="w-5 h-5" />
              <Skeleton variant="text" className="w-2/3 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mock TopNav */}
        <div className="h-16 border-b border-border-light bg-bg-surface px-8 flex items-center justify-between">
          <Skeleton variant="text" className="w-1/4 h-5" />
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="w-8 h-8" />
            <Skeleton variant="circle" className="w-8 h-8" />
          </div>
        </div>
        {/* Mock Main Content */}
        <div className="p-8 flex-grow overflow-y-auto">
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
};
