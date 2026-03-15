import { SQLiteDatabase } from 'expo-sqlite';
import { CATEGORIES } from '@/utils/constants';

export async function initializeDatabase(db: SQLiteDatabase) {
  // Enable WAL mode for better performance
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert default categories
  await seedCategories(db);
}

async function seedCategories(db: SQLiteDatabase) {
  // Check if categories already exist
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  
  if (result && result.count === 0) {
    for (const category of CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?)`,
        [category.name, category.type, category.icon, category.color, 1]
      );
    }
  }
}

export async function migrateDatabase(db: SQLiteDatabase) {
  // Future migrations will be added here
  // Example: await db.execAsync('ALTER TABLE transactions ADD COLUMN new_column TEXT');
}