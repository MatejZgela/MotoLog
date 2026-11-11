import { db } from './database';

const CURRENT_SCHEMA_VERSION = 1;

const migrations: Record<number, () => void> = {
  1: () => {
    // Initial schema (already created in initializeDatabase)
    console.log('Schema v1 already initialized');
  },
  // Future migrations:
  // 2: () => {
  //   db.execSync('ALTER TABLE motorcycles ADD COLUMN tire_pressure REAL');
  // },
  // 3: () => {
  //   db.execSync('CREATE TABLE service_reminders (id TEXT PRIMARY KEY, ...)');
  // },
};

export function runMigrations() {
  // Get current DB version
  const result = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1',
  );

  const currentVersion = result?.version || 0;

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    db.withTransactionSync(() => {
      for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
        console.log(`Running migration to v${v}`);
        migrations[v]();
        db.runSync('INSERT INTO schema_version (version) VALUES (?)', [v]);
      }
    });
    console.log(`Database upgraded to v${CURRENT_SCHEMA_VERSION}`);
  }
}
