import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 mb-2 font-medium">{label}</Text>
      )}
      <TextInput
        className={cn(
          'bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
          error && 'border-red-500',
          className
        )}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}