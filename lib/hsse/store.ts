import type Database from 'better-sqlite3';
import { getDb } from '@/lib/db/client';
import { HSSE_FIELDS, HsseMonth, HsseResult, HsseValues } from './types';

const columns = HSSE_FIELDS.map(({ key }) => key);
export function ensureHsse(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS hsse_monthly (
    year INTEGER NOT NULL CHECK(year = 2026), month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    ${columns.map(key => `${key} INTEGER NOT NULL CHECK(${key} >= 0)`).join(',')},
    updatedAt TEXT NOT NULL, PRIMARY KEY(year, month)
  )`);
}
export function readHsse(year: number, month: number, db = getDb()): HsseResult {
  ensureHsse(db);
  const rows = db.prepare('SELECT * FROM hsse_monthly WHERE year = ? AND month <= ? ORDER BY month').all(year, month) as HsseMonth[];
  const cumulative = rows.length ? Object.fromEntries(columns.map(key => [key, rows.reduce((sum, row) => sum + row[key], 0)])) as HsseValues : null;
  return { year, month, current: rows.find(row => row.month === month) ?? null, cumulative,
    missingMonths: Array.from({ length: month }, (_, i) => i + 1).filter(m => !rows.some(row => row.month === m)) };
}
export function saveHsse(year: number, month: number, values: HsseValues, db = getDb()): HsseResult {
  ensureHsse(db);
  return db.transaction(() => {
    db.prepare(`INSERT INTO hsse_monthly (year,month,${columns.join(',')},updatedAt)
      VALUES (@year,@month,${columns.map(key => `@${key}`).join(',')},@updatedAt)
      ON CONFLICT(year,month) DO UPDATE SET ${columns.map(key => `${key}=excluded.${key}`).join(',')},updatedAt=excluded.updatedAt`)
      .run({ ...values, year, month, updatedAt: new Date().toISOString() });
    return readHsse(year, month, db);
  })();
}

export function saveHsseBatch(rows: { year: number; month: number; values: HsseValues }[], year: number, month: number, db = getDb()): HsseResult {
  ensureHsse(db);
  return db.transaction(() => {
    for (const row of rows) saveHsse(row.year, row.month, row.values, db);
    return readHsse(year, month, db);
  })();
}
