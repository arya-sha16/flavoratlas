import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, onChange = null, maxStars = 5, size = 20, className = "" }) => {
  const [hoverRating, setHoverRating] = useState(null);

  const handleClick = (val) => {
    if (onChange) {
      onChange(val);
    }
  };

  const handleMouseEnter = (val) => {
    if (onChange) {
      setHoverRating(val);
    }
  };

  const handleMouseLeave = () => {
    if (onChange) {
      setHoverRating(null);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = hoverRating !== null 
          ? starValue <= hoverRating 
          : starValue <= rating;

        return (
          <button
            key={index}
            type="button"
            disabled={!onChange}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className={`${onChange ? 'cursor-pointer transition-transform hover:scale-110 active:scale-95' : 'cursor-default'}`}
          >
            <Star
              size={size}
              className={`${
                isFilled 
                  ? 'fill-saffron stroke-saffron text-saffron' 
                  : 'text-gray-300 dark:text-gray-600 stroke-2'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
