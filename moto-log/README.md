# 🏍️ MotoLog

**MotoLog** is a comprehensive React Native mobile application for motorcycle enthusiasts to track, manage, and schedule maintenance for their bikes. Built with Expo and powered by Supabase, MotoLog helps riders stay on top of service schedules, log maintenance history with photo evidence, and never miss critical maintenance deadlines.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

### 🏍️ **Multi-Bike Garage**

- Add and manage unlimited motorcycles
- Track make, model, year, nickname, and current odometer
- Visual "SERVICE DUE" badges for bikes needing attention
- Smart alert system that monitors both time and distance intervals

### 📋 **Comprehensive Maintenance Logging**

- Log every service with detailed information:
  - Task category (Engine Oil, Tires, Brakes, Chain, etc.)
  - Service date and odometer reading
  - Cost tracking
  - Custom notes
- Expandable log cards with full details
- Swipe gestures to quickly edit or delete logs

### 📸 **Photo Documentation**

- Attach up to 3 photos per maintenance log:
  - **Before** - Document the issue
  - **After** - Show the completed work
  - **Receipt** - Keep financial records
- Full-screen photo viewer with pinch-to-zoom
- Camera or gallery integration

### 📅 **Smart Scheduling System**

- Create maintenance schedules based on:
  - **Time intervals** (e.g., every 90 days)
  - **Distance intervals** (e.g., every 3,000 miles)
  - **Both combined** for comprehensive coverage
- Automatic overdue detection
- Schedule one-time or recurring maintenance

### 🔔 **Push Notifications**

- Scheduled alerts when maintenance is due
- "Gentle nag" follow-up reminders 7 days after initial alert
- Android notification channels with custom vibration patterns
- Alerts at 10:00 AM local time

### 📄 **PDF Export**

- Generate professional maintenance history reports
- Share service records via email, cloud storage, or messaging
- Perfect for warranty claims or resale documentation

### ⚙️ **User Preferences**

- Toggle between Miles and Kilometers
- Dark mode interface optimized for readability
- Persistent settings across app sessions

### 🔒 **Secure Authentication**

- Email/password authentication with Supabase
- Secure session management with auto-refresh tokens
- Account deletion with complete data removal

---

## 🛠️ Tech Stack

### **Frontend**

- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (SDK 54) - Development platform and build tools
- **TypeScript** - Type-safe development
- **Expo Router** - File-based navigation
- **React Native Gesture Handler** - Swipe interactions

### **Backend & Services**

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication & user management
  - Storage for maintenance photos
  - Real-time subscriptions

### **Key Libraries**

- `@supabase/supabase-js` - Database and auth client
- `expo-notifications` - Push notification scheduling
- `expo-camera` & `expo-image-picker` - Photo capture/selection
- `expo-print` & `expo-sharing` - PDF generation and sharing
- `@react-native-async-storage/async-storage` - Local data persistence
- `react-native-keyboard-aware-scroll-view` - Improved form UX

---

## 📊 Database Schema

MotoLog uses a Supabase PostgreSQL database with three core tables:

### `motorcycles`

| Column             | Type        | Description                           |
| ------------------ | ----------- | ------------------------------------- |
| `id`               | `uuid`      | Primary key                           |
| `user_id`          | `uuid`      | Foreign key to Supabase auth.users    |
| `nickname`         | `text`      | Optional custom nickname for the bike |
| `make`             | `text`      | Manufacturer (e.g., Yamaha, Honda)    |
| `model`            | `text`      | Model name (e.g., R6, CBR1000RR)      |
| `year`             | `integer`   | Year of manufacture                   |
| `current_odometer` | `integer`   | Current mileage/kilometers            |
| `created_at`       | `timestamp` | Record creation timestamp             |

### `maintenance_logs`

