import React, { useState } from 'react';

export const WorldMap = ({ activeRegion = "", onSelectRegion }) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Continent definitions, vector paths, labels, and coordinates for badges
  const regions = [
    {
      id: "Americas",
      label: "Americas",
      path: "M 80 80 Q 40 120 70 200 T 130 320 Q 140 280 160 220 T 170 140 Q 150 70 80 80 Z",
      badgeX: 105,
      badgeY: 180,
      description: "Tacos, Empanadas, BBQ & Maple Syrup"
    },
    {
      id: "Europe",
      label: "Europe",
      path: "M 220 70 Q 260 50 300 80 T 260 130 Q 230 130 210 110 Z",
      badgeX: 250,
      badgeY: 90,
      description: "Pasta, Coq au Vin, Tapas & Schnitzel"
    },
    {
      id: "Africa",
      label: "Africa",
      path: "M 220 140 Q 280 130 290 190 T 260 280 Q 220 250 200 200 Z",
      badgeX: 245,
      badgeY: 200,
      description: "Berbere, Tagine, Jollof & Injera"
    },
    {
      id: "Middle East",
      label: "Middle East",
      path: "M 290 115 Q 320 100 330 130 T 300 160 Z",
      badgeX: 310,
      badgeY: 135,
      description: "Hummus, Kebabs, Shawarma & Baklava"
    },
    {
      id: "Asia",
      label: "Asia",
      path: "M 320 60 Q 420 50 450 110 T 380 200 Q 330 170 330 120 Z",
      badgeX: 380,
      badgeY: 110,
      description: "Sushi, Curry, Dim Sum, Kimchi & Pad Thai"
    },
    {
      id: "Oceania",
      label: "Oceania",
      path: "M 420 220 Q 460 210 470 240 T 430 270 Z",
      badgeX: 445,
      badgeY: 245,
      description: "Pavlova, Meat Pies & Taro Root"
    }
  ];

  return (
    <div className="relative w-full overflow-hidden select-none bg-cream/30 dark:bg-charcoal/40 rounded-3xl border border-cream-dark/15 dark:border-charcoal-light/10 p-4 shadow-inner">
      
      {/* SVG Canvas representing stylized world map */}
      <svg 
        viewBox="0 0 540 360" 
        className="w-full h-auto max-h-[350px] transition-all duration-300"
      >
        {/* Background Graticule Lines (Stylized Lines for Premium Look) */}
        <g stroke="currentColor" className="text-cream-dark/10 dark:text-charcoal-light/20" strokeWidth="0.5" fill="none">
          <circle cx="270" cy="180" r="160" />
          <circle cx="270" cy="180" r="110" />
          <circle cx="270" cy="180" r="60" />
          <line x1="270" y1="20" x2="270" y2="340" />
          <line x1="20" y1="180" x2="520" y2="180" />
        </g>

        {/* Region Shapes */}
        <g>
          {regions.map((region) => {
            const isActive = activeRegion.toLowerCase() === region.id.toLowerCase();
            return (
              <path
                key={region.id}
                d={region.path}
                className={`map-region ${isActive ? 'active' : ''}`}
                onClick={() => onSelectRegion(region.id)}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
            );
          })}
        </g>

        {/* Interactive Text Badges */}
        {regions.map((region) => {
          const isActive = activeRegion.toLowerCase() === region.id.toLowerCase();
          return (
            <g 
              key={`label-${region.id}`}
              className="pointer-events-none"
            >
              {/* Badge Background */}
              <rect
                x={region.badgeX - 35}
                y={region.badgeY - 10}
                width="70"
                height="20"
                rx="10"
                className={`transition-colors duration-300 ${
                  isActive 
                    ? 'fill-saffron text-white' 
                    : 'fill-cream-light/80 dark:fill-charcoal-light/95 stroke-cream-dark/30 dark:stroke-charcoal/40 stroke'
                }`}
              />
              {/* Badge Text */}
              <text
                x={region.badgeX}
                y={region.badgeY + 4}
                textAnchor="middle"
                className={`font-sans text-[9px] font-bold ${
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
