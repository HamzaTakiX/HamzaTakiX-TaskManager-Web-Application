'use client'

import SettingsLayout from '../_components/Settings/SettingsLayout'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../_context/ThemeContext'

export default function GeneralSettings() {
  const { theme, changeTheme } = useTheme()
  const [timeFormat, setTimeFormat] = useState('24')
  const [showLanguage, setShowLanguage] = useState(false)
  const [showTimezone, setShowTimezone] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('English (Default)')
  const [selectedTimezone, setSelectedTimezone] = useState('UTC (Default)')
  const [showSuccess, setShowSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const languageRef = useRef(null)
  const timezoneRef = useRef(null)

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

  const handleSettingChange = (setting, value) => {
    setHasChanges(true)
    switch (setting) {
      case 'theme':
        changeTheme(value)
        break
      case 'timeFormat':
        setTimeFormat(value)
        break
      case 'language':
        setSelectedLanguage(value)
        break
      case 'timezone':
        setSelectedTimezone(value)
        break
      default:
        break
    }
  }

  const handleSave = () => {
    if (!hasChanges) return
    
    setShowSuccess(true)
    setHasChanges(false)
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  return (
    <SettingsLayout showSuccess={showSuccess}>
      <div className="space-y-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-blue-500">
          General Settings
        </h2>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389 21.034 21.034 0 01-.554-.6 19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
            </svg>
            Language
          </h3>
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
                    setSelectedLanguage('English (Default)')
                    setShowLanguage(false)
                    setHasChanges(true)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  English (Default)
                </button>
                <button 
                  onClick={() => {
                    setSelectedLanguage('Spanish')
                    setShowLanguage(false)
                    setHasChanges(true)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  Spanish
                </button>
                <button 
                  onClick={() => {
                    setSelectedLanguage('French')
                    setShowLanguage(false)
                    setHasChanges(true)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  French
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Timezone
          </h3>
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
                    setSelectedTimezone('UTC (Default)')
                    setShowTimezone(false)
                    setHasChanges(true)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  UTC (Default)
                </button>
                <button 
                  onClick={() => {
                    setSelectedTimezone('EST (UTC-5)')
                    setShowTimezone(false)
                    setHasChanges(true)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  EST (UTC-5)
                </button>
                <button 
                  onClick={() => {
                    setSelectedTimezone('PST (UTC-8)')
                    setShowTimezone(false)
                    setHasChanges(true)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  PST (UTC-8)
                </button>
                <button 
                  onClick={() => {
                    setSelectedTimezone('CET (UTC+1)')
                    setShowTimezone(false)
                    setHasChanges(true)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  CET (UTC+1)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Time Format
          </h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleSettingChange('timeFormat', '24')}
              className={`h-12 px-6 text-[15px] rounded-full transition-all ${
                timeFormat === '24'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => handleSettingChange('timeFormat', '12')}
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

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            Theme
          </h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleSettingChange('theme', 'light')}
              className={`h-12 px-6 text-[15px] rounded-full transition-all ${
                theme === 'light'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => handleSettingChange('theme', 'dark')}
              className={`h-12 px-6 text-[15px] rounded-full transition-all ${
                theme === 'dark'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={handleSave}
            disabled={!hasChanges}
            className={`w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
              !hasChanges ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </SettingsLayout>
  )
}
