export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string; // ISO string
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_default: boolean;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
  month: string; // 'YYYY-MM'
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
  route: string;
}

export interface Password {
  id: number;
  platform: string;
  username: string;
  password: string; // 加密后的密码
  url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DecryptedPassword {
  id: number;
  platform: string;
  username: string;
  password: string; // 解密后的密码
  url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}