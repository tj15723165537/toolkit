import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  variant?: 'default' | 'skeuomorphic';
  children: React.ReactNode;
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-white rounded-xl p-4',
    skeuomorphic: `
      bg-white rounded-2xl p-4 
      border border-gray-200
      shadow-lg shadow-black/5
      border-b-2 border-b-gray-300/30
    `,
  };
  
  return (
    <View
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardContent({ className, children, ...props }: ViewProps) {
  return (
    <View className={cn('', className)} {...props}>
      {children}
    </View>
  );
}