/**
 * Stockage local (aucun serveur). Sur iOS/Android, la base est chiffrée avec
 * SQLCipher ; la clé aléatoire est gardée dans le trousseau (expo-secure-store).
 * Toutes les requêtes utilisent des paramètres liés : aucune concaténation SQL.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import type { Profile } from './calories';
import { isProfileInBounds } from './calories';
import { LIMITS, isValidDayKey, kcalForPortion, sanitizeName } from './validation';

const DB_NAME = 'nutripanier.db';
const KEY_NAME = 'nutripanier.db.key';
const SCHEMA_VERSION = 1;

export interface Entry {
  id: number;
  day: string;
  name: string;
  grams: number;
  kcal_per_100g: number;
  kcal: number;
}

export interface Food {
  id: number;
  name: string;
  kcal_per_100g: number;
  barcode: string | null;
}

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  checked: number;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing && /^[0-9a-f]{64}$/.test(existing)) return existing;
  const bytes = await Crypto.getRandomBytesAsync(32);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(KEY_NAME, hex, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return hex;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  if (Platform.OS !== 'web') {
    // La clé ne contient que des caractères hexadécimaux vérifiés : pas d'injection possible.
    const key = await getOrCreateKey();
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
  }
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL,
      disclaimer_accepted INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      name TEXT NOT NULL,
      grams REAL NOT NULL CHECK (grams > 0),
      kcal_per_100g REAL NOT NULL CHECK (kcal_per_100g >= 0),
      kcal INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS entries_day ON entries(day);
    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kcal_per_100g REAL NOT NULL,
      barcode TEXT UNIQUE
    );
    CREATE TABLE IF NOT EXISTS shopping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      checked INTEGER NOT NULL DEFAULT 0
    );
    PRAGMA user_version = ${SCHEMA_VERSION};
  `);
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

// --- Profil -------------------------------------------------------------

export async function loadProfile(): Promise<{ profile: Profile | null; accepted: boolean }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ json: string; disclaimer_accepted: number }>(
    'SELECT json, disclaimer_accepted FROM profile WHERE id = 1',
  );
  if (!row) return { profile: null, accepted: false };
  let profile: Profile | null = null;
  try {
    const parsed = JSON.parse(row.json) as Profile;
    profile = isProfileInBounds(parsed) ? parsed : null;
  } catch {
    profile = null;
  }
  return { profile, accepted: row.disclaimer_accepted === 1 };
}

export async function saveProfile(profile: Profile): Promise<boolean> {
  if (!isProfileInBounds(profile)) return false;
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO profile (id, json, disclaimer_accepted) VALUES (1, ?, 1)
     ON CONFLICT(id) DO UPDATE SET json = excluded.json`,
    JSON.stringify(profile),
  );
  return true;
}

export async function acceptDisclaimer(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO profile (id, json, disclaimer_accepted) VALUES (1, 'null', 1)
     ON CONFLICT(id) DO UPDATE SET disclaimer_accepted = 1`,
  );
}

// --- Journal ------------------------------------------------------------

export async function listEntries(day: string): Promise<Entry[]> {
  if (!isValidDayKey(day)) return [];
  const db = await getDb();
  return db.getAllAsync<Entry>(
    'SELECT id, day, name, grams, kcal_per_100g, kcal FROM entries WHERE day = ? ORDER BY id',
    day,
  );
}

export type AddResult = 'ok' | 'invalid' | 'limit';

export async function addEntry(
  day: string,
  rawName: unknown,
  kcalPer100g: number,
  grams: number,
): Promise<AddResult> {
  const name = sanitizeName(rawName);
  const valid =
    name !== null &&
    isValidDayKey(day) &&
    Number.isFinite(kcalPer100g) &&
    kcalPer100g >= 0 &&
    kcalPer100g <= LIMITS.kcalPer100gMax &&
    Number.isFinite(grams) &&
    grams >= LIMITS.gramsMin &&
    grams <= LIMITS.gramsMax;
  if (!valid) return 'invalid';
  const db = await getDb();
  const count = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM entries WHERE day = ?',
    day,
  );
  if ((count?.n ?? 0) >= LIMITS.entriesPerDayMax) return 'limit';
  await db.runAsync(
    'INSERT INTO entries (day, name, grams, kcal_per_100g, kcal, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    day,
    name,
    grams,
    kcalPer100g,
    kcalForPortion(kcalPer100g, grams),
    Date.now(),
  );
  return 'ok';
}

export async function deleteEntry(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', id);
}

/** Totaux par jour depuis une date (historique). */
export async function dailyTotals(sinceDay: string): Promise<{ day: string; total: number }[]> {
  if (!isValidDayKey(sinceDay)) return [];
  const db = await getDb();
  return db.getAllAsync<{ day: string; total: number }>(
    'SELECT day, SUM(kcal) AS total FROM entries WHERE day >= ? GROUP BY day ORDER BY day DESC',
    sinceDay,
  );
}

