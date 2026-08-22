import { useState, useEffect } from 'react';
import { OMDbRating } from '@/utils/omdbApi';

interface IMDbRatingDisplayProps {
  rating: OMDbRating | null;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showVotes?: boolean;
}

export const IMDbRatingDisplay = ({ 
  rating, 
  isLoading = false, 
  size = 'md',
  showVotes = false
}: IMDbRatingDisplayProps) => {
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-muted rounded ${
        size === 'sm' ? 'w-12 h-6' :
        size === 'md' ? 'w-16 h-8' :
        'w-20 h-10'
      }`} />
    );
  }

  if (!rating || rating.imdbRating === null) {
    return null;
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 7) return 'text-blue-500';
    if (rating >= 6) return 'text-yellow-500';
    if (rating >= 5) return 'text-orange-500';
    return 'text-red-500';
  };

  const sizeClasses = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-bold',
    lg: 'text-base font-bold'
  };

  const containerClasses = {
    sm: 'px-2 py-1',
    md: 'px-2.5 py-1.5',
    lg: 'px-3 py-2'
  };

  return (
    <div className={`flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded ${containerClasses[size]}`}>
      <span className={`${getRatingColor(rating.imdbRating)} ${sizeClasses[size]}`}>
        ★ {rating.imdbRating.toFixed(1)}
      </span>
      {showVotes && rating.imdbVotes && (
        <span className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'}`}>
          ({(rating.imdbVotes / 1000).toFixed(0)}k)
        </span>
      )}
    </div>
  );
};

export default IMDbRatingDisplay;
