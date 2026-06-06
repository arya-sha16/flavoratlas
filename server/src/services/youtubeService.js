import axios from 'axios';
import cacheService from './redisService.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

// Helper to generate realistic mock videos if YouTube API key is missing/fails
function generateMockVideos(query) {
  const cleanQuery = query.replace(' recipe how to make', '').replace('+', ' ');
  const keywords = cleanQuery.split(' ');
  const dishName = keywords.slice(0, 3).join(' ');

  const channels = ['Chef John - Food Wishes', 'Binging with Babish', 'Gordon Ramsay', 'Tasty', 'Jamie Oliver', 'Maangchi', 'Kenji López-Alt'];
  const videoIds = ['dQw4w9WgXcQ', '9bZkp7q19f0', 'm9zZ7q_b4_0', 'Y3cv5y_wJ6o', 'f2oT4b-vHkY'];

  return Array.from({ length: 5 }).map((_, index) => {
    const channel = channels[(index + keywords.length) % channels.length];
    const videoId = videoIds[(index + keywords.length) % videoIds.length];
    const views = Math.floor(10000 + Math.random() * 5000000);
    
    let title = `${dishName} Recipe - How to Make ${dishName}`;
    if (index === 1) title = `The Ultimate Guide to ${dishName} | ${channel}`;
    if (index === 2) title = `3-Minute Quick & Easy ${dishName}`;
    if (index === 3) title = `Gordon Ramsay Teaches You ${dishName}`;
    if (index === 4) title = `Traditional ${dishName} | Masterclass`;

    return {
      videoId: index === 0 ? videoId : `${videoId}_${index}`,
      title,
      description: `Learn how to make the best ${dishName} at home. Simple step by step tutorial.`,
      thumbnail: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=320&q=80&sig=${index}`,
      channelName: channel,
      duration: `${4 + (index * 2)}:${Math.floor(10 + Math.random() * 49)}`,
      viewCount: views.toLocaleString()
    };
  });
}

export const youtubeService = {
  async searchVideos(query) {
    const cacheKey = `youtube_search:${query.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Check Redis/Memory cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache Hit for YouTube Query: "${query}"`);
      return cached;
    }

    if (!YOUTUBE_API_KEY) {
      console.log(`⚠️ YouTube API key missing. Returning mock videos for: "${query}"`);
      const mock = generateMockVideos(query);
      await cacheService.set(cacheKey, mock, 86400); // Cache for 24 hours
      return mock;
    }

    try {
      console.log(`🔍 Fetching YouTube Videos from API for: "${query}"`);
      const response = await axios.get(YOUTUBE_SEARCH_URL, {
        params: {
          key: YOUTUBE_API_KEY,
          q: query,
          part: 'snippet',
          type: 'video',
          maxResults: 5
        }
      });

      const items = response.data.items || [];
      const videos = items.map((item) => {
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          channelName: item.snippet.channelTitle,
          duration: `${5 + Math.floor(Math.random() * 8)}:${Math.floor(10 + Math.random() * 49)}`, // Mock duration since search endpoint doesn't return duration
          viewCount: Math.floor(15000 + Math.random() * 1200000).toLocaleString() // Mock view count
        };
      });

      if (videos.length === 0) {
        throw new Error('No videos found from API');
      }

      await cacheService.set(cacheKey, videos, 86400); // Cache for 24 hours
      return videos;
    } catch (err) {
      console.warn(`⚠️ YouTube API Request Failed: ${err.message}. Returning mock videos instead.`);
      const mock = generateMockVideos(query);
      // Cache the mock result so we don't hammer the failing API
      await cacheService.set(cacheKey, mock, 86400);
      return mock;
    }
  }
};

export default youtubeService;
