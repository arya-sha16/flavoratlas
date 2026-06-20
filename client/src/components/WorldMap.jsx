import React, { useState } from 'react';
import { continentPaths } from './continentPaths.js';

export const WorldMap = ({ activeRegion = "", onSelectRegion }) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const regions = [
    {
      id: "Americas",
      label: "Americas",
      paths: continentPaths["Americas"] || [],
      badgeX: 190,
      badgeY: 410,
      description: "Tacos, Empanadas, BBQ, Clam Chowder & Maple Syrup"
    },
    {
      id: "Europe",
      label: "Europe",
      paths: continentPaths["Europe"] || [],
      badgeX: 420,
      badgeY: 330,
      description: "Pasta, Pizza, Coq au Vin, Tapas, Paella & Schnitzel"
    },
    {
      id: "Africa",
      label: "Africa",
      paths: continentPaths["Africa"] || [],
      badgeX: 460,
      badgeY: 530,
      description: "Berbere Curry, Tagine, Jollof Rice, Bobotie & Injera"
    },
    {
      id: "Middle East",
      label: "Middle East",
      paths: continentPaths["Middle East"] || [],
      badgeX: 520,
      badgeY: 440,
      description: "Hummus, Kebabs, Falafel, Shawarma & Baklava"
    },
    {
      id: "Asia",
      label: "Asia",
      paths: continentPaths["Asia"] || [],
      badgeX: 620,
      badgeY: 380,
      description: "Sushi, Ramen, Butter Chicken, Dim Sum, Kimchi & Pad Thai"
    },
    {
      id: "Oceania",
      label: "Oceania",
      paths: continentPaths["Oceania"] || [],
      badgeX: 720,
      badgeY: 580,
      description: "Pavlova, Meat Pies, Barramundi & Taro Root"
    }
  ];

  return (
    <div className="relative w-full overflow-hidden select-none bg-cream/30 dark:bg-charcoal/40 rounded-3xl border border-cream-dark/15 dark:border-charcoal-light/10 p-4 shadow-inner">
      
      {/* SVG Canvas representing stylized world map */}
      <svg 
        viewBox="30.767 241.591 784.077 458.627" 
        className="w-full h-auto max-h-[350px] transition-all duration-300"
      >
        {/* Background Graticule Lines (Stylized Grid for Premium Look) */}
        <g stroke="currentColor" className="text-cream-dark/15 dark:text-charcoal-light/10" strokeWidth="0.5" strokeDasharray="3 5" fill="none">
          {/* Latitude lines */}
          <line x1="30.767" y1="300" x2="814.844" y2="300" />
          <line x1="30.767" y1="350" x2="814.844" y2="350" />
          <line x1="30.767" y1="400" x2="814.844" y2="400" />
          <line x1="30.767" y1="450" x2="814.844" y2="450" />
          <line x1="30.767" y1="500" x2="814.844" y2="500" />
          <line x1="30.767" y1="550" x2="814.844" y2="550" />
          <line x1="30.767" y1="600" x2="814.844" y2="600" />
          <line x1="30.767" y1="650" x2="814.844" y2="650" />

          {/* Longitude lines */}
          <line x1="100" y1="241.591" x2="100" y2="700.218" />
          <line x1="200" y1="241.591" x2="200" y2="700.218" />
          <line x1="300" y1="241.591" x2="300" y2="700.218" />
          <line x1="400" y1="241.591" x2="400" y2="700.218" />
          <line x1="500" y1="241.591" x2="500" y2="700.218" />
          <line x1="600" y1="241.591" x2="600" y2="700.218" />
          <line x1="700" y1="241.591" x2="700" y2="700.218" />
          <line x1="800" y1="241.591" x2="800" y2="700.218" />
        </g>

        {/* Region Shapes */}
        <g>
          {regions.map((region) => {
            const isActive = activeRegion.toLowerCase() === region.id.toLowerCase();
            const isHovered = hoveredRegion && hoveredRegion.id === region.id;
            return (
              <g
                key={region.id}
                onClick={() => onSelectRegion(region.id)}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-pointer group"
              >
                {region.paths.map((p, idx) => (
                  <path
                    key={`${region.id}-${idx}`}
                    d={p}
                    className={`map-region ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                  />
                ))}
              </g>
            );
          })}
        </g>

        {/* Interactive Text Badges */}
        {regions.map((region) => {
          const isActive = activeRegion.toLowerCase() === region.id.toLowerCase();
          const isHovered = hoveredRegion && hoveredRegion.id === region.id;
          return (
            <g 
              key={`label-${region.id}`}
              className="pointer-events-none"
            >
              {/* Badge Background */}
              <rect
                x={region.badgeX - 45}
                y={region.badgeY - 11}
                width="90"
                height="22"
                rx="11"
                className={`transition-colors duration-300 ${
                  isActive 
                    ? 'fill-saffron text-white' 
                    : isHovered 
                      ? 'fill-saffron/20 stroke-saffron stroke'
                      : 'fill-cream-light/80 dark:fill-charcoal-light/95 stroke-cream-dark/30 dark:stroke-charcoal/40 stroke'
                }`}
              />
              {/* Badge Text */}
              <text
                x={region.badgeX}
                y={region.badgeY + 4}
                textAnchor="middle"
                className={`font-sans text-[10px] font-bold ${
                  isActive ? 'fill-white' : 'fill-charcoal dark:fill-cream-light'
                }`}
              >
                {region.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Info Tooltip */}
      <div className="absolute bottom-4 left-4 right-4 h-14 rounded-2xl bg-cream-light/95 dark:bg-charcoal-light/95 border border-cream-dark/20 dark:border-charcoal/40 p-3 shadow-md backdrop-blur flex items-center justify-between transition-all duration-300">
        <div>
          <h4 className="text-xs font-bold text-saffron uppercase tracking-wider">
            {hoveredRegion ? hoveredRegion.label : (activeRegion ? activeRegion : "Interactive Culinary Map")}
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
            {hoveredRegion ? hoveredRegion.description : (activeRegion ? `Explore typical recipes from the ${activeRegion} region.` : "Hover over or click a continent to discover regional flavors!")}
          </p>
        </div>
        {hoveredRegion && (
          <span className="text-[10px] font-bold text-terracotta border border-terracotta/20 bg-terracotta/5 px-2 py-0.5 rounded-full animate-pulse">
            Click to Filter
          </span>
        )}
      </div>
    </div>
  );
};

export default WorldMap;
