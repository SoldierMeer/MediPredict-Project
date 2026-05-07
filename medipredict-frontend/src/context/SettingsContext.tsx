// src/context/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsState {
  reminders: boolean;
  riskAlerts: boolean;
  theme: 'light' | 'dark' | 'system';
}

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: (key: keyof SettingsState, value: any) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>({
    reminders: true,
    riskAlerts: true,
    theme: 'light',
  });

  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('medipredict_prefs');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 1. Remove any existing theme classes
    root.classList.remove('light', 'dark');
  
    // 2. Determine which theme to apply
    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  const updateSetting = (key: keyof SettingsState, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('medipredict_prefs', JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};