| Column                | Type        | Description                            |
| --------------------- | ----------- | -------------------------------------- |
| `id`                  | `uuid`      | Primary key                            |
| `motorcycle_id`       | `uuid`      | Foreign key to motorcycles table       |
| `task_category`       | `text`      | Service type (e.g., Engine Oil, Tires) |
| `odometer_at_service` | `integer`   | Odometer reading at time of service    |
| `cost`                | `float`     | Service cost                           |
| `notes`               | `text`      | Additional service notes               |
| `service_date`        | `date`      | Date service was performed             |
| `image_before_url`    | `text`      | Supabase Storage URL for before photo  |
| `image_after_url`     | `text`      | Supabase Storage URL for after photo   |
| `receipt_image_url`   | `text`      | Supabase Storage URL for receipt photo |
| `created_at`          | `timestamp` | Record creation timestamp              |

### `maintenance_schedules`

| Column              | Type        | Description                        |
| ------------------- | ----------- | ---------------------------------- |
| `id`                | `uuid`      | Primary key                        |
| `motorcycle_id`     | `uuid`      | Foreign key to motorcycles table   |
| `task_category`     | `text`      | Service type to schedule           |
| `interval_days`     | `integer`   | Time-based interval (nullable)     |
| `interval_distance` | `integer`   | Distance-based interval (nullable) |
| `created_at`        | `timestamp` | Record creation timestamp          |

---

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator, or a physical device with Expo Go

### **Installation**

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/moto-log.git
   cd moto-log
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)

   b. Run the following SQL in the Supabase SQL Editor:

   ```sql
   -- Create motorcycles table
   CREATE TABLE motorcycles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     nickname TEXT,
     make TEXT NOT NULL,
     model TEXT NOT NULL,
     year INTEGER NOT NULL,
     current_odometer INTEGER NOT NULL DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Create maintenance_logs table
   CREATE TABLE maintenance_logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE CASCADE,
     task_category TEXT NOT NULL,
     odometer_at_service INTEGER NOT NULL,
     cost FLOAT,
     notes TEXT,
     service_date DATE NOT NULL,
     image_before_url TEXT,
     image_after_url TEXT,
     receipt_image_url TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Create maintenance_schedules table
   CREATE TABLE maintenance_schedules (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE CASCADE,
     task_category TEXT NOT NULL,
     interval_days INTEGER,
     interval_distance INTEGER,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE motorcycles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

   -- RLS Policies for motorcycles
   CREATE POLICY "Users can view their own motorcycles"
     ON motorcycles FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own motorcycles"
     ON motorcycles FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own motorcycles"
     ON motorcycles FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own motorcycles"
     ON motorcycles FOR DELETE
     USING (auth.uid() = user_id);

   -- RLS Policies for maintenance_logs
   CREATE POLICY "Users can view logs for their motorcycles"
     ON maintenance_logs FOR SELECT
     USING (motorcycle_id IN (
       SELECT id FROM motorcycles WHERE user_id = auth.uid()
     ));

   CREATE POLICY "Users can insert logs for their motorcycles"
     ON maintenance_logs FOR INSERT
     WITH CHECK (motorcycle_id IN (
       SELECT id FROM motorcycles WHERE user_id = auth.uid()
     ));

   CREATE POLICY "Users can update logs for their motorcycles"
     ON maintenance_logs FOR UPDATE
     USING (motorcycle_id IN (
       SELECT id FROM motorcycles WHERE user_id = auth.uid()
     ));

   CREATE POLICY "Users can delete logs for their motorcycles"
     ON maintenance_logs FOR DELETE
     USING (motorcycle_id IN (
       SELECT id FROM motorcycles WHERE user_id = auth.uid()
     ));

   -- RLS Policies for maintenance_schedules
   CREATE POLICY "Users can view schedules for their motorcycles"
     ON maintenance_schedules FOR SELECT
     USING (motorcycle_id IN (
       SELECT id FROM motorcycles WHERE user_id = auth.uid()
     ));

   CREATE POLICY "Users can insert schedules for their motorcycles"
     ON maintenance_schedules FOR INSERT
     WITH CHECK (motorcycle_id IN (
       SELECT id FROM motorcycles WHERE user_id = auth.uid()
     ));

   CREATE POLICY "Users can update schedules for their motorcycles"
     ON maintenance_schedules FOR UPDATE
     USING (motorcycle_id IN (
       SELECT id FROM motorcycles WHERE user_id = auth.uid()
     ));

   CREATE POLICY "Users can delete schedules for their motorcycles"
     ON maintenance_schedules FOR DELETE
     USING (motorcycle_id IN (
       SELECT id FROM motorcycles WHERE user_id = auth.uid()
     ));

   -- Storage bucket for maintenance photos
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('maintenance-photos', 'maintenance-photos', true);

   -- Storage policies
   CREATE POLICY "Users can upload their own photos"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'maintenance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Anyone can view photos"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'maintenance-photos');

   CREATE POLICY "Users can delete their own photos"
     ON storage.objects FOR DELETE
     USING (bucket_id = 'maintenance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- Function to delete user and all associated data
   CREATE OR REPLACE FUNCTION delete_user()
   RETURNS void AS $$
   BEGIN
     DELETE FROM auth.users WHERE id = auth.uid();
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

   c. Update `lib/supabase.ts` with your Supabase credentials:

   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabasePublishableKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go (iOS) or the Expo app (Android)
   - Or press `i` for iOS Simulator / `a` for Android Emulator

---

## 📱 Building for Production

### **Android APK (Preview Build)**

```bash
eas build -p android --profile preview
```

### **Production Builds**

```bash
# iOS
eas build -p ios --profile production

