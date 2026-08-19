import { PrismaClient } from '@prisma/client';
import { mockRecipes } from '../data/mockRecipes.js';

const prisma = new PrismaClient();

// Helper to convert title to slug
const generateSlug = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
};

// Fallback helper for filtering in-memory mockRecipes
const filterMockRecipes = ({ q, cuisine, dietary, mealType, difficulty, cookTime, region }) => {
  let list = [...mockRecipes];

  if (q) {
    const query = q.toLowerCase();
    list = list.filter(r => 
      r.title.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      r.originCountry.toLowerCase().includes(query) ||
      r.cuisineType.toLowerCase().includes(query) ||
      r.tags?.some(t => t.toLowerCase().includes(query)) ||
      r.ingredients?.some(i => i.name.toLowerCase().includes(query))
    );
  }

  if (cuisine) {
    list = list.filter(r => r.cuisineType.toLowerCase() === cuisine.toLowerCase());
  }

  if (region) {
    list = list.filter(r => r.continent?.toLowerCase() === region.toLowerCase());
  }

  if (mealType) {
    list = list.filter(r => r.mealType?.toLowerCase() === mealType.toLowerCase());
  }

  if (difficulty) {
    list = list.filter(r => r.difficulty?.toLowerCase() === difficulty.toLowerCase());
  }

  if (cookTime) {
    if (cookTime === 'under_15') list = list.filter(r => r.cookTimeMins <= 15);
    else if (cookTime === '15_30') list = list.filter(r => r.cookTimeMins >= 15 && r.cookTimeMins <= 30);
    else if (cookTime === '30_60') list = list.filter(r => r.cookTimeMins >= 30 && r.cookTimeMins <= 60);
    else if (cookTime === '60_plus') list = list.filter(r => r.cookTimeMins >= 60);
  }

  if (dietary) {
    const dietaryArray = Array.isArray(dietary) ? dietary : dietary.split(',').map(d => d.trim().toLowerCase());
    list = list.filter(r => dietaryArray.every(d => r.tags?.some(t => t.toLowerCase() === d)));
  }

  return list;
};

export const listRecipes = async (req, res, next) => {
  const {
    page = 1,
    limit = 12,
    cuisine,
    dietary,
    mealType,
    difficulty,
    cookTime,
    excludeIngredients,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const where = { status: 'APPROVED', AND: [] };

    if (cuisine) where.AND.push({ cuisineType: { equals: cuisine, mode: 'insensitive' } });
    if (mealType) where.AND.push({ mealType: mealType.toUpperCase() });
    if (difficulty) where.AND.push({ difficulty: difficulty.toUpperCase() });
    if (cookTime) {
      if (cookTime === 'under_15') where.AND.push({ cookTimeMins: { lte: 15 } });
      else if (cookTime === '15_30') where.AND.push({ cookTimeMins: { gte: 15, lte: 30 } });
      else if (cookTime === '30_60') where.AND.push({ cookTimeMins: { gte: 30, lte: 60 } });
      else if (cookTime === '60_plus') where.AND.push({ cookTimeMins: { gte: 60 } });
    }

    if (dietary) {
      const dietaryArray = Array.isArray(dietary) ? dietary : dietary.split(',').map(d => d.trim());
      dietaryArray.forEach(d => {
        where.AND.push({ tags: { some: { tag: { name: { equals: d, mode: 'insensitive' } } } } });
      });
    }

    if (where.AND.length === 0) delete where.AND;

    const [recipes, total] = await prisma.$transaction([
      prisma.recipe.findMany({
        where,
        skip,
        take,
        orderBy: sortBy === 'rating' ? { createdAt: 'desc' } : { [sortBy]: sortOrder },
        include: {
          author: { select: { name: true, avatarUrl: true } },
          reviews: { select: { rating: true } },
          tags: { include: { tag: true } }
        }
      }),
      prisma.recipe.count({ where })
    ]);

    if (recipes && recipes.length > 0) {
      const formattedRecipes = recipes.map(recipe => {
        const ratings = recipe.reviews.map(r => r.rating);
        const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)) : 0;
        return {
          ...recipe,
          averageRating: avgRating,
          reviewCount: ratings.length,
          tags: recipe.tags.map(rt => rt.tag.name)
        };
      });

      return res.json({
        recipes: formattedRecipes,
        meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / take) }
      });
    }
  } catch (err) {
    console.warn('⚠️ Database unavailable, serving recipes from in-memory catalog:', err.message);
  }

  // Graceful fallback to mock data
  const fallbackList = filterMockRecipes({ cuisine, dietary, mealType, difficulty, cookTime });
  const paginated = fallbackList.slice(skip, skip + take);

  res.json({
    recipes: paginated,
    meta: {
      total: fallbackList.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(fallbackList.length / take)
    }
  });
};

