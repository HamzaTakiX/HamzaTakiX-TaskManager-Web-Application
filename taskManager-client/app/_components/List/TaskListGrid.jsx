'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMoreHorizontal, FiCalendar, FiEye, FiEdit2, FiTrash2, FiAlertCircle, FiFilter, FiClock } from 'react-icons/fi'
import { useTheme } from '@/app/_context/ThemeContext'
import TaskDetailsModal from '../Shared/TaskDetailsModal'
import NoSearchResults from '../Shared/NoSearchResults'
import NoTasks from '../Shared/NoTasks'
import EditTaskModal from '../Shared/EditTaskModal'
import Pagination from '../Shared/Pagination'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSettings } from '@/app/_context/SettingsContext'
import toast, { Toaster } from 'react-hot-toast'
import useNotifications from '@/app/_hooks/useNotifications'

const ITEMS_PER_PAGE = 10

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, taskTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex justify-center items-center z-[100]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full"
      >
        <div className="flex items-center justify-center mb-4 text-red-600">
          <FiAlertCircle className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Delete Task</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Are you sure you want to delete "{taskTitle}"? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const TaskSkeleton = () => (
  <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, index) => (
      <div key={index} className="bg-white rounded-xl p-4 border border-gray-100/60 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-5 h-5 rounded bg-gray-200" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
        </div>
        <div className="space-y-2 ml-8 mb-3">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="flex items-center space-x-2 ml-8">
          <div className="h-6 w-20 rounded-full bg-gray-200" />
          <div className="h-6 w-24 rounded-full bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
)

