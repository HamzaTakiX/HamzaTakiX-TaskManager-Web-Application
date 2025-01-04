'use client'

import { useState, useEffect } from 'react'
import { FiLayout, FiCheck, FiGrid, FiList, FiClock, FiEye, FiColumns, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/app/_context/ThemeContext'
import { useSettings } from '@/app/_context/SettingsContext'
import toast from 'react-hot-toast'

const BOARD_SETTINGS = {
  pinned: { 
    icon: FiGrid, 
    color: 'text-yellow-500',
    title: 'Pinned Tasks',
    description: 'Show pinned tasks board'
  },
  todo: { 
    icon: FiList, 
    color: 'text-blue-500',
    title: 'To Do Tasks',
    description: 'Show to-do tasks board'
  },
  inProgress: { 
    icon: FiClock, 
    color: 'text-orange-500',
    title: 'In Progress Tasks',
    description: 'Show in-progress tasks board'
  },
  done: { 
    icon: FiCheck, 
    color: 'text-green-500',
    title: 'Done Tasks',
    description: 'Show completed tasks board'
  },
  cancelled: { 
    icon: FiX, 
    color: 'text-red-500',
    title: 'Cancelled Tasks',
    description: 'Show cancelled tasks board'
  }
}

export default function BoardSettingsDropdown({ isOpen, onClose }) {
  const { theme, themes } = useTheme()
  const { settings, updateBoardSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState({
    boardVisibility: settings.boardVisibility || {
      pinned: true,
      todo: true,
      inProgress: true,
      done: true,
      cancelled: true
    }
  })

  useEffect(() => {
    setLocalSettings({
      boardVisibility: settings.boardVisibility || {
        pinned: true,
        todo: true,
        inProgress: true,
        done: true,
        cancelled: true
      }
    })
  }, [settings])

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      boardVisibility: {
        ...prev.boardVisibility,
        [key]: value
      }
    }))
  }

  const handleSave = () => {
    updateBoardSettings(localSettings.boardVisibility)
    
    // Get list of changed boards
    const changedBoards = Object.entries(localSettings.boardVisibility)
      .filter(([key, value]) => value !== settings.boardVisibility?.[key])
      .map(([key]) => BOARD_SETTINGS[key].title)

    // Show notification with changes
    if (changedBoards.length > 0) {
      toast.success(
        `Updated visibility for: ${changedBoards.join(', ')}`, 
        {
          style: {
            border: '1px solid #10B981',
            padding: '16px',
            color: '#047857',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
          duration: 3000,
        }
      )
    } else {
      toast.success('No changes to board visibility', {
        style: {
          border: '1px solid #10B981',
          padding: '16px',
          color: '#047857',
        },
        iconTheme: {
          primary: '#10B981',
          secondary: '#FFFFFF',
        },
        duration: 2000,
      })
    }
    
    onClose()
  }

  if (!isOpen) return null

  return (
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
              <FiLayout className="w-5 h-5 text-blue-500" />
              <h3 className={`text-lg font-semibold ${themes[theme].text}`}>Board Settings</h3>
            </div>
          </div>

          {/* Settings */}
          <div className="py-4 space-y-3">
            <p className={`text-sm ${themes[theme].textMuted} mb-3`}>
              Choose which boards to display
            </p>
            <div className="space-y-3">
              {Object.entries(BOARD_SETTINGS).map(([key, { icon: Icon, color, title, description }]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group ${
                    localSettings.boardVisibility[key] ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <Icon className={`w-5 h-5 mr-3 ${color}`} />
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${themes[theme].text}`}>
                        {title}
                      </span>
                      <span className={`text-xs ${themes[theme].textMuted}`}>
                        {description}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.boardVisibility[key] === true}
                      onChange={(e) => handleSettingChange(key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
