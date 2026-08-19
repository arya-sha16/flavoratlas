import axios from 'axios';
import cacheService from './redisService.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const THEMEALDB_API_KEY = process.env.THEMEALDB_API_KEY || '1';
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || '';
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID || '';
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const foodApiService = {
  // ==========================================
  // 1. THEMEALDB (Global cuisines & recipes)
  // ==========================================

  /**
   * Search recipes by query/name in TheMealDB
   */
  async searchMealDB(query) {
    const cacheKey = `mealdb_search:${query.toLowerCase().trim()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/search.php?s=${encodeURIComponent(query)}`;
      const res = await axios.get(url);
      const meals = res.data?.meals || [];
      await cacheService.set(cacheKey, meals, 3600); // cache 1 hour
      return meals;
    } catch (err) {
      console.error('MealDB search error:', err.message);
      return [];
    }
  },

  /**
   * Filter recipes by country/area in TheMealDB (e.g. Italian, Mexican, Indian, Japanese, Moroccan, Canadian, etc.)
   */
  async getMealDBByArea(area) {
    const cacheKey = `mealdb_area:${area.toLowerCase().trim()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/filter.php?a=${encodeURIComponent(area)}`;
      const res = await axios.get(url);
      const meals = res.data?.meals || [];
      await cacheService.set(cacheKey, meals, 3600);
      return meals;
    } catch (err) {
      console.error('MealDB area error:', err.message);
      return [];
    }
  },

  /**
   * Get single recipe details from TheMealDB by ID
   */
  async getMealDBById(id) {
    const cacheKey = `mealdb_id:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/lookup.php?i=${encodeURIComponent(id)}`;
      const res = await axios.get(url);
      const meal = res.data?.meals?.[0] || null;
      if (meal) {
        await cacheService.set(cacheKey, meal, 86400);
      }
      return meal;
    } catch (err) {
      console.error('MealDB lookup error:', err.message);
      return null;
    }
  },

  /**
   * List all available country areas in TheMealDB
   */
  async listMealDBAreas() {
    const cacheKey = 'mealdb_list_areas';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}/list.php?a=list`;
      const res = await axios.get(url);
      const areas = res.data?.meals?.map(m => m.strArea) || [];
      await cacheService.set(cacheKey, areas, 86400 * 7); // cache 1 week
      return areas;
    } catch (err) {
      console.error('MealDB list areas error:', err.message);
      return [];
    }
  },

  // ==========================================
  // 2. SPOONACULAR (Complex cuisine search & nutrition)
  // ==========================================

  /**
   * Search international recipes using Spoonacular
   * @param {Object} options - { query, cuisine, diet, intolerances, number }
   */
  async searchSpoonacular({ query = '', cuisine = '', diet = '', intolerances = '', number = 10 }) {
    if (!SPOONACULAR_API_KEY) {
      console.warn('⚠️ Spoonacular API key not configured in .env');
      return { error: 'SPOONACULAR_API_KEY is not set in .env' };
    }

    const cacheKey = `spoonacular:${query}:${cuisine}:${diet}:${intolerances}:${number}`.toLowerCase();
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          query,
          cuisine,
          diet,
          intolerances,
          number,
          addRecipeInformation: true,
          fillIngredients: true
        }
      });
      const data = res.data;
      await cacheService.set(cacheKey, data, 3600);
      return data;
    } catch (err) {
      console.error('Spoonacular API error:', err.response?.data?.message || err.message);
      return { error: err.response?.data?.message || err.message };
    }
  },

  // ==========================================
  // 3. EDAMAM (Recipe & Diet analysis)
  // ==========================================

  /**
   * Search recipes using Edamam
   * @param {Object} options - { query, cuisineType, mealType, health }
   */
  async searchEdamam({ query, cuisineType, mealType, health }) {
    if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
      console.warn('⚠️ Edamam API credentials not configured in .env');
      return { error: 'EDAMAM_APP_ID or EDAMAM_APP_KEY is not set in .env' };
    }

    const cacheKey = `edamam:${query}:${cuisineType || ''}:${mealType || ''}`.toLowerCase();
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get('https://api.edamam.com/api/recipes/v2', {
        params: {
          type: 'public',
          q: query,
          app_id: EDAMAM_APP_ID,
          app_key: EDAMAM_APP_KEY,
          cuisineType,
          mealType,
          health
        }
      });
      const data = res.data;
      await cacheService.set(cacheKey, data, 3600);
      return data;
    } catch (err) {
      console.error('Edamam API error:', err.response?.data?.message || err.message);
      return { error: err.response?.data?.message || err.message };
    }
  },

  // ==========================================
  // 4. OPEN FOOD FACTS (Global ingredient/product search)
  // ==========================================

  /**
   * Search global ingredient/packaged food details (100% free open API)
   */
  async searchOpenFoodFacts(query) {
    const cacheKey = `openfoodfacts:${query.toLowerCase().trim()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
        params: {
          search_terms: query,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: 10
        }
      });
      const products = res.data?.products || [];
      await cacheService.set(cacheKey, products, 86400);
      return products;
    } catch (err) {
      console.error('OpenFoodFacts error:', err.message);
      return [];
    }
  },

  // ==========================================
  // 5. GOOGLE GEMINI AI (Cultural recipe generation)
  // ==========================================

  /**
   * Generate authentic cultural recipe for any country or rare dish
   */
  async generateCulturalRecipe(country, dishName = '') {
    if (!GEMINI_API_KEY) {
      return { error: 'GEMINI_API_KEY is not set in .env' };
    }

    const cacheKey = `gemini_recipe:${country.toLowerCase()}:${dishName.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const prompt = `You are a world culinary historian and master chef.
Provide an authentic traditional recipe from ${country} ${dishName ? `for ${dishName}` : ''}.
Return strictly valid JSON with this format:
{
  "title": "Dish Name",
  "nativeName": "Original Language Name",
  "country": "${country}",
  "cuisine": "Cuisine region",
  "description": "Short culinary history & cultural significance",
  "prepTime": 20,
  "cookTime": 45,
  "servings": 4,
  "difficulty": "Medium",
  "calories": 450,
  "ingredients": ["item 1", "item 2"],
  "instructions": ["Step 1", "Step 2"],
  "dietaryTags": ["Vegan", "Gluten-Free"],
  "funFact": "Interesting cultural background"
}`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }
      );

      const rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);
      await cacheService.set(cacheKey, parsed, 86400 * 30); // cache 30 days
      return parsed;
    } catch (err) {
      console.error('Gemini Recipe Generation error:', err.response?.data || err.message);
      return { error: err.response?.data?.error?.message || err.message };
    }
  }
};

export default foodApiService;
