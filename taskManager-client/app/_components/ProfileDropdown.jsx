'use client'

import Link from 'next/link'
import { FiUser, FiHelpCircle, FiCheckCircle, FiLogOut } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import { useUser } from '@/app/_context/UserContext'
import { useSettings } from '@/app/_context/SettingsContext'
import { translations } from '@/app/_utils/translations'
import Image from 'next/image'
import { useLogoutMessage } from '../_hooks/useLogoutMessage'

export default function ProfileDropdown({ isOpen, onClose }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef(null)
  const { userName, userEmail, profileImage, userJob } = useUser()
  const { settings } = useSettings()
  const { showLogoutMessage } = useLogoutMessage()
  
  // Get translations
  const t = translations[settings.language].profileDropdown
  
  const userHandle = userName 
    ? `@${userName.toLowerCase().replace(/\s+/g, '')}`
    : '@user'

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLogout = async () => {
    // Prevent multiple logout attempts
    if (isLoggingOut) {
      console.log('🚫 Logout already in progress')
      return
    }

    try {
      setIsLoggingOut(true)
      
      // Show goodbye message and clear data
      if (userName) {
        const logoutSuccess = await showLogoutMessage(userName)
        if (logoutSuccess) {
          // Clear all authentication data
          localStorage.removeItem('token')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          localStorage.removeItem('userJob')
          Cookies.remove('token')
          
          // Close the dropdown
          onClose()
          
          // Redirect to login page
          router.replace('/auth/login')
        }
      } else {
        // No user name, just redirect
        router.replace('/auth/login')
      }
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Still try to redirect on error
      router.replace('/auth/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const menuItems = [
    { icon: FiUser, text: t.myProfile, href: '/profile' },
    { icon: FiHelpCircle, text: t.faq, href: '/faq' },
    { icon: FiCheckCircle, text: t.verified, className: 'text-green-500', static: true, iconClassName: 'text-green-500' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[998]"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div 
        ref={dropdownRef} 
        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[999] backdrop-blur-sm"
      >
        <div className="px-6 py-4 border-b border-gray-100/60">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium overflow-hidden">
              {profileImage ? (
                <Image
                  src={`http://localhost:9000${profileImage}`}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : userName ? (
                userName.charAt(0).toUpperCase()
              ) : (
                <FiUser className="h-8 w-8" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {userName || t.user}
              </p>
              <p className="text-sm text-gray-500 mb-1">{userHandle}</p>
              {userJob && (
                <div className="flex items-center">
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                    {userJob}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="py-2">
          {menuItems.map((item, index) => (
            item.static ? (
              <div
                key={index}
                className="flex items-center px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80"
              >
                <item.icon className={`mr-3 h-5 w-5 ${item.iconClassName || ''}`} />
                <span className={item.className || ''}>{item.text}</span>
              </div>
            ) : (
              <Link
                key={index}
                href={item.href}
                onClick={onClose}
                className="flex items-center px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors duration-200"
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span className={item.className || ''}>{item.text}</span>
              </Link>
            )
          ))}
        </div>
        
        <div className="px-4 py-3 border-t border-gray-100/60">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center space-x-2"
            disabled={isLoggingOut}
          >
            <FiLogOut className="w-4 h-4" />
            <span>{isLoggingOut ? t.loggingOut : t.logout}</span>
          </button>
        </div>
      </div>
    </>
  )
}
