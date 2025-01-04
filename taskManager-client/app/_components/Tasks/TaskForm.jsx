'use client';
import { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiFlag, FiEdit3, FiAlignLeft, FiChevronDown, FiTag, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import Cookies from 'js-cookie';
import Notification from '../Shared/Notification';
import { AnimatePresence, motion } from 'framer-motion';
import useNotifications from '@/app/_hooks/useNotifications';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export function TaskForm({ onTaskAdded }) {
  const { addNotification } = useNotifications();
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',  
    priority: 'medium',
    category: 'Development',
    customCategory: '',
    status: 'To Do',
    manual: true,
    validation: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const priorityRef = useRef(null);
  const categoryRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (priorityRef.current && !priorityRef.current.contains(event.target)) {
        setShowPriority(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategory(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('You must be logged in to create tasks');
      }

      // Validate required fields
      if (!taskData.title || !taskData.dueDate) {
        throw new Error('Please fill in all required fields');
      }

      // Validate category
      if (taskData.category === 'Other' && !taskData.customCategory.trim()) {
        throw new Error('Please specify a custom category');
      }

      const submissionData = {
        ...taskData,
        startDate: taskData.startDate || new Date().toISOString(),
        dueDate: new Date(taskData.dueDate).toISOString(),
        status: 'To Do',
        manual: true,
        validation: false,
        // Use custom category if 'Other' is selected
        category: taskData.category === 'Other' ? taskData.customCategory : taskData.category
      };

      // Send data to the backend API using axios
      const response = await api.post('/tasks', submissionData);

      if (response.data.state === false) {
        throw new Error(response.data.message || 'Failed to create task');
      }

      // Show immediate UI notification
      setNotification({
        show: true,
        type: 'success',
        message: `Task "${taskData.title}" has been created successfully!`
      });

      // Also send to backend notification system
      addNotification({
        type: 'success',
        title: 'Task Created Successfully',
        message: `Task "${taskData.title}" has been created with ${taskData.priority} priority in the ${taskData.category} category`,
        timestamp: new Date().toISOString()
      });

      // Small delay to ensure notification is visible
      setTimeout(() => {
        // Hide the notification
        setNotification({ show: false, type: '', message: '' });
        
        // Add the new task to the list and trigger redirection
        if (response.data.task) {
          onTaskAdded(response.data.task);
          
          // Reset form
          setTaskData({
            title: '',
            description: '',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            priority: 'medium',
            category: 'Development',
            customCategory: '',
            status: 'To Do',
            manual: true,
            validation: false
          });
        } else {
          throw new Error('No task data received from server');
        }
      }, 2000); // Increased delay to 2 seconds for better visibility
    } catch (err) {
      console.error('Error creating task:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while creating the task';
      
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Task Creation Failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    if (category === 'Other') {
      setTaskData({ ...taskData, category: 'Other' });
    } else {
      setTaskData({ ...taskData, category, customCategory: '' });
    }
    setShowCategory(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      Design: 'text-purple-500',
      Development: 'text-blue-500',
      Backend: 'text-green-500',
      Frontend: 'text-pink-500',
      Testing: 'text-yellow-600',
      Security: 'text-red-500',
      DevOps: 'text-indigo-500',
      Database: 'text-orange-500',
      API: 'text-cyan-500',
      Documentation: 'text-teal-500',
      Research: 'text-violet-500',
      Maintenance: 'text-gray-500',
      Other: 'text-gray-400'
    };
    return colors[category] || colors.Other;
  };

  const getCategoryLabel = (category) => {
    return category;
  };

  const handlePrioritySelect = (priority) => {
    setTaskData({ ...taskData, priority });
    setShowPriority(false);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-500',
      medium: 'text-yellow-500',
      high: 'text-red-500'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Low Priority',
      medium: 'Medium Priority',
      high: 'High Priority'
    };
    return labels[priority] || labels.medium;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Form Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FiEdit3 className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Create New Task
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fill in the details below to create a new task
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Notification */}
          <Notification
            show={notification.show}
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification({ show: false, type: '', message: '' })}
          />

          {/* Priority and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority Dropdown */}
            <div className="space-y-1" ref={priorityRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPriority(!showPriority)}
                  className="w-full bg-white dark:bg-gray-700 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                >
                  <div className="flex items-center">
                    <FiFlag className={`w-5 h-5 mr-2 ${getPriorityColor(taskData.priority)}`} />
                    <span className="text-gray-900 dark:text-white">{getPriorityLabel(taskData.priority)}</span>
                    <FiChevronDown className="w-5 h-5 ml-auto text-gray-400" />
                  </div>
                </button>

                {showPriority && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-lg border border-gray-200 dark:border-gray-600">
                    {['low', 'medium', 'high'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => handlePrioritySelect(priority)}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2"
                      >
                        <FiFlag className={`w-5 h-5 ${getPriorityColor(priority)}`} />
                        <span className="text-gray-900 dark:text-white">{getPriorityLabel(priority)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1" ref={categoryRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategory(!showCategory)}
                  className="w-full bg-white dark:bg-gray-700 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                >
                  <div className="flex items-center">
                    <FiTag className={`w-5 h-5 mr-2 ${getCategoryColor(taskData.category)}`} />
                    <span className="text-gray-900 dark:text-white">
                      {taskData.category === 'Other' && taskData.customCategory 
                        ? taskData.customCategory 
                        : getCategoryLabel(taskData.category)}
                    </span>
                    <FiChevronDown className="w-5 h-5 ml-auto text-gray-400" />
                  </div>
                </button>

                {showCategory && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
                    {['Design', 'Development', 'Backend', 'Frontend', 'Testing', 'Security', 'DevOps', 'Database', 'API', 'Documentation', 'Research', 'Maintenance', 'Other'].map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2"
                      >
                        <FiTag className={`w-5 h-5 ${getCategoryColor(category)}`} />
                        <span className="text-gray-900 dark:text-white">{getCategoryLabel(category)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Task Title *
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiEdit3 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                className="block w-full pl-10 pr-4 py-2.5 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-gray-700 dark:placeholder-gray-400 outline-none"
                placeholder="Enter task title"
                required
              />
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <FiAlignLeft className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="description"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                rows="4"
                className="block w-full pl-10 pr-4 py-2.5 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-gray-700 dark:placeholder-gray-400 outline-none"
                placeholder="Enter task description"
              />
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div className="space-y-1">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="startDate"
                  value={taskData.startDate}
                  onChange={(e) => setTaskData({ ...taskData, startDate: e.target.value })}
                  className="block w-full pl-10 pr-4 py-2.5 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-gray-700 outline-none"
                  required
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dueDate"
                  value={taskData.dueDate}
                  onChange={(e) => {
                    const newDueDate = e.target.value;
                    if (newDueDate && taskData.startDate && new Date(newDueDate) < new Date(taskData.startDate)) {
                      setError('Due date cannot be earlier than start date');
                    } else {
                      setError('');
                      setTaskData({ ...taskData, dueDate: newDueDate });
                    }
                  }}
                  min={taskData.startDate} // This prevents selecting dates before start date in the date picker
                  className="block w-full pl-10 pr-4 py-2.5 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-gray-700 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Custom Category Input (shows only when 'Other' is selected) */}
          {taskData.category === 'Other' && (
            <div className="space-y-1">
              <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Category *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="customCategory"
                  value={taskData.customCategory}
                  onChange={(e) => setTaskData({ ...taskData, customCategory: e.target.value })}
                  className="block w-full pl-10 pr-4 py-2.5 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-gray-700 dark:placeholder-gray-400 outline-none"
                  placeholder="Enter custom category"
                  required
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Task...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification({ ...notification, show: false })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
