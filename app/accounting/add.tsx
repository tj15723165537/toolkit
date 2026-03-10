import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useDatabase } from '@/database/hooks';
import { Icon } from '@/components/ui/Icon';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddTransactionScreen() {
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const { addTransaction, getCategories } = useDatabase();

  const loadCategories = useCallback(async () => {
    const allCategories = await getCategories();
    const filteredCategories = allCategories.filter((cat: any) => cat.type === type);
    setCategories(filteredCategories);
    if (filteredCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(filteredCategories[0]?.name || null);
    }
  }, [type, getCategories, selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
        parseFloat(amount) as number,
        selectedCategory as string,
        format(date, 'yyyy-MM-dd'),
        description || undefined
      );
      alert('记账成功');
      router.back();
    } catch {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E8ECEF' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ 
          paddingHorizontal: 24, 
          paddingVertical: 20, 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#E8ECEF',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          zIndex: 10
        }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="chevron-left" size={24} color="#4A5568" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2D3748' }}>添加记账</Text>
          <TouchableOpacity onPress={() => { setAmount(''); setDescription(''); }} activeOpacity={0.7}>
            <Text style={{ color: '#4A5568', fontSize: 14 }}>清空</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
          <Text style={{ color: '#4A5568', marginBottom: 16, fontWeight: '600', fontSize: 14 }}>类型</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setType('expense')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                borderRadius: 20,
                paddingVertical: 20,
                alignItems: 'center',
                backgroundColor: type === 'expense' ? '#EDF2F7' : '#E8ECEF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: type === 'expense' ? 3 : 1 },
                shadowOpacity: type === 'expense' ? 0.15 : 0.05,
                shadowRadius: type === 'expense' ? 8 : 4,
                elevation: type === 'expense' ? 4 : 2,
                borderWidth: 1,
                borderColor: type === 'expense' ? '#CBD5E0' : '#E2E8F0'
              }}
            >
              <Icon name="trending-down" size={32} color={type === 'expense' ? '#E53E3E' : '#A0AEC0'} />
              <Text style={{ marginTop: 12, fontWeight: '600', fontSize: 15, color: type === 'expense' ? '#C53030' : '#718096' }}>
                支出
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType('income')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                borderRadius: 20,
                paddingVertical: 20,
                alignItems: 'center',
                backgroundColor: type === 'income' ? '#EDF2F7' : '#E8ECEF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: type === 'income' ? 3 : 1 },
                shadowOpacity: type === 'income' ? 0.15 : 0.05,
                shadowRadius: type === 'income' ? 8 : 4,
                elevation: type === 'income' ? 4 : 2,
                borderWidth: 1,
                borderColor: type === 'income' ? '#CBD5E0' : '#E2E8F0'
              }}
            >
              <Icon name="trending-up" size={32} color={type === 'income' ? '#38A169' : '#A0AEC0'} />
              <Text style={{ marginTop: 12, fontWeight: '600', fontSize: 15, color: type === 'income' ? '#2F855A' : '#718096' }}>
                收入
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ 
          paddingHorizontal: 24, 
          paddingVertical: 32, 
          backgroundColor: '#EDF2F7', 
          borderRadius: 24, 
          marginHorizontal: 24, 
          marginTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#CBD5E0'
        }}>
          <Text style={{ color: '#718096', marginBottom: 12, fontWeight: '500', fontSize: 12, textAlign: 'center' }}>金额</Text>
          <Text style={{ 
            fontSize: 52, 
            fontWeight: 'bold', 
            color: '#2D3748',
            textAlign: 'center',
            letterSpacing: 1
          }}>
            {amount ? `¥${parseFloat(amount).toFixed(2)}` : '0.00'}
          </Text>
        </View>

        <View style={{ 
          paddingHorizontal: 24, 
          paddingVertical: 20, 
          backgroundColor: '#EDF2F7', 
          borderRadius: 20, 
          marginHorizontal: 24, 
          marginTop: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#CBD5E0'
        }}>
          {numberPad.map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: rowIndex < 3 ? 16 : 0 }}>
              {row.map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleNumberPress(num)}
                  activeOpacity={0.7}
                  style={{
                    width: 76,
                    height: 60,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#E8ECEF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: '#E2E8F0'
                  }}
                >
                  {num === 'backspace' ? (
                    <Icon name="delete" size={24} color="#4A5568" />
                  ) : (
                    <Text style={{ fontSize: 22, fontWeight: '600', color: '#2D3748' }}>{num}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={{ 
          paddingHorizontal: 24, 
          paddingVertical: 20, 
          backgroundColor: '#EDF2F7', 
          borderRadius: 20, 
          marginHorizontal: 24, 
          marginTop: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#CBD5E0'
        }}>
          <Text style={{ color: '#4A5568', marginBottom: 20, fontWeight: '600', fontSize: 14 }}>选择分类</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                onPress={() => setSelectedCategory(category.name)}
                activeOpacity={0.7}
                style={{
                  width: '25%',
                  paddingHorizontal: 6,
                  marginBottom: 16,
                  opacity: selectedCategory === category.name ? 1 : 0.7
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <View 
                    style={{ 
                      width: 52, 
                      height: 52, 
                      borderRadius: 16, 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginBottom: 8,
                      backgroundColor: selectedCategory === category.name ? '#F7FAFC' : '#EDF2F7',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: selectedCategory === category.name ? 3 : 1 },
                      shadowOpacity: selectedCategory === category.name ? 0.12 : 0.06,
                      shadowRadius: selectedCategory === category.name ? 8 : 4,
                      elevation: selectedCategory === category.name ? 4 : 2,
                      borderWidth: 1,
                      borderColor: selectedCategory === category.name ? '#CBD5E0' : '#E2E8F0'
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{category.icon}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#4A5568', textAlign: 'center', fontWeight: '500' }}>
                    {category.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ 
          paddingHorizontal: 24, 
          paddingVertical: 16, 
          backgroundColor: '#EDF2F7', 
          borderRadius: 20, 
          marginHorizontal: 24, 
          marginTop: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#CBD5E0'
        }}>
          <Text style={{ color: '#4A5568', marginBottom: 12, fontWeight: '600', fontSize: 14 }}>日期</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: '#E8ECEF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0'
            }}
          >
            <Text style={{ fontSize: 14, color: '#2D3748', fontWeight: '500' }}>
              {format(date, 'yyyy年M月d日', { locale: zhCN })}
            </Text>
            <Icon name="calendar" size={18} color="#718096" />
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

        <View style={{ 
          paddingHorizontal: 24, 
          paddingVertical: 16, 
          backgroundColor: '#EDF2F7', 
          borderRadius: 20, 
          marginHorizontal: 24, 
          marginTop: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#CBD5E0'
        }}>
          <Text style={{ color: '#4A5568', marginBottom: 10, fontWeight: '600', fontSize: 14 }}>备注 (可选)</Text>
          <TextInput
            style={{
              backgroundColor: '#E8ECEF',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 14,
              color: '#2D3748',
              fontSize: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0'
            }}
            placeholder="输入备注..."
            placeholderTextColor="#A0AEC0"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24 }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !amount || !selectedCategory}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#4A5568',
              paddingVertical: 18,
              borderRadius: 20,
              opacity: (isSubmitting || !amount || !selectedCategory) ? 0.5 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
              borderWidth: 1,
              borderColor: '#CBD5E0'
            }}
          >
            <Text style={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              color: '#FFFFFF', 
              fontSize: 17
            }}>
              {isSubmitting ? '保存中...' : '保存记录'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
