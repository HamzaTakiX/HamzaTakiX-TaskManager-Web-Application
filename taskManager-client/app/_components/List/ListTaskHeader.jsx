'use client'

import { useState, useRef, useEffect } from 'react'
import { FiSettings, FiMoreHorizontal, FiDownload, FiGrid, FiFilter, FiRefreshCw, 
         FiList, FiColumns, FiCheckSquare, FiPlus, FiCpu, FiEdit3, FiClipboard, 
         FiCommand, FiTerminal, FiZap, FiFeather } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import TaskSettingsDropdown from './TaskSettingsDropdown'
import TaskMoreDropdown from './TaskMoreDropdown'
import Link from 'next/link'

export default function ListTaskHeader() {
  const [showSettings, setShowSettings] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showRefreshNotif, setShowRefreshNotif] = useState(false)
  const [showNewTaskMenu, setShowNewTaskMenu] = useState(false)
  
  const settingsRef = useRef(null)
  const moreMenuRef = useRef(null)
  const newTaskRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false)
      }
      if (newTaskRef.current && !newTaskRef.current.contains(event.target)) {
        setShowNewTaskMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRefresh = () => {
    // Add refresh logic here
    setShowRefreshNotif(true)
    setTimeout(() => setShowRefreshNotif(false), 1500)
  }

  return (
    <div className="bg-white px-6 py-4 border-b border-gray-200 relative z-[60]">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FiClipboard className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative" ref={newTaskRef}>
            <motion.button 
              onClick={() => setShowNewTaskMenu(!showNewTaskMenu)}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus className="w-5 h-5 mr-2" />
              New Task
            </motion.button>

            <AnimatePresence>
              {showNewTaskMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-[60] border border-gray-200"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">Create New Task</h3>
                    <p className="text-xs text-gray-500 mt-1">Choose your preferred method</p>
                  </div>
                  
                  <Link
                    href="/tasks?tab=manual"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer group"
                    onClick={() => setShowNewTaskMenu(false)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                      <FiFeather className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Manual Creation</div>
                      <div className="text-xs text-gray-500">Create task step by step</div>
                    </div>
                  </Link>

                  <Link
                    href="/ai-assistant"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer group"
                    onClick={() => setShowNewTaskMenu(false)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                      <FiZap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">AI Assistant</div>
                      <div className="text-xs text-gray-500">Let AI help you create tasks</div>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative" ref={settingsRef}>
            <motion.button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiSettings className="w-5 h-5" />
            </motion.button>
            <TaskSettingsDropdown 
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
            />
          </div>

          <div className="relative" ref={moreMenuRef}>
            <motion.button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              animate={{ 
                rotate: showMoreMenu ? 90 : 0,
                scale: showMoreMenu ? 1.1 : 1
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ 
                duration: 0.2,
                ease: "easeInOut"
              }}
            >
              <FiMoreHorizontal className="w-5 h-5" />
            </motion.button>
            <TaskMoreDropdown 
              isOpen={showMoreMenu}
              onClose={() => setShowMoreMenu(false)}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
