import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to convert title to slug
const generateSlug = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
};

export const listRecipes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      cuisine,
      dietary, // Comma-separated string or array
      mealType,
      difficulty,
      cookTime, // under_15, 15_30, 30_60, 60_plus
      excludeIngredients, // Comma-separated string or array of allergens
      sortBy = 'createdAt', // createdAt, viewCount, saveCount, rating
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build query conditions
    const where = {
      status: 'APPROVED',
      AND: []
    };

    // Filter by Cuisine
    if (cuisine) {
      where.AND.push({ cuisineType: { equals: cuisine, mode: 'insensitive' } });
    }

    // Filter by Meal Type
    if (mealType) {
      where.AND.push({ mealType: mealType.toUpperCase() });
    }

    // Filter by Difficulty
    if (difficulty) {
      where.AND.push({ difficulty: difficulty.toUpperCase() });
    }

    // Filter by Cook Time
    if (cookTime) {
      if (cookTime === 'under_15') {
        where.AND.push({ cookTimeMins: { lte: 15 } });
      } else if (cookTime === '15_30') {
        where.AND.push({ cookTimeMins: { gte: 15, lte: 30 } });
      } else if (cookTime === '30_60') {
        where.AND.push({ cookTimeMins: { gte: 30, lte: 60 } });
      } else if (cookTime === '60_plus') {
        where.AND.push({ cookTimeMins: { gte: 60 } });
      }
    }

    // Filter by Dietary Tags (Vegan, Vegetarian, etc.) - Match ALL selected tags (AND relation)
    if (dietary) {
      const dietaryArray = Array.isArray(dietary) 
        ? dietary 
        : dietary.split(',').map(d => d.trim());
      
      dietaryArray.forEach(d => {
        where.AND.push({
          tags: {
            some: {
              tag: {
                name: { equals: d, mode: 'insensitive' }
              }
            }
          }
        });
      });
    }

    // Exclude Allergens / Ingredients
    if (excludeIngredients) {
      const excludeArray = Array.isArray(excludeIngredients)
        ? excludeIngredients
        : excludeIngredients.split(',').map(i => i.trim());

      if (excludeArray.length > 0) {
        where.AND.push({
          ingredients: {
            none: {
              name: { in: excludeArray, mode: 'insensitive' }
            }
          }
        });
      }
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Sorting definition
    let orderBy = {};
    if (sortBy === 'rating') {
      // Handled separately or default to createdAt in query, rating is average
      orderBy = { createdAt: 'desc' };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Fetch recipes
    const [recipes, total] = await prisma.$transaction([
      prisma.recipe.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          author: {
            select: { name: true, avatarUrl: true }
          },
          reviews: {
            select: { rating: true }
          },
          tags: {
            include: { tag: true }
          }
        }
      }),
      prisma.recipe.count({ where })
    ]);

    // Format recipes with average rating
    const formattedRecipes = recipes.map(recipe => {
      const ratings = recipe.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 
        ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1))
        : 0;

      return {
        ...recipe,
        averageRating: avgRating,
        reviewCount: ratings.length,
        tags: recipe.tags.map(rt => rt.tag.name)
      };
    });

    // If sorting by rating, sort in JS memory
    if (sortBy === 'rating') {
      formattedRecipes.sort((a, b) => {
        return sortOrder === 'desc' 
          ? b.averageRating - a.averageRating 
          : a.averageRating - b.averageRating;
      });
    }

    res.json({
      recipes: formattedRecipes,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const searchRecipes = async (req, res, next) => {
  try {
    const {
      q = '',
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

    const where = {
      status: 'APPROVED',
      AND: [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { originCountry: { contains: q, mode: 'insensitive' } },
            { cuisineType: { contains: q, mode: 'insensitive' } },
            {
              tags: {
                some: {
                  tag: {
                    name: { contains: q, mode: 'insensitive' }
                  }
                }
              }
            },
            {
              ingredients: {
                some: {
                  name: { contains: q, mode: 'insensitive' }
                }
              }
            }
          ]
        }
      ]
    };

    // Filter by Cuisine
    if (cuisine) {
      where.AND.push({ cuisineType: { equals: cuisine, mode: 'insensitive' } });
    }

    // Filter by Meal Type
    if (mealType) {
      where.AND.push({ mealType: mealType.toUpperCase() });
    }

    // Filter by Difficulty
    if (difficulty) {
      where.AND.push({ difficulty: difficulty.toUpperCase() });
    }

    // Filter by Cook Time
    if (cookTime) {
      if (cookTime === 'under_15') {
        where.AND.push({ cookTimeMins: { lte: 15 } });
      } else if (cookTime === '15_30') {
        where.AND.push({ cookTimeMins: { gte: 15, lte: 30 } });
      } else if (cookTime === '30_60') {
        where.AND.push({ cookTimeMins: { gte: 30, lte: 60 } });
      } else if (cookTime === '60_plus') {
        where.AND.push({ cookTimeMins: { gte: 60 } });
      }
    }

    // Filter by Dietary Tags (Vegan, Vegetarian, etc.) - Match ALL selected tags (AND relation)
    if (dietary) {
      const dietaryArray = Array.isArray(dietary) 
        ? dietary 
        : dietary.split(',').map(d => d.trim());
      
      dietaryArray.forEach(d => {
        where.AND.push({
          tags: {
            some: {
              tag: {
                name: { equals: d, mode: 'insensitive' }
              }
            }
          }
        });
      });
    }

    // Exclude Allergens / Ingredients
    if (excludeIngredients) {
      const excludeArray = Array.isArray(excludeIngredients)
        ? excludeIngredients
        : excludeIngredients.split(',').map(i => i.trim());

      if (excludeArray.length > 0) {
        where.AND.push({
          ingredients: {
            none: {
              name: { in: excludeArray, mode: 'insensitive' }
            }
          }
        });
      }
    }

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

    const formatted = recipes.map(r => {
      const avg = r.reviews.length > 0
        ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1))
        : 0;
      return {
        ...r,
        averageRating: avg,
        reviewCount: r.reviews.length,
        tags: r.tags.map(rt => rt.tag.name)
      };
    });

    res.json({
      recipes: formatted,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingRecipes = async (req, res, next) => {
  try {
    const rawRecipes = await prisma.recipe.findMany({
      where: { status: 'APPROVED' },
      take: 50,
      orderBy: [
        { viewCount: 'desc' },
        { saveCount: 'desc' }
      ],
      include: {
        author: { select: { name: true, avatarUrl: true } },
        reviews: { select: { rating: true } },
        tags: { include: { tag: true } }
      }
    });

    const seenDishTypes = new Set();
    const uniqueRecipes = [];

    const getDishKey = (title) => {
      const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
      const words = cleanTitle.split(/\s+/);
      return words[words.length - 1].toLowerCase();
    };

    for (const recipe of rawRecipes) {
      const dishKey = getDishKey(recipe.title);
      if (!seenDishTypes.has(dishKey)) {
        seenDishTypes.add(dishKey);
        uniqueRecipes.push(recipe);
      }
      if (uniqueRecipes.length >= 10) {
        break;
      }
    }

    // Fallback if we have fewer than 10 unique dish types
    if (uniqueRecipes.length < 10) {
      for (const recipe of rawRecipes) {
        if (!uniqueRecipes.some(r => r.id === recipe.id)) {
          uniqueRecipes.push(recipe);
        }
        if (uniqueRecipes.length >= 10) {
          break;
        }
      }
    }

    const formatted = uniqueRecipes.map(r => {
      const avg = r.reviews.length > 0
        ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1))
        : 0;
      return {
        ...r,
        averageRating: avg,
        reviewCount: r.reviews.length,
        tags: r.tags.map(rt => rt.tag.name)
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getRandomRecipe = async (req, res, next) => {
  try {
    const count = await prisma.recipe.count({ where: { status: 'APPROVED' } });
    if (count === 0) {
      return res.status(404).json({ error: 'No approved recipes found.' });
    }

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

    const avg = recipe.reviews.length > 0
      ? parseFloat((recipe.reviews.reduce((sum, r) => sum + r.rating, 0) / recipe.reviews.length).toFixed(1))
      : 0;

    res.json({
      ...recipe,
      averageRating: avg,
      reviewCount: recipe.reviews.length,
      tags: recipe.tags.map(rt => rt.tag.name)
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipesByRegion = async (req, res, next) => {
  try {
    const { region } = req.params;

    // First find cuisines associated with that continent/region
    const cuisinesInRegion = await prisma.cuisine.findMany({
      where: { region: { equals: region, mode: 'insensitive' } },
      select: { name: true }
    });

    const cuisineNames = cuisinesInRegion.map(c => c.name);

    const recipes = await prisma.recipe.findMany({
      where: {
        status: 'APPROVED',
        cuisineType: { in: cuisineNames }
      },
      include: {
        author: { select: { name: true } },
        reviews: { select: { rating: true } },
        tags: { include: { tag: true } }
      }
    });

    const formatted = recipes.map(r => {
      const avg = r.reviews.length > 0
        ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1))
        : 0;
      return {
        ...r,
        averageRating: avg,
        reviewCount: r.reviews.length,
        tags: r.tags.map(rt => rt.tag.name)
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getRecipesByCuisine = async (req, res, next) => {
  try {
    const { cuisine } = req.params;

    const recipes = await prisma.recipe.findMany({
      where: {
        status: 'APPROVED',
        cuisineType: { equals: cuisine, mode: 'insensitive' }
      },
      include: {
        author: { select: { name: true } },
        reviews: { select: { rating: true } },
        tags: { include: { tag: true } }
      }
    });

    const formatted = recipes.map(r => {
      const avg = r.reviews.length > 0
        ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1))
        : 0;
      return {
        ...r,
        averageRating: avg,
        reviewCount: r.reviews.length,
        tags: r.tags.map(rt => rt.tag.name)
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getRecipesByIngredient = async (req, res, next) => {
  try {
    const { ingredient } = req.query;
    if (!ingredient) {
      return res.status(400).json({ error: 'Ingredient search term is required.' });
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        status: 'APPROVED',
        ingredients: {
          some: {
            name: { contains: ingredient, mode: 'insensitive' }
          }
        }
      },
      include: {
        author: { select: { name: true } },
        reviews: { select: { rating: true } },
        tags: { include: { tag: true } }
      }
    });

    const formatted = recipes.map(r => {
      const avg = r.reviews.length > 0
        ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1))
        : 0;
      return {
        ...r,
        averageRating: avg,
        reviewCount: r.reviews.length,
        tags: r.tags.map(rt => rt.tag.name)
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getRecipeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch and increment view count
    const recipe = await prisma.recipe.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, bio: true }
        },
        ingredients: {
          orderBy: { sortOrder: 'asc' }
        },
        instructions: {
          orderBy: { stepNumber: 'asc' }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, avatarUrl: true } }
          }
        },
        tags: {
          include: { tag: true }
        }
      }
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    const avg = recipe.reviews.length > 0
      ? parseFloat((recipe.reviews.reduce((sum, r) => sum + r.rating, 0) / recipe.reviews.length).toFixed(1))
      : 0;

    res.json({
      ...recipe,
      averageRating: avg,
      reviewCount: recipe.reviews.length,
      tags: recipe.tags.map(rt => rt.tag.name)
    });
  } catch (error) {
    next(error);
  }
};

export const createRecipe = async (req, res, next) => {
  try {
    const {
      title,
      description,
      originCountry,
      cuisineType,
      mealType,
      difficulty,
      prepTimeMins,
      cookTimeMins,
      servings,
      caloriesPerServing,
      coverImageUrl,
      videoUrl,
      ingredients, // Array of { name, quantity, unit, isOptional }
      instructions, // Array of { stepNumber, description, imageUrl }
      tags // Array of tag names
    } = req.body;

    if (!title || !description || !originCountry || !cuisineType || !mealType || !difficulty || !ingredients || !instructions) {
      return res.status(400).json({ error: 'Missing required recipe details.' });
    }

    const slug = generateSlug(title);
    const parsedPrep = parseInt(prepTimeMins || 0);
    const parsedCook = parseInt(cookTimeMins || 0);
    const parsedServings = parseInt(servings || 4);
    const parsedCalories = parseInt(caloriesPerServing || 0);

    const parsedIngredients = Array.isArray(ingredients) ? ingredients : JSON.parse(ingredients);
    const parsedInstructions = Array.isArray(instructions) ? instructions : JSON.parse(instructions);
    const parsedTags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];

    const recipe = await prisma.recipe.create({
      data: {
        title,
        slug,
        description,
        originCountry,
        cuisineType,
        mealType: mealType.toUpperCase(),
        difficulty: difficulty.toUpperCase(),
        prepTimeMins: parsedPrep,
        cookTimeMins: parsedCook,
        servings: parsedServings,
        caloriesPerServing: parsedCalories,
        coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
        videoUrl: videoUrl || null,
        youtubeSearchQuery: `${title} ${cuisineType} recipe how to make`,
        status: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING', // Auto-approve if admin uploads
        authorId: req.user.id,
        ingredients: {
          create: parsedIngredients.map((ing, idx) => ({
            name: ing.name,
            quantity: parseFloat(ing.quantity || 0),
            unit: ing.unit || '',
            isOptional: ing.isOptional === true || ing.isOptional === 'true',
            sortOrder: idx + 1
          }))
        },
        instructions: {
          create: parsedInstructions.map((inst, idx) => ({
            stepNumber: inst.stepNumber || (idx + 1),
            description: inst.description,
            imageUrl: inst.imageUrl || null
          }))
        }
      }
    });

    // Create Tag relations
    if (parsedTags.length > 0) {
      for (const tName of parsedTags) {
        // Find or create tag
        const tag = await prisma.tag.upsert({
          where: { name: tName },
          update: {},
          create: {
            name: tName,
            slug: tName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            category: 'method'
          }
        });

        await prisma.recipeTag.create({
          data: {
            recipeId: recipe.id,
            tagId: tag.id
          }
        });
      }
    }

    res.status(201).json({
      message: 'Recipe submitted successfully! It is currently pending moderator approval.',
      recipe
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      originCountry,
      cuisineType,
      mealType,
      difficulty,
      prepTimeMins,
      cookTimeMins,
      servings,
      caloriesPerServing,
      coverImageUrl,
      videoUrl,
      ingredients,
      instructions
    } = req.body;

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    // Owner check
    if (existing.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to edit this recipe.' });
    }

    // If title changed, update slug
    const updateData = {};
    if (title) {
      updateData.title = title;
      updateData.slug = generateSlug(title);
    }
    if (description) updateData.description = description;
    if (originCountry) updateData.originCountry = originCountry;
    if (cuisineType) updateData.cuisineType = cuisineType;
    if (mealType) updateData.mealType = mealType.toUpperCase();
    if (difficulty) updateData.difficulty = difficulty.toUpperCase();
    if (prepTimeMins !== undefined) updateData.prepTimeMins = parseInt(prepTimeMins);
    if (cookTimeMins !== undefined) updateData.cookTimeMins = parseInt(cookTimeMins);
    if (servings !== undefined) updateData.servings = parseInt(servings);
    if (caloriesPerServing !== undefined) updateData.caloriesPerServing = parseInt(caloriesPerServing);
    if (coverImageUrl) updateData.coverImageUrl = coverImageUrl;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;

    // Start transaction to delete/insert ingredients if updated
    await prisma.$transaction(async (tx) => {
      // Update basic details
      await tx.recipe.update({
        where: { id },
        data: updateData
      });

      if (ingredients) {
        const parsedIngs = Array.isArray(ingredients) ? ingredients : JSON.parse(ingredients);
        // Delete old ingredients
        await tx.ingredient.deleteMany({ where: { recipeId: id } });
        // Re-create new ones
        await tx.ingredient.createMany({
          data: parsedIngs.map((ing, idx) => ({
            recipeId: id,
            name: ing.name,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit || '',
            isOptional: ing.isOptional === true || ing.isOptional === 'true',
            sortOrder: idx + 1
          }))
        });
      }

      if (instructions) {
        const parsedInsts = Array.isArray(instructions) ? instructions : JSON.parse(instructions);
        // Delete old instructions
        await tx.instruction.deleteMany({ where: { recipeId: id } });
        // Re-create
        await tx.instruction.createMany({
          data: parsedInsts.map((inst, idx) => ({
            recipeId: id,
            stepNumber: inst.stepNumber || (idx + 1),
            description: inst.description,
            imageUrl: inst.imageUrl || null
          }))
        });
      }
    });

    res.json({ message: 'Recipe updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const deleteRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    if (existing.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to delete this recipe.' });
    }

    await prisma.recipe.delete({ where: { id } });
    res.json({ message: 'Recipe deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getRelatedRecipes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const currentRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: { cuisineType: true }
    });

    if (!currentRecipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    // Find recipes with matching cuisine type, excluding the current recipe, capped at 4
    const related = await prisma.recipe.findMany({
      where: {
        status: 'APPROVED',
        cuisineType: currentRecipe.cuisineType,
        NOT: { id }
      },
      take: 4,
      include: {
        reviews: { select: { rating: true } },
        tags: { include: { tag: true } }
      }
    });

    const formatted = related.map(r => {
      const avg = r.reviews.length > 0
        ? parseFloat((r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length).toFixed(1))
        : 0;
      return {
        ...r,
        averageRating: avg,
        reviewCount: r.reviews.length,
        tags: r.tags.map(rt => rt.tag.name)
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};
