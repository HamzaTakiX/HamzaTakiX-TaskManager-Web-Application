import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FiCoffee } from 'react-icons/fi';

// Track if we've logged initial state to prevent duplicate logs
let hasLoggedInitialState = false;
let toastCreationInProgress = false;
let lastToastTime = 0;
const TOAST_DEBOUNCE_MS = 1000; // Prevent multiple toasts within 1 second

export function useWelcomeMessage(searchParams, router) {
  const toastRef = useRef(null);
  const [hasShownWelcome, setHasShownWelcome] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hasShownWelcome') === 'true';
      if (!hasLoggedInitialState) {
        console.log('🚀 Welcome State:', { 
          stored,
          localStorage: {
            hasShownWelcome: localStorage.getItem('hasShownWelcome'),
            userName: localStorage.getItem('userName'),
            token: !!localStorage.getItem('token')
          }
        });
        hasLoggedInitialState = true;
      }
      return stored;
    }
    return false;
  });

  // Reset logging flags when component unmounts
  useEffect(() => {
    return () => {
      hasLoggedInitialState = false;
      toastCreationInProgress = false;
    };
  }, []);

  // Handle welcome message
  useEffect(() => {
    const showWelcomeMessage = async () => {
      const welcomeParam = searchParams.get('welcome');
      const userName = localStorage.getItem('userName');
      const now = Date.now();
      const timeSinceLastToast = now - lastToastTime;

      // Only log if we're not in a debounce period
      if (timeSinceLastToast > TOAST_DEBOUNCE_MS) {
        console.log('🔍 Welcome Check:', {
          welcomeParam,
          hasShownWelcome,
          userName,
          currentToast: toastRef.current,
          toastCreationInProgress,
          timeSinceLastToast,
          localStorage: {
            hasShownWelcome: localStorage.getItem('hasShownWelcome'),
            userName: localStorage.getItem('userName'),
            token: !!localStorage.getItem('token')
          }
        });
      }

      // Only show toast if conditions are met and we're not in debounce period
      if (welcomeParam === 'true' && 
          !hasShownWelcome && 
          userName && 
          !toastRef.current && 
          !toastCreationInProgress &&
          timeSinceLastToast > TOAST_DEBOUNCE_MS) {
        
        console.log('🎯 Conditions met for showing welcome toast');
        toastCreationInProgress = true;
        lastToastTime = now;
        
        try {
          // Clean up URL parameter immediately
          router.replace('/overview', { scroll: false });

          const currentHour = new Date().getHours();
          let greeting = '';
          if (currentHour < 12) greeting = 'Good morning';
          else if (currentHour < 18) greeting = 'Good afternoon';
          else greeting = 'Good evening';

          console.log('🌅 Using greeting:', greeting);

          // Clear any existing toasts
          await toast.dismiss();
          console.log('🧹 Cleared existing toasts');

          // Show new toast
          console.log('🎉 Creating Welcome Toast for:', userName);
          toastRef.current = toast.success(
            <div className="flex items-center gap-2">
              <FiCoffee className="h-5 w-5" />
              <span>
                {greeting}, {userName}! Welcome back! 👋
              </span>
            </div>,
            {
              id: 'welcome-message',
              duration: 8000,
              position: 'top-center',
              className: 'welcome-toast',
              onClose: () => {
                console.log('🔚 Welcome toast closed:', { id: toastRef.current });
                toastRef.current = null;
                toastCreationInProgress = false;
              }
            }
          );
          console.log('✨ Welcome toast created:', { id: toastRef.current });

          // Update state after successful toast creation
          setHasShownWelcome(true);
          localStorage.setItem('hasShownWelcome', 'true');
          console.log('💾 Updated welcome state in localStorage');
        } catch (error) {
          console.error('❌ Error creating welcome toast:', error);
          toastCreationInProgress = false;
        }
      }
    };

    showWelcomeMessage();
  }, [searchParams, router]);

  // Handle user changes
  useEffect(() => {
    const handleUserChange = () => {
      console.log('👤 User Changed Event:', {
        previousToast: toastRef.current,
        hasShownWelcome,
        toastCreationInProgress,
        localStorage: {
          hasShownWelcome: localStorage.getItem('hasShownWelcome'),
          userName: localStorage.getItem('userName'),
          token: !!localStorage.getItem('token')
        }
      });
      
      localStorage.removeItem('hasShownWelcome');
      setHasShownWelcome(false);
      hasLoggedInitialState = false;
      toastCreationInProgress = false;
      lastToastTime = 0; // Reset toast timer on user change

      if (toastRef.current) {
        toast.dismiss(toastRef.current);
        toastRef.current = null;
        console.log('🧹 Cleaned up previous welcome toast');
      }
    };

    window.addEventListener('userChanged', handleUserChange);
    return () => window.removeEventListener('userChanged', handleUserChange);
  }, []);

  return hasShownWelcome;
}