export default function TaskListGrid({ 
  searchQuery, 
  filters = { priority: 'all', status: 'all', category: 'all' },
  onClearSearch, 
  onDeleteTasks, 
  onUpdateTask,
  onFilterChange 
}) {
  const { theme, themes } = useTheme()
  const { settings } = useSettings()
  const { addNotification } = useNotifications()
  const [tasks, setTasks] = useState([])
  const [hoveredTaskId, setHoveredTaskId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const menuRef = useRef(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const token = Cookies.get('token') || localStorage.getItem('token')
        if (!token) {
          console.error('No token found')
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
        
        if (response.data && response.data.state) {
          setTasks(response.data.tasks || [])
        } else {
          setTasks(Array.isArray(response.data) ? response.data : [])
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch tasks', {
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
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredTasks = tasks.filter(task => {
    // First check if task status is valid
    const validStatus = task.status?.toLowerCase().trim();
    if (validStatus !== 'done' && validStatus !== 'in progress' && !validStatus.includes('progress')) {
      return false;
    }

    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesCategory = filters.category === 'all' || task.category === filters.category;
    const matchesStatus = filters.status === 'all' || task.status === filters.status;

    return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
  })

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)

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

  const getStatusColor = (status) => {
    // Convert to lowercase and trim for comparison
    const normalizedStatus = String(status).toLowerCase().trim();
    
    if (normalizedStatus.includes('progress') || normalizedStatus === 'in progress' || normalizedStatus === 'inprogress') {
      return 'bg-[#FEF9C3] text-yellow-800'
    }
    
    switch (normalizedStatus) {
      case 'todo':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'done':
        return 'bg-green-100 text-green-800 border border-green-200'
      default:
        console.log('Unmatched status:', status, 'Normalized:', normalizedStatus);
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getStatusText = (status) => {
    const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '-');
    
    switch (normalizedStatus) {
      case 'todo':
        return 'To Do'
      case 'in-progress':
        return 'In Progress'
      case 'done':
        return 'Done'
      default:
        return status || 'Unknown'
    }
  }

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'design':
        return 'bg-purple-100 text-purple-800 border border-purple-200'
      case 'development':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'backend':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
      case 'frontend':
        return 'bg-pink-100 text-pink-800 border border-pink-200'
      case 'database':
        return 'bg-cyan-100 text-cyan-800 border border-cyan-200'
      case 'devops':
        return 'bg-teal-100 text-teal-800 border border-teal-200'
      case 'setup':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'medium':
        return 'bg-orange-100 text-orange-800 border border-orange-200'
      case 'low':
        return 'bg-green-100 text-green-800 border border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getLabelColor = (type) => {
    switch (type) {
      case 'feature':
        return 'bg-purple-100 text-purple-800'
      case 'bug':
        return 'bg-red-100 text-red-800'
      case 'design':
        return 'bg-indigo-100 text-indigo-800'
      case 'documentation':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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

  const getDaysRemaining = (startDate, dueDate) => {
    if (!startDate || !dueDate) return null;
    try {
      const start = new Date(startDate);
      const end = new Date(dueDate);
      
      if (!(end instanceof Date) || isNaN(end) || !(start instanceof Date) || isNaN(start)) return null;
      
      // Set both dates to start of day for accurate day calculation
      end.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error calculating days left:', error);
      return null;
    }
  };

  const getDaysRemainingText = (days) => {
    if (days === null) return '';
    if (days < 0) return "Time's up";
    if (days === 0) return 'Due today';
    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  };

  const getDaysRemainingColor = (days) => {
    if (days === null) return 'bg-gray-100 text-gray-800 border border-gray-200';
    if (days <= 0) return 'bg-red-100 text-red-800 border border-red-200';
    if (days <= 3) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-green-100 text-green-800 border border-green-200';
  };

  const handleMenuClick = (taskId, event) => {
    event.preventDefault()
    event.stopPropagation()
    setOpenMenuId(openMenuId === taskId ? null : taskId)
  }

  const handleMenuItemClick = (action, task, e) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)
    
    switch(action) {
      case 'view':
        setSelectedTask(task)
        break
      case 'edit':
        setTaskToEdit(task)
        setShowEditModal(true)
        break
      case 'delete':
        setTaskToDelete(task)
        setShowDeleteModal(true)
        break
    }
  }

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      try {
        const token = Cookies.get('token');
        if (!token) {
          toast.error('Authentication token not found', {
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
          return;
        }

        // Use the onDeleteTasks function from props which uses the correct endpoint
        await onDeleteTasks([taskToDelete._id]);
        setShowDeleteModal(false);
        setTaskToDelete(null);
        
        // Add notification for task deletion
        addNotification({
          title: 'Task Deleted',
          message: `Task "${taskToDelete.title}" has been deleted successfully`,
          type: 'task'
        })
        
        // Show success toast notification
        toast.success(`Task "${taskToDelete.title}" deleted successfully!`, {
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
        
        // Refresh the tasks list
        const updatedTasks = tasks.filter(task => task._id !== taskToDelete._id);
        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error deleting task:', error);
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
    }
  };

  const handleEditSave = async (updatedTask) => {
    try {
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
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => 
          task._id === updatedTask._id ? { ...task, ...formattedData } : task
        );
        return updatedTasks;
      });
      
      // Close modal
      setShowEditModal(false);
      setTaskToEdit(null);

      // Add notification for task update
      addNotification({
        title: 'Task Updated',
        message: `Task "${updatedTask.title || 'Unknown'}" has been updated successfully`,
        type: 'task'
      });
      
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
  };

  return (
    <>
      <Toaster />
      {isLoading ? (
        <TaskSkeleton />
      ) : !filteredTasks.length && searchQuery ? (
        <NoSearchResults query={searchQuery} onClear={onClearSearch} />
      ) : !tasks.length || !filteredTasks.length ? (
        <div className="w-full">
          <NoTasks />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1400px] mx-auto px-4">
          <AnimatePresence mode="wait">
            {paginatedTasks.map(task => {
              const daysRemaining = getDaysRemaining(task.startDate, task.dueDate)
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`${themes[theme].bg} rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border ${themes[theme].border} overflow-hidden relative group`}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex-1 min-w-0">
                        <motion.h3 
                          className={`font-semibold ${themes[theme].text} truncate group cursor-default text-[15px]`}
                          title={task.title}
                        >
                          <span className="line-clamp-1 group-hover:line-clamp-none">
                            {task.title}
                          </span>
                        </motion.h3>
                      </div>
                      <div className="flex items-center gap-2.5 ml-3">
                        {/* Status Badge */}
                        <span className={`${getStatusColor(task.status)} text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 font-medium`}>
                          {getStatusText(task.status)}
                        </span>
                        {/* Menu Button */}
                        <div className="relative flex-shrink-0" ref={menuRef}>
                          <motion.button
                            onClick={(e) => handleMenuClick(task.id, e)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <motion.div
                              initial={{ rotate: 0 }}
                              animate={{ rotate: openMenuId === task.id ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FiMoreHorizontal className="w-4 h-4 text-gray-500" />
                            </motion.div>
                          </motion.button>

                          {/* Dropdown Menu */}
                          <AnimatePresence>
                            {openMenuId === task.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                  <button
                                    onClick={(e) => handleMenuItemClick('view', task, e)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    role="menuitem"
                                  >
                                    <FiEye className="mr-2 h-4 w-4" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={(e) => handleMenuItemClick('edit', task, e)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    role="menuitem"
                                  >
                                    <FiEdit2 className="mr-2 h-4 w-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => handleMenuItemClick('delete', task, e)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    role="menuitem"
                                  >
                                    <FiTrash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Description Section */}
                    <div className="mb-5">
                      <h4 className={`text-xs font-medium ${themes[theme].text} mb-1.5 opacity-70`}>Description</h4>
                      <div 
                        className="group cursor-default"
                        title={task.description || 'No description provided'}
                      >
                        <p className={`text-sm ${themes[theme].text} opacity-60 line-clamp-2 group-hover:line-clamp-none transition-all duration-200`}>
                          {task.description ? task.description : 'No description provided'}
                        </p>
                      </div>
                    </div>

                    {/* Date Information and Time Remaining */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className={`inline-flex items-center text-xs ${themes[theme].text} opacity-60`}>
                        <FiCalendar className="w-3.5 h-3.5 mr-1.5" />
                        {task.startDate || task.dueDate ? (
                          <>
                            <span>{formatDate(task.startDate)}</span>
                            <span className="mx-1.5">-</span>
                            <span>{formatDate(task.dueDate)}</span>
                          </>
                        ) : (
                          'No dates set'
                        )}
                      </div>
                      
                      {/* Time Remaining Badge */}
                      {task.dueDate && (
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap flex items-center gap-1.5
                          ${getDaysRemaining(task.startDate, task.dueDate) <= 0 
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : getDaysRemaining(task.startDate, task.dueDate) <= 7 
                              ? 'bg-orange-50 text-orange-700 border border-orange-100'
                              : 'bg-green-50 text-green-700 border border-green-100'
                          }`}
                        >
                          <FiClock className="w-3.5 h-3.5" />
                          <span>
                            {getDaysRemaining(task.startDate, task.dueDate) <= 0 
                              ? "Overdue"
                              : `${getDaysRemaining(task.startDate, task.dueDate)} ${getDaysRemaining(task.startDate, task.dueDate) === 1 ? 'day' : 'days'} left`
                            }
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Categories and Labels */}
                    <div className="flex flex-wrap gap-2">
                      {/* Category */}
                      {task.category && (
                        <span className={`${getCategoryColor(task.category)} text-xs px-2.5 py-0.5 rounded-full font-medium`}>
                          {task.category}
                        </span>
                      )}

                      {/* Priority Badge */}
                      {task.priority && (
                        <span className={`${getPriorityColor(task.priority)} text-xs px-2.5 py-0.5 rounded-full font-medium`}>
                          {task.priority}
                        </span>
                      )}

                      {/* Labels */}
                      {task.labels?.map((label, index) => (
                        <span
                          key={index}
                          className={`${getLabelColor(label.type)} text-xs px-2.5 py-0.5 rounded-full font-medium`}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            taskTitle={taskToDelete?.title}
          />
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
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
          }}
        />
      )}
    </>
  )
}
