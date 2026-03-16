import {useState, useEffect, useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {format} from 'date-fns';
import {zhCN} from 'date-fns/locale';
import {useRouter} from 'expo-router';
import {useDatabase} from '@/database/hooks';
import {formatMonth, formatCurrency} from '@/utils/format';
import {Icon} from '@/components/ui/Icon';

interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

interface CategorySummary {
  category: string;
  type: 'income' | 'expense';
  total: number;
}

interface RecentMonth {
  month: string;
  income: number;
  expense: number;
}

export default function ReportScreen() {
  const router = useRouter();
  const [currentMonth] = useState(new Date());
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({income: 0, expense: 0, balance: 0});
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [recentMonths, setRecentMonths] = useState<RecentMonth[]>([]);

  const {
    getMonthlySummary,
    getCategorySummary,
    getRecentMonthsSummary,
  } = useDatabase();

  const loadData = useCallback(async () => {
    const monthKey = format(currentMonth, 'yyyy-MM');
    const [summary, categoryData, recent] = await Promise.all([
      getMonthlySummary(monthKey),
      getCategorySummary(monthKey),
      getRecentMonthsSummary(6),
    ]);

    setMonthlySummary(summary);
    setCategorySummary(categoryData);
    setRecentMonths(recent.reverse());
  }, [currentMonth, getMonthlySummary, getCategorySummary, getRecentMonthsSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
      <View style={{flex: 1, backgroundColor: '#f5f7fa'}}>
        <View style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb'
        }}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <TouchableOpacity onPress={() => router.back()}>
              <Icon name="chevron-left" size={24} color="#4B5563"/>
            </TouchableOpacity>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: '#111827'}}>
              {formatMonth(currentMonth)}报表
            </Text>
            <TouchableOpacity onPress={() => {
            }}>
              {/*<Icon name="download" size={24} color="#4B5563" />*/}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
          <View
              style={{backgroundColor: '#ffffff', borderRadius: 12, marginHorizontal: 16, marginTop: 16, padding: 16}}>
            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16}}>分类明细</Text>

            <View style={{marginBottom: 24}}>
              <Text style={{color: '#374151', fontWeight: '500', fontSize: 15, marginBottom: 12}}>支出分类</Text>
              {categorySummary
                  .filter(item => item.type === 'expense')
                  .map((item) => (
                      <View key={item.category} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12
                      }}>
                        <Text style={{color: '#6b7280', fontSize: 15}}>{item.category}</Text>
                        <Text style={{color: '#dc2626', fontWeight: '500', fontSize: 15}}>
                          -{formatCurrency(item.total)}
                        </Text>
                      </View>
                  ))}
            </View>

            <View>
              <Text style={{color: '#374151', fontWeight: '500', fontSize: 15, marginBottom: 12}}>收入分类</Text>
              {categorySummary
                  .filter(item => item.type === 'income')
                  .map((item) => (
                      <View key={item.category} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12
                      }}>
                        <Text style={{color: '#6b7280', fontSize: 15}}>{item.category}</Text>
                        <Text style={{color: '#059669', fontWeight: '500', fontSize: 15}}>
                          +{formatCurrency(item.total)}
                        </Text>
                      </View>
                  ))}
            </View>
          </View>

          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            marginHorizontal: 16,
            marginTop: 16,
            padding: 16,
            marginBottom: 32
          }}>
            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16}}>收支趋势</Text>
            <View style={{gap: 12}}>
              {recentMonths.map((item) => (
                  <View key={item.month}
                        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Text style={{color: '#6b7280', fontSize: 15}}>
                      {format(new Date(item.month + '-01'), 'yyyy年M月', {locale: zhCN})}
                    </Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={{color: '#059669', fontWeight: '500', fontSize: 15, marginRight: 16}}>
                        +{formatCurrency(item.income)}
                      </Text>
                      <Text style={{color: '#dc2626', fontWeight: '500', fontSize: 15}}>
                        -{formatCurrency(item.expense)}
                      </Text>
                    </View>
                  </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
  );
}
