import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPendingRecipes = async (req, res, next) => {
  try {
    const pending = await prisma.recipe.findMany({
      where: { status: 'PENDING' },
      include: {
        author: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pending);
  } catch (error) {
    next(error);
  }
};

export const approveRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;

    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    res.json({ message: 'Recipe approved successfully.', recipe: updated });
  } catch (error) {
    next(error);
  }
};

export const rejectRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;

    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    res.json({ message: 'Recipe rejected successfully.', recipe: updated });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        country: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot ban an admin user.' });
    }

    // Ban is handled by deleting the user from the database
    await prisma.user.delete({ where: { id } });

    res.json({ message: 'User has been banned and deleted from the platform.' });
  } catch (error) {
    next(error);
  }
};

export const promoteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: 'MODERATOR' }
    });

    res.json({ message: 'User promoted to moderator successfully.', user: updated });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    
    const approvedRecipes = await prisma.recipe.count({ where: { status: 'APPROVED' } });
    const pendingRecipes = await prisma.recipe.count({ where: { status: 'PENDING' } });
    const totalReviews = await prisma.review.count();
    const totalCookbooks = await prisma.cookbook.count();

    // Top searched/viewed recipes
    const topRecipes = await prisma.recipe.findMany({
      where: { status: 'APPROVED' },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        viewCount: true,
        saveCount: true
      }
    });

    // Cuisines stats (count per cuisine)
    const cuisineGroups = await prisma.recipe.groupBy({
      by: ['cuisineType'],
      _count: {
        id: true
      },
      _sum: {
        viewCount: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const popularCuisines = cuisineGroups.map(group => ({
      cuisine: group.cuisineType,
      recipeCount: group._count.id,
      totalViews: group._sum.viewCount || 0
    }));

    res.json({
      stats: {
        totalUsers,
        verifiedUsers,
        approvedRecipes,
        pendingRecipes,
        totalReviews,
        totalCookbooks
      },
      topRecipes,
      popularCuisines
    });
  } catch (error) {
    next(error);
  }
};
