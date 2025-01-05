'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion'
import { 
  FiEdit2, FiCheckCircle, 
  FiAlertCircle, FiBarChart2, FiPlus, FiTrash2,
  FiCheck, FiTrash, FiEdit3, FiCalendar, FiFlag, FiUser, FiPhone, FiMail,
  FiFolder, FiStar, FiChevronDown, FiFilter, FiSettings, FiCheckSquare, FiList, FiMapPin, FiPieChart, FiTrendingUp,
  FiActivity, FiX, FiSave, FiAward, FiChevronRight, FiBriefcase, FiCommand, FiGrid, FiLock, FiKey, FiEye, FiEyeOff,
  FiCode, FiPenTool, FiTrendingUp as FiTrendingUpIcon, FiSearch, FiType, FiClock, FiArrowRight
} from 'react-icons/fi'
import { useUser } from '@/app/_context/UserContext'
import ProfileInfoModal from './ProfileInfoModal'
import SkillModal from './SkillModal'
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
      setAlertType('error')
      setAlertMessage('This skill already exists')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      return false
    }

    // Check skill length (max 20 characters)
    if (skill.trim().length > 20) {
      setAlertType('error')
      setAlertMessage('Skill name must be less than 20 characters')
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

  // Add state for favorite tasks
  const [favoriteTasks, setFavoriteTasks] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFavoriteTasks, setFilteredFavoriteTasks] = useState([]);

  // Add function to fetch favorite tasks
  const fetchFavoriteTasks = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) throw new Error('Authentication required');

      const response = await axios.get('http://localhost:9000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        const favorites = response.data.filter(task => task.favorite === true);
        setFavoriteTasks(favorites);
      }
    } catch (error) {
      console.error('Error fetching favorite tasks:', error);
      setAlertType('error');
      setAlertMessage('Failed to load favorite tasks');
      setShowAlert(true);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  // Add useEffect to fetch favorite tasks when the favorites tab is active
  useEffect(() => {
    if (activeTab === 'favorites') {
      fetchFavoriteTasks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (favoriteTasks.length > 0) {
      const filtered = favoriteTasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredFavoriteTasks(filtered);
    } else {
      setFilteredFavoriteTasks([]);
    }
  }, [searchQuery, favoriteTasks]);

  // Add toggle favorite function
  const toggleFavorite = async (taskId, currentFavorite) => {
    try {
      console.log('Toggling favorite for task:', taskId, 'Current favorite:', currentFavorite);
      
      const response = await axios.put(`http://localhost:9000/api/tasks/${taskId}`, {
        favorite: !currentFavorite
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.status === 200) {
        // Update the tasks list with the new favorite status
        const updatedTasks = tasks.map(task => 
          task._id === taskId ? { ...task, favorite: !currentFavorite } : task
        );
        setTasks(updatedTasks);

        // Update favorite tasks list
        const updatedFavoriteTasks = currentFavorite
          ? favoriteTasks.filter(task => task._id !== taskId)
          : [...favoriteTasks, updatedTasks.find(task => task._id === taskId)];
        setFavoriteTasks(updatedFavoriteTasks);

        // Show success message
        setAlertType('success');
        setAlertMessage(currentFavorite ? 'Task removed from favorites' : 'Task added to favorites');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setAlertType('error');
      setAlertMessage('Failed to update favorite status');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

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
      fullName: userName || 'John Doe',
      country: userLocation || 'Casablanca, Morocco',
      languages: userLanguages || '',
      phone: userPhone || '',
      email: userEmail || 'john.doe@example.com'
    }))
  }, [userName, userLocation, userLanguages, userPhone, userEmail])

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

  const handleSaveProfileInfo = (newInfo) => {
    setProfileInfo(newInfo)
    setShowSuccess(true)
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
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

  // Navigation items with unique colors
  const navItems = [
    { id: 'overview', label: 'Overview', icon: FiUser, gradient: 'from-green-600 to-green-500' },
    { id: 'favorites', label: 'Favorites', icon: FiStar, gradient: 'from-yellow-500 to-orange-500' },
    { id: 'settings', label: 'Settings', icon: FiSettings, gradient: 'from-purple-600 to-purple-500' }
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

  // Add helper function for calculating days left
  const calculateDaysLeft = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Add function to get category icon
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'development':
        return <FiCode className="w-4 h-4" />;
      case 'design':
        return <FiPenTool className="w-4 h-4" />;
      case 'marketing':
        return <FiTrendingUpIcon className="w-4 h-4" />;
      case 'research':
        return <FiSearch className="w-4 h-4" />;
      case 'content':
        return <FiType className="w-4 h-4" />;
      default:
        return <FiFolder className="w-4 h-4" />;
    }
  };

  // Add helper function to format date
  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
      <motion.div 
        className="flex gap-3 bg-white p-2 rounded-xl shadow-sm mx-auto mb-8 w-fit"
        layout
      >
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex items-center gap-3 px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-lg`}
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${
                activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              <span>{item.label}</span>
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Profile Info Column */}
            <div className="col-span-12 lg:col-span-4">
              {/* Profile Info Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 max-h-[calc(340vh-13rem)] max-w-full min-h-[calc(98vh-13rem)] min-w-full">
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
              <div className="bg-white rounded-lg shadow-sm p-6 min-h-[calc(50vh-8rem)] max-h-[calc(100vh-8rem)] max-w-full">
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
              <div className="bg-white rounded-lg shadow-sm p-6 min-h-[calc(50vh-8rem)] max-h-[calc(100vh-8rem)] max-w-full">
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

        {activeTab === 'favorites' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-50 rounded-full">
                      <FiStar className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Favorite Tasks</h2>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search favorite tasks..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              
              {isLoadingFavorites ? (
                <div className="py-8">
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ) : filteredFavoriteTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1400px] mx-auto px-4 py-6">
                  {filteredFavoriteTasks.map((task) => (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group relative p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50/50"
                    >
                      {/* Priority Indicator */}
                      <div className={`absolute top-0 right-0 w-16 h-1 rounded-tr-xl ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      
                      {/* Task Header */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1 mr-4">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Days Left Badge */}
                            {task.dueDate && task.status !== 'completed' && (
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                calculateDaysLeft(task.dueDate) < 0
                                  ? 'bg-red-100 text-red-700'  // Overdue
                                  : calculateDaysLeft(task.dueDate) === 0
                                  ? 'bg-orange-100 text-orange-700'  // Due today
                                  : calculateDaysLeft(task.dueDate) <= 3
                                  ? 'bg-yellow-100 text-yellow-700'  // Due soon
                                  : 'bg-blue-50 text-blue-700'  // Due later
                              }`}>
                                <FiClock className="w-3.5 h-3.5" />
                                {calculateDaysLeft(task.dueDate) < 0
                                  ? `${Math.abs(calculateDaysLeft(task.dueDate))} days overdue`
                                  : calculateDaysLeft(task.dueDate) === 0
                                  ? 'Due today'
                                  : calculateDaysLeft(task.dueDate) === 1
                                  ? '1 day left'
                                  : `${calculateDaysLeft(task.dueDate)} days left`}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Star clicked for task:', task._id);
                                toggleFavorite(task._id, task.favorite);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer z-10"
                            >
                              <FiStar 
                                className={`w-5 h-5 ${task.favorite ? 'text-yellow-400 fill-current' : 'text-gray-400'} transition-colors hover:text-yellow-400`}
                              />
                            </button>
                          </div>
                        </div>
                    
                      </div>

                      {/* Task Description and Date Range Row */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        {/* Task Description */}
                        <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                          {task.description || 'No description provided'}
                        </p>

                        {/* Date Range Badge */}
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap flex-shrink-0">
                          <FiCalendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <div className="flex items-center gap-1.5">
                            <span>{formatDateShort(task.startDate)}</span>
                            <FiArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{formatDateShort(task.dueDate)}</span>
                          </div>
                        </span>
                      </div>

                      {/* Task Details */}
                      <div className="space-y-3">
                        {/* Status and Priority Row */}
                        <div className="flex items-start justify-between">
                          {/* Status and Category Column */}
                          <div className="flex flex-col gap-2">
                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                              task.status === 'in progress' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'in progress' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              {task.status === 'completed' ? 'Done' :
                               task.status === 'in progress' ? 'In Progress' :
                               'To Do'}
                            </span>

                          </div>

                          {/* Priority and Category Badges */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                              ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </span>
                            
                            {/* Category Badge */}
                            {task.category && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {getCategoryIcon(task.category)}
                                {task.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/[0.03] to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
                    </motion.div>
                  ))}
                </div>
              ) : searchQuery ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center py-16"
                >
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
                    <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg shadow-amber-100/50">
                      <FiSearch className="w-8 h-8 text-amber-500" />
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
                    className="text-center"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No matching tasks found
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      Try adjusting your search terms or check your spelling
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
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
                      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg shadow-yellow-100/50">
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No favorites yet
                      </h3>
                      <p className="text-gray-500">
                        Mark tasks as favorite in your dashboard to see them here
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
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
      </div>

      {/* Modals */}
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
