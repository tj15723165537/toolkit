import { View, Text } from 'react-native';
import { formatCurrency } from '@/utils/format';

interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

interface SummaryCardProps {
  summary: MonthlySummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>收入</Text>
          <Text style={{ color: '#059669', fontSize: 18, fontWeight: 'bold' }}>
            {formatCurrency(summary.income)}
          </Text>
        </View>
        <View style={{ width: 1, height: 32, backgroundColor: '#d1d5db' }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>支出</Text>
          <Text style={{ color: '#dc2626', fontSize: 18, fontWeight: 'bold' }}>
            {formatCurrency(summary.expense)}
          </Text>
        </View>
        <View style={{ width: 1, height: 32, backgroundColor: '#d1d5db' }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>结余</Text>
          <Text style={{ color: '#2563eb', fontSize: 18, fontWeight: 'bold' }}>
            {formatCurrency(summary.balance)}
          </Text>
        </View>
      </View>
    </View>
  );
}
