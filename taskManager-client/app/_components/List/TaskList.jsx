'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCalendar, FiMoreVertical, FiTrash2, FiEdit2, FiCheckSquare, FiMoreHorizontal, FiClock, FiTag, FiCheckCircle, FiEye, FiAlertCircle, FiFilter, FiFlag, FiX, FiList } from 'react-icons/fi'
import { BsClockHistory } from 'react-icons/bs'
import TaskDetailsModal from '../Shared/TaskDetailsModal'
import NoSearchResults from '../Shared/NoSearchResults'
import NoTasks from '../Shared/NoTasks'
import Pagination from '../Shared/Pagination'
import EditTaskModal from '../Shared/EditTaskModal'
import Notification from '../Shared/Notification'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSettings } from '@/app/_context/SettingsContext'
import toast from 'react-hot-toast'
import useNotifications from '@/app/_hooks/useNotifications'

const ITEMS_PER_PAGE = 10

const TaskSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(3)].map((_, index) => (
      <div key={index} className="bg-white rounded-xl p-4 mb-3 border border-gray-100/60 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            {/* Checkbox skeleton */}
            <div className="w-5 h-5 rounded bg-gray-200" />
            
            {/* Title skeleton */}
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
          
          {/* Menu button skeleton */}
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2 ml-8 mb-3">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex items-center space-x-2 ml-8">
          <div className="h-6 w-20 rounded-full bg-gray-200" />
          <div className="h-6 w-24 rounded-full bg-gray-200" />
          <div className="h-6 w-16 rounded-full bg-gray-200" />
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    ))}
  </div>
)

