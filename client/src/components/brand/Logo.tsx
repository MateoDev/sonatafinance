import React from 'react';

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  mono?: boolean;
};

/**
 * Sonata Logo Component
 * Creates the logo exactly as seen in the uploaded image:
 * "Sonata" with 3 curved vertical lines like the contactless payment symbol
 */
export default function Logo({ 
  className = "", 
  size = "md", 
  variant = "full",
  mono = false 
}: LogoProps) {
  // Set dimensions based on size
  const dimensions = {
    sm: { height: 24, width: variant === "icon" ? 24 : 100 },
    md: { height: 32, width: variant === "icon" ? 32 : 130 },
    lg: { height: 40, width: variant === "icon" ? 40 : 160 },
    xl: { height: 48, width: variant === "icon" ? 48 : 200 },
  };

  const { height, width } = dimensions[size];
  
  // Base colors
  const primaryColor = mono ? "#FFFFFF" : "#000000";
  
  // Icon-only variant (the 3 curved vertical lines like contactless payment)
  if (variant === "icon") {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Three curved vertical lines like contactless payment symbol */}
        <path 
          d="M8 6C8 10 8 14 8 18" 
          stroke={primaryColor} 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M12 4C12 9 12 15 12 20" 
          stroke={primaryColor} 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M16 6C16 10 16 14 16 18" 
          stroke={primaryColor} 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  
  // Text-only variant (just the word "Sonata")
  if (variant === "text") {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <text
          x="0"
          y="18"
          fontFamily="SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="20"
          fontWeight="500"
          fill={primaryColor}
        >
          Sonata
        </text>
      </svg>
    );
  }
  
  // Full logo (icon + text)
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 130 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* The 3 curved vertical lines */}
      <g transform="translate(5, 4)">
        <path 
          d="M4 6C4 10 4 14 4 18" 
          stroke={primaryColor} 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M9 4C9 9 9 15 9 20" 
          stroke={primaryColor} 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M14 6C14 10 14 14 14 18" 
          stroke={primaryColor} 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      
      {/* Sonata text */}
      <text
        x="30"
        y="20"
        fontFamily="SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="18"
        fontWeight="500" 
        fill={primaryColor}
      >
        Sonata
      </text>
    </svg>
  );
}