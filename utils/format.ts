import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 100000000) {
    return Math.round(amount / 100000000).toFixed(0) + '亿';
  } else if (absAmount >= 10000) {
    return Math.round(amount / 10000).toFixed(0) + '万';
  }
  
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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