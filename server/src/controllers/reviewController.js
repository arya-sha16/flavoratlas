import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getReviews = async (req, res, next) => {
  try {
    const { id: recipeId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { recipeId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, avatarUrl: true }
        }
      }
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req, res, next) => {
  try {
    const { id: recipeId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ error: 'Rating (1-5) and comment are required.' });
    }

    const numericRating = parseInt(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    // Check if user already reviewed this recipe
    const existingReview = await prisma.review.findFirst({
      where: { recipeId, userId: req.user.id }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this recipe. Please edit your existing review instead.' });
    }

    const review = await prisma.review.create({
      data: {
        recipeId,
        userId: req.user.id,
        rating: numericRating,
        comment
      },
      include: {
        user: { select: { name: true, avatarUrl: true } }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

export const editReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own reviews.' });
    }

    const updateData = {};
    if (rating) {
      const numRating = parseInt(rating);
      if (numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
      }
      updateData.rating = numRating;
    }
    if (comment) {
      updateData.comment = comment;
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: { select: { name: true, avatarUrl: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to delete this review.' });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
