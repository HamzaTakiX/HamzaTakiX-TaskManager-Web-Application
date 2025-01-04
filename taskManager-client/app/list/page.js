'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import TaskList from '../_components/List/TaskList'
import TaskListGrid from '../_components/List/TaskListGrid'
import OverviewMenu from '../_components/Shared/OverviewMenu'
import TaskHeader from '../_components/List/ListTaskHeader'
import TaskFilters from '../_components/List/TaskFilters'
import Sidebar from '../_components/Shared/Sidebar'
import { useTask } from '../_context/TaskContext'

export default function ListPage() {
  const { viewPreferences, tasks, addTask, deleteTasks, updateTask } = useTask()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState({
    priority: 'all',
    status: 'all',
    category: 'all'
  });

  // Calculate dates for 10 days from now
  const today = new Date()
  const tenDaysFromNow = new Date(today)
  tenDaysFromNow.setDate(today.getDate() + 10)
  
  const startDate = today.toISOString().split('T')[0]
  const endDate = tenDaysFromNow.toISOString().split('T')[0]

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleFilterChange = useCallback((newFilters) => {
    setActiveFilters(newFilters);
  }, []);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      const searchMatch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const categoryMatch = activeFilters.category === 'all' || 
        task.category === activeFilters.category;

      // Priority filter
      const priorityMatch = activeFilters.priority === 'all' || 
        task.priority === activeFilters.priority;

      // Status filter
      const statusMatch = activeFilters.status === 'all' || 
        task.status === activeFilters.status;

      return searchMatch && categoryMatch && priorityMatch && statusMatch;
    });
  }, [tasks, searchQuery, activeFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <OverviewMenu />
        <TaskHeader />
        <TaskFilters 
          onSearch={setSearchQuery} 
          searchQuery={searchQuery} 
          onClearSearch={handleClearSearch}
          onFilterChange={handleFilterChange}
        />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {viewPreferences.view === 'grid' ? (
              <TaskListGrid 
                tasks={filteredTasks} 
                searchQuery={searchQuery}
                onDeleteTasks={deleteTasks}
                onUpdateTask={updateTask}
                onCreateTask={addTask}
                onClearSearch={handleClearSearch}
              />
            ) : (
              <TaskList 
                tasks={filteredTasks} 
                searchQuery={searchQuery} 
                filters={activeFilters}
                onClearSearch={handleClearSearch}
                onDeleteTasks={deleteTasks}
                onUpdateTask={updateTask}
                onCreateTask={addTask}
                onFilterChange={handleFilterChange}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
