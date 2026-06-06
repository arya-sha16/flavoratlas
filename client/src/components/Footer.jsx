import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Globe, Mail, ArrowRight } from 'lucide-react';

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <footer className="bg-cream-dark/30 dark:bg-charcoal-dark border-t border-cream-dark/20 dark:border-charcoal-light/10 pt-16 pb-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Logo & Info */}
          <div className="md:col-span-1 space-y-4">
            <span className="text-xl font-black tracking-tight text-saffron uppercase font-display">
              Flavor<span className="text-terracotta">Atlas</span>
            </span>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Discover every flavor on Earth. FlavorAtlas is a collaborative culinary discovery database connecting home chefs with traditional recipes across all 195+ countries.
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Globe size={14} className="text-saffron" />
              <span>195+ Countries Represented</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-saffron">Regions</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li><Link to="/search?region=Asia" className="hover:text-saffron">Asia</Link></li>
              <li><Link to="/search?region=Europe" className="hover:text-saffron">Europe</Link></li>
              <li><Link to="/search?region=Africa" className="hover:text-saffron">Africa</Link></li>
              <li><Link to="/search?region=Americas" className="hover:text-saffron">Americas</Link></li>
              <li><Link to="/search?region=Middle%20East" className="hover:text-saffron">Middle East</Link></li>
            </ul>
          </div>

          {/* Diets */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-saffron">Dietary Tags</h4>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li><Link to="/search?dietary=Vegan" className="hover:text-saffron">Vegan Recipes</Link></li>
              <li><Link to="/search?dietary=Vegetarian" className="hover:text-saffron">Vegetarian Recipes</Link></li>
              <li><Link to="/search?dietary=Gluten-Free" className="hover:text-saffron">Gluten-Free Recipes</Link></li>
              <li><Link to="/search?dietary=Halal" className="hover:text-saffron">Halal Recipes</Link></li>
              <li><Link to="/search?dietary=Kosher" className="hover:text-saffron">Kosher Recipes</Link></li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-saffron">Stay Curious</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Subscribe to get the Cuisine of the Day spotlights and trending recipes in your inbox.
            </p>

            {subscribed ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 text-xs text-green-700 dark:text-green-300 font-medium">
                🎉 Subscribed! Check your inbox for updates.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    placeholder="Enter email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-full border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light/60 dark:bg-charcoal px-4 py-2 pl-9 text-xs text-charcoal focus:border-saffron focus:outline-none dark:text-cream-light"
                  />
                  <Mail size={14} className="absolute left-3.5 top-2.5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-saffron text-white shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-cream-dark/20 dark:border-charcoal/30 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 gap-4">
          <p>© 2026 FlavorAtlas Discovery Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={10} className="fill-terracotta text-terracotta animate-pulse" /> for home chefs worldwide.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
