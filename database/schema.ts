import { SQLiteDatabase } from 'expo-sqlite';
import { CATEGORIES } from '@/utils/constants';
import { generatePasswordRecordId } from '@/utils/ids';

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
      unique_id TEXT UNIQUE,
      platform TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
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
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');

  if (result && result.count === 0) {
    for (const category of CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?)`,
        [category.name, category.type, category.icon, category.color, 1]
      );
    }
  }
}

async function ensurePasswordUniqueIdColumn(db: SQLiteDatabase) {
  const column = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM pragma_table_info('passwords') WHERE name = 'unique_id'`
  );

  if (!column) {
    await db.execAsync(`ALTER TABLE passwords ADD COLUMN unique_id TEXT;`);
  }
}

async function backfillPasswordUniqueIds(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ id: number }>(
    `SELECT id FROM passwords WHERE unique_id IS NULL OR unique_id = ''`
  );

  for (const row of rows) {
    let assigned = false;
    let attempts = 0;

    while (!assigned && attempts < 5) {
      attempts += 1;
      const uniqueId = generatePasswordRecordId();

      try {
        await db.runAsync(`UPDATE passwords SET unique_id = ? WHERE id = ?`, [uniqueId, row.id]);
        assigned = true;
      } catch (error) {
        // Retry if generated id collides, otherwise bubble up on final attempt.
        if (attempts >= 5) {
          throw error;
        }
      }
    }
  }
}

async function ensurePasswordUniqueIdIndex(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_passwords_unique_id
    ON passwords(unique_id);
  `);
}

export async function migrateDatabase(db: SQLiteDatabase) {
  // Historical migration: remove legacy `url` column if present.
  const result = await db.getFirstAsync<{ sql: string }>(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='passwords'"
  );

  if (result && result.sql.includes('url')) {
    await db.execAsync(`
      CREATE TABLE passwords_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unique_id TEXT UNIQUE,
        platform TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      INSERT INTO passwords_new (id, platform, username, password, notes, created_at, updated_at)
      SELECT id, platform, username, password, notes, created_at, updated_at FROM passwords;
    `);

    await db.execAsync(`
      DROP TABLE passwords;
      ALTER TABLE passwords_new RENAME TO passwords;
    `);
  }

  await ensurePasswordUniqueIdColumn(db);
  await backfillPasswordUniqueIds(db);
  await ensurePasswordUniqueIdIndex(db);
}
