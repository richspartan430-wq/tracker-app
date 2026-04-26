import SQLite from 'react-native-sqlite-storage';
import { AppSettings, DailyEntry } from '../types/domain';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

const DATABASE_NAME = 'daily_discipline_tracker.db';
const SETTINGS_KEY = 'app_settings';

let database: any = null;

function parseEntryPayload(rawValue: string): DailyEntry | null {
  try {
    return JSON.parse(rawValue) as DailyEntry;
  } catch (error) {
    console.warn('Could not parse entry payload', error);
    return null;
  }
}

function parseSettingsPayload(rawValue: string): AppSettings | null {
  try {
    return JSON.parse(rawValue) as AppSettings;
  } catch (error) {
    console.warn('Could not parse settings payload', error);
    return null;
  }
}

async function getDatabase() {
  if (database) {
    return database;
  }

  database = await SQLite.openDatabase({
    name: DATABASE_NAME,
    location: 'default',
  });

  return database;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.executeSql('PRAGMA journal_mode = WAL;');
  await db.executeSql(
    'CREATE TABLE IF NOT EXISTS entries (date TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updated_at INTEGER NOT NULL);',
  );
  await db.executeSql(
    'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL);',
  );
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  const db = await getDatabase();

  await db.executeSql(
    'INSERT INTO entries (date, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at;',
    [entry.date, JSON.stringify(entry), Date.now()],
  );
}

export async function saveEntriesBulk(entries: DailyEntry[]): Promise<void> {
  if (!entries.length) {
    return;
  }

  const db = await getDatabase();

  for (const entry of entries) {
    await db.executeSql(
      'INSERT INTO entries (date, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at;',
      [entry.date, JSON.stringify(entry), Date.now()],
    );
  }
}

export async function loadEntry(dateKey: string): Promise<DailyEntry | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT payload FROM entries WHERE date = ? LIMIT 1;',
    [dateKey],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows.item(0) as { payload: string };
  return parseEntryPayload(row.payload);
}

export async function loadAllEntries(): Promise<DailyEntry[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT payload FROM entries ORDER BY date ASC;',
  );

  const values: DailyEntry[] = [];
  for (let index = 0; index < result.rows.length; index += 1) {
    const row = result.rows.item(index) as { payload: string };
    const parsed = parseEntryPayload(row.payload);
    if (parsed) {
      values.push(parsed);
    }
  }

  return values;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDatabase();

  await db.executeSql(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;',
    [SETTINGS_KEY, JSON.stringify(settings), Date.now()],
  );
}

export async function loadSettings(): Promise<AppSettings | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT value FROM settings WHERE key = ? LIMIT 1;',
    [SETTINGS_KEY],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows.item(0) as { value: string };
  return parseSettingsPayload(row.value);
}

export async function clearDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM entries;');
  await db.executeSql('DELETE FROM settings;');
}
