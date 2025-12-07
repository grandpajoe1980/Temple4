import React from 'react';
import Image from 'next/image';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
  alt?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

const sizePx: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

/**
 * Avatar component with fallback to initials when no image is provided.
 * Accessible and optimized for Next.js Image component.
 */
export function Avatar({ src, name, size = 'md', className = '', alt }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const dimensions = sizePx[size];
  
  // Generate initials from name
  const initials = name
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  // Generate a consistent color based on name
  const getColorFromName = (name?: string): string => {
    if (!name) return 'bg-primary';
    const colors = [
      'bg-amber-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const bgColor = getColorFromName(name);

  if (src) {
    // Check if it's an external URL or local path
    const isExternal = src.startsWith('http://') || src.startsWith('https://');
    
    if (isExternal) {
      // Use regular img for external URLs to avoid Next.js image domain config issues
      return (
        <img
          src={src}
          alt={alt || name || 'User avatar'}
          className={`rounded-full object-cover ${sizeClass} ${className}`}
          width={dimensions}
          height={dimensions}
        />
      );
    }
    
    return (
      <Image
        src={src}
        alt={alt || name || 'User avatar'}
        width={dimensions}
        height={dimensions}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  // Fallback to initials
  return (
    <div
      className={`rounded-full ${bgColor} text-white flex items-center justify-center font-medium ${sizeClass} ${className}`}
      role="img"
      aria-label={alt || name || 'User avatar'}
    >
      {initials}
    </div>
  );
}

export default Avatar;
