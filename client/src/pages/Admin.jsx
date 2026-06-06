import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, Award, BookOpen, Clock, Check, X, UserMinus, UserCheck, Flame, PieChart } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getFlagEmoji } from '../utils/flags.js';

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Route protection
  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      navigate('/');
    }
  }, [user, navigate]);

  // Analytics & tables state
  const [stats, setStats] = useState(null);
  const [topRecipes, setTopRecipes] = useState([]);
  const [popularCuisines, setPopularCuisines] = useState([]);
  
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Load Analytics
      const analyticsRes = await api.get('/admin/analytics');
      setStats(analyticsRes.data.stats);
      setTopRecipes(analyticsRes.data.topRecipes || []);
      setPopularCuisines(analyticsRes.data.popularCuisines || []);

      // 2. Load Pending Recipes
      const pendingRes = await api.get('/admin/recipes/pending');
      setPendingRecipes(pendingRes.data);

      // 3. Load Users (Only admins can see users list)
      if (user?.role === 'ADMIN') {
        const usersRes = await api.get('/admin/users');
        setUsersList(usersRes.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err.message);
      setError("Failed to fetch administrative records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  // Recipe Moderation Handlers
  const handleApproveRecipe = async (id) => {
    try {
      await api.patch(`/admin/recipes/${id}/approve`);
      setPendingRecipes(prev => prev.filter(r => r.id !== id));
      // Reload stats
      const analyticsRes = await api.get('/admin/analytics');
      setStats(analyticsRes.data.stats);
    } catch (err) {
      alert("Failed to approve recipe.");
    }
  };

  const handleRejectRecipe = async (id) => {
    try {
      await api.patch(`/admin/recipes/${id}/reject`);
      setPendingRecipes(prev => prev.filter(r => r.id !== id));
      // Reload stats
      const analyticsRes = await api.get('/admin/analytics');
      setStats(analyticsRes.data.stats);
    } catch (err) {
      alert("Failed to reject recipe.");
    }
  };

  // User Moderation Handlers
  const handlePromoteUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/promote`);
      setUsersList(prev => prev.map(u => u.id === id ? { ...u, role: 'MODERATOR' } : u));
    } catch (err) {
      alert("Failed to promote user.");
    }
  };

  const handleBanUser = async (id) => {
    if (!window.confirm("Are you sure you want to ban and delete this user?")) return;
    try {
      await api.patch(`/admin/users/${id}/ban`);
      setUsersList(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert("Failed to ban user.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron border-t-transparent" />
        <p className="text-xs text-gray-400">Loading administrative dashboards...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-cream-dark/20 dark:border-charcoal-light/10 pb-6">
        <ShieldAlert size={28} className="text-saffron" />
        <div>
          <h2 className="text-2xl font-bold font-display">Administrative Center</h2>
          <p className="text-[11px] text-gray-400">Moderation queues, platform users, and global analytics.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-600 dark:text-red-400 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* 1. STATS METRICS WIDGET */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
              <Users size={18} className="text-saffron" />
            </div>
            <div className="text-2xl font-black">{stats.totalUsers}</div>
            <div className="text-[9px] text-gray-400">{stats.verifiedUsers} Verified Users</div>
          </div>

          <div className="rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Approved Recipes</span>
              <Award size={18} className="text-green-600" />
            </div>
            <div className="text-2xl font-black">{stats.approvedRecipes}</div>
            <div className="text-[9px] text-gray-400">Active global recipes</div>
          </div>

          <div className="rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Moderation Queue</span>
              <Clock size={18} className="text-terracotta" />
            </div>
            <div className="text-2xl font-black text-terracotta">{stats.pendingRecipes}</div>
            <div className="text-[9px] text-gray-400">Pending review uploads</div>
          </div>

          <div className="rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/15 dark:border-charcoal-light/5 p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Cookbooks</span>
              <BookOpen size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-black">{stats.totalCookbooks}</div>
            <div className="text-[9px] text-gray-400">Saved user collections</div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Recipe Queue (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Moderation Queue */}
          <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold font-display">Recipe Moderation Queue</h3>
              <p className="text-[11px] text-gray-400">Approve or reject recipe submissions.</p>
            </div>

            {pendingRecipes.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                🎉 Approval queue is empty. Good job!
              </div>
            ) : (
              <div className="divide-y divide-cream-dark/15 dark:divide-charcoal/20">
                {pendingRecipes.map(recipe => (
                  <div key={recipe.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={recipe.coverImageUrl}
                        alt={recipe.title}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold leading-normal dark:text-cream-light">
                          {recipe.title}
                        </h4>
                        <p className="text-[9px] text-gray-400">
                          By: {recipe.author?.name} | Cuisine: {recipe.cuisineType} | Flag: {getFlagEmoji(recipe.originCountry)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Link
                        to={`/recipes/${recipe.id}`}
                        target="_blank"
                        className="rounded-full border border-cream-dark/40 dark:border-charcoal-light/30 px-3.5 py-1.5 text-[10px] font-bold"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() => handleRejectRecipe(recipe.id)}
                        className="rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 p-2 border border-red-200 dark:border-red-900/30"
                        title="Reject Recipe"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => handleApproveRecipe(recipe.id)}
                        className="rounded-full bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 p-2 border border-green-200 dark:border-green-900/30"
                        title="Approve Recipe"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Management Table (Visible to ADMIN only) */}
          {user?.role === 'ADMIN' && (
            <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display">User Directory</h3>
                <p className="text-[11px] text-gray-400">Ban accounts or promote users to moderator status.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cream-dark/20 dark:border-charcoal/30 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-2.5">User</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Role</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark/10 dark:divide-charcoal/20 text-xs">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-cream/10">
                        <td className="py-3 font-semibold">{u.name}</td>
                        <td className="py-3 text-gray-400">{u.email}</td>
                        <td className="py-3 font-bold text-saffron uppercase text-[10px]">{u.role}</td>
                        <td className="py-3 text-right flex gap-1.5 justify-end">
                          {u.role === 'USER' && (
                            <button
                              onClick={() => handlePromoteUser(u.id)}
                              className="rounded bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 px-2 py-1 text-[10px] font-bold flex items-center gap-1"
                              title="Promote to Moderator"
                            >
                              <UserCheck size={10} /> Mod
                            </button>
                          )}
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleBanUser(u.id)}
                              className="rounded bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-2 py-1 text-[10px] font-bold flex items-center gap-1"
                              title="Ban and Delete User"
                            >
                              <UserMinus size={10} /> Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Analytics & Spotlight graphs (1/3 width) */}
        <div className="space-y-8">
          
          {/* Top Recipes views */}
          <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-black uppercase tracking-wider text-saffron flex items-center gap-1.5">
              <Flame size={16} /> Top Searched Recipes
            </h4>
            
            <div className="space-y-3.5">
              {topRecipes.map((recipe, idx) => (
                <div key={recipe.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="truncate max-w-[150px]">{idx+1}. {recipe.title}</span>
                    <span className="text-gray-400">{recipe.viewCount} views</span>
                  </div>
                  <div className="h-1.5 w-full bg-cream dark:bg-charcoal rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-saffron"
                      style={{ width: `${Math.min((recipe.viewCount / (topRecipes[0]?.viewCount || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Cuisines */}
          <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal-light/5 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-black uppercase tracking-wider text-saffron flex items-center gap-1.5">
              <PieChart size={16} /> Popular Cuisines
            </h4>
            
            <div className="space-y-3.5">
              {popularCuisines.map((item, idx) => (
                <div key={item.cuisine} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{idx+1}. {item.cuisine}</span>
                    <span className="text-gray-400">{item.recipeCount} recipes ({item.totalViews} views)</span>
                  </div>
                  <div className="h-1.5 w-full bg-cream dark:bg-charcoal rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-terracotta"
                      style={{ width: `${Math.min((item.recipeCount / (popularCuisines[0]?.recipeCount || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Admin;
