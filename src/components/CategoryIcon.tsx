import React from 'react';
import * as Lucide from 'lucide-react';

interface CategoryIconProps {
  name?: string;
  className?: string;
}

export default function CategoryIcon({ name, className = 'w-4 h-4' }: CategoryIconProps) {
  if (!name) {
    return <Lucide.Sparkles className={className} />;
  }

  // Lookup the component from the Lucide object (case-insensitive or exact)
  // Standardize naming to PascalCase (e.g., 'home' -> 'Home', 'utensils-crossed' -> 'UtensilsCrossed')
  const formattedName = name
    .trim()
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  const IconComponent = (Lucide as any)[formattedName] || (Lucide as any)[name] || Lucide.Sparkles;

  return <IconComponent className={className} />;
}

// Export a list of popular icons so admins can select from them easily
export const POPULAR_ICONS = [
  'Home',
  'Sparkles',
  'Droplet',
  'Leaf',
  'Wrench',
  'Scissors',
  'Hammer',
  'Brush',
  'Car',
  'Laptop',
  'BookOpen',
  'Smile',
  'Compass',
  'UtensilsCrossed',
  'Shirt',
  'Gift',
  'Heart',
  'Camera',
  'Shield',
  'Star',
  'Tv',
  'Coffee',
  'Palette',
  'Music'
];
