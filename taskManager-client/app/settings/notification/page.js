'use client'

import { useState } from 'react'
import SettingsLayout from '../../_components/Settings/SettingsLayout'

export default function NotificationSettings() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [hourlyDigest, setHourlyDigest] = useState(false)
  const [dailyDigest, setDailyDigest] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [taskCompletionNotif, setTaskCompletionNotif] = useState(true)
  const [fileChangeNotif, setFileChangeNotif] = useState(true)
  const [dueDateNotif, setDueDateNotif] = useState(true)
  const [profileUpdateNotif, setProfileUpdateNotif] = useState(true)

  const handleSave = () => {
    // Add your save logic here
    setShowSuccess(true)
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  return (
    <SettingsLayout showSuccess={showSuccess}>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-blue-500">
            Notification Preferences
          </h2>
          
          {/* Delivery Time */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Notification Summary Frequency
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hourlyDigest}
                  onChange={(e) => setHourlyDigest(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Hourly summary</span>
                  <p className="text-sm text-gray-500">See updates every hour in your notification center</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Daily summary</span>
                  <p className="text-sm text-gray-500">Get a summary at the end of each day</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Weekly summary</span>
                  <p className="text-sm text-gray-500">Receive a summary every Sunday</p>
                </span>
              </label>
            </div>
          </div>

          {/* Notification Types */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Notification Types
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={taskCompletionNotif}
                  onChange={(e) => setTaskCompletionNotif(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Task completion</span>
                  <p className="text-sm text-gray-500">Get notified when tasks are marked as complete</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={fileChangeNotif}
                  onChange={(e) => setFileChangeNotif(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">File changes</span>
                  <p className="text-sm text-gray-500">Get notified when files are added or removed</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dueDateNotif}
                  onChange={(e) => setDueDateNotif(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Due date reminders</span>
                  <p className="text-sm text-gray-500">Get reminded about upcoming task deadlines</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profileUpdateNotif}
                  onChange={(e) => setProfileUpdateNotif(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Profile updates</span>
                  <p className="text-sm text-gray-500">Get notified when your profile information is updated</p>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </SettingsLayout>
  )
}
