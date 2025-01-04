'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiMoreVertical, FiTrash2, FiEdit2, FiCheckSquare, FiMoreHorizontal, FiClock, FiTag, FiCheckCircle, FiEye, FiAlertCircle, FiInbox, FiPlus, FiSearch, FiFilter, FiX, FiChevronDown, FiBriefcase, FiUser, FiShoppingBag, FiHeart, FiBook, FiPenTool, FiCode, FiServer, FiMonitor, FiCheckSquare as FiCheckSquareIcon, FiShield, FiSettings, FiDatabase, FiLink, FiFileText, FiTool } from 'react-icons/fi';
import { BsClockHistory } from 'react-icons/bs';
import Cookies from 'js-cookie';
import axios from 'axios';
import TaskvalidationModal from '../Tasks/TaskvalidationModal';
import EditTaskModal from '../Shared/EditTaskModal';
import Pagination from '../Shared/Pagination';
import toast from 'react-hot-toast'; // Import toast
import useNotifications from '@/app/_hooks/useNotifications';

// Predefined categories matching TaskForm
const CATEGORIES = [
  'Design',
  'Development',
  'Backend',
  'Frontend',
  'Testing',
  'Security',
  'DevOps',
  'Database',
  'API',
  'Documentation',
  'Research',
  'Maintenance',
  'Other'
];

const ITEMS_PER_PAGE = 10; // Add items per page constant

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (!(date instanceof Date) || isNaN(date)) return '';
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time part for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
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

const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case 'design':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'development':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'backend':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'frontend':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'testing':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'security':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'devops':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'database':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'api':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'documentation':
      return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'research':
      return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'maintenance':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'design':
      return <FiPenTool className="w-4 h-4 mr-1.5" />;
    case 'development':
      return <FiCode className="w-4 h-4 mr-1.5" />;
    case 'backend':
      return <FiServer className="w-4 h-4 mr-1.5" />;
    case 'frontend':
      return <FiMonitor className="w-4 h-4 mr-1.5" />;
    case 'testing':
      return <FiCheckSquareIcon className="w-4 h-4 mr-1.5" />;
    case 'security':
      return <FiShield className="w-4 h-4 mr-1.5" />;
    case 'devops':
      return <FiSettings className="w-4 h-4 mr-1.5" />;
    case 'database':
      return <FiDatabase className="w-4 h-4 mr-1.5" />;
    case 'api':
      return <FiLink className="w-4 h-4 mr-1.5" />;
    case 'documentation':
      return <FiFileText className="w-4 h-4 mr-1.5" />;
    case 'research':
      return <FiSearch className="w-4 h-4 mr-1.5" />;
    case 'maintenance':
      return <FiTool className="w-4 h-4 mr-1.5" />;
    default:
      return <FiTag className="w-4 h-4 mr-1.5" />;
  }
};

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const formatStatus = (status) => {
  if (!status) return '';
  
  // Normalize the status first
  const normalizedStatus = status.toLowerCase().trim();
  
  // Map of normalized status to display format
  const statusMap = {
    'todo': 'To Do',
    'to-do': 'To Do',
    'inprogress': 'In Progress',
    'done': 'Done',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[normalizedStatus] || status;
};

const getStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase().trim().replace(/\s+/g, '');
  
  const colorMap = {
    'todo': 'bg-blue-100 text-blue-800',
    'to-do': 'bg-blue-100 text-blue-800',
    'inprogress': 'bg-yellow-100 text-yellow-800',
    'done': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  return colorMap[normalizedStatus] || 'bg-gray-100 text-gray-800';
};

const getStatusIcon = (status) => {
  const normalizedStatus = status?.toLowerCase().trim().replace(/\s+/g, '');
  switch (normalizedStatus) {
    case 'todo':
    case 'to-do':
      return <FiClock className="w-4 h-4 text-blue-500" />;
    case 'inprogress':
      return <FiLoader className="w-4 h-4 text-yellow-500 animate-spin" />;
    case 'done':
      return <FiCheck className="w-4 h-4 text-green-500" />;
    default:
      return <FiAlertTriangle className="w-4 h-4 text-gray-400" />;
  }
};

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
);

