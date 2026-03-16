import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { Transaction, TransactionType, Category, MonthlySummary, Password } from '@/types';
import { formatMonthKey, groupByDate } from '@/utils/format';

export function useDatabase() {
  const db = useSQLiteContext();

  // Transaction operations
  const addTransaction = useCallback(async (
    type: TransactionType,
    amount: number,
    category: string,
    date: string,
    description?: string
  ) => {
    return await db.runAsync(
      `INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)`,
      [type, amount, category, description || null, date]
    );
  }, [db]);

  const getTransactions = useCallback(async (month?: string) => {
    const monthKey = month || formatMonthKey(new Date());
    
    const transactions = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions 
       WHERE strftime('%Y-%m', date) = ? 
       ORDER BY date DESC, created_at DESC`,
      [monthKey]
    );
    
    return groupByDate(transactions);
  }, [db]);

  const deleteTransaction = useCallback(async (id: number) => {
    return await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  }, [db]);

  const updateTransaction = useCallback(async (
    id: number,
    updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) return;
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const query = `UPDATE transactions SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    return await db.runAsync(query, [...values, id]);
  }, [db]);

  const getMonthlySummary = useCallback(async (month?: string) => {
    const monthKey = month || formatMonthKey(new Date());
    
    const result = await db.getFirstAsync<MonthlySummary>(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
       FROM transactions 
       WHERE strftime('%Y-%m', date) = ?`,
      [monthKey]
    );
    
    return result || { income: 0, expense: 0, balance: 0, month: monthKey };
  }, [db]);

  const getCategorySummary = useCallback(async (month?: string) => {
    const monthKey = month || formatMonthKey(new Date());
    
    const results = await db.getAllAsync<{
      category: string;
      type: TransactionType;
      total: number;
    }>(
      `SELECT category, type, SUM(amount) as total 
       FROM transactions 
       WHERE strftime('%Y-%m', date) = ? 
       GROUP BY category, type
       ORDER BY total DESC`,
      [monthKey]
    );
    
    return results;
  }, [db]);

  const getRecentMonthsSummary = useCallback(async (count: number = 6) => {
    const results = await db.getAllAsync<{
      month: string;
      income: number;
      expense: number;
      balance: number;
    }>(
      `SELECT 
        strftime('%Y-%m', date) as month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
       FROM transactions 
       WHERE date >= date('now', '-${count} months')
       GROUP BY strftime('%Y-%m', date)
       ORDER BY month DESC`
    );
    
    return results;
  }, [db]);

  // Category operations
  const getCategories = useCallback(async (type?: TransactionType) => {
    let query = 'SELECT * FROM categories';
    const params: any[] = [];
    
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY is_default DESC, name ASC';
    
    return await db.getAllAsync<Category>(query, params);
  }, [db]);

  const addCategory = useCallback(async (
    name: string,
    type: TransactionType,
    icon: string,
    color: string
  ) => {
    return await db.runAsync(
      `INSERT INTO categories (name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?)`,
      [name, type, icon, color, 0]
    );
  }, [db]);

  const deleteCategory = useCallback(async (id: number) => {
    // Check if category is used in transactions
    const used = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions WHERE category = (SELECT name FROM categories WHERE id = ?)',
      [id]
    );

    if (used && used.count > 0) {
      throw new Error('该分类已被使用，无法删除');
    }

    // Check if category is default
    const category = await db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [id]);
    if (category && category.is_default) {
      throw new Error('默认分类无法删除');
    }

    return await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  }, [db]);

  // Password operations
  const addPassword = useCallback(async (
    platform: string,
    username: string,
    encryptedPassword: string,
    notes?: string
  ) => {
    return await db.runAsync(
      `INSERT INTO passwords (platform, username, password, notes) VALUES (?, ?, ?, ?)`,
      [platform, username, encryptedPassword, notes || null]
    );
  }, [db]);

  const getPasswords = useCallback(async () => {
    const passwords = await db.getAllAsync<Password>(
      `SELECT * FROM passwords ORDER BY platform ASC, username ASC`
    );
    return passwords;
  }, [db]);

  const getPassword = useCallback(async (id: number) => {
    const password = await db.getFirstAsync<Password>(
      `SELECT * FROM passwords WHERE id = ?`,
      [id]
    );
    return password;
  }, [db]);

  const searchPasswords = useCallback(async (keyword: string) => {
    const passwords = await db.getAllAsync<Password>(
      `SELECT * FROM passwords
       WHERE platform LIKE ? OR username LIKE ? OR notes LIKE ?
       ORDER BY platform ASC, username ASC`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );
    return passwords;
  }, [db]);

  const deletePassword = useCallback(async (id: number) => {
    return await db.runAsync('DELETE FROM passwords WHERE id = ?', [id]);
  }, [db]);

  const updatePassword = useCallback(async (
    id: number,
    updates: Partial<Omit<Password, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const query = `UPDATE passwords SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    return await db.runAsync(query, [...values, id]);
  }, [db]);

  return {
    addTransaction,
    getTransactions,
    deleteTransaction,
    updateTransaction,
    getMonthlySummary,
    getCategorySummary,
    getRecentMonthsSummary,
    getCategories,
    addCategory,
    deleteCategory,
    addPassword,
    getPasswords,
    getPassword,
    searchPasswords,
    deletePassword,
    updatePassword,
  };
}