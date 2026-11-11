export interface Motorcycle {
  id: string;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  current_odometer: number;
  created_at: string;
}

export interface MaintenanceLog {
  id: string;
  motorcycle_id: string;
  task_category: string;
  odometer_at_service: number;
  cost: number | null;
  notes: string | null;
  service_date: string;
  image_before_url: string | null;
  image_after_url: string | null;
  receipt_image_url: string | null;
  created_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  motorcycle_id: string;
  task_category: string;
  interval_days: number | null;
  interval_distance: number | null;
  created_at: string;
}

export interface LocalData {
  motorcycles: Motorcycle[];
  maintenance_logs: MaintenanceLog[];
  maintenance_schedules: MaintenanceSchedule[];
  lastModified: number;
}

export interface BackupData {
  version: string;
  exportDate: string;
  motorcycles: Motorcycle[];
  maintenance_logs: MaintenanceLog[];
  maintenance_schedules: MaintenanceSchedule[];
  images?: Array<{
    path: string;
    base64: string;
  }>;
  settings: {
    unit: string;
    alertTime: {
      hour: number;
      minute: number;
    };
  };
}
