'use client'

import { useState, useEffect } from 'react'
import { FiColumns, FiCheck, FiCalendar, FiTag, FiClock, FiFlag, FiList } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/app/_context/ThemeContext'
import { useSettings } from '@/app/_context/SettingsContext'
import Notification from '../Shared/Notification'

const COLUMN_ICONS = {
  dueDate: { icon: FiCalendar, color: 'text-purple-500' },
  category: { icon: FiTag, color: 'text-blue-500' },
  timeRemaining: { icon: FiClock, color: 'text-orange-500' },
  priority: { icon: FiFlag, color: 'text-red-500' },
  status: { icon: FiList, color: 'text-green-500' }
}

export default function TaskSettingsDropdown({ isOpen, onClose }) {
  const { theme, themes } = useTheme()
  const { settings, updateVisibleColumns } = useSettings()
  const [showNotification, setShowNotification] = useState(false)
  const [localSettings, setLocalSettings] = useState({
    visibleColumns: settings.visibleColumns
  })

  // Update local settings when global settings change
  useEffect(() => {
    setLocalSettings({
      visibleColumns: settings.visibleColumns
    })
  }, [settings])

  const handleSettingChange = (section, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const handleSave = () => {
    // Update visible columns
    updateVisibleColumns(localSettings.visibleColumns)
    
    // Show success notification and close dropdown
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 1500)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`absolute right-0 mt-2 w-80 ${themes[theme].bg} rounded-lg shadow-lg border ${themes[theme].border} z-[999]`}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FiColumns className="w-5 h-5 text-blue-500" />
                <h3 className={`text-lg font-semibold ${themes[theme].text}`}>Column Settings</h3>
              </div>
            </div>

            {/* Visible Columns */}
            <div className="py-4 space-y-3">
              <p className={`text-sm ${themes[theme].textMuted} mb-3`}>
                Choose which columns to display in your task list
              </p>
              <div className="space-y-3">
                {Object.entries(localSettings.visibleColumns).map(([key, value]) => {
                  const { icon: Icon, color } = COLUMN_ICONS[key];
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group ${
                        value ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <Icon className={`w-5 h-5 mr-3 ${color}`} />
                        <span className={`text-sm font-medium ${themes[theme].text}`}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleSettingChange('visibleColumns', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
            >
              <FiCheck className="w-5 h-5" />
              <span className="font-medium">Save Changes</span>
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <Notification
            type="success"
            message="Column settings saved successfully"
            onClose={() => setShowNotification(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
