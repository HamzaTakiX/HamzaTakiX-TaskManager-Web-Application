import { FiX, FiClock, FiCheckCircle, FiChevronDown, FiChevronUp, FiClipboard } from 'react-icons/fi';
import { BsClockHistory } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import useNotifications from '@/app/_hooks/useNotifications';

const TaskvalidationModal = ({ task, onClose, onUpdate }) => {
  if (!task) return null;

  const { addNotification } = useNotifications();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d instanceof Date && !isNaN(d) 
      ? d.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
      : '';
  };

  const calculateTimeRemaining = (startDate, dueDate) => {
    const start = new Date(startDate);
    const due = new Date(dueDate);
    const durationInDays = Math.ceil((due - start) / (1000 * 60 * 60 * 24));
    
    return {
      days: durationInDays,
      color: durationInDays <= 0 ? 'red' : durationInDays <= 7 ? 'orange' : 'green',
      text: durationInDays <= 0 ? 'Overdue' : 
            durationInDays === 1 ? '1 day' :
            `${durationInDays} days`
    };
  };

  const TimeRemainingBadge = ({ startDate, dueDate }) => {
    const { days, color, text } = calculateTimeRemaining(startDate, dueDate);
    
    const colorClasses = {
      red: 'bg-red-100 text-red-800 border border-red-200',
      orange: 'bg-orange-100 text-orange-800 border border-orange-200',
      green: 'bg-green-100 text-green-800 border border-green-200'
    };

    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${colorClasses[color]}`}>
        <BsClockHistory className="w-4 h-4 mr-2" />
        {text}
      </span>
    );
  };

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get('token');
      
      // Preserve the original dates when updating the task
      const updatedTask = {
        ...task,
        cancelled: true,
        validation: false,
        status: 'cancelled',
        startDate: task.startDate,
        endDate: task.endDate,
        dueDate: task.dueDate
      };

      const response = await axios.put(`/api/tasks/${task._id}`, 
        { 
          cancelled: true,
          validation: false,
          status: 'cancelled',
          startDate: task.startDate,
          endDate: task.endDate,
          dueDate: task.dueDate
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.state) {
        toast.success('Task cancelled successfully');
        
        // Add notification for task cancellation
        await addNotification({
          type: 'error',
          title: 'Task Cancelled',
          message: `Task "${task.title}" has been cancelled`,
          timestamp: new Date().toISOString()
        });
        
        // Update task list with the updated task data
        if (onUpdate) {
          await onUpdate(updatedTask);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Error cancelling task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get('token');
      const response = await axios.put(`/api/tasks/${task._id}`, 
        { 
          validation: true,
          cancelled: false,
          status: 'In Progress'
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.state) {
        toast.success('Task validated successfully');
        
        // Add notification for task validation
        await addNotification({
          type: 'success',
          title: 'Task Validated',
          message: `Task "${task.title}" has been validated`,
          timestamp: new Date().toISOString()
        });
        
        // Update task list with the updated task data
        if (onUpdate) {
          const updatedTask = {
            ...task,
            validation: true,
            cancelled: false,
            status: 'In Progress'
          };
          await onUpdate(updatedTask);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error validating task:', error);
      toast.error('Error validating task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-xl shadow-sm">
              <FiClipboard className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Task Details</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Status and Category Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Status</h3>
              <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                task.status === 'todo' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                task.status === 'done' ? 'bg-green-100 text-green-800 border border-green-200' :
                'bg-purple-100 text-purple-800 border border-purple-200'}`}>
                {task.status === 'todo' ? 'To Do' :
                 task.status === 'in-progress' ? 'In Progress' :
                 task.status === 'done' ? 'Done' : 'Pinned'}
              </span>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Category</h3>
              <span className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 inline-block">
                {task.category || 'Design System'}
              </span>
            </motion.div>

            {task.priority && (
              <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Priority</h3>
                <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  'bg-green-100 text-green-800 border border-green-200'}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </motion.div>
            )}
          </div>

          {/* Title */}
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Title</h3>
            <div className="relative">
              <p className="text-lg text-gray-900 font-medium whitespace-pre-wrap break-words">
                {task.title}
              </p>
            </div>
          </motion.div>

          {/* Description */}
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Description</h3>
            <div className="relative">
              <div className={`${isDescriptionExpanded ? 'max-h-[400px] overflow-y-auto' : ''}`}>
                <p className={`text-gray-700 whitespace-pre-wrap break-words ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}>
                  {task.description || 'No description provided'}
                </p>
              </div>
              {task.description && task.description.length > 300 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-4 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center transition-colors"
                >
                  {isDescriptionExpanded ? (
                    <>
                      Show Less <FiChevronUp className="ml-2" />
                    </>
                  ) : (
                    <>
                      Show More <FiChevronDown className="ml-2" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Dates and Time Left */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start and End Dates */}
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-4">Dates</h3>
              <div className="space-y-4">
                <div className="flex items-center text-gray-700 bg-blue-50 p-3 rounded-lg">
                  <FiClock className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-sm">
                    Start Date: <span className="font-semibold ml-1">{formatDate(task.startDate || task.createdAt)}</span>
                  </span>
                </div>
                <div className="flex items-center text-gray-700 bg-green-50 p-3 rounded-lg">
                  <FiCheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm">
                    End Date: <span className="font-semibold ml-1">{formatDate(task.endDate || task.dueDate)}</span>
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Time Left */}
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-4">Time Left</h3>
              <div className="flex items-center p-4 rounded-lg">
                <TimeRemainingBadge startDate={task.startDate} dueDate={task.dueDate} />
              </div>
            </motion.div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <motion.div whileHover={{ scale: 1.01 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gradient-to-r from-gray-50 to-white p-6 rounded-b-xl">
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel Task
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleValidate}
              disabled={isLoading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Validate Task
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
    </>
  );
};

export default TaskvalidationModal;
