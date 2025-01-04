'use client';

import { useState, useCallback, useEffect } from 'react';
import { AiAssistant } from '../_components/Ai-assistant/AiAssistant';
import { SidebarComponents } from '../_components/Ai-assistant/SidebarComponents';
import { ChatContextProvider } from '../_components/Ai-assistant/SidebarComponents';
import TasksMenu from '../_components/Tasks/TasksMenu';
import { useSearchParams, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useWelcomeMessage } from '../_hooks/useWelcomeMessage';

export default function AIAssistantPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Use the welcome message hook
  useWelcomeMessage(searchParams, router);

  const [tasks, setTasks] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [];
  });
      
  return (
    <div>
      <Toaster />
      <div className="min-h-screen bg-gray-50">
        <ChatContextProvider>
          <SidebarComponents onCollapsedChange={setIsSidebarCollapsed} />
          <div className={`${isSidebarCollapsed ? 'pl-[100px]' : 'pl-80'} flex flex-col transition-all duration-300`}>
            <div className="sticky top-0 z-20 bg-white">
              <TasksMenu/>
            </div>
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                <AiAssistant isSidebarCollapsed={isSidebarCollapsed} />
              </div>
            </main>
          </div>
        </ChatContextProvider>
      </div>
    </div>
  );
}
