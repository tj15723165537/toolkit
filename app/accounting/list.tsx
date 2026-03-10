import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subMonths, addMonths } from 'date-fns';
import { useDatabase } from '@/database/hooks';
import { formatDateChinese } from '@/utils/format';
import { Icon } from '@/components/ui/Icon';
import { AccountingHeader } from '@/components/accounting/AccountingHeader';
import { SummaryCard } from '@/components/accounting/SummaryCard';
import { TransactionCard } from '@/components/accounting/TransactionCard';

interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

export default function AccountingListScreen() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <AccountingHeader
        currentMonth={currentMonth}
        onMonthChange={navigateMonth}
        onReportPress={() => {}}
        onAddPress={() => {}}
      />
      
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
                onPress={() => {}}
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
    </SafeAreaView>
  );
}
