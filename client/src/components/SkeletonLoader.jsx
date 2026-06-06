import React from 'react';

export const RecipeCardSkeleton = () => {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/10 dark:border-charcoal-light/5 shadow-sm">
      {/* Image Skeleton */}
      <div className="aspect-[4/3] w-full skeleton-loader" />
      
      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 w-16 rounded skeleton-loader" />
          <div className="h-4 w-12 rounded skeleton-loader" />
        </div>
        
        <div className="h-5 w-3/4 rounded skeleton-loader" />
        
        <div className="space-y-2">
          <div className="h-3 w-full rounded skeleton-loader" />
          <div className="h-3 w-5/6 rounded skeleton-loader" />
        </div>
        
        <div className="pt-3 border-t border-cream-dark/10 dark:border-charcoal/20 flex justify-between items-center mt-auto">
          <div className="h-3 w-10 rounded skeleton-loader" />
          <div className="h-3 w-16 rounded skeleton-loader" />
        </div>
      </div>
    </div>
  );
};

export const RecipeGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <RecipeCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const RecipeDetailSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero Banner */}
      <div className="h-[350px] md:h-[450px] w-full rounded-3xl skeleton-loader" />

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-20 rounded skeleton-loader" />
            <div className="h-10 w-2/3 rounded skeleton-loader" />
            <div className="h-4 w-1/3 rounded skeleton-loader" />
          </div>

          <div className="h-24 w-full rounded-2xl skeleton-loader" />

          {/* Ingredients list */}
          <div className="space-y-4">
            <div className="h-6 w-32 rounded skeleton-loader" />
            <div className="space-y-2">
              <div className="h-8 w-full rounded skeleton-loader" />
              <div className="h-8 w-full rounded skeleton-loader" />
              <div className="h-8 w-full rounded skeleton-loader" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="h-48 w-full rounded-2xl skeleton-loader" />
          <div className="h-64 w-full rounded-2xl skeleton-loader" />
        </div>
      </div>
    </div>
  );
};

export default RecipeCardSkeleton;
