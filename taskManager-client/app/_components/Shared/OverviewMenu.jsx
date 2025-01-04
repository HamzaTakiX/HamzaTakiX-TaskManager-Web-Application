'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FiGrid, FiList, FiBell, FiSettings, FiUser } from 'react-icons/fi'
import NotificationDropdown from './NotificationDropdown'
import ProfileDropdown from '../ProfileDropdown'
import { motion } from 'framer-motion'
import { useTheme } from '@/app/_context/ThemeContext'
import { useUser } from '@/app/_context/UserContext'
import useNotifications from '@/app/_hooks/useNotifications'
import Image from 'next/image'

export default function OverviewMenu() {
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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-[0.75]">
            <div className="hidden sm:flex sm:space-x-8 h-16">
              <div className="relative flex items-center">
                <Link 
                  href="/overview" 
                  className={`flex items-center h-full px-4 text-sm font-medium transition-colors duration-200 ease-in-out group ${
                    pathname === '/overview' 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center">
                    <FiGrid className={`mr-2 h-4 w-4 transition-colors duration-200 ${
                      pathname === '/overview' ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                    }`} />
                    <span className="font-semibold">Board</span>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transform transition-transform duration-200 ${
                    pathname === '/overview' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></div>
                </Link>
              </div>

              <div className="relative flex items-center">
                <Link 
                  href="/list" 
                  className={`flex items-center h-full px-4 text-sm font-medium transition-colors duration-200 ease-in-out group ${
                    pathname === '/list' 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center">
                    <FiList className={`mr-2 h-4 w-4 transition-colors duration-200 ${
                      pathname === '/list' ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                    }`} />
                    <span className="font-semibold">List</span>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transform transition-transform duration-200 ${
                    pathname === '/list' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></div>
                </Link>
              </div>
            </div>

          </div>

          <div className="flex items-center space-x-2 flex-[0.25] justify-end pr-4">
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
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
              className="p-2 text-gray-900 hover:text-blue-600 rounded-full hover:bg-blue-50/80 transition-all duration-200"
              onClick={() => window.location.href = '/settings'}
            >
              <FiSettings className="h-5 w-5" />
            </motion.button>

            <div className="relative z-[999]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`flex items-center focus:outline-none`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                  {profileImage && profileImage !== 'none' ? (
                    <Image
                      src={profileImage.startsWith('http') ? profileImage : `http://localhost:9000${profileImage}`}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-sm font-medium">
                      {userName ? userName.charAt(0).toUpperCase() : <FiUser className="h-5 w-5" />}
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
