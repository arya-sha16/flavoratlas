import foodApiService from '../services/foodApiService.js';

export async function searchGlobalDishes(req, res, next) {
  try {
    const { q, provider = 'mealdb' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    if (provider === 'spoonacular') {
      const result = await foodApiService.searchSpoonacular({ query: q, ...req.query });
      return res.json(result);
    }

    if (provider === 'edamam') {
      const result = await foodApiService.searchEdamam({ query: q, ...req.query });
      return res.json(result);
    }

    if (provider === 'openfoodfacts') {
      const result = await foodApiService.searchOpenFoodFacts(q);
      return res.json(result);
    }

    // Default: TheMealDB
    const result = await foodApiService.searchMealDB(q);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDishesByCountry(req, res, next) {
  try {
    const { country } = req.params;
    const dishes = await foodApiService.getMealDBByArea(country);
    res.json(dishes);
  } catch (err) {
    next(err);
  }
}

export async function getGlobalAreas(req, res, next) {
  try {
    const areas = await foodApiService.listMealDBAreas();
    res.json(areas);
  } catch (err) {
    next(err);
  }
}

export async function generateRecipeWithAI(req, res, next) {
  try {
    const { country, dishName } = req.body;
    if (!country) {
      return res.status(400).json({ error: 'Country name is required.' });
    }

    const recipe = await foodApiService.generateCulturalRecipe(country, dishName);
    res.json(recipe);
  } catch (err) {
    next(err);
  }
}
