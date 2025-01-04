'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiBell, 
  FiMail, 
  FiCheck, 
  FiInfo, 
  FiAlertCircle, 
  FiUser, 
  FiCalendar, 
  FiMessageSquare,
  FiFileText,
  FiStar,
  FiSettings,
  FiUserPlus,
  FiRefreshCw,
  FiTrash2,
  FiArrowRight,
  FiTag
} from 'react-icons/fi'
import { BsPinFill, BsPin } from 'react-icons/bs'
import { useState, useEffect } from 'react'
import useNotifications from '@/app/_hooks/useNotifications'
import useNotificationSettings from '@/app/_hooks/useNotificationSettings'
import { useSettings } from '@/app/_context/SettingsContext'
import { translations } from '@/app/_utils/translations'
import { formatDistanceToNow } from 'date-fns'

const EmptyNotifications = ({ t }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4">
    <div className="relative mb-5">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full blur-2xl"
      />
      <motion.div
        animate={{ 
          rotate: [0, 10, 0, -10, 0],
          scale: [1, 1.1, 1, 1.1, 1]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative bg-gradient-to-br from-white to-gray-50 p-2.5 rounded-xl shadow-sm"
      >
        <FiBell className="w-10 h-10 text-blue-500/80" />
      </motion.div>
    </div>
    <h3 className="text-gray-900 font-semibold text-sm mb-1.5 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{t.empty.title}</h3>
    <p className="text-gray-500 text-xs text-center leading-relaxed">
      {t.empty.description}
    </p>
  </div>
)

const NotificationDropdown = ({ isOpen, onClose }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showDeleteTooltip, setShowDeleteTooltip] = useState(false)
  const { notifications, markAllAsRead, clearAllNotifications, fetchNotifications, isLoading } = useNotifications()
  const { shouldShowNotification } = useNotificationSettings()
  const { settings } = useSettings()

  // Get translations
  const t = translations[settings.language].notifications

  // Filter notifications based on user settings
  const filteredNotifications = notifications.filter(notification => 
    shouldShowNotification(notification.type)
  )
  
  const unreadCount = filteredNotifications.filter(n => !n.read).length

  // Initial fetch
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Set up periodic refresh
  useEffect(() => {
    if (!isOpen) return; // Don't refresh if dropdown is closed

    const refreshInterval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Refresh every 30 seconds instead of 5

    return () => clearInterval(refreshInterval);
  }, [isOpen, fetchNotifications]);

  const handleClearAll = async () => {
    await clearAllNotifications();
    fetchNotifications(); // Refresh the list after clearing
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[998]"
          />
          
          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[999] backdrop-blur-sm"
          >
            <div className="p-3 border-b border-gray-100/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{t.title}</h2>
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">{unreadCount} {t.new}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={markAllAsRead}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-50/80 relative group transition-all duration-200"
                  >
                    <FiMail className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    <AnimatePresence>
                      {showTooltip && (
                        <motion.span
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute -top-9 left-1/2 transform -translate-x-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg"
                        >
                          {t.markAllAsRead}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearAll}
                    onMouseEnter={() => setShowDeleteTooltip(true)}
                    onMouseLeave={() => setShowDeleteTooltip(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-50/80 relative group transition-all duration-200"
                  >
                    <FiTrash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                    <AnimatePresence>
                      {showDeleteTooltip && (
                        <motion.span
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute -top-9 left-1/2 transform -translate-x-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg"
                        >
                          {t.clearAll}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <EmptyNotifications t={t} />
              ) : (
                <div className="py-1">
                  {filteredNotifications.map((notification) => {
                    let NotificationIcon = FiInfo;
                    let iconColor = "text-blue-500";
                    
                    // Determine icon and color based on notification type and action type
                    switch (notification.type) {
                      case 'success':
                        NotificationIcon = FiCheck;
                        iconColor = "text-green-500";
                        break;
                      case 'error':
                        NotificationIcon = FiAlertCircle;
                        iconColor = "text-red-500";
                        break;
                      case 'task':
                        // Handle different task actions
                        switch (notification.actionType) {
                          case 'status_change':
                            NotificationIcon = FiArrowRight;
                            iconColor = "text-purple-500";
                            break;
                          case 'pin_change':
                            NotificationIcon = notification.newState === 'pinned' ? BsPinFill : BsPin;
                            iconColor = "text-yellow-500";
                            break;
                          case 'favorite_change':
                            NotificationIcon = FiStar;
                            iconColor = "text-yellow-500";
                            break;
                          default:
                            NotificationIcon = FiFileText;
                            iconColor = "text-blue-500";
                        }
                        break;
                      case 'message':
                        NotificationIcon = FiMessageSquare;
                        iconColor = "text-indigo-500";
                        break;
                      case 'reminder':
                        NotificationIcon = FiCalendar;
                        iconColor = "text-orange-500";
                        break;
                      case 'settings':
                        NotificationIcon = FiSettings;
                        iconColor = "text-gray-500";
                        break;
                      default:
                        NotificationIcon = FiInfo;
                        iconColor = "text-blue-500";
                    }

                    // Format message for task actions
                    let formattedMessage = notification.message;
                    if (notification.type === 'task' && notification.actionType) {
                      switch (notification.actionType) {
                        case 'status_change':
                          formattedMessage = `Task status changed from ${notification.previousState} to ${notification.newState}`;
                          break;
                        case 'pin_change':
                          formattedMessage = notification.newState === 'pinned' 
                            ? 'Task has been pinned to the board'
                            : 'Task has been unpinned from the board';
                          break;
                        case 'favorite_change':
                          formattedMessage = notification.newState 
                            ? 'Task has been marked as favorite'
                            : 'Task has been removed from favorites';
                          break;
                      }
                    }
                    
                    return (
                      <div 
                        key={notification._id}
                        className={`
                          px-4 py-3 hover:bg-gray-50/80 transition-all duration-200
                          ${!notification.read ? 'bg-blue-50/30' : ''}
                          flex items-start gap-3 relative group
                        `}
                      >
                        <div className={`mt-0.5 p-2 rounded-full ${!notification.read ? iconColor + '/10' : 'bg-gray-100'}`}>
                          <NotificationIcon className={`w-4 h-4 ${!notification.read ? iconColor : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate pr-8">{notification.title}</h4>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{formattedMessage}</p>
                          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-2">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            {!notification.read && (
                              <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                <span className="text-blue-500">{t.new}</span>
                              </span>
                            )}
                          </p>
                        </div>
                        {!notification.read && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiCheck className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-gray-100/60">
              <button 
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center space-x-2"
                onClick={onClose}
              >
                <span>{t.viewAll}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationDropdown
