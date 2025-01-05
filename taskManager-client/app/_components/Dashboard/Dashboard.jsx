'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle, FiClock, FiAlertCircle,
  FiBarChart2, FiPlus, FiFilter,
  FiCalendar, FiFlag, FiPieChart,
  FiTrendingUp, FiActivity, FiGrid, FiMoreHorizontal, FiXCircle, FiInbox,
  FiCircle, FiPause, FiEye, FiArrowRight, FiFolder, FiBriefcase, FiUser, FiShoppingBag, FiHeart, FiBook, FiDollarSign, FiHome, FiMap, FiUsers, FiLayers,
  FiSearch, FiCode, FiPenTool, FiShare2, FiMusic, FiStar, FiChevronDown, FiType,
  FiServer, FiLayout, FiCheckSquare, FiShield, FiSettings, FiDatabase, FiTool
} from 'react-icons/fi';
import { useUser } from '@/app/_context/UserContext';
import axios from 'axios';
import Cookies from 'js-cookie';
import TaskDetailsModal from '../Shared/TaskDetailsModal';
import Pagination from '../Shared/Pagination';
import CategoryModal from './CategoryModal';

export default function Dashboard() {
  const { userName } = useUser();
  const timeFrames = ['Today', 'Week', 'Month'];
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('Today');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 4;
  const [searchQuery, setSearchQuery] = useState('');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  // Helper function to check task status
  const isTaskCompleted = (status) => {
    if (!status) return false;
    const normalizedStatus = status.toLowerCase().trim();
    return normalizedStatus === 'done';
  };

  const isTaskInProgress = (status) => {
    if (!status) return false;
    const normalizedStatus = status.toLowerCase().trim();
    return normalizedStatus === 'in progress';
  };

  const isTaskToDo = (status) => {
    if (!status) return false;
    const normalizedStatus = status.toLowerCase().trim();
    console.log('Checking To Do status:', {
      original: status,
      normalized: normalizedStatus,
      isToDo: normalizedStatus === 'to do' || normalizedStatus === 'todo'
    });
    // Check both formats: "to do" and "todo"
    return normalizedStatus === 'to do' || normalizedStatus === 'todo' || status === 'To Do';
  };

  const isTaskCancelled = (status) => {
    if (!status) return false;
    const normalizedStatus = status.toLowerCase().trim();
    return normalizedStatus === 'cancled' || normalizedStatus === 'cancelled';
  };

  // Helper function to check if a date is today
  const isToday = (date) => {
    const taskDate = new Date(date);
    const today = new Date();
    return taskDate.getDate() === today.getDate() &&
           taskDate.getMonth() === today.getMonth() &&
           taskDate.getFullYear() === today.getFullYear();
  };

  // Helper function to check if a date is within the last week (including today)
  const isWithinLastWeek = (date) => {
    const taskDate = new Date(date);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Set both dates to start of day for comparison
    today.setHours(0, 0, 0, 0);
    weekAgo.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);

    return taskDate >= weekAgo;
  };

  // Helper function to check if a date is within the last month (including week and today)
  const isWithinLastMonth = (date) => {
    const taskDate = new Date(date);
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Set dates to start of day for comparison
    today.setHours(0, 0, 0, 0);
    monthAgo.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);

    return taskDate >= monthAgo;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to get date status color
  const getDateStatusColor = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600 bg-red-50 border-red-200'; // Overdue
    if (diffDays === 0) return 'text-orange-600 bg-orange-50 border-orange-200'; // Due today
    if (diffDays <= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200'; // Due soon
    return 'text-blue-600 bg-blue-50 border-blue-200'; // Due later
  };

  // Fetch tasks from the server
  const fetchTasks = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) throw new Error('Authentication required');

      const response = await axios.get('http://localhost:9000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      // The response is directly an array of tasks
      if (Array.isArray(response.data)) {
        // Log each task's status
        response.data.forEach(task => {
          console.log('Task Status Check:', {
            title: task.title,
            status: task.status,
            isToDo: isTaskToDo(task.status),
            isInProgress: isTaskInProgress(task.status),
            isCompleted: isTaskCompleted(task.status),
            isCancelled: isTaskCancelled(task.status)
          });
        });
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    console.log('Current tasks in state:', tasks);
  }, [tasks]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if the click is outside both dropdowns
      if (filterRef.current && sortRef.current) {
        if (!filterRef.current.contains(event.target) && !sortRef.current.contains(event.target)) {
          setIsFilterOpen(false);
          setIsSortOpen(false);
        }
      }
    }

    // Add event listener
    document.addEventListener('click', handleClickOutside, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [filterRef, sortRef]);

  const getFilterIcon = (filterType) => {
    switch (filterType) {
      case 'all':
        return <FiInbox className="w-4 h-4" />;
      case 'completed':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'active':
        return <FiClock className="w-4 h-4" />;
      case 'due-soon':
        return <FiAlertCircle className="w-4 h-4" />;
      default:
        return <FiFilter className="w-4 h-4" />;
    }
  };

  const getSortIcon = (sortType) => {
    switch (sortType) {
      case 'dueDate':
        return <FiCalendar className="w-4 h-4" />;
      case 'priority':
        return <FiFlag className="w-4 h-4" />;
      case 'status':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'title':
        return <FiType className="w-4 h-4" />;
      default:
        return <FiBarChart2 className="w-4 h-4" />;
    }
  };

  const handleFilterClick = (e) => {
    e.stopPropagation();
    setIsSortOpen(false);
    setIsFilterOpen(!isFilterOpen);
  };

  const handleSortClick = (e) => {
    e.stopPropagation();
    setIsFilterOpen(false);
    setIsSortOpen(!isSortOpen);
  };

  const handleOptionClick = (handler) => (e) => {
    e.stopPropagation();
    handler();
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Calculate task statistics
  const calculateTaskStats = () => {
    if (!tasks || tasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        toDo: 0,
        cancelled: 0,
        highPriority: 0,
        completionRate: 0
      };
    }

    // Filter tasks based on selected time frame
    const currentTasks = tasks.filter(task => {
      const createdAt = task.createdAt;
      
      switch (selectedTimeFrame) {
        case 'Today':
          return isToday(createdAt);
        case 'Week':
          return isWithinLastWeek(createdAt); // Now includes today
        case 'Month':
          return isWithinLastMonth(createdAt); // Now includes week and today
        default:
          return true;
      }
    });

    // Log filtered tasks for debugging
    console.log(`Tasks for ${selectedTimeFrame}:`, currentTasks.map(task => ({
      title: task.title,
      createdAt: new Date(task.createdAt).toLocaleDateString(),
      status: task.status
    })));

    const todoTasks = currentTasks.filter(t => isTaskToDo(t.status));

    const stats = {
      total: currentTasks.length,
      completed: currentTasks.filter(t => isTaskCompleted(t.status)).length,
      inProgress: currentTasks.filter(t => isTaskInProgress(t.status)).length,
      toDo: todoTasks.length,
      cancelled: currentTasks.filter(t => isTaskCancelled(t.status)).length,
      highPriority: currentTasks.filter(t => t.priority === 'high').length,
      completionRate: currentTasks.length > 0 
        ? Math.round((currentTasks.filter(t => isTaskCompleted(t.status)).length / currentTasks.length) * 100) 
        : 0
    };

    return stats;
  };

  // Calculate category distribution and progress
  const calculateCategoryProgress = () => {
    const categoryData = {};
    
    tasks.forEach(task => {
      if (!task.category) return;
      
      if (!categoryData[task.category]) {
        categoryData[task.category] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          toDo: 0,
          cancelled: 0
        };
      }
      
      categoryData[task.category].total += 1;
      if (isTaskCompleted(task.status)) {
        categoryData[task.category].completed += 1;
      } else if (isTaskInProgress(task.status)) {
        categoryData[task.category].inProgress += 1;
      } else if (isTaskToDo(task.status)) {
        categoryData[task.category].toDo += 1;
      } else if (isTaskCancelled(task.status)) {
        categoryData[task.category].cancelled += 1;
      }
    });

    return categoryData;
  };

  const taskStats = calculateTaskStats();

  const getCategoryColor = (category) => {
    if (!category) return 'bg-gray-50 text-gray-600 border-gray-200';
    const normalizedCategory = category.toLowerCase().trim();
    
    switch (normalizedCategory) {
      case 'design':
        return 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm shadow-purple-100/50';
      case 'development':
        return 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100/50';
      case 'backend':
        return 'bg-green-50 text-green-700 border-green-200 shadow-sm shadow-green-100/50';
      case 'frontend':
        return 'bg-pink-50 text-pink-700 border-pink-200 shadow-sm shadow-pink-100/50';
      case 'testing':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm shadow-yellow-100/50';
      case 'security':
        return 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100/50';
      case 'devops':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm shadow-indigo-100/50';
      case 'database':
        return 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm shadow-orange-100/50';
      case 'api':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 shadow-sm shadow-cyan-100/50';
      case 'documentation':
        return 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm shadow-teal-100/50';
      case 'research':
        return 'bg-violet-50 text-violet-700 border-violet-200 shadow-sm shadow-violet-100/50';
      case 'maintenance':
        return 'bg-gray-50 text-gray-700 border-gray-200 shadow-sm shadow-gray-100/50';
      case 'other':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 shadow-sm shadow-fuchsia-100/50';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200 shadow-sm shadow-gray-100/50';
    }
  };

  const getCategoryProgressColor = (category) => {
    if (!category) return 'bg-gray-400';
    const normalizedCategory = category.toLowerCase().trim();
    
    switch (normalizedCategory) {
      case 'design':
        return 'bg-purple-500';
      case 'development':
        return 'bg-blue-500';
      case 'backend':
        return 'bg-green-500';
      case 'frontend':
        return 'bg-pink-500';
      case 'testing':
        return 'bg-yellow-500';
      case 'security':
        return 'bg-red-500';
      case 'devops':
        return 'bg-indigo-500';
      case 'database':
        return 'bg-orange-500';
      case 'api':
        return 'bg-cyan-500';
      case 'documentation':
        return 'bg-teal-500';
      case 'research':
        return 'bg-violet-500';
      case 'maintenance':
        return 'bg-gray-500';
      case 'other':
        return 'bg-fuchsia-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getCategoryIcon = (category) => {
    if (!category) return <FiFolder className="w-4 h-4 text-gray-400" />;
    const normalizedCategory = category.toLowerCase().trim();
    const colorClass = getCategoryProgressColor(category).replace('bg-', 'text-');
    
    switch (normalizedCategory) {
      case 'design':
        return <FiPenTool className={`w-4 h-4 ${colorClass}`} />;
      case 'development':
        return <FiCode className={`w-4 h-4 ${colorClass}`} />;
      case 'backend':
        return <FiServer className={`w-4 h-4 ${colorClass}`} />;
      case 'frontend':
        return <FiLayout className={`w-4 h-4 ${colorClass}`} />;
      case 'testing':
        return <FiCheckSquare className={`w-4 h-4 ${colorClass}`} />;
      case 'security':
        return <FiShield className={`w-4 h-4 ${colorClass}`} />;
      case 'devops':
        return <FiSettings className={`w-4 h-4 ${colorClass}`} />;
      case 'database':
        return <FiDatabase className={`w-4 h-4 ${colorClass}`} />;
      case 'api':
        return <FiShare2 className={`w-4 h-4 ${colorClass}`} />;
      case 'documentation':
        return <FiBook className={`w-4 h-4 ${colorClass}`} />;
      case 'research':
        return <FiSearch className={`w-4 h-4 ${colorClass}`} />;
      case 'maintenance':
        return <FiTool className={`w-4 h-4 ${colorClass}`} />;
      case 'other':
        return <FiMoreHorizontal className={`w-4 h-4 text-fuchsia-500`} />;
      default:
        return <FiFolder className={`w-4 h-4 ${colorClass}`} />;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    const normalizedStatus = status.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'done':
      case 'completed':
        return 'bg-green-50 text-green-700 border border-green-200 shadow-sm shadow-green-100/50';
      case 'in progress':
        return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm shadow-blue-100/50';
      case 'to do':
      case 'todo':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm shadow-yellow-100/50';
      case 'cancelled':
      case 'cancled':
        return 'bg-red-50 text-red-700 border border-red-200 shadow-sm shadow-red-100/50';
      case 'on hold':
        return 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm shadow-purple-100/50';
      case 'review':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm shadow-indigo-100/50';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200 shadow-sm';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FiCircle className="w-4 h-4" />;
    const normalizedStatus = status.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'done':
      case 'completed':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'in progress':
        return <FiClock className="w-4 h-4" />;
      case 'to do':
      case 'todo':
        return <FiCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'cancled':
        return <FiXCircle className="w-4 h-4" />;
      case 'on hold':
        return <FiPause className="w-4 h-4" />;
      case 'review':
        return <FiEye className="w-4 h-4" />;
      default:
        return <FiCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Filter and sort tasks
  const filteredTasks = tasks?.filter(task => {
    let matchesFilter = true;
    let matchesSearch = true;

    // Apply filter
    if (filter === 'completed') {
      matchesFilter = isTaskCompleted(task.status);
    } else if (filter === 'active') {
      matchesFilter = !isTaskCompleted(task.status);
    } else if (filter === 'due-soon') {
      matchesFilter = isTaskDueSoon(task.dueDate);
    }

    // Apply search
    if (searchQuery) {
      matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return matchesFilter && matchesSearch;
  }) || [];

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return 0;
  });

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = sortedTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Task Statistics Section */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200/70 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-blue-100/50">
                <FiPieChart className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Task Statistics
              </h2>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-50 rounded-full cursor-pointer transition-colors duration-200"
            >
              <FiMoreHorizontal className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>

          {/* Time Frame Selection */}
          <div className="flex gap-2 mb-6">
            {timeFrames.map((frame) => (
              <button
                key={frame}
                onClick={() => setSelectedTimeFrame(frame)}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedTimeFrame === frame
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {frame}
              </button>
            ))}
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
            {/* Completed Tasks */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500">Completed Tasks</h3>
                <FiCheckCircle className="text-green-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold">{taskStats.completed}</span>
                <span className="text-green-500 text-sm ml-2">{selectedTimeFrame}</span>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500">In Progress</h3>
                <FiClock className="text-blue-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold">{taskStats.inProgress}</span>
                <span className="text-blue-500 text-sm ml-2">Active</span>
              </div>
            </div>

            {/* To Do Tasks */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500">To Do</h3>
                <FiAlertCircle className="text-yellow-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold">{taskStats.toDo}</span>
                <span className="text-yellow-500 text-sm ml-2">Pending</span>
              </div>
            </div>

            {/* Cancelled Tasks */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500">Cancelled</h3>
                <FiXCircle className="text-red-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold">{taskStats.cancelled}</span>
                <span className="text-red-500 text-sm ml-2">Stopped</span>
              </div>
            </div>

            {/* Total Tasks */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500">Total Tasks</h3>
                <FiGrid className="text-purple-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold">{taskStats.total}</span>
                <span className="text-gray-500 text-sm ml-2">tasks</span>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-500">Completion Rate</h3>
                <FiTrendingUp className="text-pink-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold">{taskStats.completionRate}%</span>
                <span className="text-gray-500 text-sm ml-2">{selectedTimeFrame}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Priorities Section */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200/70 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-blue-100/50">
                <FiFlag className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Task Priorities
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* High Priority */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">High Priority</span>
                <FiFlag className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-700">
                {tasks.filter(task => task.priority === 'high').length}
              </div>
              <div className="text-sm text-red-600 mt-1">
                {Math.round((tasks.filter(task => task.priority === 'high').length / tasks.length) * 100)}% of total tasks
              </div>
            </div>

            {/* Medium Priority */}
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700">Medium Priority</span>
                <FiFlag className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-700">
                {tasks.filter(task => task.priority === 'medium').length}
              </div>
              <div className="text-sm text-orange-600 mt-1">
                {Math.round((tasks.filter(task => task.priority === 'medium').length / tasks.length) * 100)}% of total tasks
              </div>
            </div>

            {/* Low Priority */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Low Priority</span>
                <FiFlag className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-700">
                {tasks.filter(task => task.priority === 'low').length}
              </div>
              <div className="text-sm text-green-600 mt-1">
                {Math.round((tasks.filter(task => task.priority === 'low').length / tasks.length) * 100)}% of total tasks
              </div>
            </div>
          </div>
        </div>

        {/* Task Progress */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200/70 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-blue-100/50">
              <FiPieChart className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Task Progress Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Completed Tasks Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-100"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-green-500"
                    strokeWidth="12"
                    strokeDasharray={`${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 251.2 : 0} 251.2`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-gray-600">{taskStats.completed} Tasks</p>
              </div>
            </div>

            {/* In Progress Tasks Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-100"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-blue-500"
                    strokeWidth="12"
                    strokeDasharray={`${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 251.2 : 0} 251.2`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {taskStats.total > 0 ? Math.round((taskStats.inProgress / taskStats.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-gray-600">{taskStats.inProgress} Tasks</p>
              </div>
            </div>

            {/* To Do Tasks Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-100"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-yellow-500"
                    strokeWidth="12"
                    strokeDasharray={`${taskStats.total > 0 ? (taskStats.toDo / taskStats.total) * 251.2 : 0} 251.2`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {taskStats.total > 0 ? Math.round((taskStats.toDo / taskStats.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500">To Do</p>
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-gray-600">{taskStats.toDo} Tasks</p>
              </div>
            </div>

            {/* Cancelled Tasks Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-100"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-red-500"
                    strokeWidth="12"
                    strokeDasharray={`${taskStats.total > 0 ? (taskStats.cancelled / taskStats.total) * 251.2 : 0} 251.2`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {taskStats.total > 0 ? Math.round((taskStats.cancelled / taskStats.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Cancelled</p>
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-gray-600">{taskStats.cancelled} Tasks</p>
              </div>
            </div>
          </div>

          {/* Total Tasks Summary */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Tasks</span>
              <span className="text-lg font-bold text-gray-900">{taskStats.total}</span>
            </div>
          </div>
        </div>

        {/* Category Progress Section */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200/70 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-blue-100/50">
                <FiBarChart2 className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Category Progress
              </h2>
            </div>
            <button 
              onClick={() => setIsCategoryModalOpen(true)} 
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors group"
            >
              <span>View All</span>
              {Object.keys(calculateCategoryProgress()).length > 5 && (
                <span className="flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-xs font-medium group-hover:bg-indigo-200">
                  +{Object.keys(calculateCategoryProgress()).length - 5} more
                </span>
              )}
            </button>
          </div>
          
          {Object.entries(calculateCategoryProgress()).length > 0 ? (
            Object.entries(calculateCategoryProgress()).slice(0, 5).map(([categoryName, { total, completed, inProgress, toDo, cancelled }]) => {
              const percentage = Math.round((completed / total) * 100);
              const categoryColorClass = getCategoryColor(categoryName);
              const progressColorClass = getCategoryProgressColor(categoryName);
              const iconComponent = getCategoryIcon(categoryName);
              
              return (
                <div key={categoryName} className="mb-6 bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${categoryColorClass.replace('border-', 'bg-').split(' ')[0]}`}>
                        {iconComponent}
                      </div>
                      <span className={`font-medium ${categoryColorClass.split(' ')[1]}`}>
                        {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">To Do:</span>
                        <span className="text-sm font-medium text-yellow-600">{toDo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">In Progress:</span>
                        <span className="text-sm font-medium text-blue-600">{inProgress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Completed:</span>
                        <span className="text-sm font-medium text-green-600">{completed}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Cancelled:</span>
                        <span className="text-sm font-medium text-red-600">{cancelled}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Total:</span>
                        <span className="text-sm font-medium text-gray-700">{total}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <span className={`text-sm font-medium ${categoryColorClass.split(' ')[1]}`}>
                      {percentage}% Complete
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-full blur-lg opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full p-4 border border-blue-100/50">
                  <FiFolder className="w-12 h-12 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Categories Found</h3>
              <p className="text-sm text-gray-600 max-w-sm mb-6">
                Start organizing your tasks by adding categories to them. Categories help you group related tasks together.
              </p>
              <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm text-green-700">Work</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm text-blue-700">Personal</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-sm text-purple-700">Study</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                  <span className="text-sm text-orange-700">Health</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task List Section */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200/70 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-lg border border-blue-100/50">
                <FiActivity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800">
                  Tasks Overview
                </h2>
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                  {tasks?.length || 0} Tasks
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-64 px-4 py-2 pl-10 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={handleFilterClick}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  {getFilterIcon(filter)}
                  <span>Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
                  <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                    {['all', 'completed', 'active', 'due-soon'].map((option) => (
                      <button
                        key={option}
                        onClick={handleOptionClick(() => {
                          setFilter(option);
                          setIsFilterOpen(false);
                        })}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                          filter === option
                            ? 'text-blue-600 bg-blue-50 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        } transition-colors duration-200`}
                      >
                        {getFilterIcon(option)}
                        <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={handleSortClick}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  {getSortIcon(sortBy)}
                  <span>Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
                  <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSortOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                    {['dueDate', 'priority', 'status', 'title'].map((option) => (
                      <button
                        key={option}
                        onClick={handleOptionClick(() => {
                          setSortBy(option);
                          setIsSortOpen(false);
                        })}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                          sortBy === option
                            ? 'text-blue-600 bg-blue-50 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        } transition-colors duration-200`}
                      >
                        {getSortIcon(option)}
                        <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-20 bg-gray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-full blur-lg opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full p-4 border border-blue-100/50">
                  <FiInbox className="w-12 h-12 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No tasks found</h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto">
                {filter !== 'all' ? (
                  <span className="inline-flex flex-col gap-2">
                    <span className="text-gray-600">No tasks match your current filters.</span>
                    <span className="text-indigo-600">Try adjusting your filter settings.</span>
                  </span>
                ) : (
                  <span className="inline-flex flex-col gap-2">
                    <span className="text-gray-600">Your task list is empty.</span>
                    <span className="text-indigo-600">Start by creating a new task to get organized.</span>
                  </span>
                )}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-md">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <FiCheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700">Plan</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                  <FiClock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-700">Track</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                  <FiTrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700">Achieve</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentTasks.map((task) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 flex-grow max-w-md">
                      <div className="flex-grow">
                        <div className="group relative">
                          <h3 className="text-gray-800 font-medium truncate hover:text-blue-600 transition-colors cursor-pointer" title={task.title}>
                            {truncateText(task.title, 40)}
                          </h3>
                          {task.title.length > 40 && (
                            <div className="absolute left-0 -top-8 z-20 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg px-3 py-2 w-max max-w-[300px] shadow-lg">
                              <div className="whitespace-normal break-words">{task.title}</div>
                              <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                            </div>
                          )}
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-500 line-clamp-2" title={task.description}>
                            {task.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 flex-shrink-0">
                      <div className="flex items-center justify-center gap-3 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 shadow-sm min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 whitespace-nowrap">Start</span>
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              {formatDate(task.createdAt)}
                            </span>
                          </div>
                        </div>
                        <FiArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 whitespace-nowrap">Due</span>
                            <span className={`text-sm font-medium ${getDateStatusColor(task.dueDate)} px-2 py-0.5 rounded whitespace-nowrap`}>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getPriorityColor(task.priority)} min-w-[100px]`}>
                        <FiFlag className="w-4 h-4 flex-shrink-0" />
                        <span className="capitalize whitespace-nowrap">{task.priority}</span>
                      </div>

                      <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(task.status)} min-w-[120px]`}>
                        {getStatusIcon(task.status)}
                        <span className="whitespace-nowrap">{task.status}</span>
                      </div>

                      <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getCategoryColor(task.category)} shadow-sm min-w-[130px]`}>
                        {getCategoryIcon(task.category)}
                        <span className="capitalize whitespace-nowrap">{task.category || 'Uncategorized'}</span>
                      </div>

                      <button 
                        onClick={() => handleOpenModal(task)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 hover:text-blue-600 flex-shrink-0"
                        title="View Task Details"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {selectedTask && (
        <TaskDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          task={selectedTask}
        />
      )}
      <CategoryModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)}
        categoryStats={calculateCategoryProgress()}
      />
    </div>
  );
}