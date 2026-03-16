import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { format, subMonths, addMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useDatabase } from '@/database/hooks';
import { formatDateChinese } from '@/utils/format';
import { Icon } from '@/components/ui/Icon';
import { SummaryCard } from '@/components/accounting/SummaryCard';
import { TransactionCard } from '@/components/accounting/TransactionCard';

interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

export default function AccountingListScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [transactionsByDate, setTransactionsByDate] = useState<[string, any[]][]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({ income: 0, expense: 0, balance: 0 });
  
  const {
    getTransactions,
    getMonthlySummary,
  } = useDatabase();

  const loadData = useCallback(async () => {
    const monthKey = format(currentMonth, 'yyyy-MM');
    const [transactions, summary] = await Promise.all([
      getTransactions(monthKey),
      getMonthlySummary(monthKey),
    ]);
    
    setTransactionsByDate(transactions);
    setMonthlySummary(summary);
  }, [currentMonth, getTransactions, getMonthlySummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>记账本</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              onPress={() => router.push('/accounting/report')}
              style={{ backgroundColor: '#dbeafe', padding: 8, borderRadius: 8 }}
            >
              <Icon name="bar-chart-3" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/accounting/add')}
              style={{ backgroundColor: '#d1fae5', padding: 8, borderRadius: 8 }}
            >
              <Icon name="plus" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Icon name="chevron-left" size={24} color="#4B5563" />
          </TouchableOpacity>
          
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
            {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
          </Text>
          
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Icon name="chevron-right" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>
      
      <SummaryCard summary={monthlySummary} />

      <View style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {transactionsByDate.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <Icon name="file-text" size={64} color="#9CA3AF" />
              <Text style={{ color: '#6b7280', fontSize: 18, marginTop: 16 }}>暂无记录</Text>
              <TouchableOpacity 
                onPress={() => router.push('/accounting/add')}
                style={{ marginTop: 16, backgroundColor: '#dbeafe', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
              >
                <Text style={{ color: '#2563eb', fontWeight: '500', fontSize: 15 }}>点击添加第一笔记录</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
              {transactionsByDate.map(([date, transactions]) => (
                <View key={date} style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginRight: 8 }} />
                    <Text style={{ color: '#374151', fontWeight: '500', fontSize: 15 }}>
                      {formatDateChinese(date)}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb', marginLeft: 12 }} />
                  </View>
                  
                  {transactions.map((transaction) => (
                    <TransactionCard key={transaction.id} transaction={transaction} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
