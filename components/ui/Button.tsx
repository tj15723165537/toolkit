import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { cn } from '@/lib/utils';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'default', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const variantClasses = {
    default: 'bg-blue-600 active:bg-blue-700',
    outline: 'bg-transparent border border-blue-600 active:bg-blue-50',
    ghost: 'bg-transparent active:bg-gray-100',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 rounded-lg',
    md: 'px-4 py-3 rounded-xl',
    lg: 'px-6 py-4 rounded-2xl',
  };
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  const textColorClasses = {
    default: 'text-white',
    outline: 'text-blue-600',
    ghost: 'text-gray-700',
  };
  
  return (
    <TouchableOpacity
      className={cn(
        'items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      activeOpacity={0.7}
      {...props}
    >
      <Text className={cn(
        'font-semibold',
        textSizeClasses[size],
        textColorClasses[variant]
      )}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}