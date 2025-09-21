import React from 'react';

interface AnimatedLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'gradient1' | 'gradient2';
}

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({ 
  size = 'md', 
  className = '',
  variant = 'gradient1'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-12 h-6',
    lg: 'w-16 h-8'
  };

  const sizeValues = {
    sm: { width: '32', height: '14.32' },
    md: { width: '48', height: '21.48' },
    lg: { width: '64', height: '28.64' }
  };

  const currentSize = sizeValues[size];

  return (
    <div className={`animated-loader flex items-center justify-center ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={currentSize.width} 
        height={currentSize.height} 
        viewBox="0 0 59.072 26.388"
        className={`${sizeClasses[size]}`}
      >
        <defs>
          {variant === 'gradient1' ? (
            <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#705bff" />
              <stop offset="33%" stopColor="#322c7e" />
              <stop offset="67%" stopColor="#7881da" />
              <stop offset="100%" stopColor="#52dfac" />
            </linearGradient>
          ) : (
            <linearGradient id="grad2" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#e23838" />
              <stop offset="33%" stopColor="#973999" />
              <stop offset="67%" stopColor="#009cdf" />
              <stop offset="100%" stopColor="#5ebd3e" />
            </linearGradient>
          )}
        </defs>
        <path 
          className="path" 
          stroke={variant === 'gradient1' ? "url(#grad1)" : "url(#grad2)"} 
          d="M281.3,267.819a11.944,11.944,0,0,1,0-23.888c10.85,0,21.834,23.888,32.684,23.888a11.944,11.944,0,0,0,0-23.888C303.171,243.931,292.109,267.819,281.3,267.819Z" 
          transform="translate(-268.104 -242.681)" 
        />
      </svg>
    </div>
  );
};

export default AnimatedLoader;
