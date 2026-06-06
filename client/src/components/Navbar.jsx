import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut, LayoutDashboard, PlusCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold tracking-wide transition-colors ${
      isActive 
        ? 'text-saffron' 
        : 'text-charcoal-light hover:text-saffron dark:text-cream-dark dark:hover:text-saffron'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-cream-light/95 dark:bg-charcoal/95 border-b border-cream-dark/20 dark:border-charcoal-light/10 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-saffron uppercase font-display">
              Flavor<span className="text-terracotta">Atlas</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            <NavLink to="/search" className={navLinkClass}>Search Recipes</NavLink>
            <NavLink to="/submit-recipe" className={navLinkClass}>Submit Recipe</NavLink>
            
            {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="flex items-center gap-1 text-terracotta dark:text-terracotta-light">
                  <ShieldAlert size={14} /> Admin
                </span>
              </NavLink>
            )}
          </div>

          {/* Desktop Controls (Dark Mode + Auth Status) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-charcoal hover:bg-cream-dark/30 dark:text-cream-light dark:hover:bg-charcoal-light/40 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              // Logged In User Dropdown
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-cream-dark/30 dark:border-charcoal-light/30 px-3 py-1.5 text-sm font-medium hover:bg-cream-dark/20 dark:hover:bg-charcoal-light/20 transition-all"
                >
                  <img
                    src={user.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60`}
                    alt={user.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                </button>

                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal/40 p-2 shadow-lg ring-1 ring-black/5 z-20">
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-charcoal-light hover:bg-cream/50 dark:text-cream-dark dark:hover:bg-charcoal/50"
                      >
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <Link
                        to="/submit-recipe"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-charcoal-light hover:bg-cream/50 dark:text-cream-dark dark:hover:bg-charcoal/50"
                      >
                        <PlusCircle size={15} /> Submit Recipe
                      </Link>
                      <hr className="my-1 border-cream-dark/20 dark:border-charcoal/30" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Login / Sign Up buttons
              <Link
                to="/auth"
                className="rounded-full bg-saffron px-5 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-charcoal dark:text-cream-light"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-full p-2 text-charcoal hover:bg-cream-dark/30 dark:text-cream-light dark:hover:bg-charcoal-light/40"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="md:hidden border-t border-cream-dark/20 dark:border-charcoal-light/10 bg-cream-light dark:bg-charcoal px-4 py-4 space-y-3 shadow-lg">
          <NavLink 
            to="/" 
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-semibold hover:bg-cream dark:hover:bg-charcoal-light"
          >
            Home
          </NavLink>
          <NavLink 
            to="/search" 
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-semibold hover:bg-cream dark:hover:bg-charcoal-light"
          >
            Search Recipes
          </NavLink>
          <NavLink 
            to="/submit-recipe" 
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-semibold hover:bg-cream dark:hover:bg-charcoal-light"
          >
            Submit Recipe
          </NavLink>
          
          {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
            <NavLink 
              to="/admin" 
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-semibold text-terracotta hover:bg-cream dark:hover:bg-charcoal-light"
            >
              Admin Dashboard
            </NavLink>
          )}

          <hr className="border-cream-dark/20 dark:border-charcoal-light/20" />

          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1">
                <img
                  src={user.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60`}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-bold">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-cream dark:hover:bg-charcoal-light"
              >
                My Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={() => setIsOpen(false)}
              className="block rounded-full bg-saffron text-center py-2.5 text-sm font-bold text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
