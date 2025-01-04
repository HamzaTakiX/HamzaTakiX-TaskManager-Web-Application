'use client'

import { useState, useRef, useEffect } from 'react'
import { FiSettings, FiGrid, FiPlus, FiFeather, FiZap, FiSearch, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import BoardSettingsDropdown from './BoardSettingsDropdown'

export default function TaskHeader({ onSearch, searchQuery = '', onClearSearch }) {
  const [showNewTaskMenu, setShowNewTaskMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const newTaskRef = useRef(null)
  const settingsRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (newTaskRef.current && !newTaskRef.current.contains(event.target)) {
        setShowNewTaskMenu(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="bg-white px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3 w-1/4 relative z-20">
          <FiGrid className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
        </div>

        {/* Centered Search Bar with Enhanced Design */}
        <div className="flex-1 flex justify-center items-center w-2/4 relative z-10">
          <div className={`relative w-full max-w-2xl mx-auto transition-all duration-300 ease-in-out ${
            isFocused ? 'scale-105' : ''
          }`}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search tasks..."
              className={`w-full pl-12 pr-4 py-3 text-sm border rounded-xl transition-all duration-200 
                ${isFocused 
                  ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg bg-white' 
                  : 'border-gray-200 hover:border-gray-300 shadow-sm bg-gray-50'
                }
                focus:outline-none hover:bg-white cursor-text`}
            />
            <FiSearch 
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200
              ${isFocused ? 'text-blue-500' : 'text-gray-400'}`}
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600
                  hover:bg-gray-100 p-1 rounded-full transition-all duration-200 z-20"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 w-1/4 justify-end relative z-20">
          <div className="relative" ref={newTaskRef}>
            <motion.button 
              onClick={() => setShowNewTaskMenu(!showNewTaskMenu)}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm relative z-20"
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
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-30 border border-gray-200"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">Create New Task</h3>
                    <p className="text-xs text-gray-500 mt-1">Choose your preferred method</p>
                  </div>
                  
                  <Link
                    href="/tasks?tab=manual"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer group relative z-20"
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
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer group relative z-20"
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
          <div className="relative z-20" ref={settingsRef}>
            <motion.button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative z-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiSettings className="w-5 h-5" />
            </motion.button>
            <BoardSettingsDropdown 
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
