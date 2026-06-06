import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [savedRecipeIds, setSavedRecipeIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync saved recipes when user is logged in
  useEffect(() => {
    const fetchUserAndSaved = async () => {
      if (!user) {
        setSavedRecipeIds([]);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/users/me');
        const userData = response.data;
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatarUrl: userData.avatarUrl,
          country: userData.country,
          dietaryPreferences: userData.dietaryPreferences,
          isVerified: userData.isVerified
        });
        localStorage.setItem('user', JSON.stringify({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatarUrl: userData.avatarUrl,
          country: userData.country,
          dietaryPreferences: userData.dietaryPreferences,
          isVerified: userData.isVerified
        }));

        // Extract saved recipe IDs
        const ids = userData.savedRecipes.map(sr => sr.recipeId);
        setSavedRecipeIds(ids);
      } catch (err) {
        console.error('Error syncing user profile on boot:', err.message);
        // If 401/403 session expired, reset state
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndSaved();
  }, [user?.id]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: loggedUser } = res.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (name, email, password, country, dietaryPreferences) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      country,
      dietaryPreferences
    });
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setSavedRecipeIds([]);
  };

  const toggleSaveRecipe = async (recipeId) => {
    if (!user) {
      // Direct users to login if not authenticated
      window.location.href = '/auth';
      return false;
    }

    const isSaved = savedRecipeIds.includes(recipeId);
    try {
      if (isSaved) {
        await api.delete(`/users/me/saved/${recipeId}`);
        setSavedRecipeIds(prev => prev.filter(id => id !== recipeId));
        return false;
      } else {
        await api.post(`/users/me/saved/${recipeId}`);
        setSavedRecipeIds(prev => [...prev, recipeId]);
        return true;
      }
    } catch (err) {
      console.error('Failed to toggle bookmark save status:', err.message);
      return isSaved;
    }
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/users/me', profileData);
    const updatedUser = res.data;
    setUser(prev => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      savedRecipeIds,
      toggleSaveRecipe,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
