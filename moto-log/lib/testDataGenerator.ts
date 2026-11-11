import { addBike, addLog, addSchedule } from './database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export async function generateTestData() {
  const testBike = {
    id: uuidv4(),
    nickname: 'Test Bike',
    make: 'Honda',
    model: 'CBR600RR',
    year: 2020,
    current_odometer: 10000,
    created_at: new Date().toISOString(),
  };

  const testLog = {
    id: uuidv4(),
    motorcycle_id: testBike.id,
    task_category: 'Engine Oil',
    odometer_at_service: 9500,
    cost: 75.0,
    notes: 'Test oil change',
    service_date: '2026-03-01',
    image_before_url: null,
    image_after_url: null,
    receipt_image_url: null,
    created_at: new Date().toISOString(),
  };

  const testSchedule = {
    id: uuidv4(),
    motorcycle_id: testBike.id,
    task_category: 'Engine Oil',
    interval_days: 90,
    interval_distance: 3000,
    created_at: new Date().toISOString(),
  };

  await addBike(testBike);
  await addLog(testLog);
  await addSchedule(testSchedule);

  console.log('Test data generated successfully');
}
