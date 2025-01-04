'use client'

import SettingsLayout from '../_components/Settings/SettingsLayout'
import { useState, useEffect, useRef } from 'react'
import { useSettings } from '../_context/SettingsContext'
import { translations } from '../_utils/translations'

// Define timezones as a constant to ensure consistency between server and client
const TIMEZONES = [
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Algiers',
  'Africa/Bissau',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Ceuta',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Maputo',
  'Africa/Monrovia',
  'Africa/Nairobi',
  'Africa/Tripoli',
  'Africa/Tunis',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Chicago',
  'America/Denver',
  'America/Edmonton',
  'America/Halifax',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Regina',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Almaty',
  'Asia/Baghdad',
  'Asia/Bahrain',
  'Asia/Bangkok',
  'Asia/Beirut',
  'Asia/Colombo',
  'Asia/Damascus',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Kabul',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Kolkata',
  'Asia/Kuwait',
  'Asia/Manila',
  'Asia/Qatar',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tehran',
  'Asia/Tokyo',
  'Atlantic/Azores',
  'Atlantic/Cape_Verde',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Darwin',
  'Australia/Hobart',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Belgrade',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Bucharest',
  'Europe/Budapest',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Kiev',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Sofia',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Indian/Maldives',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Pacific/Noumea',
  'Pacific/Port_Moresby',
  'Pacific/Tongatapu'
].sort()

export default function GeneralSettings() {
  const { settings, updateSettings } = useSettings()
  const [showLanguage, setShowLanguage] = useState(false)
  const [showTimezone, setShowTimezone] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const languageRef = useRef(null)
  const timezoneRef = useRef(null)

  // Get translations based on current language
  const t = translations[settings.language].settings

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
    updateSettings({ [setting]: value })
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
          {t.title}
        </h2>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389 21.034 21.034 0 01-.554-.6 19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
            </svg>
            {t.language}
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
                <span className="select-none">{settings.language === 'en' ? 'English (Default)' : 'Français'}</span>
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
                    handleSettingChange('language', 'en')
                    setShowLanguage(false)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  English (Default)
                </button>
                <button 
                  onClick={() => {
                    handleSettingChange('language', 'fr')
                    setShowLanguage(false)
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  Français
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
            {t.timeZone}
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
                <span className="select-none">{settings.timeZone}</span>
                <svg 
                  className={`w-6 h-6 transition-transform duration-200 ${showTimezone ? 'transform rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className={`absolute w-full py-2 mt-2 bg-white rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto ${showTimezone ? '' : 'hidden'}`}>
                {TIMEZONES.map((zone) => (
                  <button 
                    key={zone}
                    onClick={() => {
                      handleSettingChange('timeZone', zone)
                      setShowTimezone(false)
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {t.timeFormat}
          </h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleSettingChange('timeFormat', '24')}
              className={`h-12 px-6 text-[15px] rounded-full transition-all ${
                settings.timeFormat === '24'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => handleSettingChange('timeFormat', '12')}
              className={`h-12 px-6 text-[15px] rounded-full transition-all ${
                settings.timeFormat === '12'
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
            onClick={handleSave}
            disabled={!hasChanges}
            className={`w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
              !hasChanges ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            {t.save}
          </button>
        </div>
      </div>
    </SettingsLayout>
  )
}
