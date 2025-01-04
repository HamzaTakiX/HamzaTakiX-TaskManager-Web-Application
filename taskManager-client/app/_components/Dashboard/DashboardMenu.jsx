'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FiGrid, FiList, FiBell, FiSettings, FiUser } from 'react-icons/fi'
import NotificationDropdown from '../Shared/NotificationDropdown'
import ProfileDropdown from '../ProfileDropdown'
import { motion } from 'framer-motion'
import { useTheme } from '@/app/_context/ThemeContext'
import { useUser } from '@/app/_context/UserContext'
import useNotifications from '@/app/_hooks/useNotifications'
import Image from 'next/image'

export default function DashboardMenu() {
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showNotifTooltip, setShowNotifTooltip] = useState(false)
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false)
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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-20">
          {/* Left side - Dashboard Title */}
          <div className="flex items-center flex-1">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="bg-blue-50 p-2 rounded-lg"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <FiGrid className="h-9 w-9 text-blue-600" />
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  <span className="bg-transparent text-gray-900">
                    Dashboard
                  </span>
                </h1>
              </motion.div>
            </div>
          </div>

          {/* Right side - Icons and Profile */}
          <div className="flex items-center space-x-4 ml-auto">
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                onMouseEnter={() => setShowNotifTooltip(true)}
                onMouseLeave={() => setShowNotifTooltip(false)}
                className={`p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <FiBell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
              {showNotifTooltip && !isNotifOpen && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-[1000]">
                  Notifications
                </div>
              )}
              <NotificationDropdown 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)} 
              />
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  rotate: 45
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-3 text-gray-900 hover:text-blue-600 rounded-full hover:bg-blue-50/80 transition-all duration-200"
                onClick={() => window.location.href = '/settings'}
                onMouseEnter={() => setShowSettingsTooltip(true)}
                onMouseLeave={() => setShowSettingsTooltip(false)}
              >
                <FiSettings className="h-6 w-6" />
              </motion.button>
              {showSettingsTooltip && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-[1000]">
                  Settings
                </div>
              )}
            </div>

            <div className="relative z-[999]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false); // Close notification dropdown
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`flex items-center focus:outline-none`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                  {profileImage && profileImage !== 'none' ? (
                    <Image
                      src={profileImage.startsWith('http') ? profileImage : `http://localhost:9000${profileImage}`}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-sm font-medium">
                      {userName ? userName.charAt(0).toUpperCase() : <FiUser className="h-6 w-6" />}
                    </div>
                  )}
                </div>
                {showTooltip && userName && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-[1000]">
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
