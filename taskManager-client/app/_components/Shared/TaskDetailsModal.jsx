import { FiX, FiClock, FiCheckCircle, FiChevronDown, FiChevronUp, FiClipboard } from 'react-icons/fi';
import { BsClockHistory } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import useNotifications from '@/app/_hooks/useNotifications';

const TaskDetailsModal = ({ task, onClose, onUpdate }) => {
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
            durationInDays === 1 ? '1' :
            `${durationInDays}`
    };
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50/80 rounded-t-xl backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100/80 p-2.5 rounded-lg shadow-sm">
              <FiClipboard className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center justify-between">
              Task Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200 hover:shadow-sm"
          >
            <FiX className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status and Priority Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Status</h3>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                  task.status.toLowerCase().replace(/[- ]/g, '') === 'todo' ? 'bg-blue-100 text-blue-800' :
                  task.status.toLowerCase().replace(/[- ]/g, '') === 'inprogress' ? 'bg-yellow-100 text-yellow-800' :
                  task.status.toLowerCase().replace(/[- ]/g, '') === 'done' ? 'bg-green-100 text-green-800' :
                  task.status.toLowerCase().replace(/[- ]/g, '') === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {task.status}
                </span>
              </div>
            </div>

            {task.priority && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Priority</h3>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Category</h3>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                  {task.category || 'General'}
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Title</h3>
            <p className="text-gray-800 font-medium">
              {task.title}
            </p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Description</h3>
            <div className={`${isDescriptionExpanded ? 'max-h-[400px]' : 'max-h-[100px]'} overflow-y-auto transition-all duration-300`}>
              {task.description ? (
                <p className={`text-gray-700 whitespace-pre-wrap break-words ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                  {task.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}
            </div>
            {task.description && task.description.length > 150 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                {isDescriptionExpanded ? (
                  <>Show Less <FiChevronUp className="ml-1 w-4 h-4" /></>
                ) : (
                  <>Show More <FiChevronDown className="ml-1 w-4 h-4" /></>
                )}
              </button>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <FiClock className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm">
                    Start: <span className="font-medium">{formatDate(task.startDate || task.createdAt)}</span>
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <FiCheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm">
                    Due: <span className="font-medium">{formatDate(task.endDate || task.dueDate)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Time Remaining</h3>
              <div>
                {task.startDate && task.dueDate && (() => {
                  const { days, color, text } = calculateTimeRemaining(task.startDate, task.dueDate);
                  return (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-base font-medium ${
                      color === 'red' ? 'bg-red-100 text-red-800' :
                      color === 'orange' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      <BsClockHistory className="w-5 h-5" />
                      {text === 'Overdue' ? text : <>{text} days left</>}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};

export default TaskDetailsModal;
