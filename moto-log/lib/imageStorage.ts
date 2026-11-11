import * as FileSystem from 'expo-file-system/legacy';
import { getAllLogsForAllBikes, getLogById, getAllLogs } from './database';

const PHOTOS_DIR = `${FileSystem.documentDirectory}maintenance-photos/`;

// Initialize directory on first run
export async function initializeImageStorage() {
  const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function saveImage(
  uri: string,
  type: 'before' | 'after' | 'receipt',
  bikeId: string,
  logId: string,
): Promise<string> {
  const filename = `${bikeId}_${logId}_${type}_${Date.now()}.jpg`;
  const dest = PHOTOS_DIR + filename;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return filename;
}

export function getAbsoluteImagePath(filename: string): string {
  return PHOTOS_DIR + filename;
}

export async function deleteImage(filename: string) {
  const path = getAbsoluteImagePath(filename);
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(path);
  }
}

export async function deleteAllImagesForBike(bikeId: string) {
  const logs = await getAllLogs(bikeId);
  for (const log of logs) {
    if (log.image_before_url) await deleteImage(log.image_before_url);
    if (log.image_after_url) await deleteImage(log.image_after_url);
    if (log.receipt_image_url) await deleteImage(log.receipt_image_url);
  }
}

export async function deleteAllImagesForLog(logId: string) {
  const log = await getLogById(logId);
  if (log) {
    if (log.image_before_url) await deleteImage(log.image_before_url);
    if (log.image_after_url) await deleteImage(log.image_after_url);
    if (log.receipt_image_url) await deleteImage(log.receipt_image_url);
  }
}

export async function cleanupOrphanedImages() {
  const files = await FileSystem.readDirectoryAsync(PHOTOS_DIR);
  const dbLogs = await getAllLogsForAllBikes();

  const referencedImages = new Set<string>();
  for (const log of dbLogs) {
    if (log.image_before_url) referencedImages.add(log.image_before_url);
    if (log.image_after_url) referencedImages.add(log.image_after_url);
    if (log.receipt_image_url) referencedImages.add(log.receipt_image_url);
  }

  for (const file of files) {
    if (!referencedImages.has(file)) {
      await deleteImage(file);
    }
  }
}

export async function deleteAllImages() {
  await FileSystem.deleteAsync(PHOTOS_DIR, { idempotent: true });
  await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
}
