import { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AlertTime = { hour: number; minute: number };

type SettingsContextType = {
  unit: string;
  toggleUnit: () => void;
  alertTime: AlertTime;
  setAlertTime: (time: AlertTime) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  unit: 'mi',
  toggleUnit: () => {},
  alertTime: { hour: 10, minute: 0 },
  setAlertTime: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [unit, setUnit] = useState('mi'); // Default to miles
  const [alertTime, setAlertTimeState] = useState<AlertTime>({ hour: 10, minute: 0 }); // Default 10:00 AM

  // Load the saved preferences when the app starts
  useEffect(() => {
    const loadSettings = async () => {
      const savedUnit = await AsyncStorage.getItem('user_unit');
      if (savedUnit) setUnit(savedUnit);

      const savedTime = await AsyncStorage.getItem('alertTime');
      if (savedTime) setAlertTimeState(JSON.parse(savedTime));
    };
    loadSettings();
  }, []);

  // Toggle the unit and save it to phone storage
  const toggleUnit = async () => {
    const newUnit = unit === 'mi' ? 'km' : 'mi';
    setUnit(newUnit);
    await AsyncStorage.setItem('user_unit', newUnit);
  };

  // Save the custom time to phone storage
  const setAlertTime = async (time: AlertTime) => {
    setAlertTimeState(time);
    await AsyncStorage.setItem('alertTime', JSON.stringify(time));
  };

  return (
    <SettingsContext.Provider value={{ unit, toggleUnit, alertTime, setAlertTime }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
