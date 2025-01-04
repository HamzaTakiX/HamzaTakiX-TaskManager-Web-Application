'use client'

import { useState, useEffect } from 'react'
import SettingsLayout from '../../_components/Settings/SettingsLayout'
import useNotificationSettings from '../../_hooks/useNotificationSettings'
import { useSettings } from '@/app/_context/SettingsContext'
import { translations } from '@/app/_utils/translations'
import axios from '../../_utils/axiosConfig'

export default function NotificationSettings() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { settings } = useSettings()
  
  // Get translations
  const t = translations[settings.language].notificationSettings
  
  // Get notification settings from the store
  const {
    taskNotifs,
    taskReminders,
    errorNotifs,
    successNotifs,
    settingsNotifs,
    updateNotifs,
    profileNotifs,
    updateAllSettings,
    updateSetting
  } = useNotificationSettings()

  // Load settings from server on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get('/users/me')
        if (response.data.state && response.data.user?.notificationSettings) {
          updateAllSettings(response.data.user.notificationSettings)
        }
      } catch (error) {
        console.error('Error loading notification settings:', error)
      }
    }
    loadSettings()
  }, [updateAllSettings])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Save settings to the server
      const settings = {
        notificationSettings: {
          taskNotifs,
          taskReminders,
          errorNotifs,
          successNotifs,
          settingsNotifs,
          updateNotifs,
          profileNotifs
        }
      }
      
      await axios.put('/users/update-profile', settings)
      
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error saving notification settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SettingsLayout showSuccess={showSuccess}>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-blue-500">
            {t.title}
          </h2>
          
          {/* Task Notifications */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              {t.categories.tasks.title}
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={taskNotifs}
                  onChange={(e) => updateSetting('taskNotifs', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{t.categories.tasks.updates.title}</span>
                  <p className="text-sm text-gray-500">{t.categories.tasks.updates.description}</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={taskReminders}
                  onChange={(e) => updateSetting('taskReminders', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{t.categories.tasks.reminders.title}</span>
                  <p className="text-sm text-gray-500">{t.categories.tasks.reminders.description}</p>
                </span>
              </label>
            </div>
          </div>

          {/* System Notifications */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {t.categories.system.title}
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={errorNotifs}
                  onChange={(e) => updateSetting('errorNotifs', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{t.categories.system.error.title}</span>
                  <p className="text-sm text-gray-500">{t.categories.system.error.description}</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={successNotifs}
                  onChange={(e) => updateSetting('successNotifs', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{t.categories.system.success.title}</span>
                  <p className="text-sm text-gray-500">{t.categories.system.success.description}</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settingsNotifs}
                  onChange={(e) => updateSetting('settingsNotifs', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{t.categories.system.settings.title}</span>
                  <p className="text-sm text-gray-500">{t.categories.system.settings.description}</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={updateNotifs}
                  onChange={(e) => updateSetting('updateNotifs', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{t.categories.system.updates.title}</span>
                  <p className="text-sm text-gray-500">{t.categories.system.updates.description}</p>
                </span>
              </label>
            </div>
          </div>

          {/* Profile Notifications */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {t.categories.profile.title}
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profileNotifs}
                  onChange={(e) => updateSetting('profileNotifs', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">{t.categories.profile.notifications.title}</span>
                  <p className="text-sm text-gray-500">{t.categories.profile.notifications.description}</p>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? t.saving : t.saveChanges}
          </button>
        </div>
      </div>
    </SettingsLayout>
  )
}
