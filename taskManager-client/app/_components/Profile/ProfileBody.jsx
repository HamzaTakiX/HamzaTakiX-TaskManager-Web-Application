'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion'
import { 
  FiEdit2, FiClock, FiCheckCircle, 
  FiAlertCircle, FiBarChart2, FiPlus, FiTrash2,
  FiCheck, FiTrash, FiEdit3, FiCalendar, FiFlag, FiUser, FiPhone, FiMail,
  FiFolder, FiStar, FiChevronDown, FiFilter, FiSettings, FiCheckSquare, FiList, FiMapPin, FiPieChart, FiTrendingUp,
  FiActivity, FiX, FiSave, FiAward, FiChevronRight, FiBriefcase, FiCommand, FiGrid, FiLock, FiKey, FiEye, FiEyeOff
} from 'react-icons/fi'
import { useUser } from '@/app/_context/UserContext'
import ActivityModal from './ActivityModal'
import ProfileInfoModal from './ProfileInfoModal'
import CategoryModal from './CategoryModal'
import SkillModal from './SkillModal'
import HistorySection from './HistorySection'
import SuccessAlert from '../Notifications/SuccessAlert'
import AboutModal from './AboutModal'
import DeleteAccountModal from './DeleteAccountModal'
import axios from 'axios'
import Cookies from 'js-cookie'

