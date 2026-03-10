import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  BarChart3,
  Calendar,
  Delete,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
} from 'lucide-react-native';

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'plus': Plus,
  'bar-chart-3': BarChart3,
  'calendar': Calendar,
  'delete': Delete,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'file-text': FileText,
  'download': Download,
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  backgroundColor?: string;
}

export function Icon({ 
  name, 
  size = 24, 
  color = '#000', 
  className,
  backgroundColor 
}: IconProps) {
  const nameStr = String(name);
  
  if (nameStr.length === 1 || (nameStr.length <= 3 && /[\p{Emoji}]/u.test(nameStr))) {
    return (
      <View 
        className={cn(
          'items-center justify-center',
          backgroundColor && 'rounded-full',
          className
        )}
        style={backgroundColor ? { backgroundColor, width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75 } : {}}
      >
        <Text style={{ fontSize: size }}>{nameStr}</Text>
      </View>
    );
  }
  
  const LucideIcon = iconMap[nameStr];
  if (LucideIcon) {
    return (
      <View 
        className={cn(
          'items-center justify-center',
          backgroundColor && 'rounded-full',
          className
        )}
        style={backgroundColor ? { backgroundColor, width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75 } : {}}
      >
        <LucideIcon size={size} color={color} />
      </View>
    );
  }
  
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