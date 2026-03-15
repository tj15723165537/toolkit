import { Category } from '@/types';

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
  route: string;
}[] = [
  {
    id: 'accounting',
    name: '记账本',
    icon: '📒',
    description: '记录日常收支',
    route: '/accounting',
  },
  {
    id: 'password',
    name: '密码管理',
    icon: '🔐',
    description: '安全存储账号密码',
    route: '/password',
  },
];

export const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];