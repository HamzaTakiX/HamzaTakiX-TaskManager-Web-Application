'use client'

import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  language: 'en',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  timeFormat: '24',
  defaultFilters: {
    priority: 'all',
    status: 'all',
    category: 'all'
  },
  visibleColumns: {
    dueDate: true,
    category: true,
    priority: true,
    status: true,
    timeRemaining: true,
  },
  notifications: {
    taskUpdates: true,
    taskReminders: true,
    systemUpdates: true,
    emailNotifications: false
  },
  boardVisibility: {
    pinned: true,
    todo: true,
    inProgress: true,
    done: true
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge saved settings with default settings to ensure all properties exist
        setSettings(prev => ({
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          // Merge nested objects
          defaultFilters: {
            ...DEFAULT_SETTINGS.defaultFilters,
            ...(parsedSettings.defaultFilters || {})
          },
          visibleColumns: {
            ...DEFAULT_SETTINGS.visibleColumns,
            ...(parsedSettings.visibleColumns || {})
          },
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...(parsedSettings.notifications || {})
          },
          boardVisibility: {
            ...DEFAULT_SETTINGS.boardVisibility,
            ...(parsedSettings.boardVisibility || {})
          }
        }));
      } catch (error) {
        console.error('Error parsing saved settings:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateDefaultFilters = (filters) => {
    setSettings(prev => ({
      ...prev,
      defaultFilters: { ...prev.defaultFilters, ...filters }
    }));
  };

  const updateVisibleColumns = (columns) => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: { ...prev.visibleColumns, ...columns }
    }));
  };

  const updateNotifications = (notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...notifications }
    }));
  };

  const updateBoardSettings = (boardVisibility) => {
    setSettings(prev => ({
      ...prev,
      boardVisibility: { ...prev.boardVisibility, ...boardVisibility }
    }));
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings,
      updateDefaultFilters,
      updateVisibleColumns,
      updateNotifications,
      updateBoardSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
