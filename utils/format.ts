import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function formatDateChinese(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'M月d日', { locale: zhCN });
}

export function formatMonth(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy年M月', { locale: zhCN });
}

export function formatMonthKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM');
}

export function getCurrentMonthKey(): string {
  return formatMonthKey(new Date());
}

export function groupByDate(transactions: any[]) {
  const groups: Record<string, any[]> = {};
  
  transactions.forEach(transaction => {
    const date = formatDate(transaction.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
  });
  
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}