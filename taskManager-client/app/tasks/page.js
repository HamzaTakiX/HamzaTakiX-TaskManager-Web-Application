'use client';

import { useState, useCallback, useEffect } from 'react';
import TasksContainer from '../_components/Tasks/TasksContainer';
import TasksMenu from '../_components/Tasks/TasksMenu';
import Sidebar from '../_components/Shared/Sidebar';
import { useSearchParams, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useWelcomeMessage } from '../_hooks/useWelcomeMessage';

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Use the welcome message hook
  useWelcomeMessage(searchParams, router);

  const [tasks, setTasks] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      todo: [
        {
          id: 'task1',
          title: 'Overdue Task',
          description: 'This task is overdue',
          category: 'Design',
          dueDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'todo'
        },
        {
          id: 'task2',
          title: 'Due Today',
          description: 'This task is due today',
          category: 'Development',
          dueDate: today.toISOString().split('T')[0],
          status: 'todo'
        },
        {
          id: 'task3',
          title: 'Due in 3 Days',
          description: 'This task is due soon',
          category: 'Frontend',
          dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'todo'
        },
        {
          id: 'task4',
          title: 'Due in 7 Days',
          description: 'This task is due in a week',
          category: 'Backend',
          dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'todo'
        },
        {
          id: 'task5',
          title: 'Due in 14 Days',
          description: 'This task is due in two weeks',
          category: 'Database',
          dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'todo'
        }
      ],
      inProgress: [],
      done: [],
      pinned: []
    };
  });

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let timer;
    if (searchQuery) {
      timer = setTimeout(() => {
        console.log('Searching for:', searchQuery);
        // Implement your search logic here
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div>
      <Toaster />
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="pl-64">
          <TasksMenu/>
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <TasksContainer tasks={tasks} searchQuery={searchQuery} onClearSearch={handleClearSearch} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
