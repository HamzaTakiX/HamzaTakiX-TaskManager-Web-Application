'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import api from '../_utils/axiosConfig'
import { useAuth } from './AuthContext'

const TaskContext = createContext()

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([])
  const [taskCount, setTaskCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [selectedTasks, setSelectedTasks] = useState([])
  const [viewPreferences, setViewPreferences] = useState({
    view: 'list',
    sortBy: 'dueDate',
    sortOrder: 'asc',
    filters: {
      priority: 'all',
      status: 'all',
      dueDate: 'all',
      category: 'all'
    }
  })

  const updateTaskCount = useCallback(async () => {
    if (!isAuthenticated) {
      setTaskCount(0);
      return;
    }

    try {
      const response = await api.get('/tasks');
      
      // Handle both response formats (with and without .state)
      const tasksData = response.data.state ? response.data.tasks : response.data;
      
      if (Array.isArray(tasksData)) {
        const todoTasks = tasksData.filter(task => {
          // Log each task for debugging
          console.log('Processing task:', {
            id: task.id,
            title: task.title,
            status: task.status,
            cancelled: task.cancelled,
            validation: task.validation
          });
          return !task.cancelled && !task.validation;
        });
        console.log('Todo tasks count:', todoTasks.length);
        setTaskCount(todoTasks.length);
        localStorage.setItem('taskCount', todoTasks.length.toString());
      } else {
        console.error('Invalid tasks data format:', tasksData);
      }
    } catch (error) {
      console.error('Error updating task count:', error);
      // On error, try to use the stored count
      const storedCount = localStorage.getItem('taskCount');
      if (storedCount) {
        setTaskCount(parseInt(storedCount));
      }
    }
  }, [isAuthenticated]);

  // Initialize task count from localStorage after mount
  useEffect(() => {
    const storedCount = localStorage.getItem('taskCount');
    if (storedCount) {
      setTaskCount(parseInt(storedCount));
    }
  }, []);

  // Update count when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      updateTaskCount();
    }
  }, [isAuthenticated, updateTaskCount]);

  // Fetch tasks when authenticated
  useEffect(() => {
    const fetchTasks = async () => {
      if (!isAuthenticated || authLoading) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get('/tasks');
        
        if (response.data.state) {
          const activeTasks = response.data.tasks.filter(task => !task.cancelled);
          setTasks(activeTasks);
          setTaskCount(activeTasks.length);
          localStorage.setItem('taskCount', activeTasks.length.toString());
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [isAuthenticated, authLoading]);

  // View management
  const changeView = useCallback((newView) => {
    setViewPreferences(prev => ({
      ...prev,
      view: newView
    }))
  }, [])

  // Export functions
  const exportAsCSV = useCallback(async () => {
    try {
      console.log('Fetching tasks for CSV export...')
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await api.get('/tasks');
      
      console.log('API Response:', response.data)
      
      if (response.data) {
        // Include validated tasks, only filter out cancelled ones
        const realTasks = response.data.filter(task => !task.cancelled)
        console.log('Filtered tasks:', realTasks, 'Total:', realTasks.length)
        
        if (!Array.isArray(realTasks) || realTasks.length === 0) {
          console.error('No tasks to export after filtering')
          throw new Error('No tasks available to export')
        }

        const headers = ['Title', 'Description', 'Start Date', 'Due Date', 'Priority', 'Status', 'Category', 'Validated']
        const csvContent = realTasks.map(task => [
          task.title || '',
          task.description || '',
          task.startDate || '',
          task.endDate || '',
          task.priority || 'normal',
          task.status || 'pending',
          task.category || '',
          task.validation ? 'Yes' : 'No'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))

        const csv = [headers.join(','), ...csvContent].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        console.log('CSV export completed successfully')
      } else {
        console.error('No data received from server')
        throw new Error('No data received from server')
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      throw error
    }
  }, [])

  const exportAsPDF = useCallback(async () => {
    try {
      console.log('Fetching tasks for PDF export...')
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await api.get('/tasks');
      
      console.log('API Response:', response.data)
      
      if (response.data) {
        // Include validated tasks, only filter out cancelled ones
        const realTasks = response.data.filter(task => !task.cancelled)
        console.log('Filtered tasks:', realTasks, 'Total:', realTasks.length)
        
        if (!Array.isArray(realTasks) || realTasks.length === 0) {
          console.error('No tasks to export after filtering')
          throw new Error('No tasks available to export')
        }

        const doc = new jsPDF()
        const headers = ['Title', 'Start Date', 'Due Date', 'Priority', 'Status', 'Category', 'Validated']
        const tableData = realTasks.map(task => [
          task.title || '',
          task.startDate || '',
          task.endDate || '',
          task.priority || 'normal',
          task.status || 'pending',
          task.category || '',
          task.validation ? 'Yes' : 'No'
        ])

        doc.setFontSize(20)
        doc.text('Tasks List', 14, 15)
        doc.setFontSize(10)
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)

        doc.autoTable({
          startY: 25,
          head: [headers],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 25 },
            6: { cellWidth: 20 }
          }
        })

        doc.save(`tasks_${new Date().toISOString().split('T')[0]}.pdf`)
        console.log('PDF export completed successfully')
      } else {
        console.error('No data received from server')
        throw new Error('No data received from server')
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      throw error
    }
  }, [])

  const refreshTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await api.get('/tasks');

      if (response.data) {
        // Trigger a task count update
        await updateTaskCount()
        return true
      }
      return false
    } catch (error) {
      console.error('Error refreshing tasks:', error)
      return false
    }
  }, [])

  // Task management functions
  const completeTasks = useCallback((taskIds) => {
    setTasks(prev => prev.map(task => 
      taskIds.includes(task.id) ? { ...task, status: 'completed' } : task
    ))
    setSelectedTasks([])
  }, [])

  const deleteTasks = useCallback(async (taskIds) => {
    try {
      await Promise.all(taskIds.map(id => 
        api.delete(`/tasks/${id}`)
      ))
      setTasks(prevTasks => prevTasks.filter(task => !taskIds.includes(task.id)))
      // Update task count after deletion
      const response = await api.get('/tasks');
      if (response.data.state) {
        const activeTasks = response.data.tasks.filter(task => !task.cancelled && !task.validation)
        setTaskCount(activeTasks.length)
      }
    } catch (error) {
      console.error('Error deleting tasks:', error)
      throw error
    }
  }, [])

  const addTask = useCallback(async (task) => {
    try {
      const formattedTask = {
        ...task,
        startDate: task.startDate ? new Date(task.startDate).toISOString() : null,
        endDate: task.endDate ? new Date(task.endDate).toISOString() : null
      }

      const response = await api.post('/tasks', formattedTask);

      if (!response.data || !response.data.state) {
        throw new Error(response.data?.message || 'Failed to add task')
      }

      setTasks(prevTasks => [...prevTasks, response.data.task])
      await updateTaskCount()
      return response.data.task
    } catch (error) {
      console.error('Error adding task:', error)
      throw error
    }
  }, [])

  const updateTask = useCallback(async (updatedTask) => {
    try {
      const response = await api.put(`/tasks/${updatedTask._id}`, updatedTask);

      if (!response.data || !response.data.state) {
        throw new Error(response.data?.message || 'Failed to update task');
      }

      const updatedTaskData = response.data.task || updatedTask;
      
      // Update tasks state
      setTasks(prevTasks => {
        const newTasks = [...prevTasks];
        const taskIndex = newTasks.findIndex(t => t._id === updatedTask._id);
        
        if (taskIndex !== -1) {
          newTasks[taskIndex] = updatedTaskData;
        }
        return newTasks;
      });

      // Update task count
      await updateTaskCount();
      
      return updatedTaskData;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [updateTaskCount]); // Add updateTaskCount to dependencies

  // Filter and sort functions
  const sortTasks = useCallback((sortBy, sortOrder) => {
    setViewPreferences(prev => ({
      ...prev,
      sortBy,
      sortOrder
    }))
  }, [])

  const applyFilters = useCallback((newFilters) => {
    setViewPreferences(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters
      }
    }))
  }, [])

  const value = {
    tasks,
    taskCount,
    setTaskCount,
    updateTaskCount,
    viewPreferences,
    changeView,
    selectedTasks,
    setSelectedTasks,
    isLoading,
    exportAsCSV,
    exportAsPDF,
    refreshTasks,
    completeTasks,
    deleteTasks,
    addTask,
    updateTask,
    sortTasks,
    applyFilters
  }

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
}

export const useTask = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}
