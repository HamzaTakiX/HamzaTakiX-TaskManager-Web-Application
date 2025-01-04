'use client'

import { useState } from 'react'
import { 
  FiDownload, 
  FiGrid, 
  FiFilter, 
  FiRefreshCw, 
  FiCheckSquare, 
  FiList, 
  FiCalendar, 
  FiClock, 
  FiStar, 
  FiArrowUp, 
  FiArrowDown, 
  FiFileText, 
  FiFilePlus 
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/app/_context/ThemeContext'
import { useTask } from '@/app/_context/TaskContext'
import Notification from '../Shared/Notification'
import { useRouter } from 'next/navigation'

export default function TaskMoreDropdown({ isOpen, onClose }) {
  const { theme, themes } = useTheme()
  const {
    viewPreferences,
    selectedTasks,
    exportAsCSV,
    exportAsPDF,
    changeView,
    refreshTasks,
    completeTasks,
    deleteTasks
  } = useTask()
  const router = useRouter()

  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const showSuccessNotification = (message) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 1500)
  }

  const handleExport = async (format) => {
    try {
      console.log(`Starting ${format.toUpperCase()} export...`)
      if (format === 'csv') {
        await exportAsCSV()
        console.log('CSV export completed successfully')
      } else {
        await exportAsPDF()
        console.log('PDF export completed successfully')
      }
      showSuccessNotification(`Tasks exported as ${format.toUpperCase()}`)
      onClose()
    } catch (error) {
      console.error('Export error:', error.message)
      showSuccessNotification(error.message)
    }
  }

  const handleViewChange = (view) => {
    changeView(view)
    showSuccessNotification(`View changed to ${view}`)
  }

  const handleRefresh = async () => {
    const success = await refreshTasks()
    showSuccessNotification(success ? 'Tasks refreshed' : 'Failed to refresh tasks')
    if (success) {
      // Force a router refresh to update the UI
      router.refresh()
      onClose()
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedTasks.length === 0) {
      showSuccessNotification('No tasks selected')
      return
    }

    try {
      if (action === 'complete') {
        await completeTasks(selectedTasks)
        showSuccessNotification('Selected tasks marked as complete')
      } else if (action === 'delete') {
        await deleteTasks(selectedTasks)
        showSuccessNotification('Selected tasks deleted')
      }
      onClose()
    } catch (error) {
      showSuccessNotification(`Failed to ${action} tasks`)
    }
  }

  if (!isOpen) return null

  const renderMainMenu = () => (
    <div className="py-3">
      {/* Export Options */}
      <div className="px-4 py-2">
        <h3 className={`text-sm font-semibold ${themes[theme].text} mb-3 flex items-center gap-2`}>
          <FiFileText className="w-4 h-4 text-blue-500" />
          Export As
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleExport('csv')}
            className={`px-4 py-2.5 text-sm rounded-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 hover:border-green-300 active:scale-95 flex items-center justify-center gap-2 font-medium text-green-700`}
          >
            <FiFilePlus className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className={`px-4 py-2.5 text-sm rounded-lg transition-all duration-200 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 hover:border-red-300 active:scale-95 flex items-center justify-center gap-2 font-medium text-red-700`}
          >
            <FiDownload className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* View Preferences */}
      <div className="px-4 py-2 mt-2 border-t border-gray-100">
        <h3 className={`text-sm font-semibold ${themes[theme].text} mb-3 flex items-center gap-2`}>
          <FiGrid className="w-4 h-4 text-purple-500" />
          View Layout
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleViewChange('list')}
            className={`px-4 py-2.5 text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
              viewPreferences.view === 'list'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md shadow-blue-200'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 text-gray-700'
            } active:scale-95`}
          >
            <FiList className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => handleViewChange('grid')}
            className={`px-4 py-2.5 text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
              viewPreferences.view === 'grid'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md shadow-blue-200'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 text-gray-700'
            } active:scale-95`}
          >
            <FiGrid className="w-4 h-4" />
            Grid
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 mt-2 border-t border-gray-100">
        <h3 className={`text-sm font-semibold ${themes[theme].text} mb-3 flex items-center gap-2`}>
          <FiStar className="w-4 h-4 text-amber-500" />
          Quick Actions
        </h3>
        <button
          onClick={handleRefresh}
          className={`w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border border-indigo-200 hover:border-indigo-300 active:scale-95 flex items-center justify-center gap-2 font-medium text-indigo-700`}
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh Tasks
        </button>
      </div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`absolute right-0 mt-2 w-80 ${themes[theme].bg} rounded-xl shadow-xl border ${themes[theme].border} z-[999] overflow-hidden backdrop-blur-sm bg-opacity-95`}
        >
          {renderMainMenu()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 right-4 z-[1000]"
          >
            <Notification message={notificationMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
