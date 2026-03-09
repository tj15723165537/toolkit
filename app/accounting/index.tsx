import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subMonths, addMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useDatabase } from '@/database/hooks';
import { formatCurrency, formatDateChinese, formatMonth } from '@/utils/format';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { CATEGORIES } from '@/utils/constants';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AccountingScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'report' | 'add'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [transactionsByDate, setTransactionsByDate] = useState<[string, any[]][]>([]);
  const [monthlySummary, setMonthlySummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [categorySummary, setCategorySummary] = useState<any[]>([]);
  const [recentMonths, setRecentMonths] = useState<any[]>([]);
  
  // Add transaction state
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<typeof CATEGORIES>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    addTransaction,
    getTransactions,
    getMonthlySummary,
    getCategorySummary,
    getRecentMonthsSummary,
    getCategories,
  } = useDatabase();

  const loadData = async () => {
    const monthKey = format(currentMonth, 'yyyy-MM');
    const [transactions, summary, categories, categoryData, recent] = await Promise.all([
      getTransactions(monthKey),
      getMonthlySummary(monthKey),
      getCategories(),
      getCategorySummary(monthKey),
      getRecentMonthsSummary(6),
    ]);
    
    setTransactionsByDate(transactions);
    setMonthlySummary(summary);
    setCategories(categories.filter(cat => cat.type === type));
    setCategorySummary(categoryData);
    setRecentMonths(recent.reverse());
    
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories.find(cat => cat.type === type)?.name || null);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth, type, viewMode]);

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

  // Add transaction handlers
  const handleNumberPress = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (num === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else if (num === 'clear') {
      setAmount('');
    } else {
      if (num === '0' && amount === '0') return;
      if (num !== '0' && amount === '0') {
        setAmount(num);
      } else {
        setAmount(prev => prev + num);
      }
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入有效金额');
      return;
    }
    
    if (!selectedCategory) {
      alert('请选择分类');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction(
        type,
        parseFloat(amount),
        selectedCategory,
        format(date, 'yyyy-MM-dd'),
        description || undefined
      );
      
      alert('记账成功');
      setShowAddModal(false);
      setAmount('');
      setDescription('');
      setDate(new Date());
      loadData();
    } catch (error) {
      alert('添加失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numberPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace']
  ];

  if (viewMode === 'add' || showAddModal) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row justify-between items-center">
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Icon name="chevron-left" size={24} color="#4B5563" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">添加记账</Text>
            <TouchableOpacity onPress={() => { setAmount(''); setDescription(''); }}>
              <Text className="text-blue-500">清空</Text>
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <View className="bg-white px-4 py-6">
            <Text className="text-gray-700 mb-4 font-medium">类型</Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={() => setType('expense')}
                className={`flex-1 rounded-xl py-4 items-center ${
                  type === 'expense' ? 'bg-red-50 border-2 border-red-500' : 'bg-gray-100 border border-gray-300'
                }`}
              >
                <Icon name="trending-down" size={28} color={type === 'expense' ? '#EF4444' : '#6B7280'} />
                <Text className={`mt-2 font-bold ${type === 'expense' ? 'text-red-600' : 'text-gray-600'}`}>
                  支出
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType('income')}
                className={`flex-1 rounded-xl py-4 items-center ${
                  type === 'income' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-100 border border-gray-300'
                }`}
              >
                <Icon name="trending-up" size={28} color={type === 'income' ? '#10B981' : '#6B7280'} />
                <Text className={`mt-2 font-bold ${type === 'income' ? 'text-green-600' : 'text-gray-600'}`}>
                  收入
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Display */}
          <View className="bg-white px-4 py-8">
            <Text className="text-gray-700 mb-2 font-medium text-center">金额 (¥)</Text>
            <Text className="text-5xl font-bold text-gray-900 text-center">
              {amount ? `¥${parseFloat(amount).toFixed(2)}` : '0.00'}
            </Text>
          </View>

          {/* Number Pad */}
          <View className="bg-white px-4 py-6">
            {numberPad.map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row justify-between mb-4">
                {row.map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => handleNumberPress(num)}
                    className={`w-20 h-16 rounded-xl items-center justify-center ${
                      num === 'backspace' ? 'bg-red-50' : 'bg-gray-100'
                    } active:opacity-80`}
                  >
                    {num === 'backspace' ? (
                      <Icon name="delete" size={28} color="#EF4444" />
                    ) : (
                      <Text className="text-2xl font-bold text-gray-800">{num}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Category Selector */}
          <View className="bg-white px-4 py-6">
            <Text className="text-gray-700 mb-4 font-medium">选择分类</Text>
            <View className="flex-row flex-wrap -mx-1">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.name}
                  onPress={() => setSelectedCategory(category.name)}
                  className={`w-1/4 px-1 mb-3 ${
                    selectedCategory === category.name ? 'opacity-100' : 'opacity-80'
                  }`}
                >
                  <View className="items-center">
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: category.color }}
                    >
                      <Text className="text-xl">{category.icon}</Text>
                    </View>
                    <Text className="text-xs text-gray-700 text-center">
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Picker */}
          <View className="bg-white px-4 py-6">
            <Text className="text-gray-700 mb-4 font-medium">日期</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center justify-between bg-gray-100 rounded-xl px-4 py-3"
            >
              <Text className="text-gray-800">
                {format(date, 'yyyy年M月d日', { locale: zhCN })}
              </Text>
              <Icon name="calendar" size={20} color="#6B7280" />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Description Input */}
          <View className="bg-white px-4 py-6">
            <Text className="text-gray-700 mb-2 font-medium">备注 (可选)</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
              placeholder="输入备注..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
          <View className="px-4 py-6">
            <Button
              variant="default"
              size="lg"
              onPress={handleSubmit}
              disabled={isSubmitting || !amount || !selectedCategory}
              className={`w-full py-4 rounded-xl ${
                (isSubmitting || !amount || !selectedCategory) ? 'opacity-50' : ''
              }`}
            >
              {isSubmitting ? '保存中...' : '保存记录'}
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (viewMode === 'report') {
    const expenseCategories = categorySummary.filter(item => item.type === 'expense');
    
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => setViewMode('list')}>
              <Icon name="chevron-left" size={24} color="#4B5563" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">
              {formatMonth(currentMonth)}报表
            </Text>
            <TouchableOpacity onPress={() => {}}>
              <Icon name="download" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Monthly Summary Cards */}
          <View className="px-4 py-4">
            <View className="flex-row -mx-2">
              <View className="flex-1 px-2">
                <View className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <View className="flex-row items-center mb-2">
                    <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    <Text className="text-green-700 font-medium">收入</Text>
                  </View>
                  <Text className="text-2xl font-bold text-green-900">
                    {formatCurrency(monthlySummary.income)}
                  </Text>
                </View>
              </View>
              <View className="flex-1 px-2">
                <View className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <View className="flex-row items-center mb-2">
                    <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    <Text className="text-red-700 font-medium">支出</Text>
                  </View>
                  <Text className="text-2xl font-bold text-red-900">
                    {formatCurrency(monthlySummary.expense)}
                  </Text>
                </View>
              </View>
              <View className="flex-1 px-2">
                <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <View className="flex-row items-center mb-2">
                    <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                    <Text className="text-blue-700 font-medium">结余</Text>
                  </View>
                  <Text className="text-2xl font-bold text-blue-900">
                    {formatCurrency(monthlySummary.balance)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Category Breakdown */}
          <View className="bg-white rounded-xl mx-4 mt-4 p-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">分类明细</Text>
            
            {/* Expense Categories */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-3">支出分类</Text>
              {categorySummary
                .filter(item => item.type === 'expense')
                .map((item) => (
                  <View key={item.category} className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-600">{item.category}</Text>
                    <Text className="text-red-600 font-medium">
                      -{formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}
            </View>
            
            {/* Income Categories */}
            <View>
              <Text className="text-gray-700 font-medium mb-3">收入分类</Text>
              {categorySummary
                .filter(item => item.type === 'income')
                .map((item) => (
                  <View key={item.category} className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-600">{item.category}</Text>
                    <Text className="text-green-600 font-medium">
                      +{formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}
            </View>
          </View>

          {/* Recent Months Trend */}
          <View className="bg-white rounded-xl mx-4 mt-4 p-4 mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">收支趋势</Text>
            <View className="space-y-3">
              {recentMonths.map((item) => (
                <View key={item.month} className="flex-row items-center justify-between">
                  <Text className="text-gray-600">
                    {format(new Date(item.month + '-01'), 'yyyy年M月', { locale: zhCN })}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-green-600 font-medium mr-4">
                      +{formatCurrency(item.income)}
                    </Text>
                    <Text className="text-red-600 font-medium">
                      -{formatCurrency(item.expense)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // List view (default)
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-bold text-gray-900">记账本</Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity 
              onPress={() => setViewMode('report')}
              className="bg-blue-100 p-2 rounded-lg"
            >
              <Icon name="bar-chart-3" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              className="bg-green-100 p-2 rounded-lg"
            >
              <Icon name="plus" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Month Selector */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Icon name="chevron-left" size={24} color="#4B5563" />
          </TouchableOpacity>
          
          <Text className="text-lg font-bold text-gray-900">
            {formatMonth(currentMonth)}
          </Text>
          
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Icon name="chevron-right" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Monthly Summary */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <Text className="text-gray-600 text-sm">收入</Text>
            <Text className="text-green-600 text-lg font-bold">
              {formatCurrency(monthlySummary.income)}
            </Text>
          </View>
          <View className="h-8 w-px bg-gray-300" />
          <View className="items-center flex-1">
            <Text className="text-gray-600 text-sm">支出</Text>
            <Text className="text-red-600 text-lg font-bold">
              {formatCurrency(monthlySummary.expense)}
            </Text>
          </View>
          <View className="h-8 w-px bg-gray-300" />
          <View className="items-center flex-1">
            <Text className="text-gray-600 text-sm">结余</Text>
            <Text className="text-blue-600 text-lg font-bold">
              {formatCurrency(monthlySummary.balance)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <View className="flex-1">
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {transactionsByDate.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Icon name="file-text" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">暂无记录</Text>
              <TouchableOpacity 
                onPress={() => setShowAddModal(true)}
                className="mt-4 bg-blue-100 px-6 py-3 rounded-full"
              >
                <Text className="text-blue-600 font-medium">点击添加第一笔记录</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="px-4 py-4">
              {transactionsByDate.map(([date, transactions]) => (
                <View key={date} className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                    <Text className="text-gray-700 font-medium">
                      {formatDateChinese(date)}
                    </Text>
                    <View className="flex-1 h-px bg-gray-300 ml-3" />
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

function TransactionCard({ transaction }: { transaction: any }) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const amountPrefix = isIncome ? '+' : '-';
  
  return (
    <View 
      className="bg-white rounded-xl p-4 mb-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
      }}
    >
      <View className="flex-row items-center">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: transaction.categoryColor }}
        >
          <Text className="text-lg">{transaction.categoryIcon || '💰'}</Text>
        </View>
        
        <View className="flex-1">
          <Text className="text-gray-800 font-medium">{transaction.category}</Text>
          {transaction.description && (
            <Text className="text-gray-500 text-sm mt-1">{transaction.description}</Text>
          )}
        </View>
        
        <View className="items-end">
          <Text className={`text-lg font-bold ${amountColor}`}>
            {amountPrefix}{formatCurrency(transaction.amount)}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {format(new Date(transaction.date), 'HH:mm')}
          </Text>
        </View>
      </View>
    </View>
  );
}