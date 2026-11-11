// TODO: Uncomment this file and the supabase-js dependency in package.json if you need to migrate data from Supabase for existing users.
/*
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { importData } from './database';
import { saveImage } from './imageStorage';
import * as FileSystem from 'expo-file-system';

async function checkIfMigrationNeeded(): Promise<boolean> {
    const migrationCompleted = await AsyncStorage.getItem('MIGRATION_COMPLETED');
    if (migrationCompleted === 'true') {
        return false;
    }
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

async function downloadImage(supabaseUrl: string, bikeId: string, logId: string, type: 'before' | 'after' | 'receipt'): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage.from('maintenance-photos').download(supabaseUrl.split('/').pop()!);
        if (error || !data) {
            throw error || new Error('No data');
        }
        const fr = new FileReader();
        return new Promise((resolve, reject) => {
            fr.onload = async () => {
                const fileUri = FileSystem.cacheDirectory + supabaseUrl.split('/').pop()!;
                await FileSystem.writeAsStringAsync(fileUri, fr.result as string, { encoding: FileSystem.EncodingType.Base64 });
                const fileName = await saveImage(fileUri, type, bikeId, logId);
                resolve(fileName);
            };
            fr.onerror = (e) => {
                reject(e);
            };
            fr.readAsDataURL(data);
        });
    } catch (e) {
        console.error('Error downloading image', e);
        return null;
    }
}

export async function migrateFromSupabase() {
    const needed = await checkIfMigrationNeeded();
    if (!needed) {
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: motorcycles, error: bikesError } = await supabase
            .from('motorcycles')
            .select('*')
            .eq('user_id', user.id);

        if (bikesError) throw bikesError;

        const { data: logs, error: logsError } = await supabase
            .from('maintenance_logs')
            .select('*')
            .in('motorcycle_id', motorcycles.map(m => m.id));

        if (logsError) throw logsError;

        for (const log of logs) {
            if (log.image_before_url) {
                log.image_before_url = await downloadImage(log.image_before_url, log.motorcycle_id, log.id, 'before');
            }
            if (log.image_after_url) {
                log.image_after_url = await downloadImage(log.image_after_url, log.motorcycle_id, log.id, 'after');
            }
            if (log.receipt_image_url) {
                log.receipt_image_url = await downloadImage(log.receipt_image_url, log.motorcycle_id, log.id, 'receipt');
            }
        }

        const { data: schedules, error: schedulesError } = await supabase
            .from('maintenance_schedules')
            .select('*')
            .in('motorcycle_id', motorcycles.map(m => m.id));

        if (schedulesError) throw schedulesError;

        importData({ motorcycles, maintenance_logs: logs, maintenance_schedules: schedules });

        await AsyncStorage.setItem('MIGRATION_COMPLETED', 'true');
        await supabase.auth.signOut();

    } catch (e) {
        console.error('Error migrating from supabase', e);
    }
}
*/
