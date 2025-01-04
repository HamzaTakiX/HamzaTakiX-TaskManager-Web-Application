'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FiGrid, FiList, FiBell, FiCalendar, FiSettings, FiUser, FiMessageSquare } from 'react-icons/fi'
import NotificationDropdown from '../Shared/NotificationDropdown'
import ProfileDropdown from '../ProfileDropdown'
import { motion } from 'framer-motion'
import { useTheme } from '@/app/_context/ThemeContext'
import { useUser } from '@/app/_context/UserContext'
import useNotifications from '@/app/_hooks/useNotifications'
import Image from 'next/image'

export default function TasksMenu() {
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const pathname = usePathname()
  const { theme, themes } = useTheme()
  const currentTheme = themes[theme] || themes.light
  const { profileImage, userName } = useUser()
  const { notifications, fetchNotifications } = useNotifications()
  const unreadCount = notifications.filter(n => !n.read).length

  // Fetch notifications on mount and set up periodic refresh
  useEffect(() => {
    fetchNotifications(); // Initial fetch

    const refreshInterval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [fetchNotifications]);

  return (
    <nav className={pathname === '/calendar' ? `${currentTheme.primary} border-b ${currentTheme.border} shadow-sm` : "bg-white border-b border-gray-200 shadow-sm"}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-1">
            <div className="hidden sm:flex sm:space-x-6 h-16">
              <div className="relative flex items-center">
                <Link 
                  href="/tasks" 
                  className={`flex items-center h-full px-4 text-sm font-medium group transition-colors duration-200 ${
                    pathname === '/tasks' 
                      ? 'text-blue-600' 
                      : pathname === '/calendar' 
                        ? `${currentTheme.secondaryText} hover:${currentTheme.text}` 
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <FiList className="mr-2.5 h-4 w-4" />
                    <span>Tasks</span>
                  </div>
                  <div className={`absolute bottom-0 left-4 right-4 h-0.5 ${pathname === '/calendar' ? currentTheme.accent : 'bg-blue-600'} transition-transform duration-300 ${
                    pathname === '/tasks' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></div>
                </Link>
              </div>

              <div className="relative flex items-center">
                <Link 
                  href="/ai-assistant" 
                  className={`flex items-center h-full px-4 text-sm font-medium group transition-colors duration-200 ${
                    pathname === '/ai-assistant' 
                      ? 'text-blue-600'
                      : pathname === '/calendar' 
                        ? `${currentTheme.secondaryText} hover:${currentTheme.text}` 
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <FiMessageSquare className="mr-2.5 h-4 w-4" />
                    <span>Task Assistance AI</span>
                  </div>
                  <div className={`absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 transition-transform duration-300 ${
                    pathname === '/ai-assistant' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></div>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${
                  pathname === '/calendar' 
                    ? `${currentTheme.secondaryText} hover:${currentTheme.text}` 
                    : 'text-gray-600 hover:text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <FiBell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
              <NotificationDropdown 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)} 
              />
            </div>

            <motion.button
              whileHover={{ 
                scale: 1.05,
                rotate: 45
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-2.5 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onClick={() => window.location.href = '/settings'}
            >
              <FiSettings className="h-5 w-5" />
            </motion.button>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg p-0.5 ml-2 ${
                  pathname === '/calendar' 
                    ? `${currentTheme.secondaryText} hover:${currentTheme.text}` 
                    : ''
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden shadow-md">
                  {profileImage && profileImage !== 'none' ? (
                    <Image
                      src={profileImage.startsWith('http') ? profileImage : `http://localhost:9000${profileImage}`}
                      alt="Profile"
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-sm font-medium">
                      {userName ? userName.charAt(0).toUpperCase() : <FiUser className="h-5 w-5" />}
                    </div>
                  )}
                </div>
                {showTooltip && userName && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    {userName}
                  </div>
                )}
              </motion.button>
              <ProfileDropdown 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
