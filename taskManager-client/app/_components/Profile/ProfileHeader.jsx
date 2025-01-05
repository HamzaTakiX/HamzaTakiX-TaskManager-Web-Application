'use client'

import { useRef, useState, useEffect } from 'react'
import { FiMail, FiMapPin, FiCalendar, FiEdit, FiCamera, FiUser, FiBriefcase, FiMoreVertical, FiUpload, FiTrash2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import axios from 'axios'
import { useUser } from '../../_context/UserContext'
import useNotifications from '@/app/_hooks/useNotifications'

export default function ProfileHeader() {
  const { 
    profileImage, 
    bannerImage,
    userName, 
    userEmail,
    userJob,
    userLocation,
    joinedDate,
    updateProfileImage, 
    updateBannerImage,
    updateUserEmail,
    updateUserJob,
    updateUserName,
    updateUserLocation
  } = useUser()
  
  const { addNotification } = useNotifications()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showBannerMenu, setShowBannerMenu] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUserInfoLoading, setIsUserInfoLoading] = useState(true)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  
  const profileInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const profileMenuRef = useRef(null)
  const bannerMenuRef = useRef(null)

  useEffect(() => {
    const storedName = localStorage.getItem('userName')
    const storedEmail = localStorage.getItem('userEmail')
    const storedJob = localStorage.getItem('userJob')
    const storedLocation = localStorage.getItem('userLocation')
    
    if (storedName) updateUserName(storedName)
    if (storedEmail) updateUserEmail(storedEmail)
    
    if ((userName && userName !== '') || 
        (storedName && storedName !== '')) {
      setIsUserInfoLoading(false)
    }
  }, [updateUserName, updateUserEmail, userName])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
      if (bannerMenuRef.current && !bannerMenuRef.current.contains(event.target)) {
        setShowBannerMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const showNotificationMessage = (message, type = 'success') => {
    setShowNotification(false)
    setTimeout(() => {
      setNotificationMessage(message)
      setNotificationType(type)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }, 100)
  }

  const handleBannerImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      showNotificationMessage('Uploading banner image...', 'info')
      
      const formData = new FormData()
      formData.append('bannerImage', file)

      const response = await axios.post('http://localhost:9000/api/users/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.state) {
        updateBannerImage(response.data.user.bannerImage)
        localStorage.setItem('bannerImage', response.data.user.bannerImage)
        setShowBannerMenu(false)
        showNotificationMessage('Banner image updated successfully', 'success')
        addNotification({
          title: 'Banner Image Updated',
          message: 'Your banner image has been successfully updated',
          type: 'success'
        })
      } else {
        showNotificationMessage(response.data.message || 'Failed to upload banner image', 'error')
        addNotification({
          title: 'Banner Update Failed',
          message: 'Failed to update your banner image. Please try again.',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error uploading banner image:', error)
      showNotificationMessage('Failed to upload banner image. Please try again.', 'error')
      addNotification({
        title: 'Banner Update Failed',
        message: 'Failed to update your banner image. Please try again.',
        type: 'error'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveBannerImage = async () => {
    try {
      showNotificationMessage('Removing banner image...', 'info')
      const response = await axios.post('http://localhost:9000/api/users/upload-images', 
        { removeBannerImage: true },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.data.state) {
        updateBannerImage(null)
        localStorage.removeItem('bannerImage')
        setShowBannerMenu(false)
        showNotificationMessage('Banner image removed successfully', 'success')
        addNotification({
          title: 'Banner Image Removed',
          message: 'Your banner image has been successfully removed',
          type: 'success'
        })
      } else {
        showNotificationMessage(response.data.message || 'Failed to remove banner image', 'error')
        addNotification({
          title: 'Banner Remove Failed',
          message: 'Failed to remove your banner image. Please try again.',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error removing banner image:', error)
      showNotificationMessage('Failed to remove banner image. Please try again.', 'error')
      addNotification({
        title: 'Banner Remove Failed',
        message: 'Failed to remove your banner image. Please try again.',
        type: 'error'
      })
    }
  }

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      showNotificationMessage('Uploading profile image...', 'info')
      const formData = new FormData()
      formData.append('profileImage', file)

      const response = await axios.post('http://localhost:9000/api/users/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.state) {
        updateProfileImage(response.data.user.profileImage)
        setShowProfileMenu(false)
        showNotificationMessage('Profile image updated successfully', 'success')
        addNotification({
          title: 'Profile Picture Updated',
          message: 'Your profile picture has been successfully updated',
          type: 'profile'
        })
      } else {
        showNotificationMessage(response.data.message || 'Failed to upload profile image', 'error')
        addNotification({
          title: 'Profile Picture Update Failed',
          message: 'Failed to update your profile picture. Please try again.',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error uploading profile image:', error)
      showNotificationMessage('Failed to upload profile image. Please try again.', 'error')
      addNotification({
        title: 'Profile Picture Update Failed',
        message: 'Failed to update your profile picture. Please try again.',
        type: 'error'
      })
    }
  }

  const handleRemoveProfileImage = async () => {
    try {
      showNotificationMessage('Removing profile image...', 'info')
      const response = await axios.post(
        'http://localhost:9000/api/users/upload-images',
        { removeProfileImage: true },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.data.state) {
        updateProfileImage(null)
        setShowProfileMenu(false)
        showNotificationMessage('Profile image removed successfully', 'success')
        addNotification({
          title: 'Profile Picture Removed',
          message: 'Your profile picture has been successfully removed',
          type: 'profile'
        })
      } else {
        showNotificationMessage(response.data.message || 'Failed to remove profile image', 'error')
        addNotification({
          title: 'Profile Picture Remove Failed',
          message: 'Failed to remove your profile picture. Please try again.',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error removing profile image:', error)
      showNotificationMessage('Failed to remove profile image. Please try again.', 'error')
      addNotification({
        title: 'Profile Picture Remove Failed',
        message: 'Failed to remove your profile picture. Please try again.',
        type: 'error'
      })
    }
  }

  return (
    <div className="bg-white shadow-sm">
      {/* Notification */}
      {showNotification && (
        <div 
          className={`fixed top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg z-50 ${
            notificationType === 'success' 
              ? 'bg-green-50 text-green-600' 
              : notificationType === 'profile' 
                ? 'bg-purple-50 text-purple-600' 
                : 'bg-red-50 text-red-600'
          }`}
          style={{
            animation: 'slideIn 0.5s ease-out forwards',
          }}
        >
          {notificationType === 'success' ? (
            <FiCheckCircle className="w-5 h-5" />
          ) : notificationType === 'profile' ? (
            <FiUser className="w-5 h-5" />
          ) : (
            <FiAlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{notificationMessage}</span>
        </div>
      )}
      
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
        {bannerImage && bannerImage !== 'none' && (
          <div className="absolute inset-0 z-0">
            <Image
              src={bannerImage.startsWith('http') ? bannerImage : `http://localhost:9000${bannerImage}`}
              alt="Banner"
              fill
              className="object-cover"
              sizes="100vw"
              priority
              quality={90}
            />
          </div>
        )}
        
        {/* Banner Menu */}
        <div className="absolute bottom-4 right-4" style={{ zIndex: 1000 }}>
          {bannerImage && bannerImage !== 'none' ? (
            <div className="relative inline-block text-left" ref={bannerMenuRef}>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBannerMenu(!showBannerMenu)}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              >
                <FiMoreVertical className="w-5 h-5" />
              </motion.button>
              
              {showBannerMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" style={{ zIndex: 1001 }}>
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => {
                        bannerInputRef.current?.click()
                        setShowBannerMenu(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiUpload className="w-4 h-4" />
                      Change Banner
                    </button>
                    <button
                      onClick={handleRemoveBannerImage}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Remove Banner
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => bannerInputRef.current?.click()}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FiCamera className="w-5 h-5" />
              <span>Add Banner</span>
            </motion.button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerImageChange}
            className="hidden"
            aria-label="Change banner image"
            disabled={isUploading}
          />
        </div>
      </div>
      
      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-24 pb-6">
          <div className="flex flex-col space-y-4">
            {/* Profile Image */}
            <div className="relative self-start">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="w-32 h-32 rounded-full border-4 border-white bg-blue-600 shadow-md overflow-hidden flex items-center justify-center text-white"
              >
                {profileImage && profileImage !== 'none' ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={profileImage.startsWith('http') ? profileImage : `http://localhost:9000${profileImage}`}
                      alt="Profile"
                      fill
                      className="object-cover"
                      sizes="128px"
                      priority
                      quality={90}
                    />
                  </div>
                ) : (
                  <div className="text-4xl font-medium">
                    {userName ? (
                      userName.charAt(0).toUpperCase()
                    ) : (
                      <FiUser className="w-16 h-16" />
                    )}
                  </div>
                )}
              </motion.div>

              {/* Profile Image Menu */}
              <div className="absolute bottom-0 right-0">
                {profileImage && profileImage !== 'none' ? (
                  <div className="relative" ref={profileMenuRef}>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <FiMoreVertical className="w-4 h-4 text-gray-600" />
                    </motion.button>
                    
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" style={{ zIndex: 1001 }}>
                        <div className="py-1" role="menu">
                          <button
                            onClick={() => {
                              profileInputRef.current?.click()
                              setShowProfileMenu(false)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <FiUpload className="w-4 h-4" />
                            Change Photo
                          </button>
                          <button
                            onClick={handleRemoveProfileImage}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Remove Photo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => profileInputRef.current?.click()}
                    className="p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <FiCamera className="w-4 h-4 text-gray-600" />
                  </motion.button>
                )}
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                  aria-label="Change profile image"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex justify-between items-start">
              <div>
                {isUserInfoLoading ? (
                  <div className="space-y-4">
                    {/* Name and username */}
                    <div className="space-y-2">
                      <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                    {/* User details */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-5 w-24 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-5 w-28 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-5 w-36 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-semibold text-gray-900">{userName || 'User'}</h1>
                    <p className="text-gray-600 mt-1">@{userName?.toLowerCase().replace(/\s+/g, '') || 'username'}</p>
                    <div className="flex flex-wrap gap-4 mt-4 text-gray-600 text-sm">
                      {userEmail && (
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          <div className="p-1 bg-blue-100 rounded-full">
                            <FiMail className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-blue-700">{userEmail}</span>
                        </motion.div>
                      )}
                      {userJob && (
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors"
                        >
                          <div className="p-1 bg-purple-100 rounded-full">
                            <FiBriefcase className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="text-purple-700">{userJob}</span>
                        </motion.div>
                      )}
                      {userLocation && (
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100 hover:bg-green-100 transition-colors"
                        >
                          <div className="p-1 bg-green-100 rounded-full">
                            <FiMapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-green-700">{userLocation}</span>
                        </motion.div>
                      )}
                      {joinedDate && (
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors"
                        >
                          <div className="p-1 bg-amber-100 rounded-full">
                            <FiCalendar className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="text-amber-700">Joined {format(new Date(joinedDate), 'do MMMM yyyy')}</span>
                        </motion.div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}