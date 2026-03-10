import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { formatMonth } from '@/utils/format';

interface AccountingHeaderProps {
  currentMonth: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onReportPress: () => void;
  onAddPress: () => void;
}

export function AccountingHeader({ 
  currentMonth, 
  onMonthChange, 
  onReportPress, 
  onAddPress 
}: AccountingHeaderProps) {
  return (
    <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>记账本</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            onPress={onReportPress}
            style={{ backgroundColor: '#dbeafe', padding: 8, borderRadius: 8 }}
          >
            <Icon name="bar-chart-3" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onAddPress}
            style={{ backgroundColor: '#d1fae5', padding: 8, borderRadius: 8 }}
          >
            <Icon name="plus" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => onMonthChange('prev')}>
          <Icon name="chevron-left" size={24} color="#4B5563" />
        </TouchableOpacity>
        
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
          {formatMonth(currentMonth)}
        </Text>
        
        <TouchableOpacity onPress={() => onMonthChange('next')}>
          <Icon name="chevron-right" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