export async function allEntries(): Promise<Entry[]> {
  const db = await getDb();
  return db.getAllAsync<Entry>(
    'SELECT id, day, name, grams, kcal_per_100g, kcal FROM entries ORDER BY day, id',
  );
}

// --- Aliments enregistrés ----------------------------------------------

export async function listFoods(): Promise<Food[]> {
  const db = await getDb();
  return db.getAllAsync<Food>('SELECT id, name, kcal_per_100g, barcode FROM foods ORDER BY name');
}

export async function saveFood(
  rawName: unknown,
  kcalPer100g: number,
  barcode: string | null,
): Promise<boolean> {
  const name = sanitizeName(rawName);
  if (!name || !Number.isFinite(kcalPer100g) || kcalPer100g < 0) return false;
  if (kcalPer100g > LIMITS.kcalPer100gMax) return false;
  const db = await getDb();
  const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM foods');
  const exists = barcode ? await findFoodByBarcode(barcode) : null;
  if (!exists && (count?.n ?? 0) >= LIMITS.foodsMax) return false;
  await db.runAsync(
    `INSERT INTO foods (name, kcal_per_100g, barcode) VALUES (?, ?, ?)
     ON CONFLICT(barcode) DO UPDATE SET name = excluded.name, kcal_per_100g = excluded.kcal_per_100g`,
    name,
    kcalPer100g,
    barcode,
  );
  return true;
}

export async function findFoodByBarcode(barcode: string): Promise<Food | null> {
  const db = await getDb();
  return db.getFirstAsync<Food>(
    'SELECT id, name, kcal_per_100g, barcode FROM foods WHERE barcode = ?',
    barcode,
  );
}

export async function deleteFood(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM foods WHERE id = ?', id);
}

// --- Liste de courses ----------------------------------------------------

export async function listShopping(): Promise<ShoppingItem[]> {
  const db = await getDb();
  return db.getAllAsync<ShoppingItem>(
    'SELECT id, name, quantity, checked FROM shopping ORDER BY checked, id',
  );
}

export async function addShopping(rawName: unknown, quantity: number): Promise<AddResult> {
  const name = sanitizeName(rawName);
  if (!name || !Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.quantityMax) {
    return 'invalid';
  }
  const db = await getDb();
  const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM shopping');
  if ((count?.n ?? 0) >= LIMITS.shoppingItemsMax) return 'limit';
  await db.runAsync('INSERT INTO shopping (name, quantity) VALUES (?, ?)', name, quantity);
  return 'ok';
}

export async function toggleShopping(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;
  const db = await getDb();
  await db.runAsync('UPDATE shopping SET checked = 1 - checked WHERE id = ?', id);
}

export async function clearCheckedShopping(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM shopping WHERE checked = 1');
}

// --- Effacement total (droit à l'effacement) ----------------------------

export async function wipeAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM entries; DELETE FROM foods; DELETE FROM shopping; DELETE FROM profile;
    VACUUM;
  `);
}