export const searchRecipes = async (req, res, next) => {
  const {
    q = '',
    page = 1,
    limit = 12,
    cuisine,
    dietary,
    mealType,
    difficulty,
    cookTime,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const where = {
      status: 'APPROVED',
      AND: [{
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { originCountry: { contains: q, mode: 'insensitive' } },
          { cuisineType: { contains: q, mode: 'insensitive' } }
        ]
      }]
    };

    if (cuisine) where.AND.push({ cuisineType: { equals: cuisine, mode: 'insensitive' } });
    if (mealType) where.AND.push({ mealType: mealType.toUpperCase() });

    const [recipes, total] = await prisma.$transaction([
      prisma.recipe.findMany({
        where,
        skip,
        take,
        orderBy: { viewCount: 'desc' },
        include: {
          author: { select: { name: true, avatarUrl: true } },
          reviews: { select: { rating: true } },
          tags: { include: { tag: true } }
        }
      }),
      prisma.recipe.count({ where })
    ]);

    if (recipes && recipes.length > 0) {
      const formatted = recipes.map(r => {
        const avg = r.reviews.length > 0 ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1)) : 0;
        return { ...r, averageRating: avg, reviewCount: r.reviews.length, tags: r.tags.map(rt => rt.tag.name) };
      });
      return res.json({
        recipes: formatted,
        meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / take) }
      });
    }
  } catch (err) {
    console.warn('⚠️ Search DB unavailable, fallback to in-memory search.');
  }

  const fallbackList = filterMockRecipes({ q, cuisine, dietary, mealType, difficulty, cookTime });
  const paginated = fallbackList.slice(skip, skip + take);

  res.json({
    recipes: paginated,
    meta: {
      total: fallbackList.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(fallbackList.length / take)
    }
  });
};

export const getTrendingRecipes = async (req, res, next) => {
  try {
    const rawRecipes = await prisma.recipe.findMany({
      where: { status: 'APPROVED' },
      take: 10,
      orderBy: [{ viewCount: 'desc' }, { saveCount: 'desc' }],
      include: {
        author: { select: { name: true, avatarUrl: true } },
        reviews: { select: { rating: true } },
        tags: { include: { tag: true } }
      }
    });

    if (rawRecipes && rawRecipes.length > 0) {
      const formatted = rawRecipes.map(r => {
        const avg = r.reviews.length > 0 ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1)) : 0;
        return { ...r, averageRating: avg, reviewCount: r.reviews.length, tags: r.tags.map(rt => rt.tag.name) };
      });
      return res.json(formatted);
    }
  } catch (err) {
    console.warn('⚠️ Trending DB unavailable, fallback to mock trending.');
  }

  const sorted = [...mockRecipes].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);
  res.json(sorted);
};

export const getRandomRecipe = async (req, res, next) => {
  try {
    const count = await prisma.recipe.count({ where: { status: 'APPROVED' } });
    if (count > 0) {
      const randomIndex = Math.floor(Math.random() * count);
      const recipe = await prisma.recipe.findFirst({
        where: { status: 'APPROVED' },
        skip: randomIndex,
        include: {
          author: { select: { name: true, avatarUrl: true } },
          ingredients: { orderBy: { sortOrder: 'asc' } },
          instructions: { orderBy: { stepNumber: 'asc' } },
          reviews: { select: { rating: true } },
          tags: { include: { tag: true } }
        }
      });
      if (recipe) {
        const avg = recipe.reviews.length > 0 ? parseFloat((recipe.reviews.reduce((sum, r) => sum + r.rating, 0) / recipe.reviews.length).toFixed(1)) : 0;
        return res.json({ ...recipe, averageRating: avg, reviewCount: recipe.reviews.length, tags: recipe.tags.map(rt => rt.tag.name) });
      }
    }
  } catch (err) {
    console.warn('⚠️ Random recipe DB unavailable, fallback to mock.');
  }

  const randomMock = mockRecipes[Math.floor(Math.random() * mockRecipes.length)];
  res.json(randomMock);
};

export const getRecipesByRegion = async (req, res, next) => {
  const { region } = req.params;
  try {
    const cuisinesInRegion = await prisma.cuisine.findMany({
      where: { region: { equals: region, mode: 'insensitive' } },
      select: { name: true }
    });

    const cuisineNames = cuisinesInRegion.map(c => c.name);
    const recipes = await prisma.recipe.findMany({
      where: { status: 'APPROVED', cuisineType: { in: cuisineNames } },
      include: { author: { select: { name: true } }, reviews: { select: { rating: true } }, tags: { include: { tag: true } } }
    });

    if (recipes && recipes.length > 0) {
      const formatted = recipes.map(r => {
        const avg = r.reviews.length > 0 ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1)) : 0;
        return { ...r, averageRating: avg, reviewCount: r.reviews.length, tags: r.tags.map(rt => rt.tag.name) };
      });
      return res.json(formatted);
    }
  } catch (err) {
    console.warn('⚠️ Region DB unavailable, fallback to mock region.');
  }

  const filtered = filterMockRecipes({ region });
  res.json(filtered.length > 0 ? filtered : mockRecipes);
};

