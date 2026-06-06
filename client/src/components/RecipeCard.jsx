import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BarChart, Bookmark, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from './StarRating.jsx';
import { getFlagEmoji } from '../utils/flags.js';

export const RecipeCard = ({ recipe }) => {
  const { savedRecipeIds, toggleSaveRecipe } = useAuth();
  
  const isSaved = savedRecipeIds.includes(recipe.id);
  const flag = getFlagEmoji(recipe.originCountry);

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaveRecipe(recipe.id);
  };

  // Map difficulty levels to color badges
  const difficultyBadge = (diff) => {
    switch (diff) {
      case 'EASY':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'HARD':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'CHEF':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const totalTime = recipe.prepTimeMins + recipe.cookTimeMins;

  return (
    <Link 
      to={`/recipes/${recipe.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Recipe Image & Overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img 
          src={recipe.coverImageUrl} 
          alt={recipe.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Bookmark/Save button */}
        <button
          onClick={handleSave}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream-light/90 dark:bg-charcoal-light/90 text-charcoal shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95"
          title={isSaved ? "Remove from Cookbooks" : "Save to Cookbook"}
        >
          <Bookmark 
            size={18} 
            className={`transition-colors ${isSaved ? 'fill-terracotta text-terracotta' : 'text-charcoal-light dark:text-cream-dark'}`} 
          />
        </button>

        {/* Origin Country Banner */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-charcoal/70 px-2.5 py-1 text-xs font-medium text-cream-light backdrop-blur-sm">
          <span>{flag}</span>
          <span>{recipe.originCountry}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Cuisine & Difficulty */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-saffron">
            {recipe.cuisineType}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${difficultyBadge(recipe.difficulty)}`}>
            {recipe.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-1 text-lg font-bold leading-snug line-clamp-1 group-hover:text-saffron transition-colors">
          {recipe.title}
        </h3>

        {/* Description */}
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {recipe.description}
        </p>

        {/* Footer Metrics */}
        <div className="mt-auto pt-3 border-t border-cream-dark/20 dark:border-charcoal/30 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-saffron" />
            <span>{totalTime}m</span>
          </div>

          <div className="flex items-center gap-1">
            <StarRating rating={recipe.averageRating} size={13} />
            <span className="font-semibold text-charcoal dark:text-cream-light ml-0.5">
              {recipe.averageRating > 0 ? recipe.averageRating : 'New'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
