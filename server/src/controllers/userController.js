import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        recipes: true,
        reviews: {
          include: {
            recipe: true
          }
        },
        cookbooks: {
          include: {
            recipes: { include: { recipe: true } }
          }
        },
        savedRecipes: {
          include: { recipe: true }
        },
        browseHistory: {
          orderBy: { viewedAt: 'desc' },
          take: 10,
          include: { recipe: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, bio, country, dietaryPreferences, avatarUrl } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (country !== undefined) updateData.country = country;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (dietaryPreferences) {
      updateData.dietaryPreferences = Array.isArray(dietaryPreferences)
        ? dietaryPreferences
        : JSON.parse(dietaryPreferences);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        country: true,
        dietaryPreferences: true,
        role: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.clearCookie('refreshToken');
    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getSavedRecipes = async (req, res, next) => {
  try {
    const saved = await prisma.savedRecipe.findMany({
      where: { userId: req.user.id },
      include: {
        recipe: {
          include: {
            reviews: { select: { rating: true } },
            tags: { include: { tag: true } }
          }
        }
      }
    });

    const recipes = saved.map(s => {
      const r = s.recipe;
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

    res.json(recipes);
  } catch (error) {
    next(error);
  }
};

export const saveRecipe = async (req, res, next) => {
  try {
    const recipeId = req.params.id;

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    // Check if already saved
    const existing = await prisma.savedRecipe.findUnique({
      where: {
        userId_recipeId: { userId: req.user.id, recipeId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Recipe already saved.' });
    }

    // Save and increment recipe save count
    await prisma.$transaction([
      prisma.savedRecipe.create({
        data: { userId: req.user.id, recipeId }
      }),
      prisma.recipe.update({
        where: { id: recipeId },
        data: { saveCount: { increment: 1 } }
      })
    ]);

    res.json({ message: 'Recipe saved to cookbook collection.' });
  } catch (error) {
    next(error);
  }
};

export const unsaveRecipe = async (req, res, next) => {
  try {
    const recipeId = req.params.id;

    const existing = await prisma.savedRecipe.findUnique({
      where: {
        userId_recipeId: { userId: req.user.id, recipeId }
      }
    });

    if (!existing) {
      return res.status(400).json({ error: 'Recipe was not saved.' });
    }

    // Unsave and decrement recipe save count
    await prisma.$transaction([
      prisma.savedRecipe.delete({
        where: {
          userId_recipeId: { userId: req.user.id, recipeId }
        }
      }),
      prisma.recipe.update({
        where: { id: recipeId },
        data: { saveCount: { decrement: 1 } }
      })
    ]);

    res.json({ message: 'Recipe removed from saved collection.' });
  } catch (error) {
    next(error);
  }
};

export const listCookbooks = async (req, res, next) => {
  try {
    const cookbooks = await prisma.cookbook.findMany({
      where: { userId: req.user.id },
      include: {
        recipes: {
          include: {
            recipe: true
          }
        }
      }
    });

    res.json(cookbooks);
  } catch (error) {
    next(error);
  }
};

export const createCookbook = async (req, res, next) => {
  try {
    const { name, description, coverImageUrl, isPublic, recipeIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Cookbook name is required.' });
    }

    const parsedIds = recipeIds ? (Array.isArray(recipeIds) ? recipeIds : JSON.parse(recipeIds)) : [];

    const cookbook = await prisma.cookbook.create({
      data: {
        userId: req.user.id,
        name,
        description: description || null,
        coverImageUrl: coverImageUrl || null,
        isPublic: isPublic === true || isPublic === 'true',
        recipes: {
          create: parsedIds.map(rId => ({
            recipeId: rId
          }))
        }
      },
      include: {
        recipes: { include: { recipe: true } }
      }
    });

    res.status(201).json(cookbook);
  } catch (error) {
    next(error);
  }
};

export const updateCookbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, coverImageUrl, isPublic, recipeIds } = req.body;

    const existing = await prisma.cookbook.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cookbook not found.' });
    }

    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to update this cookbook.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (isPublic !== undefined) updateData.isPublic = isPublic === true || isPublic === 'true';

    await prisma.$transaction(async (tx) => {
      await tx.cookbook.update({
        where: { id },
        data: updateData
      });

      if (recipeIds) {
        const parsedIds = Array.isArray(recipeIds) ? recipeIds : JSON.parse(recipeIds);
        // Clear old recipes
        await tx.cookbookRecipe.deleteMany({ where: { cookbookId: id } });
        // Create new ones
        await tx.cookbookRecipe.createMany({
          data: parsedIds.map(rId => ({
            cookbookId: id,
            recipeId: rId
          }))
        });
      }
    });

    res.json({ message: 'Cookbook updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const deleteCookbook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.cookbook.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cookbook not found.' });
    }

    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this cookbook.' });
    }

    await prisma.cookbook.delete({ where: { id } });
    res.json({ message: 'Cookbook deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// Add recipe view history logging
export const logHistory = async (req, res, next) => {
  try {
    const recipeId = req.params.id;
    if (!req.user) return res.sendStatus(200);

    // Upsert browsing history to update the viewedAt timestamp
    await prisma.browseHistory.upsert({
      where: {
        userId_recipeId: { userId: req.user.id, recipeId }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        userId: req.user.id,
        recipeId
      }
    });

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
