/**
 * Animated Logo Icon - Compact version for headers and navigation
 * 
 * Features:
 * - Simplified gear-based design
 * - Rotating animation
 * - Small footprint for headers/nav
 * - Multiple size variants
 */

import React from 'react';

interface AnimatedLogoIconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function AnimatedLogoIcon({ 
  className = '', 
  size = 'md'
}: AnimatedLogoIconProps) {
  const sizeMap = {
    xs: 20,
    sm: 24,
    md: 32,
    lg: 40
  };

  const iconSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 80 80" 
        width={iconSize} 
        height={iconSize}
        className="drop-shadow-sm"
      >
        {/* Background circle */}
        <circle 
          cx="40" 
          cy="40" 
          r="36" 
          fill="#ffffff" 
          stroke="#CC3333" 
          strokeWidth="2"
        />
        
        {/* Animated gear */}
        <g transform="translate(40, 40)">
          <g>
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0"
              to="360"
              dur="3s"
              repeatCount="indefinite"
            />
            
            {/* Main gear body */}
            <circle cx="0" cy="0" r="18" fill="#CC3333">
              <animate 
                attributeName="r" 
                values="18;20;18" 
                dur="2s" 
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Center hole */}
            <circle cx="0" cy="0" r="8" fill="#ffffff"/>
            
            {/* Gear teeth */}
            <path 
              d="M0,-22 L0,-16 M11,-19 L7,-13 M19,-11 L13,-7 M22,0 L16,0 M19,11 L13,7 M11,19 L7,13 M0,22 L0,16 M-11,19 L-7,13 M-19,11 L-13,7 M-22,0 L-16,0 M-19,-11 L-13,-7 M-11,-19 L-7,-13" 
              stroke="#CC3333" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
          </g>
        </g>
        
        {/* Flow indicators */}
        <circle r="2" fill="#FF5555">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M15,40 Q40,20 65,40 Q40,60 15,40"
          />
          <animate 
            attributeName="fill-opacity" 
            values="0.3;1;0.3" 
            dur="2s" 
            repeatCount="indefinite"
          />
        </circle>
        
        <circle r="2" fill="#FF5555">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M15,40 Q40,20 65,40 Q40,60 15,40"
            begin="0.7s"
          />
          <animate 
            attributeName="fill-opacity" 
            values="0.3;1;0.3" 
            dur="2s" 
            repeatCount="indefinite"
            begin="0.7s"
          />
        </circle>
        
        <circle r="2" fill="#FF5555">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M15,40 Q40,20 65,40 Q40,60 15,40"
            begin="1.4s"
          />
          <animate 
            attributeName="fill-opacity" 
            values="0.3;1;0.3" 
            dur="2s" 
            repeatCount="indefinite"
            begin="1.4s"
          />
        </circle>
      </svg>
    </div>
  );
}

export default AnimatedLogoIcon;