export default function ProfileBody() {
  const { 
    userName, 
    userEmail, 
    userJob, 
    userPhone, 
    userLanguages, 
    userLocation, 
    userAbout, 
    updateUserAbout, 
    userSkills, 
    updateUserSkills, 
    deleteAccount, 
    updateUserName, 
    updateUserEmail, 
    updateUserJob, 
    updateUserPhone, 
    updateUserLanguages, 
    updateUserLocation 
  } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [isEditingAbout, setIsEditingAbout] = useState(false)
  const [editedDescription, setEditedDescription] = useState(userAbout || '')
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('error')
  const [isSkillsLoading, setIsSkillsLoading] = useState(true)
  const [isAboutLoading, setIsAboutLoading] = useState(true)
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  })
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
    if (name === 'newPassword') {
      const strength = getPasswordStrength(value)
      setPasswordStrength(strength)
    }
  }

  const getPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[!@#$%^&*()_+\-={};':"\\|,.<>?]/.test(password)) strength++
    return strength
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  // Handle password update
  const handleUpdatePassword = async () => {
    // Validate passwords
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setAlertType('error')
      setAlertMessage('Please fill in all password fields')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlertType('error')
      setAlertMessage('New passwords do not match')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      return
    }

    try {
      setIsUpdatingPassword(true)
      const token = Cookies.get('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      // Call the update password endpoint
      const response = await axios.put(
        '/api/users/profile/password',
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.state) {
        setAlertType('success')
        setAlertMessage('Password updated successfully')
        setShowAlert(true)
        // Clear form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      setAlertType('error')
      setAlertMessage(error.response?.data?.message || 'Failed to update password')
      setShowAlert(true)
    } finally {
      setIsUpdatingPassword(false)
      setTimeout(() => setShowAlert(false), 3000)
    }
  }

  // Update editedDescription when userAbout changes
  useEffect(() => {
    setEditedDescription(userAbout || '')
    setIsAboutLoading(false)
  }, [userAbout])

  useEffect(() => {
    if (userSkills) {
      setIsSkillsLoading(false)
    }
  }, [userSkills])

  const [profileInfo, setProfileInfo] = useState({
    fullName: userName || 'John Doe',
    country: userLocation || 'Casablanca, Morocco',
    languages: userLanguages || '',
    phone: userPhone || '',
    email: userEmail || 'john.doe@example.com'
  })
  const [newLink, setNewLink] = useState({ platform: '', url: '' })
  const [newSkill, setNewSkill] = useState('')
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [error, setError] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const validateSkill = (skill) => {
    // Check if skill already exists
    if (userSkills.includes(skill.trim())) {
      setAlertMessage('This skill already exists')
      setAlertType('error')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      return false
    }

    // Check skill length (max 20 characters)
    if (skill.trim().length > 20) {
      setAlertMessage('Skill name must be less than 20 characters')
      setAlertType('error')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      return false
    }

    return true
  }

  const handleAddSkill = async () => {
    const trimmedSkill = newSkill.trim()
    if (!trimmedSkill) return

    if (!validateSkill(trimmedSkill)) {
      setNewSkill('')
      return
    }

    try {
      const token = Cookies.get('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      // Update skills in the database
      const response = await axios.put(
        '/api/users/update-profile',
        {
          skills: [...userSkills, trimmedSkill],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.state) {
        updateUserSkills([...userSkills, trimmedSkill])
        setNewSkill('')
        addActivity('update', 'Skills', `Added ${trimmedSkill} to skills`)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Error updating skills:', error)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const handleRemoveSkill = async (skillToRemove) => {
    try {
      const updatedSkills = userSkills.filter(skill => skill !== skillToRemove)
      await updateUserSkills(updatedSkills)
      addActivity('update', 'Skills', `Removed ${skillToRemove} from skills`)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Failed to remove skill:', error)
      setError(error.message || 'Failed to remove skill')
    }
  }

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Implement User Authentication',
      status: 'completed',
      priority: 'high',
      dueDate: '2024-01-05',
      progress: 100
    },
    {
      id: 2,
      title: 'Design Dashboard Layout',
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2024-01-10',
      progress: 65
    },
    {
      id: 3,
      title: 'API Integration',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2024-01-15',
      progress: 30
    }
  ])

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'complete',
      taskTitle: 'User Authentication',
      timestamp: '2024-01-02T10:30:00',
      icon: FiCheck,
      color: 'text-green-500'
    },
    {
      id: 2,
      type: 'update',
      taskTitle: 'API Integration',
      details: 'Updated progress to 65%',
      timestamp: '2024-01-02T09:15:00',
      icon: FiEdit3,
      color: 'text-blue-500'
    },
    {
      id: 3,
      type: 'create',
      taskTitle: 'Design Dashboard Layout',
      timestamp: '2024-01-01T16:45:00',
      icon: FiPlus,
      color: 'text-purple-500'
    },
    {
      id: 4,
      type: 'priority',
      taskTitle: 'API Integration',
      details: 'Changed priority to High',
      timestamp: '2024-01-01T14:20:00',
      icon: FiFlag,
      color: 'text-orange-500'
    },
    {
      id: 5,
      type: 'deadline',
      taskTitle: 'User Authentication',
      details: 'Changed due date to Jan 15',
      timestamp: '2024-01-01T11:10:00',
      icon: FiCalendar,
      color: 'text-indigo-500'
    }
  ])

  const [activeTimeFilter, setActiveTimeFilter] = useState('today')

  const [emailPreferences, setEmailPreferences] = useState({
    activityNotifications: false,
    taskUpdates: false,
    weeklySummary: false
  })

  const [categoryStats] = useState({
    development: { count: 15, total: 20, color: '#4F46E5' }, // Indigo
    design: { count: 8, total: 10, color: '#9333EA' },      // Purple
    marketing: { count: 12, total: 15, color: '#EC4899' },  // Pink
    research: { count: 5, total: 8, color: '#2563EB' },     // Blue
    content: { count: 7, total: 10, color: '#06B6D4' }      // Cyan
  })

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  const platformDropdownRef = useRef(null)

  // Close platform dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (platformDropdownRef.current && !platformDropdownRef.current.contains(event.target)) {
        setIsPlatformDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setProfileInfo(prev => ({
      ...prev,
      fullName: userName || '',
      country: userLocation || '',
      languages: userLanguages || '',
      phone: userPhone || '',
      email: userEmail || ''
    }))
  }, [userName, userEmail, userPhone, userLanguages, userLocation])

  const handleSaveDescription = async () => {
    try {
      const token = Cookies.get('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      // Update user info in the database
      const response = await axios.put('/api/users/update-profile', {
        about: editedDescription.trim() || 'No description provided'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.state) {
        setIsEditingAbout(false)
        updateUserAbout(editedDescription)
        // Add to activity feed
        addActivity('update', 'Profile Description', 'Updated about section')
        // Show success message
        setAlertType('success')
        setAlertMessage('Profile updated successfully!')
        setShowAlert(true)
        setTimeout(() => setShowAlert(false), 3000)
      } else {
        throw new Error(response.data.message)
      }
    } catch (err) {
      console.error('About update error:', err)
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Please login again to update your profile')
        // Clear invalid token
        Cookies.remove('token')
        localStorage.removeItem('token')
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update about section')
      }
    }
  }

  const addActivity = (type, taskTitle, details = '') => {
    const newActivity = {
      id: Date.now(),
      type,
      taskTitle,
      details,
      timestamp: new Date().toISOString(),
      icon: type === 'complete' ? FiCheck :
            type === 'update' ? FiEdit3 :
            type === 'create' ? FiPlus :
            type === 'priority' ? FiFlag :
            type === 'deadline' ? FiCalendar :
            FiActivity,
      color: type === 'complete' ? 'text-green-500' :
             type === 'update' ? 'text-blue-500' :
             type === 'create' ? 'text-purple-500' :
             type === 'priority' ? 'text-orange-500' :
             type === 'deadline' ? 'text-indigo-500' :
             'text-gray-500'
    }
    activities.unshift(newActivity)
  }

  const handleSaveProfileInfo = (newInfo) => {
    setProfileInfo(newInfo)
    addActivity('update', 'Profile Information', 'Updated profile information')
    setShowSuccess(true)
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60))
        return `${diffInMinutes} minutes ago`
      }
      return `${diffInHours} hours ago`
    }
    
    if (diffInHours < 48) {
      return 'Yesterday'
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'complete':
        return `Completed task "${activity.taskTitle}"`
      case 'update':
        return `Updated task "${activity.taskTitle}"`
      case 'create':
        return `Created new task "${activity.taskTitle}"`
      case 'priority':
        return `Updated priority for "${activity.taskTitle}"`
      case 'deadline':
        return `Updated deadline for "${activity.taskTitle}"`
      default:
        return `Modified task "${activity.taskTitle}"`
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-600'
      case 'in-progress':
        return 'bg-yellow-50 text-yellow-600'
      case 'pending':
        return 'bg-gray-50 text-gray-600'
      case 'overdue':
        return 'bg-red-50 text-red-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-4 h-4" />
      case 'in-progress':
        return <FiClock className="w-4 h-4" />
      case 'pending':
        return <FiClock className="w-4 h-4" />
      case 'overdue':
        return <FiAlertCircle className="w-4 h-4" />
      default:
        return <FiCircle className="w-4 h-4" />
    }
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }

  const handleEmailPreference = (key) => {
    setEmailPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleExportData = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Call the export endpoint
      const response = await axios({
        method: 'GET',
        url: 'http://localhost:9000/api/users/export-data',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        responseType: 'blob', // Important for downloading files
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'user_data.json';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      // Show success message
      setAlertType('success');
      setAlertMessage('Data exported successfully!');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
      let errorMessage = 'Failed to export data. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Please login again to export your data.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User data not found.';
      }
      setAlertType('error');
      setAlertMessage(errorMessage);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount()
      setIsDeleteAccountModalOpen(false)
      setAlertType('success')
      setAlertMessage('Account deleted successfully')
      setShowAlert(true)
    } catch (error) {
      console.error('Error deleting account:', error)
      setAlertType('error')
      setAlertMessage('Failed to delete account. Please try again.')
      setShowAlert(true)
    }
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
  }

  const averageProgress = Math.round(
    tasks.reduce((acc, task) => acc + task.progress, 0) / tasks.length
  )

  // Navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'history', label: 'History', icon: FiClock },
    { id: 'tasks', label: 'Tasks', icon: FiCheckSquare },
    { id: 'favorites', label: 'Favorites', icon: FiStar },
    { id: 'activity', label: 'Activity', icon: FiActivity },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ]

  const textareaRef = useRef(null)

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  useEffect(() => {
    if (isEditingAbout) {
      autoResizeTextarea()
    }
  }, [isEditingAbout])

  const [isEditingSkills, setIsEditingSkills] = useState(false)

  const handleUpdateSkills = async (newSkills) => {
    try {
      const token = Cookies.get('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      // Update skills in the database
      const response = await axios.put(
        '/api/users/update-profile',
        {
          skills: newSkills,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.state) {
        updateUserSkills(newSkills)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
        setIsSkillModalOpen(false)
      }
    } catch (error) {
      console.error('Error updating skills:', error)
      setError(error.message || 'Failed to update skills')
    }
  }

  // Add function to fetch user data
  const fetchUserData = async () => {
    try {
      const token = Cookies.get('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await axios.get('http://localhost:9000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.state) {
        const userData = response.data.user
        console.log('Raw user data:', userData)  // Debug log

        // Handle phone number - ensure we're getting the correct field name
        const phoneNumber = userData.phoneNumber || userData.phone || ''
        console.log('Phone number from DB:', phoneNumber)  // Debug log

        // Update all user data in context
        updateUserName(userData.fullName || userName)
        updateUserEmail(userData.email || userEmail)
        updateUserJob(userData.job || userJob)
        updateUserPhone(phoneNumber)  // Update with the phone number
        updateUserLanguages(userData.languages || '')
        updateUserLocation(userData.location || userLocation)
        updateUserAbout(userData.about || userAbout)
        if (userData.skills && Array.isArray(userData.skills)) {
          updateUserSkills(userData.skills)
        }
        
        // Update local state
        const updatedProfileInfo = {
          fullName: userData.fullName || userName || 'John Doe',
          country: userData.location || userLocation || 'Casablanca, Morocco',
          languages: userData.languages || userLanguages || '',
          phone: phoneNumber,  // Use the retrieved phone number
          email: userData.email || userEmail || 'john.doe@example.com'
        }
        console.log('Updated profile info:', updatedProfileInfo)  // Debug log
        setProfileInfo(updatedProfileInfo)

        // Double check the phone number is set
        setTimeout(() => {
          console.log('Profile info after update:', profileInfo)  // Debug log
        }, 0)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to load user data')
    }
  }

  // Add useEffect to fetch data on mount and when needed
  useEffect(() => {
    fetchUserData()
  }, []) // Fetch on mount

  // Add useEffect to update profileInfo when user data changes
  useEffect(() => {
    const updatedInfo = {
      fullName: userName || 'John Doe',
      country: userLocation || 'Casablanca, Morocco',
      languages: userLanguages || '',
      phone: userPhone,  // Use phone directly
      email: userEmail || 'john.doe@example.com'
    }
    console.log('Updating profile info from effect:', updatedInfo)  // Debug log
    setProfileInfo(updatedInfo)
  }, [userName, userLocation, userLanguages, userPhone, userEmail])

  return (
    <>
      <SuccessAlert 
        message="Profile updated successfully!" 
        isVisible={showSuccess} 
        onClose={() => setShowSuccess(false)} 
      />
      {/* Alert Notification */}
      {showAlert && (
        <div className={`fixed top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
          alertType === 'success' 
            ? 'bg-green-50 text-green-600' 
            : 'bg-red-50 text-red-600'
        }`}>
          {alertType === 'success' ? (
            <FiCheckCircle className="w-5 h-5" />
          ) : (
            <FiAlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{alertMessage}</span>
        </div>
      )}
      {/* Main Navigation */}
      <div className="bg-white shadow-sm mb-6 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex justify-center space-x-8" aria-label="Profile Navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === item.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Profile Info Column */}
            <div className="col-span-12 lg:col-span-4">
              {/* Profile Info Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 max-h-[calc(340vh-13rem)] max-w-full min-h-[calc(113vh-13rem)] min-w-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-50 rounded-full">
                      <FiUser className="w-4 h-4 text-green-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Profile Info</h2>
                  </div>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-base font-medium text-gray-500 mb-3">Full Name</h3>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded-full">
                        <FiUser className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-base text-gray-900">{profileInfo.fullName}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-500 mb-3">Country</h3>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded-full">
                        <FiMapPin className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-base text-gray-900">{profileInfo.country}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-500 mb-3">Languages</h3>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded-full">
                        <FiCommand className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-base text-gray-900">{profileInfo.languages}</p>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-gray-100">
                    <h3 className="text-base font-medium text-gray-900 mb-6">Contacts</h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-full">
                          <FiPhone className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-base text-gray-600">{profileInfo.phone}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-full">
                          <FiMail className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-base text-gray-600">{profileInfo.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills and About Column */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* About Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 min-h-[calc(65vh-8rem)] max-h-[calc(100vh-8rem)] max-w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-50 rounded-full">
                      <FiUser className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">About</h2>
                  </div>
                  <button
                    onClick={() => setIsEditingAbout(!isEditingAbout)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {isEditingAbout ? <FiX className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4" />}
                  </button>
                </div>

                {isEditingAbout ? (
                  <div className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                        {error}
                      </div>
                    )}
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={editedDescription}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (newValue.length <= 1000) {
                            setEditedDescription(newValue);
                            autoResizeTextarea();
                          }
                        }}
                        maxLength={1000}
                        className="w-full px-4 py-3 text-base text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px] overflow-hidden resize-none"
                        placeholder="Write something about yourself (max 1000 characters)..."
                      />
                      <div className="mt-2 flex justify-between items-center text-sm">
                        <span className={`${editedDescription.length >= 1000 ? 'text-red-500' : 'text-gray-500'}`}>
                          {editedDescription.length}/1000 characters
                        </span>
                        <button
                          onClick={handleSaveDescription}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <FiSave className="w-4 h-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap max-w-full">
                    {isAboutLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ) : editedDescription.trim() ? (
                      <div>
                        <p className="text-gray-600 whitespace-pre-wrap min-h-[150px] max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {editedDescription.length > 500 
                            ? editedDescription.slice(0, 500) + '...'
                            : editedDescription
                          }
                        </p>
                        {editedDescription.length > 500 && (
                          <button
                            onClick={() => setIsAboutModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                          >
                            Read More
                            <FiChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="p-3 bg-purple-50 rounded-full mb-3">
                          <FiCommand className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-base font-medium text-gray-900 mb-1">No Description Added</h3>
                          <p className="text-sm text-gray-500">Click the "Edit" button to add your description (max 1000 characters)</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Skills Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 min-h-[calc(65vh-8rem)] max-h-[calc(100vh-8rem)] max-w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <FiBarChart2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                  </div>
                  <button
                    onClick={() => setIsAddingSkill(!isAddingSkill)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {isAddingSkill ? <FiX className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                  </button>
                </div>

                {isAddingSkill && (
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add a skill..."
                      className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddSkill}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                )}

                <div className="relative h-[120px] w-full overflow-hidden">
                  {isSkillsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-10 w-24 bg-gray-200 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto scrollbar-hide hover:scrollbar-default transition-all pr-2">
                      {userSkills.length > 0 ? (
                        <>
                          {userSkills.slice(0, 5).map((skill, index) => (
                            <motion.span
                              key={skill}
                              initial={isAddingSkill ? { scale: 0 } : false}
                              animate={isAddingSkill ? { scale: 1 } : false}
                              exit={isAddingSkill ? { scale: 0 } : false}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-base bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shrink-0"
                            >
                              {skill}
                              <button
                                onClick={() => handleRemoveSkill(skill)}
                                className="p-1 hover:bg-blue-200 rounded-full"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            </motion.span>
                          ))}
                          {userSkills.length > 5 && (
                            <button
                              onClick={() => setIsSkillModalOpen(true)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow group shrink-0"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-sm">
                                  +{userSkills.length - 5}
                                </span>
                                <span className="hidden sm:inline">more skills</span>
                              </span>
                              <FiChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center h-[120px]">
                          <div className="p-3 bg-blue-50 rounded-full mb-3">
                            <FiAward className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-base font-medium text-gray-900 mb-1">No Skills Added</h3>
                            <p className="text-sm text-gray-500">Click the "Add Skills" button to get started</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistorySection />
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Statistics Section */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-50 rounded-full">
                    <FiPieChart className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Task Statistics</h2>
                </div>
              </div>
              
              <div className="p-6">
                {/* Time Filter */}
                <div className="flex gap-2 mb-6">
                  <button 
                    onClick={() => setActiveTimeFilter('today')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      activeTimeFilter === 'today'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setActiveTimeFilter('week')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      activeTimeFilter === 'week'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setActiveTimeFilter('month')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      activeTimeFilter === 'month'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Month
                  </button>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Completed Tasks</span>
                      <div className="p-1.5 bg-green-100 rounded-full">
                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">24</span>
                      <span className="text-sm text-green-600">+12.5%</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">In Progress</span>
                      <div className="p-1.5 bg-blue-100 rounded-full">
                        <FiClock className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">8</span>
                      <span className="text-sm text-blue-600">Active</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Total Tasks</span>
                      <div className="p-1.5 bg-indigo-100 rounded-full">
                        <FiList className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {Object.values(categoryStats).reduce((sum, category) => sum + category.total, 0)}
                      </span>
                      <span className="text-sm text-indigo-600">tasks</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                      <div className="p-1.5 bg-purple-100 rounded-full">
                        <FiTrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">75%</span>
                      <span className="text-sm text-purple-600">+5%</span>
                    </div>
                  </div>
                </div>

                {/* Category Progress */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">Category Progress</h3>
                    <button
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(categoryStats).map(([category, stats]) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: stats.color }}
                            ></span>
                            <span className="text-sm text-gray-600 capitalize">{category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {stats.count}/{stats.total}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({Math.round((stats.count / stats.total) * 100)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              backgroundColor: stats.color,
                              width: `${(stats.count / stats.total) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Last Task Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-50 rounded-full">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Last Task</h2>
                </div>
              </div>
              
              {tasks.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(tasks[0].status)}`} />
                        <h3 className="text-base font-medium text-gray-900">
                          {tasks[0].title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4 text-gray-500" />
                          <span>Due {tasks[0].dueDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {tasks[0].status === 'completed' ? (
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiAlertCircle className="w-4 h-4 text-indigo-500" />
                          )}
                          <span className="capitalize">{tasks[0].status.replace('-', ' ')}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-medium text-indigo-600">{tasks[0].progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getProgressColor(tasks[0].progress)} transition-all duration-500`}
                            style={{ width: `${tasks[0].progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <FiCheckSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No tasks yet</h3>
                  <p className="text-sm text-gray-500">Create your first task to get started</p>
                </div>
              )}
            </div>

            {/* Recent Tasks Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-full">
                    <FiClock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                </div>
              </div>
              <div className="space-y-4">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                          <h3 className="text-base font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {task.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FiClock className="w-4 h-4 text-gray-500" />
                            <span>Due {task.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {task.status === 'completed' ? (
                              <FiCheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <FiAlertCircle className="w-4 h-4 text-indigo-500" />
                            )}
                            <span className="capitalize">{task.status.replace('-', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(task.progress)} transition-all duration-500`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Activity Feed */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-full">
                    <FiActivity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTimeFilter('today')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTimeFilter === 'today'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setActiveTimeFilter('week')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTimeFilter === 'week'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setActiveTimeFilter('month')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTimeFilter === 'month'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-0 left-4 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-8">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="relative flex gap-4 items-start">
                      <div className="absolute -left-2 w-8 h-8 flex items-center justify-center">
                        <div className={`p-1.5 rounded-full ${activity.color.replace('text-', 'bg-').replace('500', '100')}`}>
                          <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                      </div>
                      <div className="flex-1 ml-8">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{activity.title}</span>
                          <span className="text-sm text-gray-500">{formatTimestamp(activity.timestamp)}</span>
                        </div>
                        {activity.details && (
                          <p className="mt-1 text-sm text-gray-500">{activity.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsActivityModalOpen(true)}
                  className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FiChevronDown className="w-4 h-4" />
                  View All Activity
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Password Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <FiSettings className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Password Settings</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type={showPasswords.currentPassword ? 'text' : 'password'}
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="block w-full pl-10 pr-12 py-2.5 text-sm border border-gray-300 rounded-lg 
                            bg-gray-50 focus:bg-white hover:bg-gray-50/80
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                            transition-all duration-200"
                          placeholder="Enter your current password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('currentPassword')}
                            className="text-gray-400 hover:text-blue-500 focus:outline-none focus:text-blue-500 transition-colors"
                          >
                            {showPasswords.currentPassword ? (
                              <FiEyeOff className="h-5 w-5" />
                            ) : (
                              <FiEye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiKey className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type={showPasswords.newPassword ? 'text' : 'password'}
                          id="newPassword"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="block w-full pl-10 pr-12 py-2.5 text-sm border border-gray-300 rounded-lg 
                            bg-gray-50 focus:bg-white hover:bg-gray-50/80
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                            transition-all duration-200"
                          placeholder="Enter your new password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('newPassword')}
                            className="text-gray-400 hover:text-blue-500 focus:outline-none focus:text-blue-500 transition-colors"
                          >
                            {showPasswords.newPassword ? (
                              <FiEyeOff className="h-5 w-5" />
                            ) : (
                              <FiEye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {passwordForm.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1">
                            <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {passwordStrength === 0 && 'Use 8+ characters with a mix of letters, numbers & symbols'}
                            {passwordStrength === 1 && 'Password is weak'}
                            {passwordStrength === 2 && 'Password is medium'}
                            {passwordStrength === 3 && 'Password is strong'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCheckCircle className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type={showPasswords.confirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="block w-full pl-10 pr-12 py-2.5 text-sm border border-gray-300 rounded-lg 
                            bg-gray-50 focus:bg-white hover:bg-gray-50/80
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                            transition-all duration-200"
                          placeholder="Confirm your new password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                            className="text-gray-400 hover:text-blue-500 focus:outline-none focus:text-blue-500 transition-colors"
                          >
                            {showPasswords.confirmPassword ? (
                              <FiEyeOff className="h-5 w-5" />
                            ) : (
                              <FiEye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleUpdatePassword}
                        disabled={isUpdatingPassword}
                        className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                          isUpdatingPassword 
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isUpdatingPassword ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                            Updating...
                          </div>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-6">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-50 rounded-full">
                      <FiTrash2 className="w-4 h-4 text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
                      <p className="text-sm text-gray-500">Download a copy of your data</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      Export
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-red-600">Delete Account</h3>
                      <p className="text-sm text-red-500">Permanently delete your account and all data</p>
                    </div>
                    <button
                      onClick={() => setIsDeleteAccountModalOpen(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-50 rounded-full">
                    <FiStar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Favorite Items</h2>
                </div>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="py-16 px-6"
              >
                <div className="max-w-sm mx-auto text-center">
                  <motion.div 
                    initial={{ scale: 0.8, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.5,
                      ease: "easeOut",
                      delay: 0.1
                    }}
                    className="relative inline-block mb-6"
                  >
                    <div className="absolute inset-0 bg-yellow-100 rounded-full animate-ping opacity-20"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-50 to-yellow-100">
                      <FiStar className="w-8 h-8 text-yellow-500" />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4,
                      ease: "easeOut",
                      delay: 0.2
                    }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No favorites yet
                    </h3>
                    <p className="text-gray-500">
                      Items you mark as favorite will appear here for quick access
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        activities={activities}
        formatTimestamp={formatTimestamp}
        getActivityMessage={getActivityMessage}
      />
      <ProfileInfoModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialData={profileInfo}
        onSave={handleSaveProfileInfo}
      />
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        description={editedDescription}
      />
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryStats={categoryStats}
      />
      <SkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        skills={userSkills}
        onUpdateSkills={handleUpdateSkills}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirmDelete={handleDeleteAccount}
      />
    </>
  )
}
