import { useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FiLogOut } from 'react-icons/fi';

// Track last toast to prevent duplicates
let lastToastTime = 0;
const TOAST_DEBOUNCE_MS = 1000;

export function useLogoutMessage() {
  const toastRef = useRef(null);

  const clearAllData = () => {
    console.log('🧹 Clearing all application data...');
    
    // Clear all localStorage items
    const itemsToRemove = [
      'token',
      'userName',
      'userEmail',
      'userJob',
      'hasShownWelcome',
      'profileImage',
      'bannerImage',
      'lastToastTime',
      'toastCreationInProgress'
    ];

    itemsToRemove.forEach(item => {
      const value = localStorage.getItem(item);
      if (value) {
        console.log(`📤 Removing from localStorage: ${item}`);
        localStorage.removeItem(item);
      }
    });

    // Reset all global state
    lastToastTime = 0;
    toastRef.current = null;

    // Clear all cookies
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      console.log(`🍪 Removed cookie: ${name}`);
    });

    localStorage.clear(); // Make sure everything is cleared
    console.log('✨ All application data cleared');
  };

  const showLogoutMessage = async (userName) => {
    const now = Date.now();
    const timeSinceLastToast = now - lastToastTime;

    // Only show toast if we're not in debounce period
    if (userName && timeSinceLastToast > TOAST_DEBOUNCE_MS && !toastRef.current) {
      console.log('👋 Showing goodbye message for:', userName);
      lastToastTime = now;

      try {
        // Clear any existing toasts
        await toast.dismiss();
        console.log('🧹 Cleared existing toasts');

        // Show the goodbye toast
        toast.success(
          <div className="flex items-center gap-2">
            <FiLogOut className="h-5 w-5" />
            <span>Goodbye, {userName}! See you soon! 👋</span>
          </div>,
          {
            id: 'logout-message',
            duration: 3000,
            position: 'top-center',
          }
        );

        // Wait briefly for toast to be visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Clear all data immediately after showing toast
        clearAllData();
        
        return true; // Indicate successful logout
      } catch (error) {
        console.error('❌ Error showing logout message:', error);
        clearAllData(); // Still clear data even if toast fails
        return true; // Still allow logout
      }
    } else {
      // If we can't show toast, still clear data
      clearAllData();
      return true; // Still allow logout
    }
  };

  return { showLogoutMessage };
}