const EmptyState = ({ onSwitchTab }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center justify-center py-12 px-4"
  >
    <div className="relative mb-6">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 rounded-full blur-2xl"
      />
      <motion.div
        animate={{ 
          rotate: [0, 10, 0, -10, 0],
          scale: [1, 1.1, 1, 1.1, 1]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative bg-gradient-to-br from-white to-gray-50 p-4 rounded-2xl shadow-sm"
      >
        <FiInbox className="w-12 h-12 text-green-500/80" />
      </motion.div>
    </div>
    <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
      No Tasks Found
    </h3>
    <p className="text-gray-500 text-center text-sm leading-relaxed max-w-sm mb-6">
      Your task list is empty. Start by creating a new task to keep track of your work.
    </p>
    <button
      onClick={() => onSwitchTab('manual')}
      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <FiPlus className="w-5 h-5" />
      <span>Create New Task</span>
    </button>
  </motion.div>
);

export function TaskList({ tasks, onUpdateTask, onDeleteTask, onSwitchTab }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [customCategory, setCustomCategory] = useState('');
  const [appliedCustomCategory, setAppliedCustomCategory] = useState('');
  const [showDropdowns, setShowDropdowns] = useState({
    status: false,
    category: false,
    priority: false
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [tasksList, setTasksList] = useState(tasks);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    console.log('📋 TaskList: Received new tasks data', tasks);
    // Filter out tasks that are not todo
    const filteredTasks = tasks.filter(task => {
      const normalizedStatus = task.status?.toLowerCase().trim().replace(/\s+/g, '');
      console.log('🔍 Filtering task:', {
        id: task._id,
        status: task.status,
        normalizedStatus,
        cancelled: task.cancelled,
        validation: task.validation,
        shouldInclude: ['todo', 'to-do', 'todo'].includes(normalizedStatus) && !task.cancelled && !task.validation
      });
      return ['todo', 'to-do', 'todo'].includes(normalizedStatus) && !task.cancelled && !task.validation;
    });
    console.log('📋 TaskList: Setting filtered tasks list:', filteredTasks);
    setTasksList(filteredTasks);
  }, [tasks]);

  useEffect(() => {
    // Simulate loading for demo purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleMenuClick = (taskId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === taskId ? null : taskId);
  };

  const handleMenuItemClick = async (action, task, e) => {
    e.stopPropagation();
    setOpenMenuId(null);

    switch (action) {
      case 'view':
        setViewingTask(task);
        break;
      case 'edit':
        setSelectedTask(task);
        break;
      case 'delete':
        try {
          await onDeleteTask(task);
          setTasksList(prev => prev.filter(t => t._id !== task._id));
        } catch (error) {
          console.error('Error deleting task:', error);
        }
        break;
    }
  };

  const handleTaskUpdate = async (updatedTaskData) => {
    try {
      if (!updatedTaskData._id) {
        throw new Error('Task ID is missing');
      }

      // If this is a cancellation or validation update, use the dates as is
      if (updatedTaskData.cancelled !== undefined || updatedTaskData.validation !== undefined) {
        const updatedTask = await onUpdateTask(updatedTaskData);
        
        // Update the local tasks list
        setTasksList(prev => prev.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        ));
        
        return updatedTask;
      }

      // For regular updates, format the dates
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) ? date.toISOString() : null;
      };

      const startDate = formatDate(updatedTaskData.startDate);
      const endDate = formatDate(updatedTaskData.endDate);

      if (!startDate || !endDate) {
        throw new Error('Invalid date format');
      }

      // Format data for API submission
      const formattedData = {
        ...updatedTaskData,
        startDate,
        endDate,
        dueDate: endDate
      };

      // Call the onUpdateTask prop to update the task
      const updatedTask = await onUpdateTask(formattedData);
      
      // Show success notification
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

      // Close the edit modal
      setSelectedTask(null);
      
      // Update the local tasks list
      setTasksList(prev => prev.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      ));

      // Create notification for task update
      const notificationMessage = updatedTaskData.status 
        ? `Task status updated to ${formatStatus(updatedTaskData.status)}`
        : 'Task details have been updated';
        
      await addNotification({
        title: 'Task Updated',
        message: notificationMessage,
        type: 'task',
        read: false
      });

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Failed to update task. Please try again.', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          padding: '16px',
          borderRadius: '8px',
        },
      });
      throw error;
    }
  };

  const closeEditModal = () => {
    setSelectedTask(null);
  };

  const closeDetailsModal = () => {
    setViewingTask(null);
  };

  const handleFilterChange = (filterType, value) => {
    console.log(`🔍 Filter changed: ${filterType} = ${value}`);
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setShowDropdowns(prev => ({ ...prev, [filterType]: false }));
  };

  const statusOptions = [
    { value: 'all', label: 'All Status', icon: FiTag },
    { value: 'todo', label: 'To Do', icon: FiInbox }
  ];

  const filteredTasks = useMemo(() => {
    console.log('🔄 Running filteredTasks memo with:', {
      tasksList,
      searchTerm,
      filters
    });

    return tasksList.filter(task => {
      console.log('🔄 Processing task for display:', task);
      
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // For status filter, if it's 'all', show all todo tasks, otherwise match the specific status
      const taskStatus = task.status?.toLowerCase().trim().replace(/\s+/g, '');
      const filterStatus = filters.status?.toLowerCase().trim();
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'todo' && ['todo', 'to-do', 'todo'].includes(taskStatus));
      
      console.log('📊 Status check:', {
        taskStatus,
        filterStatus,
        matchesStatus,
        isValidTodoStatus: ['todo', 'to-do', 'todo'].includes(taskStatus)
      });

      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      const matchesCategory = filters.category === 'all' || 
        (filters.category === 'other' ? 
          task.category === appliedCustomCategory : 
          task.category === filters.category);

      const shouldInclude = matchesSearch && matchesPriority && matchesStatus && matchesCategory;
      console.log(`📌 Task ${task._id} ${shouldInclude ? 'included' : 'filtered out'} with status ${task.status}`, {
        matchesSearch,
        matchesStatus,
        matchesPriority,
        matchesCategory
      });
      
      return shouldInclude;
    });
  }, [tasksList, searchTerm, filters, appliedCustomCategory]);

  useEffect(() => {
    console.log('🎯 Current filters:', filters);
    console.log('📊 Total tasks:', tasks.length);
    console.log('📊 Filtered tasks:', filteredTasks.length);
    console.log('📊 Tasks that passed filters:', filteredTasks);
  }, [filteredTasks, filters, tasks]);

  const handleStatusChange = (status) => {
    console.log('🔄 Status filter changing:', {
      from: filters.status,
      to: status,
      currentTasks: tasksList.map(t => ({ id: t._id, status: t.status }))
    });
    
    setFilters(prev => {
      const newFilters = { ...prev, status };
      console.log('📊 New filters:', newFilters);
      return newFilters;
    });
    
    setShowDropdowns(prev => ({ ...prev, status: false }));
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <TaskSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedTask && (
        <EditTaskModal
          task={selectedTask}
          onClose={closeEditModal}
          onSubmit={handleTaskUpdate}
        />
      )}
      
      {viewingTask && (
        <TaskvalidationModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
      
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 flex items-center gap-2 ${
            showFilters ? 'bg-green-50 text-green-600 border-green-200' : ''
          }`}
        >
          <FiFilter className="w-5 h-5" />
          <span>Filter</span>
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative" ref={null}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <button
                type="button"
                onClick={() => setShowDropdowns(prev => ({ ...prev, status: !prev.status }))}
                className="w-full px-3 py-2 text-left rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 flex items-center justify-between"
              >
                <span className="flex items-center">
                  {(() => {
                    const option = statusOptions.find(opt => opt.value === filters.status);
                    const Icon = option?.icon || FiTag;
                    return (
                      <>
                        <Icon className="w-4 h-4 mr-2" />
                        {option?.label || 'All Status'}
                      </>
                    );
                  })()}
                </span>
                <FiChevronDown className={`w-5 h-5 transition-transform ${showDropdowns.status ? 'transform rotate-180' : ''}`} />
              </button>
              {showDropdowns.status && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="py-1">
                    {statusOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(option.value)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center ${
                            filters.status === option.value ? 'bg-green-50 text-green-700' : ''
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={null}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <button
                type="button"
                onClick={() => setShowDropdowns(prev => ({ ...prev, category: !prev.category }))}
                className="w-full px-3 py-2 text-left rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 flex items-center justify-between"
              >
                <span>
                  {filters.category === 'all' 
                    ? 'All Categories' 
                    : filters.category === 'other' && appliedCustomCategory 
                      ? appliedCustomCategory 
                      : filters.category === 'other' 
                        ? 'Other' 
                        : filters.category}
                </span>
                <FiChevronDown className={`w-5 h-5 transition-transform ${showDropdowns.category ? 'transform rotate-180' : ''}`} />
              </button>
              {showDropdowns.category && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, category: 'all' }));
                        setCustomCategory('');
                        setAppliedCustomCategory('');
                        setShowDropdowns(prev => ({ ...prev, category: false }));
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      All Categories
                    </button>
                    <div className="max-h-[200px] overflow-y-auto">
                      {[...CATEGORIES, 'other'].map(category => (
                        <button
                          key={category}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, category }));
                            if (category !== 'other') {
                              setCustomCategory('');
                              setAppliedCustomCategory('');
                            }
                            setShowDropdowns(prev => ({ ...prev, category: false }));
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {filters.category === 'other' && (
                <div className="mt-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter category name and press Enter"
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setAppliedCustomCategory(customCategory);
                          setShowDropdowns(prev => ({ ...prev, category: false }));
                        }
                      }}
                    />
                    {customCategory !== appliedCustomCategory && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        Press Enter to apply
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={null}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <button
                type="button"
                onClick={() => setShowDropdowns(prev => ({ ...prev, priority: !prev.priority }))}
                className="w-full px-3 py-2 text-left rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 flex items-center justify-between"
              >
                <span>{filters.priority === 'all' ? 'All Priorities' : filters.priority}</span>
                <FiChevronDown className={`w-5 h-5 transition-transform ${showDropdowns.priority ? 'transform rotate-180' : ''}`} />
              </button>
              {showDropdowns.priority && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, priority: 'all' }));
                        setShowDropdowns(prev => ({ ...prev, priority: false }));
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      All Priorities
                    </button>
                    {['high', 'medium', 'low'].map(priority => (
                      <button
                        key={priority}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, priority }));
                          setShowDropdowns(prev => ({ ...prev, priority: false }));
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  priority: 'all',
                  status: 'all',
                  category: 'all'
                });
                setCustomCategory('');
                setAppliedCustomCategory('');
                setShowFilters(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
      
      {tasksList.length === 0 ? (
        <EmptyState onSwitchTab={onSwitchTab} />
      ) : filteredTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative inline-block"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-green-200 to-green-100 rounded-full blur-md opacity-75"></div>
              <motion.div 
                className="relative bg-gradient-to-br from-green-50 to-white p-4 rounded-full shadow-lg"
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 opacity-50"
                    animate={{ 
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  >
                    <FiSearch className="w-12 h-12 text-green-300" />
                  </motion.div>
                  <FiSearch className="w-12 h-12 text-green-600" />
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">No matching tasks found</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                We couldn't find any tasks matching your current search and filters. Try adjusting your criteria or clear all filters to see all tasks.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    priority: 'all',
                    status: 'all',
                    category: 'all'
                  });
                  setCustomCategory('');
                  setAppliedCustomCategory('');
                  setShowFilters(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <FiX className="w-4 h-4 mr-2" />
                Clear all filters
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiCheckSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Manual Tasks
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {tasksList.length} {tasksList.length === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-green-50 text-sm font-medium text-gray-600">
            <div className="col-span-3">Task</div>
            <div className="col-span-2 text-center">Category</div>
            <div className="col-span-2 text-center">Priority</div>
            <div className="col-span-2 text-center">Time Remaining</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>

          {/* Task List */}
          <AnimatePresence mode="wait">
            {paginatedTasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 hover:bg-green-50 transition-colors items-center"
              >
                <div className="col-span-3">
                  <button 
                    onClick={() => setViewingTask(task)}
                    className="text-left group w-full"
                  >
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors truncate max-w-[250px]" title={task.title}>
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate max-w-[250px]" title={task.description}>
                      {task.description || 'This task has no description.'}
                    </p>
                  </button>
                </div>

                <div className="col-span-2 flex justify-center">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={`inline-flex items-center justify-center min-w-[90px] px-3 py-1.5 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}
                  >
                    {getCategoryIcon(task.category)}
                    {task.category}
                  </motion.span>
                </div>

                <div className="col-span-2 flex justify-center">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority || 'Normal'}
                  </motion.span>
                </div>

                <div className="col-span-2 text-center">
                  {task.dueDate && (
                    <span className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap
                      ${calculateTimeRemaining(task.startDate, task.dueDate) <= 0 
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : calculateTimeRemaining(task.startDate, task.dueDate) <= 7 
                          ? 'bg-orange-50 text-orange-700 border border-orange-100'
                          : 'bg-green-50 text-green-700 border border-green-100'
                      }`}
                    >
                      <FiClock className="w-4 h-4 mr-2" />
                      {calculateTimeRemaining(task.startDate, task.dueDate)} days left
                    </span>
                  )}
                </div>

                <div className="col-span-2 flex justify-center">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                      <span className="ml-1.5">{formatStatus(task.status)}</span>
                    </span>
                  </div>
                </div>

                <div className="col-span-1 flex justify-center relative" ref={menuRef}>
                  <motion.button
                    onClick={(e) => handleMenuClick(task._id, e)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full hover:bg-green-50 hover:text-green-600 transition-all duration-200 group"
                  >
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: openMenuId === task._id ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMoreHorizontal className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {openMenuId === task._id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-12 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden"
                      >
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Task Actions</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={(e) => handleMenuItemClick('view', task, e)}
                            className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 flex items-center group transition-all duration-200"
                          >
                            <FiEye className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => handleMenuItemClick('edit', task, e)}
                            className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 flex items-center group transition-all duration-200"
                          >
                            <FiEdit2 className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
                            Edit Task
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredTasks.length > ITEMS_PER_PAGE && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                color="green"
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
