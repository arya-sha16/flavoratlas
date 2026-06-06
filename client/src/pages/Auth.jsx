import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Globe, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();

  // Tab: login | register | forgot
  const [tab, setTab] = useState("login");
  
  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  
  // Feedback states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Email verification token handling
  const [verifying, setVerifying] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Handle email verification token or OAuth redirect token on mount
  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");
    const verifyMode = window.location.pathname.includes("verify-email");
    const resetMode = window.location.pathname.includes("reset-password");

    if (verifyMode && token) {
      const verifyUserEmail = async () => {
        setVerifying(true);
        setError("");
        setSuccess("");
        try {
          const res = await api.get(`/auth/verify-email?token=${token}`);
          setSuccess(res.data.message || "Email verified successfully! You can now log in.");
          setTab("login");
        } catch (err) {
          setError(err.response?.data?.error || "Invalid or expired verification token.");
        } finally {
          setVerifying(false);
        }
      };
      verifyUserEmail();
    } else if (resetMode && token) {
      setTab("reset");
    } else if (token) {
      // Direct OAuth login token found
      localStorage.setItem('accessToken', token);
      // Force reload to let AuthContext capture user details
      window.location.href = '/dashboard';
    }
  }, [searchParams, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await register(name, email, password, country, dietaryPreferences);
      setSuccess(res.message || "Registration successful! Verification email sent.");
      setTab("login");
      setEmail("");
      setPassword("");
      setName("");
      setCountry("");
      setDietaryPreferences([]);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message || "If email exists in our logs, a reset link was sent.");
      setTab("login");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to trigger password reset request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const token = searchParams.get("token");
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setSuccess(res.data.message || "Password successfully updated! You can now log in.");
      setTab("login");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDietaryToggle = (item) => {
    setDietaryPreferences(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  const handleGoogleLogin = () => {
    // Redirect to backend passport auth endpoint or log mock
    const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <ShieldCheck size={48} className="text-saffron animate-pulse" />
        <h3 className="text-xl font-bold">Verifying Your Credentials...</h3>
        <p className="text-xs text-gray-400">Communicating with the database security servers.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal/40 p-8 shadow-md space-y-6">
        
        {/* Toggle Headings */}
        {tab !== 'forgot' && tab !== 'reset' && (
          <div className="flex border-b border-cream-dark/20 dark:border-charcoal/30">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-colors ${
                tab === 'login' ? 'border-saffron text-saffron' : 'border-transparent text-gray-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-colors ${
                tab === 'register' ? 'border-saffron text-saffron' : 'border-transparent text-gray-400'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Dynamic headings for reset/forgot */}
        {tab === 'forgot' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold font-display text-saffron">Forgot Password</h2>
            <p className="text-[11px] text-gray-400">Request a recovery link via email.</p>
          </div>
        )}
        {tab === 'reset' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold font-display text-saffron">Reset Password</h2>
            <p className="text-[11px] text-gray-400">Configure your new secure account password.</p>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-600 dark:text-red-400 font-semibold">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-3 text-xs text-green-700 dark:text-green-300 font-semibold">
            🎉 {success}
          </div>
        )}

        {/* A. LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-saffron"
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Password</label>
                <button
                  type="button"
                  onClick={() => setTab("forgot")}
                  className="text-[10px] font-bold text-terracotta hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-saffron"
                />
                <Lock size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-saffron py-3 text-xs font-bold text-white shadow hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* B. REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Atlas Chef"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-saffron"
                />
                <UserIcon size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="chef@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-saffron"
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-saffron"
                />
                <Lock size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Origin Country</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Mexico, Japan..."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-saffron"
                />
                <Globe size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* Dietary Preference Checkboxes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Dietary Preferences</label>
              <div className="grid grid-cols-3 gap-2">
                {["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Kosher", "Jain"].map(pref => {
                  const active = dietaryPreferences.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => handleDietaryToggle(pref)}
                      className={`rounded-lg py-1.5 text-center text-[10px] font-bold border transition-colors ${
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-saffron py-3 text-xs font-bold text-white shadow hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : 'Register'} <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* C. FORGOT PASSWORD FORM */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-saffron"
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTab("login")}
                className="flex-1 rounded-full border border-cream-dark/40 py-2.5 text-xs font-bold hover:bg-cream text-charcoal dark:border-charcoal-light/30"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-saffron py-2.5 text-xs font-bold text-white shadow"
              >
                {loading ? 'Sending...' : 'Request Link'}
              </button>
            </div>
          </form>
        )}

        {/* D. RESET PASSWORD FORM */}
        {tab === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-saffron"
                />
                <Lock size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-saffron py-3 text-xs font-bold text-white shadow hover:scale-[1.02] active:scale-95 transition-transform"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {/* Third Party Auth (Google OAuth Option) */}
        {tab !== 'reset' && (
          <div className="space-y-4 pt-4 border-t border-cream-dark/20 dark:border-charcoal/30">
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-cream-light dark:bg-charcoal px-2 text-gray-400">Or continue with</span>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full rounded-full border border-cream-dark/30 dark:border-charcoal-light/30 px-5 py-2.5 text-xs font-bold hover:bg-cream/40 text-charcoal dark:text-cream-light flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Account
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Auth;
