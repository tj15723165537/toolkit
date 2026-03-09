import { icons } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type IconName = keyof typeof icons;

interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  className?: string;
  backgroundColor?: string;
}

// For emoji icons (fallback)
export function Icon({ 
  name, 
  size = 24, 
  color = '#000', 
  className,
  backgroundColor 
}: IconProps) {
  // Check if it's an emoji (non-lucide icon)
  if (name.length === 1 || (name.length <= 3 && /[\p{Emoji}]/u.test(name))) {
    return (
      <View 
        className={cn(
          'items-center justify-center',
          backgroundColor && 'rounded-full',
          className
        )}
        style={backgroundColor ? { backgroundColor, width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75 } : {}}
      >
        <Text style={{ fontSize: size }}>{name}</Text>
      </View>
    );
  }
  
  // Try to use lucide icon
  try {
    const LucideIcon = icons[name as IconName];
    if (LucideIcon) {
      const IconComponent = LucideIcon;
      return (
        <View 
          className={cn(
            'items-center justify-center',
            backgroundColor && 'rounded-full',
            className
          )}
          style={backgroundColor ? { backgroundColor, width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75 } : {}}
        >
          <IconComponent size={size * 0.7} color={color} />
        </View>
      );
    }
  } catch (error) {
    // Fallback to text
  }
  
  // Fallback to text
  return (
    <View 
      className={cn(
        'items-center justify-center',
        backgroundColor && 'rounded-full',
        className
      )}
      style={backgroundColor ? { backgroundColor, width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75 } : {}}
    >
      <Text style={{ fontSize: size * 0.8, color }}>📦</Text>
    </View>
  );
}