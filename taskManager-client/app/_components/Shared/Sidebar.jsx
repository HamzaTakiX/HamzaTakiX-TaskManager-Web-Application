'use client'
import Link from 'next/link'
import { SiTask } from "react-icons/si"
import { RiDashboardLine, RiSettings4Line, RiUser3Line, RiLayoutGridLine, RiTaskLine, RiMoreLine, RiLogoutBoxLine } from 'react-icons/ri'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/app/_context/ThemeContext'
import { useUser } from '../../_context/UserContext'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { FiLogOut } from 'react-icons/fi'
import { useLogoutMessage } from '@/app/_hooks/useLogoutMessage'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const { profileImage, userName, userEmail, updateUserName, updateUserEmail } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)
  const { theme, themes } = useTheme()
  const currentTheme = themes[theme] || themes.light
  const isCalendarPage = pathname === '/calendar'
  const isDarkTheme = isCalendarPage && theme === 'dark'
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { showLogoutMessage } = useLogoutMessage();

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the button and dropdown
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      try {
        // Check if we have user data in context
        if (userName && userEmail) {
          setIsLoading(false)
          return
        }

        // Check if we have a token
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoading(false)
          return
        }

        // Get data from localStorage
        const storedName = localStorage.getItem('userName')
        const storedEmail = localStorage.getItem('userEmail')
        
        if (storedName && storedEmail) {
          // Update context with stored data
          updateUserName(storedName)
          updateUserEmail(storedEmail)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserData()
  }, [userName, userEmail, updateUserName, updateUserEmail])

  const handleLogout = async () => {
    // Prevent multiple logout attempts
    if (isLoggingOut) {
      console.log('🚫 Logout already in progress');
      return;
    }

    const userName = localStorage.getItem('userName');
    console.log('🔄 Logout Initiated:', {
      currentUser: userName,
      localStorage: {
        token: !!localStorage.getItem('token'),
        userName: localStorage.getItem('userName'),
        userEmail: localStorage.getItem('userEmail'),
        userJob: localStorage.getItem('userJob')
      },
      cookies: {
        token: !!Cookies.get('token')
      }
    });
    
    try {
      setIsLoggingOut(true);
      
      // Show goodbye message and clear data
      if (userName) {
        const logoutSuccess = await showLogoutMessage(userName);
        if (logoutSuccess) {
          // Redirect to login page
          console.log('🔄 Redirecting to login page...');
          router.replace('/auth/login');
        }
      } else {
        // No user name, just redirect
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Error logging out');
      // Still try to redirect on error
      router.replace('/auth/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    router.push('/profile')
    setShowDropdown(false)
  }

  const getLinkStyles = (path) => {
    const isActive = pathname === path
    const baseClasses = 'flex items-center px-2 py-2 rounded-lg group'
    
    if (isCalendarPage) {
      if (isActive) return `${baseClasses} bg-blue-50 text-blue-600`
      return `${baseClasses} ${isDarkTheme ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`
    }
    
    return `${baseClasses} ${
      isActive 
        ? 'bg-blue-50 text-blue-600' 
        : 'text-gray-600 hover:bg-gray-100'
    }`
  }

  return (
    <div className={isCalendarPage ? `fixed inset-y-0 left-0 w-64 border-r ${currentTheme.primary} ${currentTheme.border} flex flex-col` : "fixed inset-y-0 left-0 bg-white w-64 border-r border-gray-200 flex flex-col"}>
      {/* Logo section */}
      <div className={`h-16 flex items-center px-4 border-b ${isCalendarPage ? currentTheme.border : 'border-gray-200'}`}>
        <Link href="/" className="text-[#1D4ED8] flex items-center">
          <SiTask className="h-7 w-7" />
          <h1 className="ml-2.5 font-semibold text-lg">Star Company</h1>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 mt-6 px-4">
        <div className="space-y-4">
          <Link 
            href="/dashboard" 
            className={getLinkStyles('/dashboard')}
          >
            <RiDashboardLine className={`h-5 w-5 mr-3 ${isDarkTheme && pathname !== '/dashboard' ? 'text-white' : ''}`} />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          <Link 
            href="/tasks" 
            className={getLinkStyles('/tasks')}
          >
            <div className="flex items-center w-full relative">
              <RiTaskLine className={`h-5 w-5 mr-3 ${isDarkTheme && pathname !== '/tasks' ? 'text-white' : ''}`} />
              <span className="text-sm font-medium">Tasks</span>
              <span className="absolute -top-1 right-0 min-w-[20px] h-5 flex items-center justify-center text-xs font-medium px-1.5 rounded-full bg-blue-100 text-blue-600">10</span>
            </div>
          </Link>

          <Link 
            href="/overview" 
            className={getLinkStyles('/overview')}
          >
            <RiLayoutGridLine className={`h-5 w-5 mr-3 ${isDarkTheme && pathname !== '/overview' ? 'text-white' : ''}`} />
            <span className="text-sm font-medium">Overview</span>
          </Link>

          <Link 
            href="/settings" 
            className={getLinkStyles('/settings')}
          >
            <RiSettings4Line className={`h-5 w-5 mr-3 ${isDarkTheme && pathname !== '/settings' ? 'text-white' : ''}`} />
            <span className="text-sm font-medium">Settings</span>
          </Link>

          <Link 
            href="/profile" 
            className={getLinkStyles('/profile')}
          >
            <RiUser3Line className={`h-5 w-5 mr-3 ${isDarkTheme && pathname !== '/profile' ? 'text-white' : ''}`} />
            <span className="text-sm font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Profile section */}
      <div className={`p-4 border-t ${isCalendarPage ? currentTheme.border : 'border-gray-200'}`}>
        <div className="flex items-center justify-between relative">
          <div className="flex items-center">
            <div className="relative h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
              {isLoading ? (
                <div className="animate-pulse w-full h-full bg-blue-400" />
              ) : profileImage && profileImage !== 'none' ? (
                <Image
                  src={profileImage.startsWith('http') ? profileImage : `http://localhost:9000${profileImage}`}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-sm font-medium">
                  {userName ? userName.charAt(0).toUpperCase() : <RiUser3Line className="h-5 w-5" />}
                </div>
              )}
            </div>
            <div className="ml-2">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {userName || 'User'}
                  </div>
                  <div className={`text-xs text-gray-500 ${isDarkTheme ? 'text-gray-400' : ''}`}>
                    {userEmail || 'user@example.com'}
                  </div>
                </>
              )}
            </div>
          </div>
          <motion.button 
            ref={buttonRef}
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`p-2 rounded-lg ${
              isDarkTheme
                ? 'text-gray-300 hover:text-white hover:bg-white/10'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            } transition-colors`}
            onClick={(e) => {
              e.stopPropagation()
              setShowDropdown(!showDropdown)
            }}
            disabled={isLoading}
          >
            <RiMoreLine className={`h-5 w-5 ${isLoading ? 'opacity-50' : ''}`} />
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showDropdown && !isLoading && (
              <motion.div 
                ref={dropdownRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`absolute bottom-full right-0 mb-2 w-48 rounded-lg ${
                  isCalendarPage 
                    ? `${currentTheme.primary} ${currentTheme.border}` 
                    : 'bg-white border border-gray-200'
                } shadow-lg py-1 z-50`}
              >
                <button
                  onClick={handleProfileClick}
                  className={`w-full px-4 py-2 text-sm flex items-center ${
                    isDarkTheme
                      ? 'text-white hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <RiUser3Line className="h-4 w-4 mr-2" />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className={`w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100 flex items-center ${
                    isDarkTheme ? 'hover:bg-white/10' : ''
                  }`}
                >
                  <RiLogoutBoxLine className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
