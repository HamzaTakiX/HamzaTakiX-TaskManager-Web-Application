import { FiMoreHorizontal, FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiClock, FiCheckCircle, FiRefreshCw, FiSearch, FiEye, FiArchive, FiCalendar, FiX } from 'react-icons/fi'
import { BsClockHistory, BsPinFill, BsPin } from 'react-icons/bs'
import { AiOutlineCheckCircle } from 'react-icons/ai'
import { motion, AnimatePresence, useDragControls, useAnimationControls } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import BoardLoadingState from './LoadingStates'
import Noresults from './Noresults'
import TaskDetailsModal from '../Shared/TaskDetailsModal'
import EditTaskModal from '../Shared/EditTaskModal'
import DeleteCardModal from '../Shared/DeleteCardModal'
import ClearBoardModal from './ClearBoardModal';
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSettings } from '@/app/_context/SettingsContext'
import toast from 'react-hot-toast'
import useNotifications from '@/app/_hooks/useNotifications'

const CARD_DIMENSIONS = {
  width: 550,
  height: 250
};

const TaskCard = ({ task, onMoveTask, onRemoveTask, onUpdateTask, onToggleStar, columnId, larger = false }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isDraggable, setIsDraggable] = useState(false)
  const [hoveredColumn, setHoveredColumn] = useState(null)
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isStarred, setIsStarred] = useState(task?.favorite || false)
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const scrollInterval = useRef(null)
  const controls = useAnimationControls()
  const doubleClickTimeoutRef = useRef(null)

  const calculateDaysLeft = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (!(end instanceof Date) || isNaN(end) || !(start instanceof Date) || isNaN(start)) return null;
      
      // Set both dates to start of day for accurate day calculation
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error calculating days left:', error);
      return null;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (!(d instanceof Date) || isNaN(d)) return '';
    
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
  };

  const getDaysRemainingText = (days) => {
    if (days === null) return 'No dates set';
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  };

  const getDaysRemainingColor = (days) => {
    if (days === null) return 'bg-gray-50 text-gray-700 border border-gray-100';
    if (days < 0) return 'bg-red-50 text-red-700 border border-red-100';
    if (days <= 7) return 'bg-orange-50 text-orange-700 border border-orange-100';
    return 'bg-green-50 text-green-700 border border-green-100';
  };

  const daysLeft = calculateDaysLeft(task?.startDate, task?.dueDate);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && 
          !menuRef.current.contains(event.target) && 
          !menuButtonRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  useEffect(() => {
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current)
      }
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  useEffect(() => {
    setIsStarred(task?.favorite || false);
  }, [task?.favorite]);

  const handleDragStart = (event, info) => {
    setIsDraggable(true);
    const rect = event.target.getBoundingClientRect();
    
    // Calculate offset from mouse to card's top-left corner
    setDragOffset({
      x: info.point.x - rect.left,
      y: info.point.y - rect.top
    });

    // Set initial position
    setCardPosition({
      x: rect.left,
      y: rect.top
    });
  };

  const handleDrag = (event, info) => {
    const threshold = 100;
    const speed = 5;
    const mouseY = event.clientY;
    const windowHeight = window.innerHeight;

    // Get the current scroll position
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // Auto-scroll based on mouse position
    if (mouseY < threshold && scrollY > 0) {
      // Scroll up when near top
      window.scrollTo({
        top: Math.max(0, scrollY - speed),
        behavior: 'auto'
      });
    } else if (mouseY > windowHeight - threshold && scrollY < maxScroll) {
      // Scroll down when near bottom
      window.scrollTo({
        top: Math.min(maxScroll, scrollY + speed),
        behavior: 'auto'
      });
    }

    // Update card position to follow mouse exactly
    setCardPosition({
      x: event.clientX - dragOffset.x,
      y: event.clientY + window.scrollY - dragOffset.y
    });

    // Check for column hover
    const dragPoint = { x: event.clientX, y: event.clientY };
    const columns = document.querySelectorAll('.column-drop-zone');
    let currentHoveredColumn = null;

    columns.forEach(column => {
      const rect = column.getBoundingClientRect();
      if (
        dragPoint.x >= rect.left &&
        dragPoint.x <= rect.right &&
        dragPoint.y >= rect.top &&
        dragPoint.y <= rect.bottom
      ) {
        currentHoveredColumn = column.getAttribute('data-column-id');
      }
    });

    if (currentHoveredColumn !== hoveredColumn) {
      setHoveredColumn(currentHoveredColumn);
    }
  };

  const handleDragEnd = async (event, info) => {
    setIsDraggable(false);
    setCardPosition({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });

    if (!hoveredColumn || hoveredColumn === columnId) {
      await controls.start({
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 30
        }
      });
    } else {
      onMoveTask(task.id, columnId, hoveredColumn)
    }

    setHoveredColumn(null);
  }

  const handleDoubleClick = (e) => {
    if (!isDraggable) {
      const rect = e.currentTarget.getBoundingClientRect()
      setCardPosition({ x: rect.left, y: rect.top })
    }
    setIsDraggable(prev => !prev)
  }

  const handleStarClick = (e) => {
    e.stopPropagation();
    setIsStarred(!isStarred);
    onToggleStar();
  };

  const handleArchiveTask = (taskId) => {
    // Archive functionality will be implemented later
    console.log('Archive functionality coming soon:', taskId)
  }

  const handleMenuOpen = (columnId) => {
    setActiveMenu(activeMenu === columnId ? null : columnId)
  }

  const boards = [
    { 
      id: 'todo', 
      label: 'To Do',
      icon: <FiClock className="w-4 h-4 text-blue-500" />,
      className: 'mb-4'
    },
    { 
      id: 'inProgress', 
      label: 'In Progress',
      icon: <FiRefreshCw className="w-4 h-4 text-yellow-500" />,
      className: 'mb-4'
    },
    { 
      id: 'done', 
      label: 'Done',
      icon: <FiCheckCircle className="w-4 h-4 text-green-500" />,
      className: ''
    },
    { 
      id: 'cancelled', 
      label: 'Cancelled',
      icon: <FiX className="w-4 h-4 text-red-500" />,
      className: 'mb-4'
    },
    { 
      id: 'pinned', 
      label: 'Pinned',
      icon: <BsPinFill className="w-4 h-4 text-yellow-500" />,
      className: 'mb-4'
    }
  ]

  const menuItems = [
    { 
      icon: <FiEye className="w-4 h-4" />, 
      label: 'View', 
      color: 'text-indigo-600', 
      action: () => {
        setShowTaskDetails(true)
        setShowMenu(false)
      }
    },
    { 
      icon: <FiEdit2 className="w-4 h-4" />, 
      label: 'Edit', 
      color: 'text-blue-600',
      action: () => {
        setShowEditModal(true)
        setShowMenu(false)
      }
    },
    { 
      icon: <FiArrowRight className="w-4 h-4" />, 
      label: 'Move To', 
      color: 'text-purple-600',
      submenu: true,
      action: () => setShowMoveSubmenu(true)
    },
    columnId === 'pinned' 
      ? { icon: <BsPin className="w-4 h-4" />, label: 'Unpin', color: 'text-yellow-600', action: () => {
          onMoveTask(task.id, 'pinned', task.previousColumn || 'todo')
          setShowMenu(false)
        }}
      : { icon: <BsPinFill className="w-4 h-4" />, label: 'Pin', color: 'text-yellow-600', action: () => {
          const updatedTask = { ...task, previousColumn: columnId }
          onMoveTask(task.id, columnId, 'pinned', updatedTask)
          setShowMenu(false)
        }},
    { icon: <FiTrash2 className="w-4 h-4" />, label: 'Remove', color: 'text-red-600', action: () => {
      setShowMenu(false);
      setShowDeleteModal(true);
    }},

  ]

  useEffect(() => {
    let scrollInterval;
    
    const handleScroll = () => {
      if (isDraggable) {
        // Update position based on current mouse position
        const mouseY = window.event?.clientY;
        if (mouseY !== undefined) {
          setCardPosition(prev => ({
            ...prev,
            y: mouseY + window.scrollY - dragOffset.y
          }));
        }
      }
    };

    if (isDraggable) {
      window.addEventListener('scroll', handleScroll);
      prevScrollY.current = window.scrollY;
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isDraggable, dragOffset.y]);

  const prevScrollY = useRef(0);

  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      if (isDraggable) {
        setCardPosition(prev => ({
          ...prev,
          y: mousePosition.current.y + window.scrollY - dragOffset.y
        }));
      }
    };

    if (isDraggable) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isDraggable]);

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
        return 'bg-purple-100 text-purple-800 border border-purple-200'
      case 'bug':
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'design':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
      case 'documentation':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  return (
    <motion.div 
      onDoubleClick={handleDoubleClick}
      animate={controls}
      initial={{ opacity: 0, y: 20 }}
      drag={isDraggable}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        zIndex: isDraggable ? 9999 : 1,
        position: isDraggable ? 'fixed' : 'relative',
        cursor: isDraggable ? 'grab' : 'default',
        touchAction: 'none',
        width: `${CARD_DIMENSIONS.width}px`,
        maxWidth: `${CARD_DIMENSIONS.width}px`,
        minHeight: `${CARD_DIMENSIONS.height}px`,
        maxHeight: `${CARD_DIMENSIONS.height}px`,
        overflow: 'hidden',
        left: isDraggable ? `${cardPosition.x}px` : 'auto',
        top: isDraggable ? `${cardPosition.y}px` : 'auto',
        transform: 'none'
      }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        scale: isDraggable ? 1.05 : 1,
        boxShadow: isDraggable 
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
          : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      whileHover={{
        scale: isDraggable ? 1.05 : 1.02,
        y: -5,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25
        }
      }}
      whileDrag={{
        scale: 1.1,
        boxShadow: "0 35px 60px -15px rgba(0, 0, 0, 0.3)",
        cursor: "grabbing",
        zIndex: 9999
      }}
      layoutId={`task-${task.id}`}
      layout
      transition={{ 
        default: {
          type: "spring",
          stiffness: 500,
          damping: 20,
          mass: 0.8
        }
      }}
      className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100/60 
        flex flex-col cursor-pointer relative overflow-hidden
        ${isDraggable ? 'cursor-move drag-mode' : ''}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="group cursor-default min-w-0 flex-1" title={task?.title || 'Untitled Task'}>
            <h3 className="font-semibold text-gray-900 text-[15px] truncate group-hover:whitespace-normal group-hover:text-clip">
              {task?.title || 'Untitled Task'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap flex items-center gap-1.5
            ${task.status?.toLowerCase() === 'todo' || task.status === 'To Do' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
              task.status?.toLowerCase() === 'in progress' || task.status?.toLowerCase() === 'inprogress' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
              task.status?.toLowerCase() === 'done' || task.status?.toLowerCase() === 'complete' ? 'bg-green-50 text-green-700 border border-green-100' :
              task.status?.toLowerCase() === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-100' :
              'bg-gray-50 text-gray-700 border border-gray-100'}`}
          >
            {task.status?.toLowerCase() === 'todo' || task.status === 'To Do' ? 'To Do' :
             task.status?.toLowerCase() === 'in progress' || task.status?.toLowerCase() === 'inprogress' ? 'In Progress' :
             task.status?.toLowerCase() === 'done' || task.status?.toLowerCase() === 'complete' ? 'Complete' :
             task.status?.toLowerCase() === 'cancelled' ? 'Cancelled' :
             task.status || 'Unknown'}
          </span>
          {task.startDate && task.dueDate && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap flex items-center gap-1.5
              ${getDaysRemainingColor(daysLeft)}`}
            >
              <FiClock className="w-3.5 h-3.5" />
              <span>{getDaysRemainingText(daysLeft)}</span>
            </span>
          )}
          <button
            onClick={handleStarClick}
            className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
              isStarred ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-gray-500'
            }`}
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              animate={isStarred ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isStarred ? "currentColor" : "none"}
                stroke="currentColor"
                className="w-5 h-5"
                strokeWidth={isStarred ? "0" : "2"}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </motion.div>
          </button>
          <button
            ref={menuButtonRef}
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <FiMoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-5">
        <h4 className="text-xs font-medium text-gray-900 mb-1.5 opacity-70">Description</h4>
        <div 
          className="group cursor-default"
          title={task?.description || 'No description provided'}
        >
          <p className="text-sm text-gray-500 line-clamp-3 group-hover:line-clamp-none transition-all duration-200">
            {task?.description || 'No description provided'}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center mb-5">
        <div className="inline-flex items-center text-xs text-gray-500">
          <FiCalendar className="w-3.5 h-3.5 mr-1.5" />
          <span>{formatDate(task.startDate)}</span>
          <span className="mx-1.5">-</span>
          <span>{formatDate(task.dueDate)}</span>
        </div>
      </div>

      {/* Categories and Labels */}
      <div className="flex flex-wrap gap-2">
        {task?.category && (
          <span className={`${getCategoryColor(task.category)} text-xs px-2.5 py-0.5 rounded-full font-medium`}>
            {task.category}
          </span>
        )}
        {task?.priority && (
          <span className={`${getPriorityColor(task.priority)} text-xs px-2.5 py-0.5 rounded-full font-medium`}>
            {task.priority}
          </span>
        )}
        {task?.labels?.map((label, index) => (
          <span
            key={index}
            className={`${getLabelColor(label.type)} text-xs px-2.5 py-0.5 rounded-full font-medium`}
          >
            {label.name}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.2 }}
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
            style={{
              width: '200px',
              top: 'auto',
              right: '0',
              transform: 'translateY(-100%)',
              marginTop: '-25px'
            }}
          >
            {!showMoveSubmenu ? (
              menuItems.map((item, index) => (
                <motion.button
                  key={index}
                  onClick={(e) => item.action ? item.action(e) : handleMenuItemClick(item.label.toLowerCase(), task, e)}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  whileHover={{ backgroundColor: '#F3F4F6' }}
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-gray-700">{item.label}</span>
                  {item.submenu && (
                    <FiArrowRight className="w-4 h-4 ml-auto text-gray-400" />
                  )}
                </motion.button>
              ))
            ) : (
              <>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                  Move to
                </div>
                {boards.map((board, index) => (
                  <motion.button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (board.id !== columnId) {
                        onMoveTask(task.id, columnId, board.id)
                      }
                      setShowMenu(false)
                      setShowMoveSubmenu(false)
                    }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    whileHover={{ backgroundColor: '#F3F4F6' }}
                    disabled={board.id === columnId}
                  >
                    <span className="text-gray-500">{board.icon}</span>
                    <span className="text-gray-700">{board.label}</span>
                    {board.id === columnId && (
                      <span className="ml-auto text-xs text-gray-400">Current</span>
                    )}
                  </motion.button>
                ))}
                <motion.button
                  onClick={() => setShowMoveSubmenu(false)}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-gray-500 border-t border-gray-100"
                  whileHover={{ backgroundColor: '#F3F4F6' }}
                >
                  <FiArrowRight className="w-4 h-4 rotate-180" />
                  <span>Back</span>
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTaskDetails && (
          <TaskDetailsModal
            task={task}
            onClose={() => setShowTaskDetails(false)}
            onUpdate={onUpdateTask}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEditModal && (
          <EditTaskModal
            task={task}
            onClose={() => setShowEditModal(false)}
            onSubmit={async (updatedTask) => {
              try {
                await onUpdateTask(updatedTask);
                setShowEditModal(false);
              } catch (error) {
                console.error('Error updating task:', error);
                // Handle error appropriately
              }
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteCardModal
            task={task}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={(taskId, status) => {
              onRemoveTask(taskId, status || columnId);
              setShowDeleteModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const EmptyState = ({ title, columnId }) => {
  const getIcon = () => {
    switch (columnId) {
      case 'todo':
        return <FiEdit2 className="w-16 h-16 mb-4 text-blue-400" />
      case 'inProgress':
        return <BsClockHistory className="w-16 h-16 mb-4 text-orange-400" />
      case 'done':
        return <AiOutlineCheckCircle className="w-[80px] h-[80px] mb-4 text-green-400" />
      case 'cancelled':
        return <FiX className="w-16 h-16 mb-4 text-red-400" />
      case 'pinned':
        return <BsPinFill className="w-16 h-16 mb-4 text-yellow-400" />
      default:
        return null
    }
  }

  const getMessage = () => {
    switch (columnId) {
      case 'todo':
        return "No tasks to do yet"
      case 'inProgress':
        return "No tasks in progress yet"
      case 'done':
        return "No completed tasks yet"
      case 'cancelled':
        return "No cancelled tasks yet"
      case 'pinned':
        return "No pinned tasks yet"
      default:
        return `No tasks in ${title} yet`
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-gray-400 px-4"
    >
      <motion.div
        animate={{ 
          y: [0, -8, 0],
          rotate: [-5, 5, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="flex items-center justify-center"
      >
        {getIcon()}
      </motion.div>
      <p className="text-lg font-medium text-center">{getMessage()}</p>
    </motion.div>
  )
}

const LoadingState = ({ columnId }) => {
  const getLoadingColor = () => {
    switch (columnId) {
      case 'todo':
        return 'text-blue-500'
      case 'inProgress':
        return 'text-orange-500'
      case 'done':
        return 'text-green-500'
      case 'cancelled':
        return 'text-red-500'
      case 'pinned':
        return 'text-yellow-500'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          rotate: 360 
        }}
        transition={{ 
          opacity: { duration: 0.2 },
          rotate: { 
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }
        }}
        className={`${getLoadingColor()}`}
      >
        <FiRefreshCw className="w-8 h-8" />
      </motion.div>
    </div>
  )
}

const BoardSkeleton = () => (
  <div className="flex flex-col space-y-6 relative z-0">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="p-4 rounded-lg w-full shadow-sm h-[350px] bg-white/80">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-6 w-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, cardIndex) => (
              <div key={cardIndex} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const TaskBoard = ({ searchQuery = '', onClearSearch }) => {
  const { settings } = useSettings();
  const { addNotification } = useNotifications();
  const [taskState, setTaskState] = useState({
    pinned: [],
    todo: [],
    inProgress: [],
    done: [],
    cancelled: []
  });
  const [filteredTaskState, setFilteredTaskState] = useState({
    pinned: [],
    todo: [],
    inProgress: [],
    done: [],
    cancelled: []
  });
  const [loadingStates, setLoadingStates] = useState({
    pinned: false,
    todo: false,
    inProgress: false,
    done: false,
    cancelled: false
  });
  const [scrollPositions, setScrollPositions] = useState({});
  const [boardToClear, setBoardToClear] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const boardRefs = useRef({});
  const boardMenuRefs = useRef({});
  const [dateFormatKey, setDateFormatKey] = useState(Date.now());

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  // Update dateFormatKey when needed
  useEffect(() => {
    setDateFormatKey(prev => prev + 1);
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get('token');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await axios.get('http://localhost:9000/api/tasks', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      // Organize tasks by status
      const organizedTasks = {
        todo: [],
        inProgress: [],
        done: [],
        cancelled: [],
        pinned: []
      };

      const tasks = Array.isArray(response.data) ? response.data : [];
      console.log('Initial task load - All tasks:', tasks);

      tasks.forEach(task => {
        // Skip cancelled tasks
        const taskStatus = task.status.toLowerCase();
        if (taskStatus === 'cancelled' || taskStatus === 'canceled') {
          organizedTasks.cancelled.push(task);
          return;
        }

        // If task is pinned, only add it to pinned board
        if (task.pinned) {
          organizedTasks.pinned.push(task);
          return; // Skip adding to status boards if pinned
        }

        // Map API status values to board columns for unpinned tasks
        let boardStatus;
        switch(taskStatus) {
          case 'todo':
          case 'to do':
          case 'new':
            boardStatus = 'todo';
            break;
          case 'in progress':
          case 'in-progress':
          case 'inprogress':
            boardStatus = 'inProgress';
            break;
          case 'done':
          case 'completed':
          case 'complete':
            boardStatus = 'done';
            break;
          default:
            console.log('Skipping task with unknown status:', task);
            return; // Skip tasks with unknown status
        }
        
        // Add unpinned task to its status board
        if (organizedTasks[boardStatus]) {
          organizedTasks[boardStatus].push({
            ...task,
            status: boardStatus
          });
        }
      });

      console.log('Initial task load - Organized tasks:', organizedTasks);
      setTaskState(organizedTasks);
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
      setIsLoading(false);
    }
  };

  const fetchBoardTasks = async (columnId) => {
    try {
      console.log('Fetching tasks for board:', columnId);
      setLoadingStates(prev => ({
        ...prev,
        [columnId]: true
      }));

      const token = Cookies.get('token');
      if (!token) {
        console.log('No token found');
        return;
      }

      // Get all tasks to maintain proper state
      const response = await axios.get('http://localhost:9000/api/tasks', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      const tasks = Array.isArray(response.data) ? response.data : [];
      console.log('Board refresh - Fetched tasks:', tasks);
      
      setTaskState(prev => {
        const newState = { ...prev };
        // Keep other boards' tasks unchanged
        Object.keys(newState).forEach(board => {
          if (board !== columnId) {
            newState[board] = prev[board];
          }
        });

        // Update only the requested board's tasks
        if (columnId === 'pinned') {
          // For pinned board, show all pinned tasks
          newState[columnId] = tasks.filter(task => task.pinned);
        } else if (columnId === 'cancelled') {
          // For cancelled board, show all cancelled tasks that aren't pinned
          newState[columnId] = tasks.filter(task => {
            const status = task.status.toLowerCase();
            return !task.pinned && (status === 'cancelled' || status === 'canceled');
          }).map(task => ({
            ...task,
            status: 'cancelled'
          }));
        } else {
          newState[columnId] = tasks.filter(task => {
            // Skip pinned tasks and cancelled tasks
            if (task.pinned) return false;
            const taskStatus = task.status.toLowerCase();
            if (taskStatus === 'cancelled' || taskStatus === 'canceled') return false;
            
            // Map API status to board status
            let boardStatus;
            switch(taskStatus) {
              case 'in progress':
              case 'in-progress':
              case 'inprogress':
                boardStatus = 'inProgress';
                break;
              case 'done':
              case 'completed':
              case 'complete':
                boardStatus = 'done';
                break;
              case 'todo':
              case 'to do':
              case 'new':
                boardStatus = 'todo';
                break;
              default:
                console.log('Skipping task with unknown status:', task);
                return false;
            }
            
            // Return true if the mapped status matches the column
            return boardStatus === columnId;
          }).map(task => {
            // Map the status in the task object to match the board format
            let mappedStatus;
            switch(task.status.toLowerCase()) {
              case 'in progress':
              case 'in-progress':
              case 'inprogress':
                mappedStatus = 'inProgress';
                break;
              case 'done':
              case 'completed':
              case 'complete':
                mappedStatus = 'done';
                break;
              case 'todo':
              case 'to do':
              case 'new':
                mappedStatus = 'todo';
                break;
              default:
                return null;
            }
            
            return {
              ...task,
              status: mappedStatus
            };
          }).filter(Boolean); // Remove any null tasks from mapping
        }

        console.log('Board refresh - Updated board state:', {
          columnId,
          tasks: newState[columnId]
        });

        return newState;
      });

    } catch (error) {
      console.error('Error fetching board tasks:', error);
      throw error;
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [columnId]: false
      }));
    }
  };

  const handleUpdateTask = async (taskId, updates = {}) => {
    try {
      console.log('TaskBoard - Update task called with:', { taskId, updates });
      
      const token = Cookies.get('token');
      
      // Handle case where taskId is passed as an object containing _id
      const actualTaskId = typeof taskId === 'object' ? taskId._id : taskId;
      console.log('TaskBoard - Actual taskId:', actualTaskId);
      
      // Find the existing task first to ensure we have complete data
      const existingTask = Object.values(taskState).flat().find(task => task._id === actualTaskId) || 
                          Object.values(filteredTaskState).flat().find(task => task._id === actualTaskId);
      
      console.log('TaskBoard - Found existing task:', existingTask);
      
      if (!existingTask) {
        console.error('Task not found:', actualTaskId);
        toast.error('Failed to update task: Task not found');
        return;
      }

      // Map the status to the correct format for the API
      let apiStatus = existingTask.status; // Default to existing status
      if (updates && updates.status) {
        console.log('TaskBoard - Mapping status:', updates.status);
        switch(updates.status) {
          case 'todo':
            apiStatus = 'To Do';
            break;
          case 'inProgress':
            apiStatus = 'in progress';
            break;
          case 'done':
            apiStatus = 'done';
            break;
          case 'cancelled':
            apiStatus = 'cancelled';
            break;
        }
      }

      console.log('TaskBoard - Status mapping:', {
        originalStatus: updates?.status,
        apiStatus,
        existingStatus: existingTask.status
      });

      // Prepare updates with mapped status
      const apiUpdates = {
        ...(updates || {}),
        status: apiStatus
      };

      console.log('TaskBoard - Sending API update:', {
        taskId: actualTaskId,
        updates: apiUpdates
      });

      const response = await axios.put(`http://localhost:9000/api/tasks/${actualTaskId}`, apiUpdates, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('TaskBoard - API response:', response.data);

      if (response.data.state) {
        const oldStatus = existingTask.status;
        const isPinned = existingTask.pinned || false;

        // Update both taskState and filteredTaskState
        const updateState = (state) => {
          console.log('TaskBoard - Updating state:', {
            oldStatus,
            newStatus: updates?.status,
            isPinned,
            currentState: state
          });

          const newState = { ...state };
          // Remove task from all columns first
          Object.keys(newState).forEach(column => {
            if (Array.isArray(newState[column])) {
              newState[column] = newState[column].filter(t => t._id !== actualTaskId);
            }
          });

          // Create updated task with all properties
          const updatedTask = {
            ...existingTask,
            ...(updates || {}),
            status: updates?.status || existingTask.status,
            pinned: isPinned // Maintain pinned state unless explicitly changed
          };

          console.log('TaskBoard - Updated task object:', updatedTask);

          // If task is pinned and we're not unpinning it, keep it in pinned board
          if (isPinned && !('pinned' in (updates || {}))) {
            if (!newState.pinned) newState.pinned = [];
            newState.pinned.push(updatedTask);
          } else {
            // Add task to appropriate status board
            const targetColumn = updates?.status || oldStatus;
            if (!newState[targetColumn]) newState[targetColumn] = [];
            newState[targetColumn].push(updatedTask);
          }

          console.log('TaskBoard - New state after update:', newState);
          return newState;
        };

        setTaskState(prev => {
          console.log('TaskBoard - Updating taskState');
          return updateState(prev);
        });
        
        setFilteredTaskState(prev => {
          console.log('TaskBoard - Updating filteredTaskState, searchQuery:', searchQuery);
          if (searchQuery) {
            // If we're searching, update the search results
            const newState = { ...prev };
            if (newState.searchResults) {
              newState.searchResults = newState.searchResults.map(task => 
                task._id === actualTaskId ? {
                  ...task,
                  ...(updates || {}),
                  status: updates?.status || existingTask.status,
                  pinned: isPinned
                } : task
              );
            }
            console.log('TaskBoard - Updated search results:', newState.searchResults);
            return newState;
          }
          return updateState(prev);
        });

        toast.success('Task updated successfully');
        
        // Always send notifications for important task updates
        const shouldNotify = settings?.notifications?.taskUpdates !== false;
        if (shouldNotify) {
          addNotification({
            title: 'Task Updated',
            message: `Task "${updates.title || existingTask?.title || 'Untitled'}" has been updated`,
            type: 'task',
            actionType: 'status_change',
            taskId: actualTaskId,
            previousState: oldStatus,
            newState: updates?.status || oldStatus
          });
        }
        
        return response.data;
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      throw error;
    }
  };

  const handleToggleStar = async (taskId) => {
    try {
      const token = Cookies.get('token');
      
      let task = null;
      let taskBoard = null;
      Object.keys(taskState).forEach(boardId => {
        const foundTask = taskState[boardId].find(t => t._id === taskId);
        if (foundTask) {
          task = foundTask;
          taskBoard = boardId;
        }
      });

      if (!task) return;

      const newFavoriteStatus = !task.favorite;

      await axios.put(`http://localhost:9000/api/tasks/${taskId}`, 
        { favorite: newFavoriteStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setTaskState(prev => {
        const newState = { ...prev };
        newState[taskBoard] = newState[taskBoard].map(t => 
          t._id === taskId ? { ...t, favorite: newFavoriteStatus } : t
        );
        return newState;
      });

      // Add notification for favorite status change
      addNotification({
        title: newFavoriteStatus ? 'Task Marked as Favorite' : 'Task Removed from Favorites',
        message: `Task "${task.title}" has been ${newFavoriteStatus ? 'marked as favorite' : 'removed from favorites'}`,
        type: 'task',
        actionType: 'favorite_change',
        taskId,
        previousState: !newFavoriteStatus,
        newState: newFavoriteStatus
      });

      toast.success(newFavoriteStatus ? 'Task marked as favorite' : 'Task removed from favorites');
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDrop = async (taskId, sourceColumnId, targetColumnId) => {
    const token = Cookies.get('token');
    
    // Handle pinning/unpinning
    if (targetColumnId === 'pinned') {
      try {
        // Store the source column as previousStatus when pinning
        await axios.put(`http://localhost:9000/api/tasks/${taskId}`, { 
          pinned: true,
          previousStatus: sourceColumnId 
        }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setTaskState(prev => {
          const newTasks = { ...prev };
          let taskToPin = null;

          Object.keys(newTasks).forEach(boardId => {
            if (boardId !== 'pinned') {
              const taskIndex = newTasks[boardId].findIndex(t => t._id === taskId);
              if (taskIndex !== -1) {
                taskToPin = { 
                  ...newTasks[boardId][taskIndex], 
                  pinned: true,
                  previousStatus: sourceColumnId 
                };
                newTasks[boardId].splice(taskIndex, 1);
              }
            }
          });

          if (taskToPin) {
            if (!newTasks.pinned) newTasks.pinned = [];
            newTasks.pinned.push(taskToPin);

            // Add notification for pinning
            addNotification({
              title: 'Task Pinned',
              message: `Task "${taskToPin.title}" has been pinned to the board`,
              type: 'task',
              actionType: 'pin_change',
              taskId,
              previousState: sourceColumnId,
              newState: 'pinned'
            });
          }

          return newTasks;
        });

        toast.success('Task pinned successfully');
        return;
      } catch (error) {
        console.error('Error pinning task:', error);
        toast.error('Failed to pin task');
        return;
      }
    }

    // Handle unpinning
    if (sourceColumnId === 'pinned') {
      try {
        const task = taskState.pinned.find(t => t._id === taskId);
        const targetStatus = task?.previousStatus || targetColumnId;
        
        await axios.put(`http://localhost:9000/api/tasks/${taskId}`, { 
          pinned: false,
          status: targetStatus === 'inProgress' ? 'in progress' : targetStatus,
          previousStatus: null // Clear previousStatus when unpinning
        }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setTaskState(prev => {
          const newTasks = { ...prev };
          let taskToUnpin = null;

          const taskIndex = newTasks.pinned.findIndex(t => t._id === taskId);
          if (taskIndex !== -1) {
            taskToUnpin = { 
              ...newTasks.pinned[taskIndex], 
              pinned: false,
              previousStatus: null 
            };
            newTasks.pinned.splice(taskIndex, 1);
          }

          if (taskToUnpin) {
            if (!newTasks[targetStatus]) newTasks[targetStatus] = [];
            newTasks[targetStatus].push(taskToUnpin);

            // Add notification for unpinning
            addNotification({
              title: 'Task Unpinned',
              message: `Task "${taskToUnpin.title}" has been unpinned from the board`,
              type: 'task',
              actionType: 'pin_change',
              taskId,
              previousState: 'pinned',
              newState: targetStatus
            });
          }

          return newTasks;
        });

        toast.success('Task unpinned successfully');
        return;
      } catch (error) {
        console.error('Error unpinning task:', error);
        toast.error('Failed to unpin task');
        return;
      }
    }

    // Handle status changes
    if (sourceColumnId !== targetColumnId) {
      try {
        const updates = { 
          status: targetColumnId === 'inProgress' ? 'in progress' : 
                 targetColumnId === 'todo' ? 'To Do' : 
                 targetColumnId,
          // Reset validation and cancelled flags when moving to To Do
          validation: targetColumnId === 'todo' ? false : undefined,
          cancelled: targetColumnId === 'todo' ? false : undefined
        };
        
        await axios.put(`http://localhost:9000/api/tasks/${taskId}`, updates, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setTaskState(prev => {
          const newTasks = { ...prev };
          let taskToMove = null;

          const sourceIndex = newTasks[sourceColumnId].findIndex(t => t._id === taskId);
          if (sourceIndex !== -1) {
            taskToMove = { 
              ...newTasks[sourceColumnId][sourceIndex], 
              status: updates.status,
              validation: updates.validation !== undefined ? updates.validation : newTasks[sourceColumnId][sourceIndex].validation,
              cancelled: updates.cancelled !== undefined ? updates.cancelled : newTasks[sourceColumnId][sourceIndex].cancelled
            };
            newTasks[sourceColumnId].splice(sourceIndex, 1);
          }

          if (taskToMove) {
            if (!newTasks[targetColumnId]) newTasks[targetColumnId] = [];
            newTasks[targetColumnId].push(taskToMove);

            // Add notification for status change
            addNotification({
              title: 'Task Status Updated',
              message: `Task "${taskToMove.title}" moved to ${targetColumnId.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
              type: 'task',
              actionType: 'status_change',
              taskId,
              previousState: sourceColumnId,
              newState: targetColumnId
            });
          }

          return newTasks;
        });

        toast.success('Task status updated');
      } catch (error) {
        console.error('Error updating task status:', error);
        toast.error('Failed to update task status');
        fetchTasks(); // Revert on error
      }
    }
  };

  const handleMenuOpen = (columnId) => {
    setActiveMenu(activeMenu === columnId ? null : columnId)
  }

  const columns = [
    { 
      id: 'pinned', 
      title: 'Pinned Tasks', 
      icon: <BsPinFill className="w-4 h-4" />,
      headerClass: 'bg-yellow-50 border-yellow-200',
      iconButtonClass: 'hover:bg-yellow-100',
      color: 'yellow',
      description: 'Important pinned tasks'
    },
    { 
      id: 'todo', 
      title: 'To Do', 
      icon: <FiEdit2 className="w-4 h-4" />,
      headerClass: 'bg-blue-50 border-blue-200',
      iconButtonClass: 'hover:bg-blue-100',
      color: 'blue',
      description: 'Tasks to be started'
    },
    { 
      id: 'inProgress', 
      title: 'In Progress',
      icon: <FiRefreshCw className="w-4 h-4" />,
      headerClass: 'bg-orange-50 border-orange-200',
      iconButtonClass: 'hover:bg-orange-100',
      color: 'orange',
      description: 'Tasks being worked on'
    },
    { 
      id: 'done', 
      title: 'Done',
      icon: <FiCheckCircle className="w-4 h-4" />,
      headerClass: 'bg-green-50 border-green-200',
      iconButtonClass: 'hover:bg-green-100',
      color: 'green',
      description: 'Completed tasks'
    },
    { 
      id: 'cancelled', 
      title: 'Cancelled',
      icon: <FiX className="w-4 h-4" />,
      headerClass: 'bg-red-50 border-red-200',
      iconButtonClass: 'hover:bg-red-100',
      color: 'red',
      description: 'Cancelled tasks'
    }
  ];

  const visibleColumns = columns.filter(column => 
    settings.boardVisibility?.[column.id] !== false
  );

  const getColumnStyles = (columnId) => {
    const styles = {
      todo: {
        bg: 'bg-gradient-to-br from-blue-50 to-white border border-blue-100',
        text: 'text-blue-500',
        hover: 'hover:bg-blue-100',
        menuBorder: 'border-blue-100',
        menuHover: '#EBF5FF',
        menuText: 'text-blue-700'
      },
      inProgress: {
        bg: 'bg-gradient-to-br from-orange-50 to-white border border-orange-100',
        text: 'text-orange-500',
        hover: 'hover:bg-orange-100',
        menuBorder: 'border-orange-100',
        menuHover: '#FFF7ED',
        menuText: 'text-orange-700'
      },
      done: {
        bg: 'bg-gradient-to-br from-green-50 to-white border border-green-100',
        text: 'text-green-500',
        hover: 'hover:bg-green-100',
        menuBorder: 'border-green-100',
        menuHover: '#DCFCE7',
        menuText: 'text-green-700'
      },
      cancelled: {
        bg: 'bg-gradient-to-br from-red-50 to-white border border-red-100',
        text: 'text-red-500',
        hover: 'hover:bg-red-100',
        menuBorder: 'border-red-100',
        menuHover: '#FEE2E2',
        menuText: 'text-red-700'
      },
      pinned: {
        bg: 'bg-gradient-to-br from-yellow-50 to-white border border-yellow-100',
        text: 'text-yellow-500',
        hover: 'hover:bg-yellow-100',
        menuBorder: 'border-yellow-100',
        menuHover: '#FEF9C3',
        menuText: 'text-yellow-700'
      }
    }
    return styles[columnId]
  }

  const handleMoveTask = (taskId, fromColumn, toColumn) => {
    handleDrop(taskId, fromColumn, toColumn)
  };

  const handleRemoveTask = async (taskId, columnId) => {
    try {
      const token = Cookies.get('token');
      
      // Find the task before deleting it
      const deletedTask = taskState[columnId]?.find(task => task._id === taskId);
      
      // Update UI state immediately
      setTaskState(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(column => {
          newState[column] = Array.isArray(newState[column]) 
            ? newState[column].filter(task => task._id !== taskId)
            : [];
        });
        return newState;
      });

      // Make API call
      await axios.delete(`http://localhost:9000/api/tasks/${taskId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Add notification for task deletion
      if (deletedTask) {
        addNotification({
          title: 'Task Deleted',
          message: `Task "${deletedTask.title}" has been deleted`,
          type: 'task',
          actionType: 'delete',
          taskId,
          previousState: columnId,
          newState: null
        });
      }

      toast.success('Task deleted successfully');
      // Close any open menus
      setActiveMenu(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      // Revert the state if API call fails
      fetchTasks();
    }
  };

  const handleClearBoard = (columnId) => {
    setBoardToClear(columnId);
    setActiveMenu(null);
  };

  const handleReloadBoard = async (columnId) => {
    try {
      await fetchBoardTasks(columnId);
      toast.success(`${columnId.charAt(0).toUpperCase() + columnId.slice(1)} board refreshed successfully`);
    } catch (error) {
      console.error('Error reloading board:', error);
      toast.error(`Failed to reload ${columnId} board`);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu) {
        const menuRef = boardMenuRefs.current[activeMenu];
        if (menuRef && !menuRef.contains(event.target)) {
          setActiveMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  const boardMenuItems = [
    { 
      icon: <FiTrash2 className="w-4 h-4" />, 
      label: 'Clear Board', 
      color: 'text-red-600',
      onClick: (columnId) => handleClearBoard(columnId)
    }
  ]

  useEffect(() => {
    const handleBoardScroll = (columnId) => {
      const board = boardRefs.current[columnId]
      if (board) {
        setScrollPositions(prev => ({
          ...prev,
          [columnId]: board.scrollLeft
        }));
      }
    }

    Object.keys(boardRefs.current).forEach(columnId => {
      const board = boardRefs.current[columnId]
      if (board) {
        board.addEventListener('scroll', () => handleBoardScroll(columnId))
        // Initialize scroll positions
        handleBoardScroll(columnId)
      }
    })

    return () => {
      Object.keys(boardRefs.current).forEach(columnId => {
        const board = boardRefs.current[columnId]
        if (board) {
          board.removeEventListener('scroll', () => handleBoardScroll(columnId))
        }
      })
    }
  }, [taskState])

  const handleAddTask = (columnId) => {
    // Add task functionality will be implemented later
    console.log('Add task functionality coming soon:', columnId)
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTaskState(taskState);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    
    // Create a single array of all matching tasks with their source board
    const matchingTasks = Object.keys(taskState).reduce((matches, boardKey) => {
      const boardMatches = taskState[boardKey]
        .filter(task => 
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.category?.toLowerCase().includes(query)
        )
        .map(task => ({
          ...task,
          sourceBoard: boardKey
        }));
      return [...matches, ...boardMatches];
    }, []);

    // When there are search results, show only the results board
    if (matchingTasks.length > 0) {
      setFilteredTaskState({
        todo: [],
        inProgress: [],
        done: [],
        cancelled: [],
        pinned: [],
        searchResults: matchingTasks
      });
    } else {
      // If no results, show empty states in all boards
      setFilteredTaskState({
        todo: [],
        inProgress: [],
        done: [],
        cancelled: [],
        pinned: []
      });
    }
  }, [searchQuery, taskState]);

  const handleArchiveTask = async (taskId) => {
    try {
      const token = Cookies.get('token');
      const task = Object.values(taskState)
        .flat()
        .find(t => t._id === taskId);

      if (!task) return;

      // Update UI state immediately
      setTaskState(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(boardKey => {
          newState[boardKey] = newState[boardKey].filter(t => t._id !== taskId);
        });
        return newState;
      });

      // Make API call to archive the task
      await axios.put(`http://localhost:9000/api/tasks/${taskId}/archive`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Add notification
      if (settings?.notifications?.taskUpdates !== false) {
        addNotification({
          title: 'Task Archived',
          message: `Task "${task.title}" has been archived`,
          type: 'info',
          timestamp: new Date().toISOString()
        });
      }

      toast.success('Task archived successfully');
    } catch (error) {
      console.error('Error archiving task:', error);
      toast.error('Failed to archive task');
      // Revert the state if API call fails
      fetchTasks();
    }
  };

  if (isLoading) {
    return <BoardSkeleton />;
  }

  return (
    <div className="flex flex-col space-y-6 relative z-0">
      {/* Clear Board Modal */}
      <AnimatePresence>
        {boardToClear && (
          <ClearBoardModal
            boardName={columns.find(col => col.id === boardToClear)?.title || boardToClear}
            taskCount={filteredTaskState[boardToClear]?.length || 0}
            onClose={() => {
              setBoardToClear(null);
              setActiveMenu(null);
            }}
            onConfirm={async () => {
              try {
                const token = Cookies.get('token');
                const tasksToDelete = filteredTaskState[boardToClear] || [];
                const boardTitle = columns.find(col => col.id === boardToClear)?.title || boardToClear;
                
                if (tasksToDelete.length === 0) {
                  setBoardToClear(null);
                  return;
                }

                // Update UI state immediately
                setTaskState(prev => ({
                  ...prev,
                  [boardToClear]: []
                }));

                // Delete all tasks in the column
                await Promise.all(tasksToDelete.map(async (task) => {
                  await axios.delete(`http://localhost:9000/api/tasks/${task._id}`, {
                    headers: { 
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                }));

                // Add notification for board clear with simplified format
                if (settings?.notifications?.taskUpdates !== false) {
                  addNotification({
                    title: `${boardTitle} Board Cleared`,
                    message: `${tasksToDelete.length} ${tasksToDelete.length === 1 ? 'task was' : 'tasks were'} deleted`,
                    type: 'success',
                    timestamp: new Date().toISOString()
                  });
                }

                toast.success('Board cleared successfully');
                setBoardToClear(null);
              } catch (error) {
                console.error('Error clearing board:', error);
                toast.error('Failed to clear board');
                // Revert the state if API call fails
                fetchTasks();
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Search Results or Board Content */}
      {searchQuery && filteredTaskState.searchResults?.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiSearch className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-lg">Search Results</h2>
                  <p className="text-sm text-gray-500">
                    Found {filteredTaskState.searchResults.length} matching {filteredTaskState.searchResults.length === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-full font-medium">
                  {filteredTaskState.searchResults.length}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
          <div 
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50 divide-y divide-gray-100"
            style={{ maxHeight: 'calc(100vh - 13rem)' }}
          >
            <AnimatePresence>
              {filteredTaskState.searchResults.map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.2,
                    delay: index * 0.05
                  }}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <TaskCard
                    task={task}
                    columnId={task.sourceBoard}
                    onMoveTask={handleMoveTask}
                    onRemoveTask={handleRemoveTask}
                    onUpdateTask={handleUpdateTask}
                    onToggleStar={handleToggleStar}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : searchQuery ? (
        <Noresults 
          query={searchQuery}
          onClearSearch={onClearSearch}
        />
      ) : (
        visibleColumns.map((column, index) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.1
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              data-column-id={column.id}
              className={`p-4 rounded-lg w-full column-drop-zone shadow-sm h-[350px] flex flex-col relative ${getColumnStyles(column.id).bg}`}
            >
              {loadingStates[column.id] ? (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-50">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : null}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <h2 className="font-medium text-gray-900">{column.title}</h2>
                  <span className={`ml-2 inline-flex items-center justify-center px-3.5 py-1.5 text-sm font-medium rounded-full
                    ${column.id === 'todo' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      column.id === 'inProgress' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                      column.id === 'done' ? 'bg-green-50 text-green-700 border border-green-100' :
                      column.id === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                    transition-all duration-200 min-w-[28px] shadow-sm`}>
                    {(filteredTaskState[column.id] || []).length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button 
                    whileHover={{ scale: 1.2, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReloadBoard(column.id)}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`p-1.5 rounded-md ${getColumnStyles(column.id).text} ${getColumnStyles(column.id).iconButtonClass} cursor-pointer`}
                  >
                    <FiRefreshCw className="w-5 h-5" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleClearBoard(column.id)}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`p-1.5 rounded-md ${getColumnStyles(column.id).text} ${getColumnStyles(column.id).iconButtonClass} cursor-pointer`}
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="relative flex-1">
                <div
                  ref={el => boardRefs.current[column.id] = el}
                  className="flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth h-[350px] py-2 px-4"
                  style={{ width: '100%' }}
                  onScroll={(e) => {
                    const target = e.target;
                    setScrollPositions(prev => ({
                      ...prev,
                      [column.id]: e.target.scrollLeft
                    }));
                  }}
                >
                  {(filteredTaskState[column.id] || []).length > 0 ? (
                    (filteredTaskState[column.id] || []).map((task) => (
                      <div 
                        key={`${task._id}-${column.id}-${dateFormatKey}`} 
                        className="flex-shrink-0"
                        style={{ 
                          width: `${CARD_DIMENSIONS.width}px`,
                          minWidth: `${CARD_DIMENSIONS.width}px`,
                          maxWidth: `${CARD_DIMENSIONS.width}px`
                        }}
                      >
                        <TaskCard
                          task={task}
                          columnId={column.id}
                          onMoveTask={handleMoveTask}
                          onRemoveTask={handleRemoveTask}
                          onUpdateTask={(updates) => handleUpdateTask(task._id, updates)}
                          onToggleStar={() => handleToggleStar(task._id)}
                          larger={task.fromTodo}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center -mt-32">
                      <EmptyState 
                        title={searchQuery ? 'No matching tasks' : `No ${column.title.toLowerCase()} tasks`} 
                        columnId={column.id}
                      />
                    </div>
                  )}
                </div>
                
                {/* Scroll Arrows */}
                {(filteredTaskState[column.id] || []).length > 1 && (
                  <>
                    {/* Left Arrow */}
                    <AnimatePresence>
                      {scrollPositions[column.id] > 0 && (
                        <motion.button
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          onClick={() => handleScroll(column.id, 'left')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-6 h-6 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {/* Right Arrow */}
                    <AnimatePresence>
                      {boardRefs.current[column.id] && 
                       (filteredTaskState[column.id] || []).length * CARD_DIMENSIONS.width > boardRefs.current[column.id].clientWidth && 
                       (!scrollPositions[column.id] || 
                        scrollPositions[column.id] < 
                        boardRefs.current[column.id].scrollWidth - boardRefs.current[column.id].clientWidth) && (
                        <motion.button
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          onClick={() => handleScroll(column.id, 'right')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-6 h-6 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ))
      )}
    </div>
  )
}

export default TaskBoard;
