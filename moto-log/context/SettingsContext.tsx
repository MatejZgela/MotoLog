import { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsContextType = {
  unit: string;
  toggleUnit: () => void;
};

const SettingsContext = createContext<SettingsContextType>({
  unit: 'mi',
  toggleUnit: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [unit, setUnit] = useState('mi'); // Default to miles

  // Load the saved preference when the app starts
  useEffect(() => {
    const loadSettings = async () => {
      const savedUnit = await AsyncStorage.getItem('user_unit');
      if (savedUnit) setUnit(savedUnit);
    };
    loadSettings();
  }, []);

  // Toggle the unit and save it to phone storage
  const toggleUnit = async () => {
    const newUnit = unit === 'mi' ? 'km' : 'mi';
    setUnit(newUnit);
    await AsyncStorage.setItem('user_unit', newUnit);
  };

  return (
    <SettingsContext.Provider value={{ unit, toggleUnit }}>{children}</SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
