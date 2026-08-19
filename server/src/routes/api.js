import express from 'express';
import { globalLimiter, authLimiter } from '../middleware/rateLimiter.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

// Controllers
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as recipeController from '../controllers/recipeController.js';
import * as reviewController from '../controllers/reviewController.js';
import * as videoController from '../controllers/videoController.js';
import * as adminController from '../controllers/adminController.js';
import * as foodApiController from '../controllers/foodApiController.js';
import { upload, cloudinaryService } from '../services/cloudinaryService.js';

const router = express.Router();

// Apply global rate limiting to all API endpoints
router.use(globalLimiter);

// ----------------------------------------------------
// AUTHENTICATION ROUTES (/api/auth)
// ----------------------------------------------------
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/forgot-password', authLimiter, authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);
router.get('/auth/verify-email', authController.verifyEmail);

// ----------------------------------------------------
// USER ROUTES (/api/users)
// ----------------------------------------------------
router.get('/users/me', authMiddleware, userController.getMe);
router.put('/users/me', authMiddleware, userController.updateMe);
router.delete('/users/me', authMiddleware, userController.deleteMe);
router.get('/users/me/saved', authMiddleware, userController.getSavedRecipes);
router.post('/users/me/saved/:id', authMiddleware, userController.saveRecipe);
router.delete('/users/me/saved/:id', authMiddleware, userController.unsaveRecipe);
router.get('/users/me/cookbooks', authMiddleware, userController.listCookbooks);
router.post('/users/me/cookbooks', authMiddleware, userController.createCookbook);
router.put('/users/me/cookbooks/:id', authMiddleware, userController.updateCookbook);
router.delete('/users/me/cookbooks/:id', authMiddleware, userController.deleteCookbook);
router.post('/users/history/:id', authMiddleware, userController.logHistory);
router.post('/upload', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const imageUrl = await cloudinaryService.uploadImage(req.file.path);
    res.json({ imageUrl });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// RECIPE ROUTES (/api/recipes)
// ----------------------------------------------------
router.get('/recipes', recipeController.listRecipes);
router.get('/recipes/search', recipeController.searchRecipes);
router.get('/recipes/trending', recipeController.getTrendingRecipes);
router.get('/recipes/random', recipeController.getRandomRecipe);
router.get('/recipes/by-region/:region', recipeController.getRecipesByRegion);
router.get('/recipes/by-cuisine/:cuisine', recipeController.getRecipesByCuisine);
router.get('/recipes/by-ingredient', recipeController.getRecipesByIngredient);
router.get('/recipes/:id', recipeController.getRecipeById);
router.post('/recipes', authMiddleware, recipeController.createRecipe);
router.put('/recipes/:id', authMiddleware, recipeController.updateRecipe);
router.delete('/recipes/:id', authMiddleware, recipeController.deleteRecipe);
router.get('/recipes/:id/related', recipeController.getRelatedRecipes);

// ----------------------------------------------------
// REVIEW ROUTES (/api/recipes/:id/reviews)
// ----------------------------------------------------
router.get('/recipes/:id/reviews', reviewController.getReviews);
router.post('/recipes/:id/reviews', authMiddleware, reviewController.addReview);
router.put('/recipes/reviews/:reviewId', authMiddleware, reviewController.editReview);
router.delete('/recipes/reviews/:reviewId', authMiddleware, reviewController.deleteReview);

// ----------------------------------------------------
// VIDEO ROUTES (/api/videos)
// ----------------------------------------------------
router.get('/videos/search', videoController.searchProxy);
router.get('/videos/embed/:recipeId', videoController.getEmbedVideo);

// ----------------------------------------------------
// ADMIN ROUTES (/api/admin) - Admin role only
// ----------------------------------------------------
router.get('/admin/recipes/pending', authMiddleware, roleMiddleware(['ADMIN', 'MODERATOR']), adminController.getPendingRecipes);
router.patch('/admin/recipes/:id/approve', authMiddleware, roleMiddleware(['ADMIN', 'MODERATOR']), adminController.approveRecipe);
router.patch('/admin/recipes/:id/reject', authMiddleware, roleMiddleware(['ADMIN', 'MODERATOR']), adminController.rejectRecipe);
router.get('/admin/users', authMiddleware, roleMiddleware(['ADMIN']), adminController.getUsers);
router.patch('/admin/users/:id/ban', authMiddleware, roleMiddleware(['ADMIN']), adminController.banUser);
router.patch('/admin/users/:id/promote', authMiddleware, roleMiddleware(['ADMIN']), adminController.promoteUser);
router.get('/admin/analytics', authMiddleware, roleMiddleware(['ADMIN', 'MODERATOR']), adminController.getAnalytics);

// ----------------------------------------------------
// EXTERNAL GLOBAL FOOD API ROUTES (/api/external-food)
// ----------------------------------------------------
router.get('/external-food/search', foodApiController.searchGlobalDishes);
router.get('/external-food/by-country/:country', foodApiController.getDishesByCountry);
router.get('/external-food/areas', foodApiController.getGlobalAreas);
router.post('/external-food/ai-generate', foodApiController.generateRecipeWithAI);

export default router;
