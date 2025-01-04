'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiChevronDown, FiCalendar, FiFlag, FiEdit3, FiAlignLeft, FiTag } from 'react-icons/fi'
import { createPortal } from 'react-dom'
import useNotifications from '@/app/_hooks/useNotifications'

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"
};

const EditTaskModal = ({ task, onClose, onSubmit, onSuccess }) => {
  const { addNotification } = useNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('EditTaskModal - Received task:', task);
  }, [task]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const mapStatusToInternal = (apiStatus) => {
    console.log('EditTaskModal - Mapping API status:', apiStatus);
    if (!apiStatus) return 'todo';
    switch(apiStatus.toLowerCase()) {
      case 'in progress':
      case 'in-progress':
      case 'inprogress':
        return 'inProgress';
      case 'done':
      case 'completed':
        return 'done';
      case 'todo':
      case 'to do':
      case 'new':
        return 'todo';
      default:
        return 'todo';
    }
  };

  const [formData, setFormData] = useState(() => {
    const mappedStatus = mapStatusToInternal(task.status);
    console.log('EditTaskModal - Initial form data:', {
      originalStatus: task.status,
      mappedStatus,
      task
    });
    
    return {
      title: task.title || '',
      description: task.description || '',
      status: mappedStatus,
      category: task.category || 'Development',
      customCategory: task.customCategory || '',
      priority: task.priority || 'medium',
      startDate: task.startDate ? formatDateForInput(task.startDate) : '',
      endDate: task.endDate ? formatDateForInput(task.endDate) : '',
      labels: task.labels || []
    };
  })
  const [error, setError] = useState('')
  const [showDropdowns, setShowDropdowns] = useState({
    status: false,
    category: false,
    priority: false
  })

  const statusRef = useRef(null)
  const categoryRef = useRef(null)
  const priorityRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setShowDropdowns(prev => ({ ...prev, status: false }));
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowDropdowns(prev => ({ ...prev, category: false }));
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target)) {
        setShowDropdowns(prev => ({ ...prev, priority: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields to ensure proper format and validation
    if (name === 'startDate' || name === 'endDate') {
      const newDates = {
        ...formData,
        [name]: value
      };
      
      // If both dates are set, validate them
      if (newDates.startDate && newDates.endDate) {
        const startDate = new Date(newDates.startDate);
        const endDate = new Date(newDates.endDate);
        
        if (endDate < startDate) {
          setError('End date cannot be earlier than start date');
          return;
        }
      }
      
      setError(''); // Clear error if dates are valid
      setFormData(newDates);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError('Invalid date format');
        return;
      }

      if (endDate < startDate) {
        setError('End date cannot be earlier than start date');
        return;
      }

      // Include the task ID and format dates in the form data
      const taskData = {
        ...formData,
        _id: task._id,
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      
      console.log('EditTaskModal - Submitting task data:', taskData);
      
      const updatedTask = await onSubmit(taskData);
      console.log('EditTaskModal - Task update response:', updatedTask);
      
      onClose();
      if (onSuccess) {
        onSuccess(updatedTask);
      }
    } catch (error) {
      console.error('EditTaskModal - Error submitting task:', error);
      setError(error.message || 'Failed to update task');
    }
  };

  const toggleDropdown = (name) => {
    setShowDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo':
        return 'To Do'
      case 'inProgress':
        return 'In Progress'
      case 'done':
        return 'Done'
      default:
        return 'Select Status'
    }
  }

  return mounted ? createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] mx-auto overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b bg-gradient-to-r from-green-50 to-white">
          <div className="px-5 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2.5 rounded-lg shadow-sm">
                  <FiEdit3 className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                  {task._id ? 'Edit Task' : 'Create Task'}
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center"
            >
              <FiX className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1.5">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiEdit3 className="w-4 h-4 mr-2 text-gray-400" />
                  Title
                </label>
                <span className="text-xs text-gray-500">{formData.title.length}/100</span>
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    handleInputChange(e);
                  }
                }}
                className="block w-full px-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                maxLength={100}
                required
              />
            </motion.div>

            {/* Description */}
            <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1.5">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiAlignLeft className="w-4 h-4 mr-2 text-gray-400" />
                  Description
                </label>
                <span className="text-xs text-gray-500">{formData.description.length}/500</span>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    handleInputChange(e);
                  }
                }}
                rows="4"
                className="block w-full px-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none text-sm"
                maxLength={500}
              />
            </motion.div>

            {/* Status, Priority, and Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Status */}
              <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <FiFlag className="w-4 h-4 mr-2 text-gray-400" />
                  Status
                </label>
                <div className="relative" ref={statusRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('status')}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-left flex items-center justify-between transition-all text-sm"
                  >
                    <span>{getStatusText(formData.status)}</span>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${showDropdowns.status ? 'transform rotate-180' : ''}`} />
                  </button>
                  {showDropdowns.status && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                    >
                      {['todo', 'inProgress', 'done'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, status }));
                            toggleDropdown('status');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm"
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            status === 'todo' ? 'bg-blue-500' :
                            status === 'inProgress' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <span>{getStatusText(status)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Priority */}
              <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <FiFlag className="w-4 h-4 mr-2 text-gray-400" />
                  Priority
                </label>
                <div className="relative" ref={priorityRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('priority')}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-left flex items-center justify-between transition-all text-sm"
                  >
                    <span className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        formData.priority === 'high' 
                          ? 'bg-red-500' 
                          : formData.priority === 'medium' 
                            ? 'bg-yellow-500' 
                            : 'bg-blue-500'
                      }`} />
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                    </span>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${showDropdowns.priority ? 'transform rotate-180' : ''}`} />
                  </button>
                  {showDropdowns.priority && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                    >
                      {['low', 'medium', 'high'].map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, priority }));
                            toggleDropdown('priority');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm"
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            priority === 'high' 
                              ? 'bg-red-500' 
                              : priority === 'medium' 
                                ? 'bg-yellow-500' 
                                : 'bg-blue-500'
                          }`} />
                          <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Category */}
              <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <FiTag className="w-4 h-4 mr-2 text-gray-400" />
                  Category
                </label>
                <div className="relative" ref={categoryRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('category')}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-left flex items-center justify-between transition-all text-sm"
                  >
                    <span>{formData.category}</span>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${showDropdowns.category ? 'transform rotate-180' : ''}`} />
                  </button>
                  {showDropdowns.category && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                    >
                      {[
                        'Development',
                        'Design',
                        'Marketing',
                        'Sales',
                        'Backend',
                        'Frontend',
                        'Database',
                        'DevOps',
                        'Setup',
                        'Documentation',
                        'Testing',
                        'Security',
                        'Performance',
                        'UI/UX',
                        'Research',
                        'Planning',
                        'Maintenance',
                        'Other'
                      ].map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              category,
                              customCategory: category === 'Other' ? prev.customCategory : ''
                            }));
                            toggleDropdown('category');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                        >
                          {category}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
                {formData.category === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Custom Category</span>
                      <span className="text-xs text-gray-500">{formData.customCategory.length}/30</span>
                    </div>
                    <input
                      type="text"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={(e) => {
                        if (e.target.value.length <= 30) {
                          handleInputChange(e);
                        }
                      }}
                      placeholder="Enter custom category..."
                      className="block w-full px-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                      maxLength={30}
                      required
                    />
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                  required
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate} // Prevent selecting dates before start date
                  className="block w-full px-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                  required
                />
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="w-full sm:w-28 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full sm:w-28 px-5 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>Save</span>
                <motion.svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ scale: 1.1 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  ) : null;
}

export default EditTaskModal
