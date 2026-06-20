import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, RefreshCw, X, AlertCircle } from 'lucide-react';
import api from '../services/api.js';
import RecipeCard from '../components/RecipeCard.jsx';
import { RecipeGridSkeleton } from '../components/SkeletonLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Cuisines lists for selector dropdown
const cuisines = [
  "Italian", "Japanese", "Indian", "Mexican", "Chinese", "French", 
  "Thai", "Korean", "Ethiopian", "Moroccan", "Lebanese", "Greek", 
  "Spanish", "Brazilian", "Peruvian", "Nigerian", "Indonesian", 
  "Vietnamese", "Turkish", "Afghan", "Persian", "Central Asian", "Balkan"
];

const dietaryOptions = ["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Kosher", "Jain"];
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Drink"];
const difficulties = ["Easy", "Medium", "Hard", "Chef"];
const cookTimes = [
  { label: "Under 15 min", value: "under_15" },
  { label: "15–30 min", value: "15_30" },
  { label: "30–60 min", value: "30_60" },
  { label: "60+ min", value: "60_plus" }
];

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Search state
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [debouncedQ, setDebouncedQ] = useState(q);

  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get("cuisine") || "");
  const [selectedDietaries, setSelectedDietaries] = useState(() => {
    const urlDietary = searchParams.get("dietary");
    if (urlDietary) return urlDietary.split(",");
    if (user && user.dietaryPreferences && user.dietaryPreferences.length > 0) {
      return user.dietaryPreferences;
    }
    return [];
  });
  const [selectedMealType, setSelectedMealType] = useState(searchParams.get("mealType") || "");
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get("difficulty") || "");
  const [selectedCookTime, setSelectedCookTime] = useState(searchParams.get("cookTime") || "");
  
  // Allergen exclusions state
  const [allergenInput, setAllergenInput] = useState("");
  const [excludedIngredients, setExcludedIngredients] = useState(searchParams.get("exclude") ? searchParams.get("exclude").split(",") : []);
  
  // Sorting & pagination
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  
  // API responses
  const [recipes, setRecipes] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Helper to update URL parameters (hoisted function)
  function updateURLParams(newParams) {
    const updated = new URLSearchParams(searchParams);
    
    // Merge new parameters
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
        updated.delete(key);
      } else {
        updated.set(key, Array.isArray(val) ? val.join(",") : val);
      }
    });
    
    // Always reset page to 1 when changing search criteria
    if (!newParams.page) {
      updated.set("page", "1");
    }

    setSearchParams(updated);
  }

  // Debounce search query to prevent API spam on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
      const urlQ = searchParams.get("q") || "";
      if (q !== urlQ) {
        updateURLParams({ q });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [q, searchParams]);

  // Sync initial URL params if they change
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    setQ(urlQ);
    setDebouncedQ(urlQ);
    setSelectedCuisine(searchParams.get("cuisine") || "");
    
    const urlDietary = searchParams.get("dietary");
    if (urlDietary) {
      setSelectedDietaries(urlDietary.split(","));
    } else if (user && user.dietaryPreferences && user.dietaryPreferences.length > 0) {
      setSelectedDietaries(user.dietaryPreferences);
    } else {
      setSelectedDietaries([]);
    }

    setSelectedMealType(searchParams.get("mealType") || "");
    setSelectedDifficulty(searchParams.get("difficulty") || "");
    setSelectedCookTime(searchParams.get("cookTime") || "");
    setExcludedIngredients(searchParams.get("exclude") ? searchParams.get("exclude").split(",") : []);
    setSortBy(searchParams.get("sortBy") || "createdAt");
    setPage(parseInt(searchParams.get("page") || "1"));
  }, [searchParams, user]);

  // Fetch data on parameters update
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 12,
          sortBy,
          sortOrder: sortBy === 'createdAt' || sortBy === 'viewCount' ? 'desc' : 'asc'
        };

        if (debouncedQ) params.q = debouncedQ;
        if (selectedCuisine) params.cuisine = selectedCuisine;
        if (selectedMealType) params.mealType = selectedMealType;
        if (selectedDifficulty) params.difficulty = selectedDifficulty;
        if (selectedCookTime) params.cookTime = selectedCookTime;
        if (selectedDietaries.length > 0) params.dietary = selectedDietaries.join(",");
        if (excludedIngredients.length > 0) params.excludeIngredients = excludedIngredients.join(",");

        // Check region query (if continent clicked on WorldMap)
        const region = searchParams.get("region");
        let endpoint = '/recipes';
        if (debouncedQ) {
          endpoint = '/recipes/search';
        } else if (region) {
          endpoint = `/recipes/by-region/${encodeURIComponent(region)}`;
        }

        const res = await api.get(endpoint, { params });
        
        // Cuisines by-region endpoint returns a direct array, wrap it to match general response structure
        if (Array.isArray(res.data)) {
          setRecipes(res.data);
          setTotalRecipes(res.data.length);
          setTotalPages(1);
        } else {
          setRecipes(res.data.recipes || []);
          setTotalRecipes(res.data.meta?.total || 0);
          setTotalPages(res.data.meta?.totalPages || 1);
        }
      } catch (err) {
        console.error('Error querying recipes:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [debouncedQ, selectedCuisine, selectedDietaries, selectedMealType, selectedDifficulty, selectedCookTime, excludedIngredients, sortBy, page, searchParams]);

  const handleDietaryToggle = (item) => {
    const next = selectedDietaries.includes(item)
      ? selectedDietaries.filter(d => d !== item)
      : [...selectedDietaries, item];
    setSelectedDietaries(next);
    updateURLParams({ dietary: next });
  };

  const handleAddAllergen = (e) => {
    e.preventDefault();
    if (allergenInput.trim() && !excludedIngredients.includes(allergenInput.trim())) {
      const next = [...excludedIngredients, allergenInput.trim()];
      setExcludedIngredients(next);
      setAllergenInput("");
      updateURLParams({ exclude: next });
    }
  };

  const handleRemoveAllergen = (item) => {
    const next = excludedIngredients.filter(e => e !== item);
    setExcludedIngredients(next);
    updateURLParams({ exclude: next });
  };

  const handleResetFilters = () => {
    setQ("");
    setSelectedCuisine("");
    setSelectedDietaries([]);
    setSelectedMealType("");
    setSelectedDifficulty("");
    setSelectedCookTime("");
    setExcludedIngredients([]);
    setSortBy("createdAt");
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. SEARCH INPUT */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-cream-dark/20 dark:border-charcoal-light/10 pb-6">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search recipes, ingredients, cuisines..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateURLParams({ q })}
            className="w-full rounded-full border border-cream-dark/40 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-5 py-2.5 pl-11 text-sm text-charcoal focus:border-saffron focus:outline-none dark:text-cream-light shadow-sm"
          />
          <SearchIcon size={16} className="absolute left-4 top-3.5 text-gray-400" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              updateURLParams({ sortBy: e.target.value });
            }}
            className="rounded-full border border-cream-dark/40 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="createdAt">Newest Additions</option>
            <option value="viewCount">Most Viewed</option>
            <option value="saveCount">Most Saved</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex sm:hidden items-center gap-1.5 rounded-full bg-saffron px-4 py-2 text-xs font-bold text-white shadow"
          >
            <Filter size={14} /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 2. ADVANCED FILTERS SIDEBAR (DESKTOP) */}
        <aside className="hidden lg:block space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold uppercase tracking-wide text-saffron">Advanced Filters</h3>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-terracotta hover:underline"
            >
              <RefreshCw size={10} /> Reset
            </button>
          </div>

          <div className="space-y-5 rounded-2xl bg-cream-light/40 dark:bg-charcoal-light/25 border border-cream-dark/15 dark:border-charcoal-light/5 p-5">
            {/* Cuisine Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Cuisine / Country</label>
              <select
                value={selectedCuisine}
                onChange={(e) => {
                  setSelectedCuisine(e.target.value);
                  updateURLParams({ cuisine: e.target.value });
                }}
                className="w-full rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal p-2.5 text-xs focus:outline-none"
              >
                <option value="">All Cuisines</option>
                {cuisines.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Meal Type Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Meal Type</label>
              <select
                value={selectedMealType}
                onChange={(e) => {
                  setSelectedMealType(e.target.value);
                  updateURLParams({ mealType: e.target.value });
                }}
                className="w-full rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal p-2.5 text-xs focus:outline-none"
              >
                <option value="">All Meals</option>
                {mealTypes.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  updateURLParams({ difficulty: e.target.value });
                }}
                className="w-full rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal p-2.5 text-xs focus:outline-none"
              >
                <option value="">All Levels</option>
                {difficulties.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Cook Time Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Max Cook Time</label>
              <div className="flex flex-col gap-1.5">
                {cookTimes.map(c => (
                  <button
                    key={c.value}
                    onClick={() => {
                      const val = selectedCookTime === c.value ? "" : c.value;
                      setSelectedCookTime(val);
                      updateURLParams({ cookTime: val });
                    }}
                    className={`rounded-lg py-1.5 px-3 text-left text-xs font-medium border transition-colors ${
                      selectedCookTime === c.value
                        ? 'bg-saffron/10 border-saffron text-saffron'
                        : 'border-cream-dark/20 dark:border-charcoal/30 bg-cream-light dark:bg-charcoal hover:bg-cream'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Dietary Profile</label>
              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map(option => {
                  const active = selectedDietaries.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleDietaryToggle(option)}
                      className={`rounded-lg py-1.5 text-center text-xs font-bold border transition-colors ${
                        active 
                          ? 'bg-saffron text-white border-saffron shadow-sm' 
                          : 'border-cream-dark/20 dark:border-charcoal-light/20 bg-cream-light dark:bg-charcoal hover:bg-cream'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exclude Allergens Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Exclude Allergens</label>
              <form onSubmit={handleAddAllergen} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Peanut, Dairy..."
                  value={allergenInput}
                  onChange={(e) => setAllergenInput(e.target.value)}
                  className="flex-1 rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-3 py-1.5 text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-terracotta px-3 text-xs font-bold text-white shadow"
                >
                  +
                </button>
              </form>

              {/* Allergen Badges */}
              {excludedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {excludedIngredients.map(item => (
                    <span
                      key={item}
                      className="flex items-center gap-1 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400"
                    >
                      {item}
                      <button type="button" onClick={() => handleRemoveAllergen(item)}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </aside>

        {/* 3. RECIPES LIST GRID */}
        <main className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Found <span className="font-bold text-charcoal dark:text-cream-light">{totalRecipes}</span> recipes matching your filters
            </p>
          </div>

          {loading ? (
            <RecipeGridSkeleton count={8} />
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl bg-cream-light/30 dark:bg-charcoal-light/5 border border-dashed border-cream-dark/30 dark:border-charcoal-light/20">
              <AlertCircle size={40} className="text-gray-400" />
              <h3 className="text-xl font-bold">No Recipes Found</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                We couldn't find any recipes matching your query. Try resetting your search filters or searching for something else.
              </p>
              <button
                onClick={handleResetFilters}
                className="rounded-full bg-saffron px-6 py-2 text-xs font-bold text-white shadow"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Masonry Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => {
                      setPage(page - 1);
                      updateURLParams({ page: page - 1 });
                    }}
                    className="rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 px-3 py-1.5 text-xs font-bold hover:bg-cream disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => {
                      setPage(page + 1);
                      updateURLParams({ page: page + 1 });
                    }}
                    className="rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 px-3 py-1.5 text-xs font-bold hover:bg-cream disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>

      </div>

      {/* 4. MOBILE FILTERS DRAWER */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-80 h-full overflow-y-auto bg-cream-light dark:bg-charcoal p-6 space-y-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-cream-dark/20 dark:border-charcoal-light/10 pb-4">
              <h3 className="text-lg font-bold">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={20} />
              </button>
            </div>
            
            {/* Same filter sidebar form elements as desktop */}
            <div className="flex-1 space-y-5">
              {/* Cuisine */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cuisine</label>
                <select
                  value={selectedCuisine}
                  onChange={(e) => {
                    setSelectedCuisine(e.target.value);
                    updateURLParams({ cuisine: e.target.value });
                  }}
                  className="w-full rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal p-2 text-xs focus:outline-none"
                >
                  <option value="">All Cuisines</option>
                  {cuisines.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Meal Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Meal Type</label>
                <select
                  value={selectedMealType}
                  onChange={(e) => {
                    setSelectedMealType(e.target.value);
                    updateURLParams({ mealType: e.target.value });
                  }}
                  className="w-full rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal p-2 text-xs focus:outline-none"
                >
                  <option value="">All Meals</option>
                  {mealTypes.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    setSelectedDifficulty(e.target.value);
                    updateURLParams({ difficulty: e.target.value });
                  }}
                  className="w-full rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal p-2 text-xs focus:outline-none"
                >
                  <option value="">All Levels</option>
                  {difficulties.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Cook Time */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Max Cook Time</label>
                <div className="grid grid-cols-2 gap-2">
                  {cookTimes.map(c => (
                    <button
                      key={c.value}
                      onClick={() => {
                        const val = selectedCookTime === c.value ? "" : c.value;
                        setSelectedCookTime(val);
                        updateURLParams({ cookTime: val });
                      }}
                      className={`rounded-lg py-1.5 px-3 text-center text-xs font-medium border transition-colors ${
                        selectedCookTime === c.value
                          ? 'bg-saffron/10 border-saffron text-saffron'
                          : 'border-cream-dark/20 dark:border-charcoal/30 bg-cream-light dark:bg-charcoal hover:bg-cream'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diets */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Diets</label>
                <div className="grid grid-cols-2 gap-2">
                  {dietaryOptions.map(option => {
                    const active = selectedDietaries.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleDietaryToggle(option)}
                        className={`rounded-lg py-1.5 text-center text-xs font-bold border transition-colors ${
                          active 
                            ? 'bg-saffron text-white border-saffron shadow-sm' 
                            : 'border-cream-dark/20 dark:border-charcoal-light/20 bg-cream-light dark:bg-charcoal hover:bg-cream'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergens */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Allergen Exclusions</label>
                <form onSubmit={handleAddAllergen} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Nuts..."
                    value={allergenInput}
                    onChange={(e) => setAllergenInput(e.target.value)}
                    className="flex-1 rounded-lg border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-3 py-1 text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-terracotta px-3 text-xs font-bold text-white"
                  >
                    +
                  </button>
                </form>

                {excludedIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {excludedIngredients.map(item => (
                      <span
                        key={item}
                        className="flex items-center gap-1 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400"
                      >
                        {item}
                        <button type="button" onClick={() => handleRemoveAllergen(item)}>
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-cream-dark/20 dark:border-charcoal-light/10 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 rounded-full border border-cream-dark/40 py-2.5 text-xs font-bold hover:bg-cream text-center text-charcoal dark:border-charcoal-light/30"
              >
                Reset
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 rounded-full bg-saffron py-2.5 text-xs font-bold text-white text-center"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Search;
