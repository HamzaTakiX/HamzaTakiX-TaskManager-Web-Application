import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const DeleteCardModal = ({ task, onClose, onConfirm }) => {
  if (!task) return null;

  // Function to truncate and format the task title
  const formatTaskTitle = (title) => {
    if (!title) return 'Untitled Task';
    if (title.length <= 40) return title;
    return `${title.substring(0, 37)}...`;
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
        className="bg-white rounded-lg shadow-xl w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">Delete Task</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
          <div className="text-gray-800 bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2 truncate hover:text-clip hover:whitespace-normal" title={task.title}>
              {formatTaskTitle(task.title)}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 hover:line-clamp-none break-words" title={task.description}>
              {task.description || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(task._id, task.status);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
          >
            Delete Task
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteCardModal;
