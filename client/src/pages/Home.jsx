import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, Award, Globe, ArrowRight } from 'lucide-react';
import api from '../services/api.js';
import WorldMap from '../components/WorldMap.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import { RecipeCardSkeleton } from '../components/SkeletonLoader.jsx';
import { getFlagEmoji } from '../utils/flags.js';

export const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingSpotlight, setLoadingSpotlight] = useState(true);
  
  const navigate = useNavigate();

  // Load Trending and Spotlight recipes
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const trendingRes = await api.get('/recipes/trending');
        setTrending(trendingRes.data.slice(0, 8));
      } catch (err) {
        console.error('Error fetching trending recipes:', err.message);
      } finally {
        setLoadingTrending(false);
      }

      try {
        const randomRes = await api.get('/recipes/random');
        setSpotlight(randomRes.data);
      } catch (err) {
        console.error('Error fetching spotlight recipe:', err.message);
      } finally {
        setLoadingSpotlight(false);
      }
    };

    loadHomeData();
  }, []);

  // Handle Autocomplete Suggestions (Fuzzy filtering based on typed titles)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        // Query backend search with page size 5 for quick suggestions
        const res = await api.get(`/recipes/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        setSuggestions(res.data.recipes || []);
      } catch (e) {
        console.error('Fuzzy search error:', e.message);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleContinentSelect = (region) => {
    navigate(`/search?region=${encodeURIComponent(region)}`);
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream to-cream-dark/50 dark:from-charcoal-dark dark:to-charcoal py-20 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Tagline & Search */}
          <div className="space-y-6 text-center lg:text-left z-10">
            <span className="inline-block rounded-full bg-saffron/10 border border-saffron/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-saffron">
              🌐 FlavorAtlas Culinary Finder
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-charcoal dark:text-cream-light leading-[1.1]">
              Discover Every <br />
              <span className="text-saffron">Flavor</span> on Earth
            </h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto lg:mx-0">
              Traverse continents, filter by dietary requirements, and access step-by-step video recipes from 195+ sovereign countries.
            </p>

            {/* Auto-complete Search bar */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center rounded-full bg-cream-light dark:bg-charcoal-light border border-cream-dark dark:border-charcoal/40 p-1.5 shadow-md">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search dishes, ingredients, or cuisines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full bg-transparent px-4 py-2.5 text-sm text-charcoal dark:text-cream-light focus:outline-none"
                  />
                  <Search className="absolute right-4 top-3 text-gray-400" size={18} />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-saffron px-6 py-2.5 text-sm font-bold text-white shadow hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  Explore
                </button>
              </div>

              {/* Autocomplete Dropdown List */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 z-30 rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal/40 p-2 shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/recipes/${item.id}`)}
                      className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm text-charcoal hover:bg-cream dark:text-cream-dark dark:hover:bg-charcoal"
                    >
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-[10px] uppercase font-bold text-saffron bg-saffron/10 px-2 py-0.5 rounded">
                        {item.cuisineType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Interactive World Map */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-md lg:max-w-lg">
              <WorldMap onSelectRegion={handleContinentSelect} />
            </div>
          </div>

        </div>
      </section>

      {/* 2. EXPLORE BY CONTINENT TILES */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="mb-8 text-center lg:text-left">
          <h2 className="text-3xl font-bold font-display text-charcoal dark:text-cream-light">
            Explore by Continent
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click a region card to navigate straight to typical cuisine recipes.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Asia", img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300" },
            { name: "Europe", img: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=300" },
            { name: "Africa", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300" },
            { name: "Americas", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300" },
            { name: "Middle East", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300" },
            { name: "Oceania", img: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=300" }
          ].map((region) => (
            <button
              key={region.name}
              onClick={() => handleContinentSelect(region.name)}
              className="group relative h-32 overflow-hidden rounded-2xl shadow-sm border border-cream-dark/10 dark:border-charcoal-light/10 text-left transition-transform hover:-translate-y-1"
            >
              <img 
                src={region.img} 
                alt={region.name} 
                className="h-full w-full object-cover brightness-[0.7] group-hover:brightness-50 transition-all duration-300"
              />
              <span className="absolute bottom-4 left-4 font-bold text-white text-base tracking-wide flex items-center gap-1 group-hover:text-saffron transition-colors">
                {region.name} <ArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. TRENDING RECIPES (HORIZONTAL SCROLL) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="text-terracotta fill-terracotta" size={24} />
            <h2 className="text-3xl font-bold font-display text-charcoal dark:text-cream-light">
              Trending Recipes
            </h2>
          </div>
          <button 
            onClick={() => navigate('/search?sortBy=viewCount')} 
            className="text-xs font-bold text-saffron hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loadingTrending ? (
          <div className="flex gap-6 overflow-x-hidden">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="w-[280px]">
                <RecipeCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="horizontal-scroll-carousel gap-6 pb-4 scrollbar-thin scrollbar-thumb-saffron">
            {trending.map((recipe) => (
              <div key={recipe.id} className="w-[285px] sm:w-[320px]">
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. CUISINE OF THE DAY SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4">
        {loadingSpotlight ? (
          <div className="h-64 rounded-3xl skeleton-loader" />
        ) : spotlight && (
          <div className="rounded-3xl bg-gradient-to-r from-saffron/10 to-terracotta/10 border border-saffron/15 dark:border-charcoal-light/10 p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Left Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-md border border-cream-dark/20 dark:border-charcoal/40">
              <img
                src={spotlight.coverImageUrl}
                alt={spotlight.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-charcoal/80 px-3 py-1 text-xs font-semibold text-white">
                {getFlagEmoji(spotlight.originCountry)} {spotlight.originCountry}
              </span>
            </div>

            {/* Right Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-saffron">
                <Award size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Cuisine Spotlight of the Day</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold font-display leading-tight text-charcoal dark:text-cream-light hover:text-saffron cursor-pointer" onClick={() => navigate(`/recipes/${spotlight.id}`)}>
                {spotlight.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {spotlight.description}
              </p>
              
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="text-saffron font-bold">Cuisine:</span> {spotlight.cuisineType}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-saffron font-bold">Servings:</span> {spotlight.servings} people
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-saffron font-bold">Difficulty:</span> {spotlight.difficulty}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate(`/recipes/${spotlight.id}`)}
                  className="rounded-full bg-saffron px-8 py-3 text-xs font-bold text-white shadow-sm hover:scale-[1.02] active:scale-95 transition-transform flex items-center gap-2"
                >
                  Start Cooking <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
