import { PrismaClient } from '@prisma/client';
import youtubeService from '../services/youtubeService.js';

const prisma = new PrismaClient();

export const searchProxy = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query parameter (q) is required.' });
    }

    const videos = await youtubeService.searchVideos(q);
    res.json(videos);
  } catch (error) {
    next(error);
  }
};

export const getEmbedVideo = async (req, res, next) => {
  try {
    const { recipeId } = req.params;

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { title: true, cuisineType: true, youtubeSearchQuery: true, videoUrl: true }
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    const searchQuery = recipe.youtubeSearchQuery || `${recipe.title} ${recipe.cuisineType} recipe how to make`;
    const searchResults = await youtubeService.searchVideos(searchQuery);

    // If the recipe has an explicit user-submitted video, we can format it as the primary video
    let primaryVideo = null;
    let alternatives = [];

    if (recipe.videoUrl) {
      // Parse Youtube video ID if it's a youtube link
      let explicitVideoId = null;
      try {
        const url = new URL(recipe.videoUrl);
        if (url.hostname.includes('youtube.com')) {
          explicitVideoId = url.searchParams.get('v');
        } else if (url.hostname.includes('youtu.be')) {
          explicitVideoId = url.pathname.slice(1);
        }
      } catch (e) {}

      if (explicitVideoId) {
        primaryVideo = {
          videoId: explicitVideoId,
          title: `User Submitted Tutorial: How to cook ${recipe.title}`,
          description: 'A custom step-by-step cooking guide submitted by the author.',
          thumbnail: searchResults[0]?.thumbnail || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=320',
          channelName: 'FlavorAtlas Creator',
          duration: 'N/A',
          viewCount: '0'
        };
        // All search results become alternatives
        alternatives = searchResults.slice(0, 4);
      }
    }

    if (!primaryVideo && searchResults.length > 0) {
      primaryVideo = searchResults[0];
      alternatives = searchResults.slice(1, 5); // Display next 3-4 video cards
    }

    res.json({
      primaryVideo,
      alternatives
    });
  } catch (error) {
    next(error);
  }
};
