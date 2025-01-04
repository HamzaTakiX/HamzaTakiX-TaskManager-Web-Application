'use client';
import { useState, useEffect } from 'react';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import axios from 'axios';
import Cookies from 'js-cookie';
import Notification from '../Shared/Notification';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useTask } from '../../_context/TaskContext';
import { useSearchParams } from 'next/navigation';

export default function TasksContainer() {
  const [activeTab, setActiveTab] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: 'info', message: '' });
  const { setTaskCount } = useTask();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'manual') {
      setActiveTab('manual');
    }
  }, [searchParams]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const closeNotification = () => {
    setNotification({ show: false, message: '', type: 'info' });
  };

  const fetchTasks = async () => {
    console.log('🔄 Fetching tasks from server...');
    try {
      const token = Cookies.get('token');
      const response = await axios.get('http://localhost:9000/api/tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('📥 Raw response:', response.data);

      if (response.data) {
        console.log('✅ Tasks fetched successfully');
        // Handle both response formats
        const allTasks = response.data.state ? response.data.tasks : response.data;
        console.log('📋 Tasks to set:', allTasks);
        setTasks(allTasks || []);
        
        // Update task count to only include todo tasks
        const todoTasks = allTasks.filter(task => {
          const normalizedStatus = task.status?.toLowerCase().trim().replace(/\s+/g, '');
          const isTodoStatus = ['todo', 'to-do', 'todo'].includes(normalizedStatus);
          return isTodoStatus && !task.cancelled && !task.validation;
        });
        setTaskCount(todoTasks.length);
        console.log('📊 Todo tasks count updated:', todoTasks.length);
      } else {
        console.error('❌ Invalid response format:', response.data);
        setTasks([]);
        setTaskCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please try again later.');
      setTasks([]);
      setTaskCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskAdded = async (newTask) => {
    console.log('✨ New task added:', newTask);
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, newTask];
      console.log('📋 Updated tasks list:', updatedTasks);
      return updatedTasks;
    });
    setActiveTab('list');
  };

  const handleUpdateTask = async (updatedTask) => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make sure we have a valid task ID
      if (!updatedTask._id) {
        throw new Error('Task ID is missing');
      }

      console.log('🔄 Starting task update process...');

      // Optimistically update UI
      setTasks(prev => {
        console.log('🔄 Optimistic update applied');
        return prev.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
      });

      const response = await axios.put(`http://localhost:9000/api/tasks/${updatedTask._id}`, updatedTask, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        console.log('✅ Task updated successfully on server');
        
        // Update with server data
        setTasks(prev => {
          console.log('🔄 Updating state with server response');
          return prev.map(task => 
            task._id === response.data._id ? response.data : task
          );
        });
        
        showNotification('Task updated successfully!', 'success');
        
        // Fetch fresh data from server
        console.log('🔄 Fetching fresh data from server...');
        await fetchTasks();
        console.log('✅ Fresh data fetched and state updated');
        
        return response.data;
      } else {
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.log('❌ Error during task update:', error);
      // Revert optimistic update on error
      await fetchTasks();
      console.error('Error updating task:', error);
      showNotification(error.response?.data?.message || 'Failed to update task', 'error');
      throw error;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.delete(`http://localhost:9000/api/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setTasks(prev => prev.filter(task => task.id !== taskId));
      showNotification('Task deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification('Failed to delete task', 'error');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center min-h-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm font-medium">Loading tasks...</p>
        </div>
      );
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    switch (activeTab) {
      case 'list':
        return <TaskList 
          tasks={tasks} 
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onSwitchTab={setActiveTab} 
        />;
      case 'manual':
        return <TaskForm onTaskAdded={handleTaskAdded} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Navigation Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm">
              <motion.button
                onClick={() => setActiveTab('list')}
                className={`relative px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${
                  activeTab === 'list'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === 'list' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 rounded-lg"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Task List</span>
              </motion.button>

              <motion.button
                onClick={() => setActiveTab('manual')}
                className={`relative px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${
                  activeTab === 'manual'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === 'manual' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Manual Entry</span>
              </motion.button>
            </div>
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col justify-center items-center min-h-[400px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-base font-medium">Loading your tasks...</p>
                <p className="mt-2 text-gray-500 dark:text-gray-500 text-sm">Please wait a moment</p>
              </div>
            </motion.div>
          </AnimatePresence>

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
                  onClose={closeNotification}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm">
            <motion.button
              onClick={() => setActiveTab('list')}
              className={`relative px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${
                activeTab === 'list'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === 'list' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 rounded-lg"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">Task List</span>
            </motion.button>

            <motion.button
              onClick={() => setActiveTab('manual')}
              className={`relative px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${
                activeTab === 'manual'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === 'manual' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">Manual Entry</span>
            </motion.button>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

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
                onClose={closeNotification}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
