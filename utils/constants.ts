import { Category } from '@/types';

type AppRoute = 
  | '/accounting'
  | '/pomodoro' 
  | '/habit'
  | '/diary'
  | '/converter'
  | '/color'
  | '/modal'
  | '/(tabs)'
  | '/(tabs)/index'
  | '/(tabs)/explore';

export const CATEGORIES: Omit<Category, 'id' | 'is_default'>[] = [
  // Expense categories
  { name: '餐饮', type: 'expense', icon: '🍜', color: '#FF9800' },
  { name: '交通', type: 'expense', icon: '🚗', color: '#2196F3' },
  { name: '购物', type: 'expense', icon: '🛍️', color: '#9C27B0' },
  { name: '娱乐', type: 'expense', icon: '🎮', color: '#E91E63' },
  { name: '居住', type: 'expense', icon: '🏠', color: '#795548' },
  { name: '医疗', type: 'expense', icon: '❤️', color: '#F44336' },
  { name: '教育', type: 'expense', icon: '📚', color: '#3F51B5' },
  { name: '其他', type: 'expense', icon: '⋯', color: '#9E9E9E' },
  
  // Income categories
  { name: '工资', type: 'income', icon: '💰', color: '#4CAF50' },
  { name: '奖金', type: 'income', icon: '🎁', color: '#00BCD4' },
  { name: '投资', type: 'income', icon: '📈', color: '#FF9800' },
  { name: '兼职', type: 'income', icon: '💼', color: '#9C27B0' }
];

export const TOOLS: {
  id: string;
  name: string;
  icon: string;
  description: string;
  available: boolean;
  route: AppRoute;
}[] = [
  {
    id: 'accounting',
    name: '记账本',
    icon: '📒',
    description: '记录日常收支',
    available: true,
    route: '/accounting',
  },
  {
    id: 'pomodoro',
    name: '番茄钟',
    icon: '⏰',
    description: '专注时间管理',
    available: false,
    route: '/pomodoro',
  },
  {
    id: 'habit',
    name: '习惯打卡',
    icon: '✓',
    description: '养成好习惯',
    available: false,
    route: '/habit',
  },
  {
    id: 'diary',
    name: '心情日记',
    icon: '😊',
    description: '记录每日心情',
    available: false,
    route: '/diary',
  },
  {
    id: 'converter',
    name: '单位转换',
    icon: '🔧',
    description: '快速换算单位',
    available: false,
    route: '/converter',
  },
  {
    id: 'color',
    name: '颜色选择',
    icon: '📊',
    description: '取色与配色',
    available: false,
    route: '/color',
  },
];

export const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];