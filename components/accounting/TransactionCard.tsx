import { View, Text } from 'react-native';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/format';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categoryIcon?: string;
  categoryColor: string;
  description?: string;
  date: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? '#059669' : '#dc2626';
  const amountPrefix = isIncome ? '+' : '-';
  
  return (
    <View 
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View 
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            backgroundColor: transaction.categoryColor
          }}
        >
          <Text style={{ fontSize: 18 }}>{transaction.categoryIcon || '💰'}</Text>
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#1f2937', fontWeight: '500', fontSize: 15 }}>{transaction.category}</Text>
          {transaction.description && (
            <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>{transaction.description}</Text>
          )}
        </View>
        
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: amountColor }}>
            {amountPrefix}{formatCurrency(transaction.amount)}
          </Text>
          <Text style={{ color: '#d1d5db', fontSize: 13, marginTop: 4 }}>
            {format(new Date(transaction.date), 'HH:mm')}
          </Text>
        </View>
      </View>
    </View>
  );
}
