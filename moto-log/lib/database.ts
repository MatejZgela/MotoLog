import * as SQLite from 'expo-sqlite';
import { Motorcycle, MaintenanceLog, MaintenanceSchedule } from '../types/database';

export const db = SQLite.openDatabaseSync('motolog.db');

export function initializeDatabase() {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS motorcycles (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      current_odometer INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      motorcycle_id TEXT NOT NULL,
      task_category TEXT NOT NULL,
      odometer_at_service INTEGER NOT NULL,
      cost REAL,
      notes TEXT,
      service_date TEXT NOT NULL,
      image_before_url TEXT,
      image_after_url TEXT,
      receipt_image_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (motorcycle_id) REFERENCES motorcycles(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS maintenance_schedules (
      id TEXT PRIMARY KEY,
      motorcycle_id TEXT NOT NULL,
      task_category TEXT NOT NULL,
      interval_days INTEGER,
      interval_distance INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (motorcycle_id) REFERENCES motorcycles(id) ON DELETE CASCADE
    );
  `);

  db.execSync('CREATE INDEX IF NOT EXISTS idx_logs_motorcycle ON maintenance_logs(motorcycle_id);');
  db.execSync('CREATE INDEX IF NOT EXISTS idx_logs_date ON maintenance_logs(service_date);');
  db.execSync(
    'CREATE INDEX IF NOT EXISTS idx_schedules_motorcycle ON maintenance_schedules(motorcycle_id);',
  );

  const version = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1',
  );
  if (!version) {
    db.runSync('INSERT INTO schema_version (version) VALUES (1)');
  }
}

export function getAllBikes(): Motorcycle[] {
  return db.getAllSync<Motorcycle>('SELECT * FROM motorcycles ORDER BY created_at DESC');
}

export function getBikeById(id: string): Motorcycle | null {
  return db.getFirstSync<Motorcycle>('SELECT * FROM motorcycles WHERE id = ?', id);
}

export function addBike(bike: Motorcycle) {
  db.runSync(
    'INSERT INTO motorcycles (id, nickname, make, model, year, current_odometer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    bike.id,
    bike.nickname,
    bike.make,
    bike.model,
    bike.year,
    bike.current_odometer,
    bike.created_at,
  );
}

export function updateBike(id: string, updates: Partial<Motorcycle>) {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(', ');
  const values = Object.values(updates);
  db.runSync(`UPDATE motorcycles SET ${fields} WHERE id = ?`, ...values, id);
}

export function deleteBike(id: string) {
  db.runSync('DELETE FROM motorcycles WHERE id = ?', id);
}

export function getAllLogs(bikeId: string): MaintenanceLog[] {
  return db.getAllSync<MaintenanceLog>(
    'SELECT * FROM maintenance_logs WHERE motorcycle_id = ? ORDER BY service_date DESC',
    bikeId,
  );
}

export function getAllLogsForAllBikes(): MaintenanceLog[] {
  return db.getAllSync<MaintenanceLog>('SELECT * FROM maintenance_logs');
}

export function getLogById(id: string): MaintenanceLog | null {
  return db.getFirstSync<MaintenanceLog>('SELECT * FROM maintenance_logs WHERE id = ?', id);
}

export function addLog(log: MaintenanceLog) {
  db.runSync(
    'INSERT INTO maintenance_logs (id, motorcycle_id, task_category, odometer_at_service, cost, notes, service_date, image_before_url, image_after_url, receipt_image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    log.id,
    log.motorcycle_id,
    log.task_category,
    log.odometer_at_service,
    log.cost,
    log.notes,
    log.service_date,
    log.image_before_url,
    log.image_after_url,
    log.receipt_image_url,
    log.created_at,
  );
}

export function updateLog(id: string, updates: Partial<MaintenanceLog>) {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(', ');
  const values = Object.values(updates);
  db.runSync(`UPDATE maintenance_logs SET ${fields} WHERE id = ?`, ...values, id);
}

export function deleteLog(id: string) {
  db.runSync('DELETE FROM maintenance_logs WHERE id = ?', id);
}

export function searchLogs(bikeId: string, query: string): MaintenanceLog[] {
  const searchTerm = `%${query}%`;
  return db.getAllSync<MaintenanceLog>(
    'SELECT * FROM maintenance_logs WHERE motorcycle_id = ? AND (task_category LIKE ? OR notes LIKE ?)',
    bikeId,
    searchTerm,
    searchTerm,
  );
}

export function getAllSchedules(bikeId: string): MaintenanceSchedule[] {
  return db.getAllSync<MaintenanceSchedule>(
    'SELECT * FROM maintenance_schedules WHERE motorcycle_id = ?',
    bikeId,
  );
}

export function getAllSchedulesForAllBikes(): MaintenanceSchedule[] {
  return db.getAllSync<MaintenanceSchedule>('SELECT * FROM maintenance_schedules');
}

export function getScheduleById(id: string): MaintenanceSchedule | null {
  return db.getFirstSync<MaintenanceSchedule>(
    'SELECT * FROM maintenance_schedules WHERE id = ?',
    id,
  );
}

export function getScheduleByBikeAndTask(bikeId: string, task: string): MaintenanceSchedule | null {
  return db.getFirstSync<MaintenanceSchedule>(
    'SELECT * FROM maintenance_schedules WHERE motorcycle_id = ? AND task_category = ?',
    bikeId,
    task,
  );
}

export function getLastServiceLogForTask(bikeId: string, task: string): MaintenanceLog | null {
  return db.getFirstSync<MaintenanceLog>(
    'SELECT * FROM maintenance_logs WHERE motorcycle_id = ? AND task_category = ? ORDER BY service_date DESC LIMIT 1',
    bikeId,
    task,
  );
}

export function addSchedule(schedule: MaintenanceSchedule) {
  db.runSync(
    'INSERT INTO maintenance_schedules (id, motorcycle_id, task_category, interval_days, interval_distance, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    schedule.id,
    schedule.motorcycle_id,
    schedule.task_category,
    schedule.interval_days,
    schedule.interval_distance,
    schedule.created_at,
  );
}

export function updateSchedule(id: string, updates: Partial<MaintenanceSchedule>) {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(', ');
  const values = Object.values(updates);
  db.runSync(`UPDATE maintenance_schedules SET ${fields} WHERE id = ?`, ...values, id);
}

export function deleteSchedule(id: string) {
  db.runSync('DELETE FROM maintenance_schedules WHERE id = ?', id);
}

export function exportAllData() {
  const motorcycles = getAllBikes();
  const maintenance_logs = db.getAllSync<MaintenanceLog>('SELECT * FROM maintenance_logs');
  const maintenance_schedules = db.getAllSync<MaintenanceSchedule>(
    'SELECT * FROM maintenance_schedules',
  );
  return {
    motorcycles,
    maintenance_logs,
    maintenance_schedules,
  };
}

export function importData(data: {
  motorcycles: Motorcycle[];
  maintenance_logs: MaintenanceLog[];
  maintenance_schedules: MaintenanceSchedule[];
}) {
  db.withTransactionSync(() => {
    for (const bike of data.motorcycles) {
      addBike(bike);
    }
    for (const log of data.maintenance_logs) {
      addLog(log);
    }
    for (const schedule of data.maintenance_schedules) {
      addSchedule(schedule);
    }
  });
}

export function clearAllData() {
  db.execSync('DELETE FROM motorcycles');
  db.execSync('DELETE FROM maintenance_logs');
  db.execSync('DELETE FROM maintenance_schedules');
  db.execSync('DELETE FROM schema_version');
}

export function getCurrentSchemaVersion(): number {
  const result = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1',
  );
  return result?.version || 0;
}
