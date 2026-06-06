import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, BookOpen, History, MessageSquare, Plus, Check, Settings, Shield, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { getFlagEmoji } from '../utils/flags.js';
import StarRating from '../components/StarRating.jsx';

export const Dashboard = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user session is null
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Tab: profile | cookbooks | history | reviews | submitted | notifications
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form state
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  
  // Dashboard details state
  const [cookbooks, setCookbooks] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [history, setHistory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Cookbook creation form state
  const [showCreateCookbook, setShowCreateCookbook] = useState(false);
  const [cbName, setCbName] = useState("");
  const [cbDesc, setCbDesc] = useState("");
  const [cbPublic, setCbPublic] = useState(false);
  const [cbRecipes, setCbRecipes] = useState([]);

  // Feedback states
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch complete user profile relations on mount
  useEffect(() => {
    if (!user) return;
    const fetchDashboardDetails = async () => {
      try {
        const res = await api.get('/users/me');
        setBio(res.data.bio || "");
        setCountry(res.data.country || "");
        setDietaryPreferences(res.data.dietaryPreferences || []);
        setAvatarUrl(res.data.avatarUrl || "");

        setCookbooks(res.data.cookbooks || []);
        setSavedRecipes(res.data.savedRecipes || []);
        setHistory(res.data.browseHistory || []);
        setReviews(res.data.reviews || []);
        setSubmissions(res.data.recipes || []);
      } catch (err) {
        console.error('Error fetching dashboard details:', err.message);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDashboardDetails();
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);
    setProfileError("");
    try {
      await updateProfile({
        name,
        bio,
        country,
        dietaryPreferences,
        avatarUrl
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.error || "Failed to update profile details.");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileError("");
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(res.data.imageUrl);
      // Automatically trigger save for the new avatar URL
      await updateProfile({ avatarUrl: res.data.imageUrl });
    } catch (err) {
      setProfileError("Avatar file upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreateCookbookSubmit = async (e) => {
    e.preventDefault();
    if (!cbName.trim()) return;

    try {
      const res = await api.post('/users/me/cookbooks', {
        name: cbName,
        description: cbDesc,
        isPublic: cbPublic,
        recipeIds: cbRecipes
      });
      setCookbooks(prev => [...prev, res.data]);
      setCbName("");
      setCbDesc("");
      setCbPublic(false);
      setCbRecipes([]);
      setShowCreateCookbook(false);
    } catch (err) {
      alert("Failed to create cookbook.");
    }
  };

  const toggleRecipeInCookbook = (id) => {
    setCbRecipes(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const handleDietaryToggle = (item) => {
    setDietaryPreferences(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron border-t-transparent" />
        <p className="text-xs text-gray-400">Loading your culinary space...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Dashboard Navigation Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 p-6 text-center space-y-4 shadow-sm">
            <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border border-cream-dark/30 group">
              <img
                src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">
                {uploadingAvatar ? 'Uploading...' : 'Upload'}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div>
              <h3 className="text-base font-bold">{user?.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{user?.role} Account</p>
            </div>
            
            <p className="text-xs text-gray-500 italic line-clamp-2">
              "{bio || 'No bio written yet. Introduce yourself!'}"
            </p>
          </div>

          {/* Navigation Links */}
          <div className="rounded-2xl bg-cream-light/40 dark:bg-charcoal-light/20 border border-cream-dark/15 dark:border-charcoal-light/5 p-2 space-y-1">
            {[
              { id: "profile", label: "Profile Settings", icon: <Settings size={14} /> },
              { id: "cookbooks", label: "My Cookbooks", icon: <BookOpen size={14} /> },
              { id: "submissions", label: "My Submissions", icon: <Shield size={14} /> },
              { id: "reviews", label: "My Reviews", icon: <MessageSquare size={14} /> },
              { id: "history", label: "Browsing History", icon: <History size={14} /> },
              { id: "notifications", label: "Notifications", icon: <Bell size={14} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-xs font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-saffron text-white shadow-sm'
                    : 'text-charcoal-light hover:bg-cream dark:text-cream-dark dark:hover:bg-charcoal'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Right Columns: Dynamic Active Content Area */}
        <main className="lg:col-span-3">
          
          {/* A. PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h3 className="text-xl font-bold font-display">Profile Settings</h3>
                <p className="text-[11px] text-gray-400">Update your public credentials and dietary settings.</p>
              </div>

              {profileSuccess && (
                <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-3 text-xs text-green-700 dark:text-green-300 font-semibold flex items-center gap-1.5">
                  <Check size={14} /> Profile updated successfully!
                </div>
              )}
              {profileError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-600 dark:text-red-400 font-semibold">
                  ⚠️ {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Location Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Biography</label>
                  <textarea
                    rows="3"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your home cooking hobbies, preferred spices..."
                    className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-3 text-xs focus:outline-none"
                  />
                </div>

                {/* Dietary selections */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Dietary Preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Kosher", "Jain"].map(pref => {
                      const active = dietaryPreferences.includes(pref);
                      return (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => handleDietaryToggle(pref)}
                          className={`rounded-lg px-4 py-2 text-xs font-bold border transition-colors ${
                            active 
                              ? 'bg-saffron text-white border-saffron shadow-sm' 
                              : 'border-cream-dark/20 dark:border-charcoal-light/20 bg-cream-light dark:bg-charcoal hover:bg-cream'
                          }`}
                        >
                          {pref}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-full bg-saffron px-8 py-3 text-xs font-bold text-white shadow hover:scale-[1.01] active:scale-95 transition-transform"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* B. COOKBOOKS PANEL */}
          {activeTab === 'cookbooks' && (
            <div className="space-y-6">
              
              {/* Title & Action */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-display">My Cookbooks</h3>
                  <p className="text-[11px] text-gray-400">Manage your custom recipe collections.</p>
                </div>
                {!showCreateCookbook && (
                  <button
                    onClick={() => setShowCreateCookbook(true)}
                    className="rounded-full bg-saffron px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                  >
                    <Plus size={14} /> New Cookbook
                  </button>
                )}
              </div>

              {/* Creating cookbook subform */}
              {showCreateCookbook && (
                <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 p-6 space-y-4 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-saffron">Create a New Collection</h4>
                  <form onSubmit={handleCreateCookbookSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cookbook Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Traditional Soups, Friday Desserts..."
                        value={cbName}
                        onChange={(e) => setCbName(e.target.value)}
                        className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Description</label>
                      <textarea
                        rows="2"
                        placeholder="What is this collection about?"
                        value={cbDesc}
                        onChange={(e) => setCbDesc(e.target.value)}
                        className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="cbPublic"
                        checked={cbPublic}
                        onChange={(e) => setCbPublic(e.target.checked)}
                        className="rounded accent-saffron h-4 w-4"
                      />
                      <label htmlFor="cbPublic" className="text-xs font-bold text-gray-600">
                        Make this collection public
                      </label>
                    </div>

                    {/* Choose recipes to add (from bookmarked saved list) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Select Saved Recipes to Add</label>
                      {savedRecipes.length === 0 ? (
                        <p className="text-[10px] text-gray-400">Save some recipes to see them here.</p>
                      ) : (
                        <div className="max-h-36 overflow-y-auto border border-cream-dark/20 dark:border-charcoal/40 rounded-2xl p-3 divide-y divide-cream-dark/10 dark:divide-charcoal/20">
                          {savedRecipes.map(item => {
                            const selected = cbRecipes.includes(item.recipe.id);
                            return (
                              <div
                                key={item.recipe.id}
                                onClick={() => toggleRecipeInCookbook(item.recipe.id)}
                                className="flex items-center justify-between py-2 text-xs cursor-pointer hover:bg-cream/40"
                              >
                                <span className="font-semibold">{item.recipe.title}</span>
                                <span className={`h-4 w-4 border rounded flex items-center justify-center ${selected ? 'bg-saffron border-saffron text-white' : ''}`}>
                                  {selected && <Check size={10} />}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateCookbook(false)}
                        className="rounded-full border border-cream-dark/40 py-2.5 px-6 text-xs font-bold text-charcoal dark:border-charcoal-light/30"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-full bg-saffron py-2.5 px-6 text-xs font-bold text-white shadow"
                      >
                        Save Collection
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Cookbooks Grid */}
              {cookbooks.length === 0 ? (
                <div className="text-center py-12 rounded-3xl bg-cream-light/30 border border-dashed border-cream-dark/30 text-xs text-gray-400">
                  📁 No collections created yet. Build a cookbook to save favorite regional dishes!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {cookbooks.map(cb => (
                    <div
                      key={cb.id}
                      className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-5 space-y-4 shadow-sm"
                    >
                      <div>
                        <h4 className="text-base font-bold leading-tight">{cb.name}</h4>
                        <p className="text-[11px] text-gray-400 leading-normal line-clamp-1">{cb.description || 'No description provided.'}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 border-t border-cream-dark/10 dark:border-charcoal/20 pt-3">
                        <span>{cb.recipes.length} Recipes</span>
                        <span className="uppercase text-saffron bg-saffron/10 px-2 py-0.5 rounded">
                          {cb.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* C. SUBMITTED RECIPES */}
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold font-display">My Recipe Submissions</h3>
                <p className="text-[11px] text-gray-400">Review status and approval queue details.</p>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 rounded-3xl bg-cream-light/30 border border-dashed border-cream-dark/30 text-xs text-gray-400 space-y-3">
                  <p>You haven't uploaded any recipes yet.</p>
                  <Link
                    to="/submit-recipe"
                    className="inline-block rounded-full bg-saffron px-6 py-2 text-xs font-bold text-white shadow"
                  >
                    Submit a Recipe
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-cream-dark/20 dark:divide-charcoal/30 bg-cream-light dark:bg-charcoal-light rounded-3xl border border-cream-dark/15 dark:border-charcoal-light/5 overflow-hidden shadow-sm">
                  {submissions.map(recipe => (
                    <div 
                      key={recipe.id}
                      className="flex items-center justify-between p-4 hover:bg-cream/20"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={recipe.coverImageUrl}
                          alt={recipe.title}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-bold leading-normal dark:text-cream-light">
                            {recipe.title}
                          </h4>
                          <p className="text-[9px] text-gray-400">
                            Cuisine: {recipe.cuisineType} | Flag: {getFlagEmoji(recipe.originCountry)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${statusBadgeClass(recipe.status)}`}>
                          {recipe.status}
                        </span>
                        <Link
                          to={`/recipes/${recipe.id}`}
                          className="rounded-full bg-cream-dark/20 dark:bg-charcoal/40 px-3 py-1 text-[10px] font-bold"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* D. MY REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold font-display">My Submitted Reviews</h3>
                <p className="text-[11px] text-gray-400">All ratings and feedback comments you have submitted.</p>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-12 rounded-3xl bg-cream-light/30 border border-dashed border-cream-dark/30 text-xs text-gray-400">
                  💬 You haven't left any reviews for recipes yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div
                      key={rev.id}
                      className="rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-5 space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold leading-normal text-saffron">
                          Recipe: <Link to={`/recipes/${rev.recipeId}`} className="hover:underline">{rev.recipe?.title || 'Unknown Recipe'}</Link>
                        </h4>
                        <StarRating rating={rev.rating} size={12} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal pl-1">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* E. BROWSING HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold font-display">Browsing History</h3>
                <p className="text-[11px] text-gray-400">Your 10 most recently viewed recipes.</p>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 rounded-3xl bg-cream-light/30 border border-dashed border-cream-dark/30 text-xs text-gray-400">
                  ⏳ Browsing history is empty. Go find some recipes!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {history.map(item => (
                    <Link
                      key={item.recipeId}
                      to={`/recipes/${item.recipeId}`}
                      className="flex items-center gap-3 rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-3 shadow-sm hover:scale-[1.01] transition-transform"
                    >
                      <img
                        src={item.recipe.coverImageUrl}
                        alt={item.recipe.title}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold leading-normal dark:text-cream-light line-clamp-1">
                          {item.recipe.title}
                        </h4>
                        <p className="text-[9px] text-gray-400">
                          {item.recipe.cuisineType} | Viewed: {new Date(item.viewedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* F. NOTIFICATIONS PANEL */}
          {activeTab === 'notifications' && (
            <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h3 className="text-xl font-bold font-display">Notification Preferences</h3>
                <p className="text-[11px] text-gray-400">Control how FlavorAtlas interacts with your mailbox.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="n1" defaultChecked className="mt-1 h-4 w-4 accent-saffron" />
                  <div>
                    <label htmlFor="n1" className="text-xs font-bold">Email me Cuisine of the Day Spotlight</label>
                    <p className="text-[10px] text-gray-400">Receive a daily selected recipe from around the world.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="n2" defaultChecked className="mt-1 h-4 w-4 accent-saffron" />
                  <div>
                    <label htmlFor="n2" className="text-xs font-bold">Email me when my submitted recipes are approved</label>
                    <p className="text-[10px] text-gray-400">Get notified when moderator approves your submissions.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="n3" className="mt-1 h-4 w-4 accent-saffron" />
                  <div>
                    <label htmlFor="n3" className="text-xs font-bold">Weekly Newsletter digests</label>
                    <p className="text-[10px] text-gray-400">Receive weekly compilation of trending food discussions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
};

export default Dashboard;
