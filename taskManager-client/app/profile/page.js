'use client'

import { useState, useEffect, useRef } from 'react'
import ProfileHeader from '../_components/Profile/ProfileHeader'
import ProfileBody from '../_components/Profile/ProfileBody'
import Sidebar from '../_components/Shared/Sidebar'
import { Toaster } from 'react-hot-toast'
import useNotifications from '@/app/_hooks/useNotifications'

export default function ProfilePage() {
  const [timeFormat, setTimeFormat] = useState('24')
  const [showLanguage, setShowLanguage] = useState(false)
  const [showTimezone, setShowTimezone] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('English (Default)')
  const [selectedTimezone, setSelectedTimezone] = useState('UTC (Default)')
  const [showSuccess, setShowSuccess] = useState(false)
  
  const languageRef = useRef(null)
  const timezoneRef = useRef(null)
  const { addNotification } = useNotifications()

  const handleProfileUpdate = (type, success = true) => {
    const notifications = {
      language: {
        title: 'Language Settings Updated',
        message: `Language has been changed to ${selectedLanguage}`,
      },
      timezone: {
        title: 'Timezone Settings Updated',
        message: `Timezone has been changed to ${selectedTimezone}`,
      },
      timeFormat: {
        title: 'Time Format Updated',
        message: `Time format has been changed to ${timeFormat}-hour format`,
      },
      password: {
        title: 'Password Updated',
        message: 'Your password has been successfully changed',
      },
      export: {
        title: 'Data Export Initiated',
        message: 'Your data export has started. You will be notified when it\'s ready',
      },
      profile: {
        title: 'Profile Updated',
        message: 'Your profile information has been successfully updated',
      }
    }

    if (success) {
      addNotification(notifications[type])
    } else {
      addNotification({
        title: 'Update Failed',
        message: `Failed to update ${type}. Please try again.`,
        error: true
      })
    }
  }

  const handleSave = (type) => {
    setShowSuccess(true)
    handleProfileUpdate(type)
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language)
    setShowLanguage(false)
    handleProfileUpdate('language')
  }

  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone)
    setShowTimezone(false)
    handleProfileUpdate('timezone')
  }

  const handleTimeFormatChange = (format) => {
    setTimeFormat(format)
    handleProfileUpdate('timeFormat')
  }

  const handlePasswordChange = (success = true) => {
    handleProfileUpdate('password', success)
  }

  const handleExportData = () => {
    handleProfileUpdate('export')
    // Add your export logic here
  }

  const handleProfileInfoUpdate = (success = true) => {
    handleProfileUpdate('profile', success)
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguage(false)
      }
      if (timezoneRef.current && !timezoneRef.current.contains(event.target)) {
        setShowTimezone(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#22c55e',
              color: '#fff',
            },
          },
          error: {
            duration: 3000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
      <Sidebar />
      <div className="flex-1 pl-64">
        <ProfileHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProfileBody>
            <div className="space-y-10">
              <div>
                <h2 className="text-[15px] font-medium text-gray-700 mb-3">Language</h2>
                <div className="w-full max-w-md">
                  <div className="relative" ref={languageRef}>
                    <button 
                      onClick={() => {
                        setShowLanguage(!showLanguage)
                        setShowTimezone(false)
                      }}
                      className="flex flex-row justify-between w-full px-4 py-3 text-[15px] text-gray-700 bg-white border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                    >
                      <span className="select-none">{selectedLanguage}</span>
                      <svg 
                        className={`w-6 h-6 transition-transform duration-200 ${showLanguage ? 'transform rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <div className={`absolute w-full py-2 mt-2 bg-white rounded-lg shadow-lg z-10 ${showLanguage ? '' : 'hidden'}`}>
                      <button 
                        onClick={() => {
                          handleLanguageChange('English (Default)')
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        English (Default)
                      </button>
                      <button 
                        onClick={() => {
                          handleLanguageChange('Spanish')
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        Spanish
                      </button>
                      <button 
                        onClick={() => {
                          handleLanguageChange('French')
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        French
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-[15px] font-medium text-gray-700 mb-3">Timezone</h2>
                <div className="w-full max-w-md">
                  <div className="relative" ref={timezoneRef}>
                    <button 
                      onClick={() => {
                        setShowTimezone(!showTimezone)
                        setShowLanguage(false)
                      }}
                      className="flex flex-row justify-between w-full px-4 py-3 text-[15px] text-gray-700 bg-white border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                    >
                      <span className="select-none">{selectedTimezone}</span>
                      <svg 
                        className={`w-6 h-6 transition-transform duration-200 ${showTimezone ? 'transform rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <div className={`absolute w-full py-2 mt-2 bg-white rounded-lg shadow-lg z-10 ${showTimezone ? '' : 'hidden'}`}>
                      <button 
                        onClick={() => {
                          handleTimezoneChange('UTC (Default)')
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        UTC (Default)
                      </button>
                      <button 
                        onClick={() => {
                          handleTimezoneChange('EST (UTC-5)')
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        EST (UTC-5)
                      </button>
                      <button 
                        onClick={() => {
                          handleTimezoneChange('PST (UTC-8)')
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        PST (UTC-8)
                      </button>
                      <button 
                        onClick={() => {
                          handleTimezoneChange('CET (UTC+1)')
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        CET (UTC+1)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-[15px] font-medium text-gray-700 mb-3">Time Format</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleTimeFormatChange('24')
                    }}
                    className={`h-12 px-6 text-[15px] rounded-full transition-all ${
                      timeFormat === '24'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200'
                    }`}
                  >
                    24 Hours
                  </button>
                  <button
                    onClick={() => {
                      handleTimeFormatChange('12')
                    }}
                    className={`h-12 px-6 text-[15px] rounded-full transition-all ${
                      timeFormat === '12'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200'
                    }`}
                  >
                    12 Hours
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => {
                    handleSave('profile')
                  }}
                  className="h-11 px-5 bg-blue-600 text-white text-[15px] font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </ProfileBody>
        </main>
      </div>
    </div>
  )
}
