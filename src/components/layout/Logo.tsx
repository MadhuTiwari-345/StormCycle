import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function Logo({ className = '', size = 32, showText = true, variant = 'dark' }: LogoProps) {
  const textColor = variant === 'dark' ? 'text-storm-text' : 'text-white';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Petals */}
        <ellipse cx="50" cy="20" rx="10" ry="20" fill="#6B1A3A" /> {/* Top */}
        <ellipse cx="50" cy="80" rx="10" ry="20" fill="#E8D5DF" /> {/* Bottom */}
        <ellipse cx="20" cy="50" rx="20" ry="10" fill="#A46E82" /> {/* Left */}
        <ellipse cx="80" cy="50" rx="20" ry="10" fill="#6B1A3A" /> {/* Right */}
        
        {/* Diagonal Petals */}
        <g transform="rotate(45 50 50)">
          <ellipse cx="50" cy="20" rx="10" ry="20" fill="#A46E82" />
          <ellipse cx="50" cy="80" rx="10" ry="20" fill="#6B1A3A" />
          <ellipse cx="20" cy="50" rx="20" ry="10" fill="#E8D5DF" />
          <ellipse cx="80" cy="50" rx="20" ry="10" fill="#A46E82" />
        </g>

        {/* Center Circle */}
        <circle cx="50" cy="50" r="18" fill="#1A0A10" />
        
        {/* Moon Crescent */}
        <path 
          d="M58 42C58 48.6274 52.6274 54 46 54C43.5 54 41.5 53.5 39.5 52.5C43.5 51.5 46.5 47.5 46.5 43C46.5 38.5 43.5 34.5 39.5 33.5C41.5 32.5 43.5 32 46 32C52.6274 32 58 37.3726 58 42Z" 
          fill="white" 
        />
        <circle cx="42" cy="42" r="3" fill="white" opacity="0.3" />
      </svg>
      
      {showText && (
        <span className={`font-serif text-xl font-bold tracking-[0.2em] uppercase ${textColor}`}>
          StormCycle
        </span>
      )}
    </div>
  );
}
