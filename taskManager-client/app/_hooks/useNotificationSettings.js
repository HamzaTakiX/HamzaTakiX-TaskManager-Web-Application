'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useNotificationSettings = create(
  persist(
    (set, get) => ({
      // Task Notifications
      taskNotifs: true,
      taskReminders: true,
      
      // System Notifications
      errorNotifs: true,
      successNotifs: true,
      settingsNotifs: true,
      updateNotifs: true,
      
      // Profile Notifications
      profileNotifs: true,

      // Update individual settings
      updateSetting: (setting, value) => {
        set({ [setting]: value })
      },

      // Check if a notification should be shown based on its type
      shouldShowNotification: (type) => {
        const state = get()
        
        switch (type) {
          case 'task':
            return state.taskNotifs
          case 'reminder':
            return state.taskReminders
          case 'error':
            return state.errorNotifs
          case 'success':
            return state.successNotifs
          case 'settings':
            return state.settingsNotifs
          case 'update':
            return state.updateNotifs
          case 'profile':
            return state.profileNotifs
          default:
            return true
        }
      },

      // Update all settings at once
      updateAllSettings: (settings) => {
        set({
          taskNotifs: settings.taskNotifs,
          taskReminders: settings.taskReminders,
          errorNotifs: settings.errorNotifs,
          successNotifs: settings.successNotifs,
          settingsNotifs: settings.settingsNotifs,
          updateNotifs: settings.updateNotifs,
          profileNotifs: settings.profileNotifs,
        })
      }
    }),
    {
      name: 'notification-settings',
      skipHydration: true
    }
  )
)

export default useNotificationSettings
