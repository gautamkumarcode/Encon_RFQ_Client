import React from 'react';

interface EnconLogoProps {
  className?: string;
  size?: number;
  alt?: string;
}

export const EnconLogo: React.FC<EnconLogoProps> = ({
  className = 'w-8 h-8',
  size = 32,
  alt = 'ENCON Logo',
}) => {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
};
