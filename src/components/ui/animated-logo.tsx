/**
 * Animated Orchestrator Logo - Professional Loading Animation
 * 
 * Features:
 * - Rotating gear animation
 * - Flowing data particles along connection paths
 * - Pulsing workflow nodes
 * - Smooth, professional animations
 */

import React from 'react';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function AnimatedLogo({ 
  className = '', 
  size = 'md',
  showText = true 
}: AnimatedLogoProps) {
  const sizeMap = {
    sm: { width: 200, height: 150, scale: 0.5 },
    md: { width: 300, height: 225, scale: 0.75 },
    lg: { width: 400, height: 300, scale: 1 },
    xl: { width: 500, height: 375, scale: 1.25 }
  };

  const { width, height, scale } = sizeMap[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 400 300" 
        width={width} 
        height={height}
        className="drop-shadow-lg"
      >
        {/* Background with subtle animation */}
        <rect 
          width="400" 
          height="300" 
          fill="#ffffff" 
          rx="20" 
          ry="20"
          className="animate-pulse"
          style={{
            animationDuration: '3s',
            animationTimingFunction: 'ease-in-out'
          }}
        />
        
        {/* Main logo element */}
        <g transform={`translate(70, 100) scale(${scale})`}>
          {/* Connection lines with flowing gradient */}
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CC3333" stopOpacity="0.3">
                <animate 
                  attributeName="stop-opacity" 
                  values="0.3;1;0.3" 
                  dur="2s" 
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#FF5555" stopOpacity="0.8">
                <animate 
                  attributeName="stop-opacity" 
                  values="0.8;0.4;0.8" 
                  dur="2s" 
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#CC3333" stopOpacity="0.3">
                <animate 
                  attributeName="stop-opacity" 
                  values="0.3;1;0.3" 
                  dur="2s" 
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
          
          <path 
            d="M50,50 L120,20 L190,50 L260,20" 
            stroke="url(#flowGradient)"
            strokeWidth="5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Animated gear element */}
          <g transform="translate(35, 50)">
            <g className="origin-center">
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0"
                to="360"
                dur="4s"
                repeatCount="indefinite"
              />
              
              <circle cx="0" cy="0" r="22" fill="#CC3333">
                <animate 
                  attributeName="r" 
                  values="22;24;22" 
                  dur="3s" 
                  repeatCount="indefinite"
                />
              </circle>
              
              <circle cx="0" cy="0" r="10" fill="#ffffff"/>
              
              {/* Gear teeth */}
              <path 
                d="M0,-28 L0,-18 M14,-24 L9,-15 M24,-14 L15,-9 M28,0 L18,0 M24,14 L15,9 M14,24 L9,15 M0,28 L0,18 M-14,24 L-9,15 M-24,14 L-15,9 M-28,0 L-18,0 M-24,-14 L-15,-9 M-14,-24 L-9,-15" 
                stroke="#CC3333" 
                strokeWidth="6" 
                strokeLinecap="round"
              />
            </g>
          </g>
          
          {/* Pulsing flow nodes */}
          <circle cx="120" cy="20" r="18" fill="#CC3333">
            <animate 
              attributeName="r" 
              values="18;20;18" 
              dur="2.5s" 
              repeatCount="indefinite"
              begin="0s"
            />
            <animate 
              attributeName="fill-opacity" 
              values="1;0.7;1" 
              dur="2.5s" 
              repeatCount="indefinite"
            />
          </circle>
          
          <circle cx="190" cy="50" r="18" fill="#CC3333">
            <animate 
              attributeName="r" 
              values="18;20;18" 
              dur="2.5s" 
              repeatCount="indefinite"
              begin="0.8s"
            />
            <animate 
              attributeName="fill-opacity" 
              values="1;0.7;1" 
              dur="2.5s" 
              repeatCount="indefinite"
              begin="0.8s"
            />
          </circle>
          
          <circle cx="260" cy="20" r="18" fill="#CC3333">
            <animate 
              attributeName="r" 
              values="18;20;18" 
              dur="2.5s" 
              repeatCount="indefinite"
              begin="1.6s"
            />
            <animate 
              attributeName="fill-opacity" 
              values="1;0.7;1" 
              dur="2.5s" 
              repeatCount="indefinite"
              begin="1.6s"
            />
          </circle>
          
          {/* Flowing data particles */}
          <circle r="4" fill="#FF5555">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M50,50 L120,20 L190,50 L260,20"
            />
            <animate 
              attributeName="fill-opacity" 
              values="0;1;1;0" 
              dur="3s" 
              repeatCount="indefinite"
            />
          </circle>
          
          <circle r="4" fill="#FF5555">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M50,50 L120,20 L190,50 L260,20"
              begin="1s"
            />
            <animate 
              attributeName="fill-opacity" 
              values="0;1;1;0" 
              dur="3s" 
              repeatCount="indefinite"
              begin="1s"
            />
          </circle>
          
          <circle r="4" fill="#FF5555">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M50,50 L120,20 L190,50 L260,20"
              begin="2s"
            />
            <animate 
              attributeName="fill-opacity" 
              values="0;1;1;0" 
              dur="3s" 
              repeatCount="indefinite"
              begin="2s"
            />
          </circle>
        </g>
        
        {/* Company name with subtle animation */}
        {showText && (
          <text 
            x="200" 
            y="190" 
            fontFamily="ui-sans-serif, system-ui, sans-serif" 
            fontSize="32" 
            fontWeight="bold" 
            textAnchor="middle" 
            fill="#000000"
            className="select-none"
          >
            <animate 
              attributeName="fill-opacity" 
              values="0.7;1;0.7" 
              dur="4s" 
              repeatCount="indefinite"
            />
            ORCHESTRATOR
          </text>
        )}
      </svg>
    </div>
  );
}

export default AnimatedLogo;