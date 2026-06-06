import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Users, Flame, ChefHat, Bookmark, Share2, User, Send, Star } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from '../components/StarRating.jsx';
import { getFlagEmoji } from '../utils/flags.js';
import RecipeCard from '../components/RecipeCard.jsx';
import { RecipeDetailSkeleton } from '../components/SkeletonLoader.jsx';

const Youtube = ({ size = 24, className = "", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, savedRecipeIds, toggleSaveRecipe } = useAuth();

  // Recipe details state
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(4);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Video tutorial states
  const [primaryVideo, setPrimaryVideo] = useState(null);
  const [alternativeVideos, setAlternativeVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Related suggestions state
  const [related, setRelated] = useState([]);

  // Load recipe data, video proxy matches, and related items
  useEffect(() => {
    const loadRecipeDetails = async () => {
      setLoading(true);
      setLoadingVideos(true);
      try {
        // Log browsing history if user is logged in
        if (user) {
          api.post(`/users/history/${id}`).catch(() => {});
        }

        const res = await api.get(`/recipes/${id}`);
        setRecipe(res.data);
        setServings(res.data.servings || 4);
        setReviews(res.data.reviews || []);
        setIsSaved(savedRecipeIds.includes(res.data.id));

        // Fetch related recipes
        const relatedRes = await api.get(`/recipes/${id}/related`);
        setRelated(relatedRes.data);

        // Fetch videos
        const videoRes = await api.get(`/videos/embed/${id}`);
        setPrimaryVideo(videoRes.data.primaryVideo);
        setAlternativeVideos(videoRes.data.alternatives || []);
      } catch (err) {
        console.error('Error loading recipe details:', err.message);
        if (err.response && err.response.status === 404) {
          navigate('/search');
        }
      } finally {
        setLoading(false);
        setLoadingVideos(false);
      }
    };

    loadRecipeDetails();
  }, [id, navigate, savedRecipeIds, user]);

  const handleBookmark = async () => {
    if (!recipe) return;
    const nextSaved = await toggleSaveRecipe(recipe.id);
    setIsSaved(nextSaved);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    setReviewError("");
    try {
      const res = await api.post(`/recipes/${id}/reviews`, {
        rating: newRating,
        comment: newComment
      });
      
      // Add review locally
      setReviews(prev => [res.data, ...prev]);
      setNewComment("");
      setNewRating(5);
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <RecipeDetailSkeleton />
      </div>
    );
  }

  if (!recipe) return null;

  const totalTime = recipe.prepTimeMins + recipe.cookTimeMins;
  const flag = getFlagEmoji(recipe.originCountry);

  // Scaler helper
  const scaleQuantity = (qty) => {
    if (!qty) return 0;
    const ratio = servings / recipe.servings;
    const result = qty * ratio;
    // Format to 2 decimal places maximum
    return parseFloat(result.toFixed(2));
  };

  // Safe YouTube embed URL generator
  const getEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}`;
  };

  // Safe nutritional calculations (Mock values based on calories)
  const calories = Math.round((recipe.caloriesPerServing / recipe.servings) * servings);
  const protein = Math.round((calories * 0.15) / 4);
  const fat = Math.round((calories * 0.35) / 9);
  const carbs = Math.round((calories * 0.50) / 4);
  const fiber = Math.round(calories * 0.008);

  return (
    <div className="pb-16 space-y-12 transition-all duration-300">
      
      {/* 1. HERO BANNER */}
      <section className="relative h-[300px] md:h-[450px] overflow-hidden">
        <img
          src={recipe.coverImageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover brightness-[0.7] dark:brightness-50"
        />
        
        {/* Origin Country Banner Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-12">
          <div className="max-w-6xl mx-auto w-full space-y-4">
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-saffron px-3.5 py-1 text-xs font-bold text-white uppercase tracking-wider shadow">
                {flag} {recipe.originCountry}
              </span>
              <span className="rounded-full bg-cream-light/20 backdrop-blur px-3 py-1 text-xs font-bold text-cream-light uppercase tracking-wider">
                {recipe.cuisineType} Cuisine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white leading-tight">
              {recipe.title}
            </h1>
            
            <p className="text-sm text-gray-300 max-w-2xl line-clamp-2">
              {recipe.description}
            </p>

          </div>
        </div>
      </section>

      {/* 2. META DATA GRID */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-4 shadow-sm">
          <div className="rounded-full bg-saffron/10 p-2.5 text-saffron">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Time</div>
            <div className="text-base font-black">{totalTime} mins</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-4 shadow-sm">
          <div className="rounded-full bg-terracotta/10 p-2.5 text-terracotta">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Servings</div>
            <div className="text-base font-black">{recipe.servings} people</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-4 shadow-sm">
          <div className="rounded-full bg-yellow-500/10 p-2.5 text-yellow-600">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Calories</div>
            <div className="text-base font-black">{recipe.caloriesPerServing} kcal</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-4 shadow-sm">
          <div className="rounded-full bg-green-500/10 p-2.5 text-green-600">
            <ChefHat size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Difficulty</div>
            <div className="text-base font-black uppercase tracking-wider">{recipe.difficulty}</div>
          </div>
        </div>
      </section>

      {/* 3. MAIN DETAILS CONTENT */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Ingredients & Steps) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Action Row */}
          <div className="flex items-center gap-3 border-b border-cream-dark/20 dark:border-charcoal-light/10 pb-4">
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold border transition-colors ${
                isSaved 
                  ? 'bg-terracotta border-terracotta text-white' 
                  : 'border-cream-dark/30 dark:border-charcoal-light/30 hover:bg-cream text-charcoal dark:text-cream-light'
              }`}
            >
              <Bookmark size={14} className={isSaved ? 'fill-white' : ''} />
              {isSaved ? 'Saved to Cookbooks' : 'Save Recipe'}
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full border border-cream-dark/30 dark:border-charcoal-light/30 px-5 py-2 text-xs font-bold hover:bg-cream text-charcoal dark:text-cream-light"
            >
              <Share2 size={14} />
              {copied ? 'Link Copied!' : 'Share'}
            </button>
          </div>

          {/* Ingredients with Scaler Slider */}
          <div className="rounded-3xl bg-cream-light/40 dark:bg-charcoal-light/20 border border-cream-dark/15 dark:border-charcoal-light/5 p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-display">Recipe Ingredients</h3>
                <p className="text-[11px] text-gray-400">Use the slider to scale ingredient quantities.</p>
              </div>

              {/* Servings Slider */}
              <div className="flex items-center gap-4 border border-cream-dark/30 dark:border-charcoal-light/30 rounded-2xl px-4 py-2 bg-cream-light dark:bg-charcoal">
                <span className="text-xs font-bold text-saffron min-w-[70px]">
                  {servings} Servings
                </span>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value))}
                  className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-saffron"
                />
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-cream-dark/10 dark:divide-charcoal/20">
              {recipe.ingredients?.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between py-3 text-sm">
                  <span className={`font-medium ${ing.isOptional ? 'text-gray-400 italic' : ''}`}>
                    {ing.name} {ing.isOptional && '(optional)'}
                  </span>
                  <span className="font-bold text-saffron bg-saffron/5 dark:bg-saffron/10 px-2.5 py-0.5 rounded-full">
                    {scaleQuantity(ing.quantity)} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Cooking Instructions */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-display">Cooking Instructions</h3>
            <div className="relative border-l-2 border-saffron/20 pl-6 ml-4 space-y-8">
              {recipe.instructions?.map((step, idx) => (
                <div key={step.id} className="relative group">
                  
                  {/* Number bubble */}
                  <span className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-saffron text-[11px] font-black text-white ring-4 ring-cream dark:ring-charcoal">
                    {step.stepNumber}
                  </span>

                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed text-charcoal-light dark:text-cream-dark">
                      {step.description}
                    </p>
                    {step.imageUrl && (
                      <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-sm border border-cream-dark/20 dark:border-charcoal/30">
                        <img
                          src={step.imageUrl}
                          alt={`Step ${step.stepNumber}`}
                          className="w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* YouTube Video Section */}
          <div className="space-y-6 border-t border-cream-dark/20 dark:border-charcoal-light/10 pt-8">
            <div className="flex items-center gap-2 text-red-600">
              <Youtube size={24} className="fill-red-600 text-white" />
              <h3 className="text-2xl font-bold font-display">Video Tutorials</h3>
            </div>

            {loadingVideos ? (
              <div className="h-64 rounded-3xl skeleton-loader" />
            ) : primaryVideo ? (
              <div className="space-y-6">
                {/* Primary Embed Player */}
                <div className="relative aspect-video w-full overflow-hidden rounded-3xl shadow-md border border-cream-dark/20 dark:border-charcoal/40 bg-black">
                  <iframe
                    src={getEmbedUrl(primaryVideo.videoId)}
                    title={primaryVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>

                {/* Alternatives Carousel */}
                {alternativeVideos.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">More Cooking Tutorials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {alternativeVideos.map(video => (
                        <a
                          key={video.videoId}
                          href={`https://www.youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 overflow-hidden shadow-sm hover:scale-[1.01] transition-transform"
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] text-white">
                              {video.duration}
                            </div>
                          </div>
                          <div className="p-3 space-y-1">
                            <h5 className="text-xs font-bold line-clamp-1 dark:text-cream-light">
                              {video.title}
                            </h5>
                            <p className="text-[10px] text-gray-400">{video.channelName}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-cream-dark dark:border-charcoal-light p-6 text-center text-xs text-gray-500">
                🎥 No video tutorials available for this recipe yet.
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Sidebar: Chef's Tips & Nutrition) */}
        <div className="space-y-8">
          
          {/* Chef's Tips & Variations */}
          <div className="rounded-3xl bg-terracotta/5 border border-terracotta/10 p-6 space-y-4">
            <h4 className="text-lg font-bold font-display text-terracotta">Chef's Tips & Variations</h4>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              💡 <strong>Traditional Touch:</strong> Serve alongside warm pickled carrots and fresh cilantro leaves. <br /><br />
              🔥 <strong>Spiciness Control:</strong> Add sliced habaneros to the oil sauté step if you prefer a sharper heat. <br /><br />
              🥗 <strong>Dietary Substitution:</strong> Swap the primary protein for extra firm tofu or boiled chickpeas to make it fully vegetarian!
            </p>
          </div>

          {/* Nutritional Info Table */}
          <div className="rounded-3xl bg-cream-light/40 dark:bg-charcoal-light/20 border border-cream-dark/15 dark:border-charcoal-light/5 p-6 space-y-4 shadow-sm">
            <h4 className="text-sm font-black uppercase tracking-wider text-saffron">Nutritional Information</h4>
            <p className="text-[10px] text-gray-400">Calculated dynamically for your {servings} servings scale.</p>
            
            <div className="divide-y divide-cream-dark/10 dark:divide-charcoal/20 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="font-semibold text-gray-500">Calories</span>
                <span className="font-bold">{calories} kcal</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-semibold text-gray-500">Protein</span>
                <span className="font-bold">{protein} g</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-semibold text-gray-500">Fat</span>
                <span className="font-bold">{fat} g</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-semibold text-gray-500">Carbohydrates</span>
                <span className="font-bold">{carbs} g</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-semibold text-gray-500">Dietary Fiber</span>
                <span className="font-bold">{fiber} g</span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* 4. USER REVIEWS & RATINGS */}
      <section className="max-w-6xl mx-auto px-4 border-t border-cream-dark/20 dark:border-charcoal-light/10 pt-12 space-y-8">
        <h3 className="text-2xl font-bold font-display">User Reviews</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Submit Review Form (Auth Required) */}
          <div className="lg:col-span-1 rounded-3xl bg-cream-light/50 dark:bg-charcoal-light/20 border border-cream-dark/15 dark:border-charcoal-light/5 p-6 space-y-4 shadow-sm h-fit">
            <h4 className="text-base font-bold">Write a Review</h4>
            {user ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded">
                    {reviewError}
                  </div>
                )}
                
                {/* Rating selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Rating</label>
                  <StarRating rating={newRating} onChange={setNewRating} size={24} />
                </div>

                {/* Comment box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Comment</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Share your culinary experience, flavor adjustments..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-3 text-xs focus:outline-none focus:border-saffron"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full rounded-full bg-saffron py-2.5 text-xs font-bold text-white shadow hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Send size={12} /> {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-gray-400">You must be logged in to leave a review.</p>
                <Link
                  to="/auth"
                  className="inline-block rounded-full bg-saffron px-6 py-2 text-xs font-bold text-white shadow"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                💬 No reviews written yet. Be the first to cook and review!
              </div>
            ) : (
              reviews.map(review => (
                <div 
                  key={review.id}
                  className="rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={review.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50'}
                        alt={review.user?.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <h5 className="text-xs font-bold">{review.user?.name || 'Anonymous User'}</h5>
                        <p className="text-[9px] text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-1">
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* 5. RELATED RECIPE SUGGESTIONS */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 border-t border-cream-dark/20 dark:border-charcoal-light/10 pt-12 space-y-6">
          <h3 className="text-2xl font-bold font-display">You Might Also Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map(item => (
              <RecipeCard key={item.id} recipe={item} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default RecipeDetail;