# Android
eas build -p android --profile production
```

### **Submit to Stores**

```bash
eas submit -p ios
eas submit -p android
```

> **Note**: You'll need an [Expo EAS](https://expo.dev/eas) account for building and submitting.

---

## 🎯 Usage Guide

### **Adding Your First Motorcycle**

1. Launch the app and sign up/login
2. Tap the "Add Motorcycle" button
3. Enter make, model, year, and current odometer
4. Optionally add a nickname
5. Save to add to your garage

### **Logging Maintenance**

1. Select a bike from your garage
2. Tap "Log Service"
3. Choose the service category
4. Enter odometer reading, cost, and notes
5. Optionally add before/after/receipt photos
6. Save the log

### **Creating a Schedule**

1. Open a bike profile
2. Tap "Add Schedule"
3. Select the task category
4. Set time interval (days) and/or distance interval
5. Save to enable automatic alerts

### **Viewing Maintenance History**

1. Open any bike profile
2. Scroll through the maintenance logs
3. Tap a log to expand and see full details
4. Swipe left to edit, swipe right to delete

### **Exporting Reports**

1. Open a bike profile
2. Tap the share icon (export button)
3. Choose "Print/Share Report"
4. Select a sharing method (email, messages, files, etc.)

---

## 🗂️ Project Structure

```
moto-log/
├── app/                      # Expo Router file-based navigation
│   ├── _layout.tsx           # Root layout with auth guard
│   ├── index.tsx             # Garage screen (home)
│   ├── login.tsx             # Authentication screen
│   ├── add-bike.tsx          # Add motorcycle form
│   ├── edit-bike.tsx         # Edit motorcycle form
│   ├── log-service.tsx       # Add maintenance log
│   ├── edit-log.tsx          # Edit maintenance log
│   ├── add-schedule.tsx      # Add maintenance schedule
│   ├── edit-schedule.tsx     # Edit maintenance schedule
│   ├── settings.tsx          # User settings and preferences
│   └── bike/
│       └── [id].tsx          # Dynamic bike profile screen
├── assets/                   # Images, icons, and fonts
├── context/
│   └── SettingsContext.tsx   # Global settings state (units)
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   └── notifications.ts      # Push notification handlers
├── app.json                  # Expo configuration
├── eas.json                  # EAS Build configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Backend powered by [Supabase](https://supabase.com)
- Icons from [@expo/vector-icons](https://icons.expo.fyi)

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ for motorcycle enthusiasts**
