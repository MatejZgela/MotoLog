import * as FileSystem from 'expo-file-system/legacy';
const {
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
  makeDirectoryAsync,
  deleteAsync,
  documentDirectory,
  readDirectoryAsync,
  moveAsync,
} = FileSystem;
import JSZip from 'jszip';
import { exportAllData, importData, clearAllData } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';

const PHOTOS_DIR = `${documentDirectory}maintenance-photos/`;

export async function createBackup(includeImages: boolean = true) {
  const zip = new JSZip();

  // Add data.json
  const data = exportAllData();
  const dataJson = JSON.stringify(data, null, 2);
  zip.file('data.json', dataJson);

  // Add settings.json
  const settings = {
    unit: await AsyncStorage.getItem('user_unit'),
    alertTime: await AsyncStorage.getItem('alertTime'),
  };
  const settingsJson = JSON.stringify(settings, null, 2);
  zip.file('settings.json', settingsJson);

  // Add images if requested
  if (includeImages) {
    const photosDirInfo = await getInfoAsync(PHOTOS_DIR);
    if (photosDirInfo.exists) {
      const photos = await readDirectoryAsync(PHOTOS_DIR);
      const imagesFolder = zip.folder('images');

      for (const photo of photos) {
        const photoPath = PHOTOS_DIR + photo;
        const photoBase64 = await readAsStringAsync(photoPath, {
          encoding: EncodingType.Base64,
        });
        imagesFolder!.file(photo, photoBase64, { base64: true });
      }
    }
  }

  // Generate ZIP as base64
  const zipBase64 = await zip.generateAsync({ type: 'base64' });

  // Write to file system
  const backupFileName = `motolog_backup_${new Date().toISOString().split('T')[0]}.zip`;
  const zipUri = documentDirectory + backupFileName;
  await writeAsStringAsync(zipUri, zipBase64, {
    encoding: EncodingType.Base64,
  });

  return zipUri;
}

export async function shareBackup(zipUri: string) {
  await Sharing.shareAsync(zipUri, {
    mimeType: 'application/zip',
    dialogTitle: 'Share MotoLog Backup',
  });
}

export async function importBackup(zipUri: string, mode: 'merge' | 'replace') {
  // Read ZIP file as base64
  const zipBase64 = await readAsStringAsync(zipUri, {
    encoding: EncodingType.Base64,
  });

  // Load into JSZip
  const zip = await JSZip.loadAsync(zipBase64, { base64: true });

  // Extract and parse data.json
  const dataFile = zip.file('data.json');
  if (!dataFile) throw new Error('Backup is missing data.json');
  const dataJson = await dataFile.async('string');
  const data = JSON.parse(dataJson);

  // Extract and parse settings.json
  const settingsFile = zip.file('settings.json');
  if (!settingsFile) throw new Error('Backup is missing settings.json');
  const settingsJson = await settingsFile.async('string');
  const settings = JSON.parse(settingsJson);

  // Clear existing data if replace mode
  if (mode === 'replace') {
    await clearAllData();
    const photosDirInfo = await getInfoAsync(PHOTOS_DIR);
    if (photosDirInfo.exists) {
      await deleteAsync(PHOTOS_DIR, { idempotent: true });
    }
    await makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }

  // Import data to SQLite
  await importData(data);

  // Restore settings
  if (settings.unit) await AsyncStorage.setItem('user_unit', settings.unit);
  if (settings.alertTime) await AsyncStorage.setItem('alertTime', settings.alertTime);

  // Extract images if they exist
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    await makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });

    const imageFiles: { [key: string]: JSZip.JSZipObject } = {};
    imagesFolder.forEach((relativePath, file) => {
      if (!file.dir) {
        imageFiles[relativePath] = file;
      }
    });

    for (const [filename, file] of Object.entries(imageFiles)) {
      const imageBase64 = await file.async('base64');
      const photoPath = PHOTOS_DIR + filename;
      await writeAsStringAsync(photoPath, imageBase64, {
        encoding: EncodingType.Base64,
      });
    }
  }
}

export async function checkAndCreateAutoBackup() {
  try {
    const lastBackup = await AsyncStorage.getItem('LAST_AUTO_BACKUP');
    const now = Date.now();

    if (!lastBackup || now - parseInt(lastBackup) > 7 * 24 * 60 * 60 * 1000) {
      const backupUri = await createBackup(false);

      const autoBackupDir = documentDirectory + 'auto_backups/';
      await makeDirectoryAsync(autoBackupDir, { intermediates: true });

      const backupKey = `AUTO_BACKUP_${now}.zip`;
      await moveAsync({
        from: backupUri,
        to: autoBackupDir + backupKey,
      });

      await AsyncStorage.setItem('LAST_AUTO_BACKUP', now.toString());

      await cleanupOldBackups();

      console.log('Auto-backup created successfully');
    }
  } catch (error) {
    console.error('Auto-backup failed:', error);
  }
}

async function cleanupOldBackups() {
  const autoBackupDir = documentDirectory + 'auto_backups/';
  const dirInfo = await getInfoAsync(autoBackupDir);
  if (!dirInfo.exists) return;

  const backups = await readDirectoryAsync(autoBackupDir);
  if (backups.length > 3) {
    const sortedBackups = backups.sort((a, b) => {
      const aTime = parseInt(a.replace('AUTO_BACKUP_', '').replace('.zip', ''));
      const bTime = parseInt(b.replace('AUTO_BACKUP_', '').replace('.zip', ''));
      return aTime - bTime;
    });

    const toDelete = sortedBackups.slice(0, sortedBackups.length - 3);
    for (const backup of toDelete) {
      await deleteAsync(autoBackupDir + backup);
    }
  }
}