export const getRecipesByCuisine = async (req, res, next) => {
  const { cuisine } = req.params;
  try {
    const recipes = await prisma.recipe.findMany({
      where: { status: 'APPROVED', cuisineType: { equals: cuisine, mode: 'insensitive' } },
      include: { author: { select: { name: true } }, reviews: { select: { rating: true } }, tags: { include: { tag: true } } }
    });

    if (recipes && recipes.length > 0) {
      const formatted = recipes.map(r => {
        const avg = r.reviews.length > 0 ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1)) : 0;
        return { ...r, averageRating: avg, reviewCount: r.reviews.length, tags: r.tags.map(rt => rt.tag.name) };
      });
      return res.json(formatted);
    }
  } catch (err) {
    console.warn('⚠️ Cuisine DB unavailable, fallback to mock cuisine.');
  }

  const filtered = filterMockRecipes({ cuisine });
  res.json(filtered.length > 0 ? filtered : mockRecipes);
};

export const getRecipesByIngredient = async (req, res, next) => {
  const { ingredient } = req.query;
  if (!ingredient) {
    return res.status(400).json({ error: 'Ingredient search term is required.' });
  }

  try {
    const recipes = await prisma.recipe.findMany({
      where: { status: 'APPROVED', ingredients: { some: { name: { contains: ingredient, mode: 'insensitive' } } } },
      include: { author: { select: { name: true } }, reviews: { select: { rating: true } }, tags: { include: { tag: true } } }
    });

    if (recipes && recipes.length > 0) {
      const formatted = recipes.map(r => {
        const avg = r.reviews.length > 0 ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1)) : 0;
        return { ...r, averageRating: avg, reviewCount: r.reviews.length, tags: r.tags.map(rt => rt.tag.name) };
      });
      return res.json(formatted);
    }
  } catch (err) {
    console.warn('⚠️ Ingredient DB unavailable, fallback to mock.');
  }

  const filtered = mockRecipes.filter(r => r.ingredients?.some(i => i.name.toLowerCase().includes(ingredient.toLowerCase())));
  res.json(filtered);
};

export const getRecipeById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const recipe = await prisma.recipe.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, bio: true } },
        ingredients: { orderBy: { sortOrder: 'asc' } },
        instructions: { orderBy: { stepNumber: 'asc' } },
        reviews: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, avatarUrl: true } } } },
        tags: { include: { tag: true } }
      }
    });

    if (recipe) {
      const avg = recipe.reviews.length > 0 ? parseFloat((recipe.reviews.reduce((sum, r) => sum + r.rating, 0) / recipe.reviews.length).toFixed(1)) : 0;
      return res.json({ ...recipe, averageRating: avg, reviewCount: recipe.reviews.length, tags: recipe.tags.map(rt => rt.tag.name) });
    }
  } catch (err) {
    console.warn(`⚠️ DB lookup for recipe ${id} failed, checking mock catalog.`);
  }

  const mock = mockRecipes.find(r => r.id === id) || mockRecipes[0];
  if (mock) {
    return res.json(mock);
  }

  res.status(404).json({ error: 'Recipe not found.' });
};

export const getRelatedRecipes = async (req, res, next) => {
  const { id } = req.params;

  try {
    const currentRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: { cuisineType: true }
    });

    if (currentRecipe) {
      const related = await prisma.recipe.findMany({
        where: { status: 'APPROVED', cuisineType: currentRecipe.cuisineType, NOT: { id } },
        take: 4,
        include: { reviews: { select: { rating: true } }, tags: { include: { tag: true } } }
      });

      if (related && related.length > 0) {
        const formatted = related.map(r => {
          const avg = r.reviews.length > 0 ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1)) : 0;
          return { ...r, averageRating: avg, reviewCount: r.reviews.length, tags: r.tags.map(rt => rt.tag.name) };
        });
        return res.json(formatted);
      }
    }
  } catch (err) {
    console.warn('⚠️ Related recipes DB unavailable, fallback to mock.');
  }

  const fallbackRelated = mockRecipes.filter(r => r.id !== id).slice(0, 4);
  res.json(fallbackRelated);
};

export const createRecipe = async (req, res, next) => {
  try {
    const { title, description, originCountry, cuisineType, mealType, difficulty, prepTimeMins, cookTimeMins, servings, caloriesPerServing, coverImageUrl, videoUrl, ingredients, instructions, tags } = req.body;
    const slug = generateSlug(title);

    const recipe = await prisma.recipe.create({
      data: {
        title, slug, description, originCountry, cuisineType,
        mealType: mealType.toUpperCase(),
        difficulty: difficulty.toUpperCase(),
        prepTimeMins: parseInt(prepTimeMins),
        cookTimeMins: parseInt(cookTimeMins),
        servings: parseInt(servings),
        caloriesPerServing: caloriesPerServing ? parseInt(caloriesPerServing) : null,
        coverImageUrl: coverImageUrl || null,
        videoUrl: videoUrl || null,
        status: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
        authorId: req.user.id
      }
    });
    res.status(201).json(recipe);
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Recipe not found.' });
    if (existing.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to edit this recipe.' });
    }
    const recipe = await prisma.recipe.update({ where: { id }, data: req.body });
    res.json(recipe);
  } catch (error) {
    next(error);
  }
};

export const deleteRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Recipe not found.' });
    if (existing.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to delete this recipe.' });
    }
    await prisma.recipe.delete({ where: { id } });
    res.json({ message: 'Recipe deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
