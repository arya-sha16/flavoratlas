import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

// Pages
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitRecipe from './pages/SubmitRecipe.jsx';
import Admin from './pages/Admin.jsx';

// Protected Route components
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron border-t-transparent" />
        <p className="text-xs text-gray-400">Loading your profile...</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron border-t-transparent" />
        <p className="text-xs text-gray-400">Verifying administrative access...</p>
      </div>
    );
  }
  const hasAccess = user && (user.role === 'ADMIN' || user.role === 'MODERATOR');
  return hasAccess ? children : <Navigate to="/" replace />;
};

function AppContent() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-cream dark:bg-charcoal text-charcoal dark:text-cream-light transition-colors duration-300">
        
        {/* Navigation Header */}
        <Navbar />

        {/* Core Main Area */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            
            {/* Auth routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify-email" element={<Auth />} />
            <Route path="/reset-password" element={<Auth />} />

            {/* Authenticated user routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/submit-recipe" 
              element={
                <ProtectedRoute>
                  <SubmitRecipe />
                </ProtectedRoute>
              } 
            />

            {/* Administrative routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } 
            />

            {/* Wildcard redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
        
      </div>
    </Router>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