const TaskList = ({ 
  searchQuery, 
  filters = { priority: 'all', status: 'all', category: 'all' },
  onClearSearch, 
  onDeleteTasks, 
  onUpdateTask, 
  onFilterChange
}) => {
  const [tasks, setTasks] = useState([])
  const { settings } = useSettings()
  const { addNotification } = useNotifications()
  const [selectedTask, setSelectedTask] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [isLoading, setIsLoading] = useState(true)
  const menuRef = useRef(null)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const token = Cookies.get('token')
        if (!token) {
          console.log('No token found')
          setIsLoading(false)
          return
        }

        const response = await axios.get('http://localhost:9000/api/tasks', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        })
        
        console.log('Raw API response:', response);
        let tasksData;
        
        // Handle different response structures
        if (response.data && response.data.state) {
          tasksData = response.data.tasks || [];
          console.log('Tasks from state:', tasksData);
        } else {
          tasksData = Array.isArray(response.data) ? response.data : [];
          console.log('Tasks from direct array:', tasksData);
        }
        
        console.log('Tasks before filtering:', tasksData);
        
        // Set all tasks without filtering initially
        setTasks(tasksData);
        
      } catch (error) {
        console.error('Error fetching tasks:', error);
        if (error.code === 'ECONNABORTED') {
          setNotification({
            show: true,
            type: 'error',
            message: 'Request timed out. Please check if the server is running.'
          });
        } else if (error.response) {
          setNotification({
            show: true,
            type: 'error',
            message: `Server error: ${error.response.data.message || 'Unknown error'}`
          });
        } else if (error.request) {
          setNotification({
            show: true,
            type: 'error',
            message: 'Could not connect to server. Please check if the server is running.'
          });
        } else {
          setNotification({
            show: true,
            type: 'error',
            message: 'An unexpected error occurred.'
          });
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Parse the ISO date string
      const date = new Date(dateString);
      if (!(date instanceof Date) || isNaN(date)) return '';
      
      // Format the date
      const options = { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const calculateDaysLeft = (dueDate) => {
    if (!dueDate) return null;
    try {
      const end = new Date(dueDate);
      const now = new Date();
      
      if (!(end instanceof Date) || isNaN(end)) return null;
      
      // Set both dates to start of day for accurate day calculation
      end.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error calculating days left:', error);
      return null;
    }
  };

  const calculateTimeRemaining = (startDate, dueDate) => {
    if (!startDate || !dueDate) return null;
    try {
      // Parse dates
      const start = new Date(startDate);
      const end = new Date(dueDate);

      // Validate dates
      if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end)) {
        return null;
      }

      // Calculate total duration
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return null;
    }
  };

  const handleMenuClick = (taskId, e) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === taskId ? null : taskId)
  }

  const handleMenuItemClick = async (action, task, e) => {
    e.stopPropagation();
    setOpenMenuId(null);

    switch (action) {
      case 'view':
        setSelectedTask(task);
        break;
      case 'edit':
        setTaskToEdit(task);
        setShowEditModal(true);
        break;
      case 'delete':
        setTaskToDelete(task);
        setShowDeleteModal(true);
        break;
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const token = Cookies.get('token');
      await axios.delete(`http://localhost:9000/api/tasks/${taskToDelete._id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Remove the task from the local state
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskToDelete._id));
      
      // Close the delete modal
      setShowDeleteModal(false);
      setTaskToDelete(null);

      // Add notification for task deletion
      addNotification({
        title: 'Task Deleted',
        message: `Task "${taskToDelete.title}" has been deleted successfully`,
        type: 'task'
      })

      // Show success toast notification
      toast.success('Task deleted successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#FFFFFF',
          padding: '16px',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#10B981',
        },
      });

    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Show error toast notification
      toast.error(error.response?.data?.message || 'Failed to delete task', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          padding: '16px',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#EF4444',
        },
      });
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleEditSave = async (updatedTask) => {
    try {
      // Format dates
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) ? date.toISOString() : null;
      };

      const startDate = formatDate(updatedTask.startDate);
      const endDate = formatDate(updatedTask.endDate);

      if (!startDate || !endDate) {
        throw new Error('Invalid date format');
      }

      // Format data for API submission
      const formattedData = {
        ...updatedTask,
        startDate,
        endDate,
        dueDate: endDate // Set dueDate to be the same as endDate
      };

      // Call the parent component's update function
      await onUpdateTask(formattedData);
      
      // Update the local state
      setTasks(prevTasks => prevTasks.map(task => 
        task._id === updatedTask._id ? { ...task, ...formattedData } : task
      ));
      
      // Close modal
      setShowEditModal(false);
      setTaskToEdit(null);

      // Add notification for task update
      addNotification({
        title: 'Task Updated',
        message: `Task "${updatedTask.title || 'Unknown'}" has been updated successfully`,
        type: 'task'
      })

      // Show success toast notification
      toast.success('Task updated successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#FFFFFF',
          padding: '16px',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#10B981',
        },
      });
    } catch (error) {
      console.error('Error updating task:', error);
      
      // Show error toast notification
      toast.error(error.response?.data?.message || 'Failed to update task', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          padding: '16px',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#EF4444',
        },
      });
    }
  }

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
  }

  const filteredTasks = tasks.filter(task => {
    // Debug logging
    console.log('Filtering task:', {
      id: task._id,
      title: task.title,
      status: task.status,
      searchQuery,
      filters
    });

    // First check if task status is valid (completed or in progress)
    const validStatus = task.status?.toLowerCase().trim();
    console.log('Task status check:', {
      taskId: task._id,
      originalStatus: task.status,
      normalizedStatus: validStatus,
      isValid: validStatus === 'done' || validStatus === 'in progress' || validStatus.includes('progress')
    });

    if (validStatus !== 'done' && validStatus !== 'in progress' && !validStatus.includes('progress')) {
      return false;
    }

    // Search query filter
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply additional filters only if they are not set to 'all'
    const matchesPriority = filters.priority === 'all' || 
      (task.priority && task.priority.toLowerCase() === filters.priority.toLowerCase());
    
    const matchesCategory = filters.category === 'all' || 
      (task.category && task.category.toLowerCase() === filters.category.toLowerCase());

    const matchesStatus = filters.status === 'all' || 
      validStatus === filters.status.toLowerCase();

    // Debug log the filter results
    console.log('Filter results:', {
      taskId: task._id,
      matchesSearch,
      matchesPriority,
      matchesCategory,
      matchesStatus
    });

    return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
  });

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

  const allTasks = tasks
  const hasNoTasks = allTasks.length === 0
  const hasSearchResults = filteredTasks.length > 0

  return (
    <div className="w-full">
      {isLoading ? (
        <TaskSkeleton />
      ) : !filteredTasks.length && searchQuery ? (
        <NoSearchResults query={searchQuery} onClear={onClearSearch} />
      ) : !tasks.length || !filteredTasks.length ? (
        <NoTasks />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Table Header */}
          {!hasNoTasks && (
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-blue-50 text-sm font-semibold text-blue-900 border-b border-blue-100">
              <div className="col-span-3 flex items-center">
                <FiList className="w-4 h-4 mr-2 text-blue-500" />
                <span>Task</span>
              </div>
              {settings.visibleColumns.category && (
                <div className="col-span-2 flex items-center justify-center">
                  <FiTag className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Category</span>
                </div>
              )}
              {settings.visibleColumns.dueDate && (
                <div className="col-span-2 flex items-center justify-center">
                  <FiCalendar className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Date Range</span>
                </div>
              )}
              {settings.visibleColumns.timeRemaining && (
                <div className="col-span-2 flex flex-col justify-center items-center text-sm">
                  <FiClock className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Time Remaining</span>
                </div>
              )}
              {settings.visibleColumns.priority && (
                <div className="col-span-1 flex items-center justify-center">
                  <FiFlag className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Priority</span>
                </div>
              )}
              {settings.visibleColumns.status && (
                <div className="col-span-1 flex items-center justify-center">
                  <FiCheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Status</span>
                </div>
              )}
              <div className="col-span-1 flex items-center justify-center">
                <span>Actions</span>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {hasNoTasks ? (
                <NoTasks />
              ) : searchQuery && filteredTasks.length === 0 ? (
                <NoSearchResults query={searchQuery} onClear={onClearSearch} />
              ) : filteredTasks.length === 0 ? (
                <NoTasks />
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedTasks.map((task, index) => (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors items-center group relative"
                    >
                      {/* Task Title */}
                      <div className="col-span-3">
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="text-left group flex items-start space-x-3 w-full"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-gray-500 truncate mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Category */}
                      {settings.visibleColumns.category && (
                        <div className="col-span-2 flex justify-center">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center justify-center min-w-[90px] px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {task.category}
                          </motion.span>
                        </div>
                      )}

                      {/* Task Dates */}
                      {settings.visibleColumns.dueDate && (
                        <div className="col-span-2 flex flex-col justify-center items-center text-sm">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center justify-center min-w-[140px] px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200"
                          >
                            <FiCalendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            <span className="whitespace-nowrap">
                              {task.startDate || task.dueDate ? (
                                <>
                                  <span>{formatDate(task.startDate)}</span>
                                  <span className="mx-1">-</span>
                                  <span>{formatDate(task.dueDate)}</span>
                                </>
                              ) : (
                                'No dates set'
                              )}
                            </span>
                          </motion.div>
                        </div>
                      )}

                      {/* Time Remaining */}
                      {settings.visibleColumns.timeRemaining && task.dueDate && (
                        <div className="col-span-2 flex justify-center items-center text-sm">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center justify-center min-w-[120px] px-3 py-1.5 rounded-full text-xs font-medium
                              ${calculateTimeRemaining(task.startDate, task.dueDate) <= 0 
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : calculateTimeRemaining(task.startDate, task.dueDate) <= 7 
                                  ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                  : 'bg-green-50 text-green-700 border border-green-100'
                              }`}
                          >
                            <BsClockHistory className="w-3.5 h-3.5 mr-1.5" />
                            {calculateTimeRemaining(task.startDate, task.dueDate) <= 0 
                              ? "Overdue"
                              : `${calculateTimeRemaining(task.startDate, task.dueDate)} ${calculateTimeRemaining(task.startDate, task.dueDate) === 1 ? 'day' : 'days'} left`
                            }
                          </motion.div>
                        </div>
                      )}

                      {/* Priority */}
                      {settings.visibleColumns.priority && (
                        <div className="col-span-1 flex items-center justify-center">
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium
                              ${task.priority?.toLowerCase() === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                                task.priority?.toLowerCase() === 'medium' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                'bg-blue-50 text-blue-700 border border-blue-100'}`}
                          >
                            {task.priority || 'Low'}
                          </motion.span>
                        </div>
                      )}

                      {/* Status */}
                      {settings.visibleColumns.status && (
                        <div className="col-span-1 flex justify-center">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center justify-center min-w-[90px] px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                              ${task.status?.toLowerCase().trim() === 'done' ? 'bg-green-50 text-green-700 border border-green-100' :
                                task.status?.toLowerCase().includes('progress') ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                'bg-blue-50 text-blue-700 border border-blue-100'}`}
                          >
                            {task.status?.toLowerCase().trim() === 'done' ? 'Done' :
                             task.status?.toLowerCase().includes('progress') ? 'In Progress' :
                             task.status || 'To Do'}
                          </motion.span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="col-span-1 flex justify-center relative" ref={menuRef}>
                        <motion.button
                          onClick={(e) => handleMenuClick(task._id, e)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: openMenuId === task._id ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <FiMoreHorizontal className="w-4 h-4 text-gray-500" />
                          </motion.div>
                        </motion.button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {openMenuId === task._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
                            >
                              <button
                                onClick={(e) => handleMenuItemClick('view', task, e)}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <FiEye className="w-4 h-4 mr-2" />
                                View Details
                              </button>
                              <button
                                onClick={(e) => handleMenuItemClick('edit', task, e)}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <FiEdit2 className="w-4 h-4 mr-2" />
                                Edit Task
                              </button>
                              <button
                                onClick={(e) => handleMenuItemClick('delete', task, e)}
                                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                              >
                                <FiTrash2 className="w-4 h-4 mr-2" />
                                Delete Task
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {filteredTasks.length > ITEMS_PER_PAGE && (
            <div className="mt-4 px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                color="blue"
              />
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {showEditModal && (
        <EditTaskModal
          task={taskToEdit}
          onClose={() => {
            setShowEditModal(false)
            setTaskToEdit(null)
          }}
          onSubmit={handleEditSave}
          onSuccess={() => {
            setShowEditModal(false)
            setTaskToEdit(null)
            setNotification({
              show: true,
              type: 'success',
              message: 'Task updated successfully'
            })
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[100]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
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
  )
}

export default TaskList
