'use client';
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiMessageCircle, 
  FiTrash2, 
  FiPlus, 
  FiFolder, 
  FiChevronRight, 
  FiChevronDown,
  FiSearch,
  FiSettings,
  FiZap,
  FiX,
  FiInbox,
  FiEdit2,
  FiChevronLeft,
  FiMoreVertical,
  FiBriefcase,
  FiUser,
  FiMoreHorizontal,
  FiChevronsRight,
  FiChevronsLeft,
  FiStar
} from 'react-icons/fi';
import { RiRobot2Fill } from 'react-icons/ri';
import axios from 'axios';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.config.method}] ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// Create Chat Context
const ChatContext = createContext();

export function ChatContextProvider({ children }) {
  const [currentChat, setCurrentChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('Loading conversations...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token found');
        setError('Please log in to view your conversations');
        setChats([]);
        return;
      }

      const response = await api.get('/ai/conv');
      console.log('API Response:', response.data);
      
      if (response.data?.conversations) {
        const transformedChats = response.data.conversations.map(conv => {
          if (!conv || !conv._id) {
            console.warn('Invalid conversation data:', conv);
            return null;
          }

          let title = conv.title;
          if (!title && conv.messages && conv.messages.length > 0) {
            const firstMessage = conv.messages[0].message;
            title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
          }
          
          return {
            id: conv._id,
            _id: conv._id,
            title: title || 'New Chat',
            messages: conv.messages?.map(msg => ({
              type: msg.sender === 'user' ? 'user' : 'ai',
              content: msg.message,
              timestamp: msg.timestamp
            })) || [],
            starred: conv.starred || false,
            favorite: conv.favorite || false
          };
        }).filter(chat => chat !== null); // Remove any invalid chats
        
        console.log('Transformed chats:', transformedChats);
        setChats(transformedChats);
      } else {
        console.error('Invalid data structure:', response.data);
        setError('No conversations found');
        setChats([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (error.response?.status === 401) {
        setError('Please log in to view your conversations');
      } else {
        setError('Failed to load conversations. Please try again.');
      }
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  // Load conversations when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadConversations();
    }
  }, []);

  // Listen for token changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          loadConversations();
        } else {
          setChats([]);
          setCurrentChat(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateChatMessages = (chatId, messages) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, messages };
      }
      return chat;
    }));
  };

  const addNewChat = (chat, replaceTemp = false) => {
    setChats(prev => {
      // If we're replacing a temporary chat, filter it out
      const filteredChats = replaceTemp 
        ? prev.filter(c => !c.isTemporary)
        : prev;
      return [chat, ...filteredChats];
    });
    setCurrentChat(chat);
  };

  const updateChatTitle = (chatId, title) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, title };
      }
      return chat;
    }));
  };

  const removeChat = async (chatId) => {
    try {
      // Check if it's a temporary chat ID
      if (chatId.startsWith('temp-')) {
        // For temporary chats, just remove from local state without server call
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        if (currentChat?.id === chatId) {
          setCurrentChat(null);
        }
        return;
      }

      // For permanent chats, make the server call
      await api.delete(`/ai/conv/${chatId}`);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
    } catch (error) {
      console.error('Error removing chat:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const toggleFavorite = async (chatId) => {
    let originalChat = null;
    try {
      console.log('Starting toggleFavorite for chatId:', chatId);
      const chat = chats.find(c => c.id === chatId);
      if (!chat) {
        console.log('Chat not found:', chatId);
        return;
      }
      console.log('Found chat:', chat);
      
      // Store original chat state for error handling
      originalChat = { ...chat };

      // Optimistically update the UI
      console.log('Updating UI optimistically, setting favorite to:', !chat.favorite);
      setChats(prevChats => 
        prevChats.map(c => 
          c.id === chatId ? { ...c, favorite: !c.favorite } : c
        )
      );

      console.log('Making API request to:', `/ai/conv/${chatId}/favorite`);
      const response = await api.put(`/ai/conv/${chatId}/favorite`, {
        favorite: !chat.favorite
      });
      console.log('API Response:', response);

      // If the API call was not successful, revert the change
      if (!response.data || !response.data.success) {
        console.log('API call unsuccessful, reverting UI change');
        setChats(prevChats => 
          prevChats.map(c => 
            c.id === chatId ? { ...c, favorite: originalChat.favorite } : c
          )
        );
      } else {
        console.log('API call successful, favorite status updated');
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      // Revert the change on error if we have the original chat state
      if (originalChat) {
        console.log('Reverting UI change due to error');
        setChats(prevChats => 
          prevChats.map(c => 
            c.id === chatId ? { ...c, favorite: originalChat.favorite } : c
          )
        );
      }
    }
  };

  const createNewChat = async () => {
    try {
      const newChat = {
        id: 'temp-' + Date.now(),
        title: 'New Chat',
        messages: [],
        isTemporary: true
      };
      addNewChat(newChat);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const value = {
    currentChat,
    setCurrentChat,
    chats,
    setChats,
    loading,
    error,
    loadConversations,
    updateChatMessages,
    addNewChat,
    updateChatTitle,
    removeChat,
    toggleFavorite,
    createNewChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatContextProvider');
  }
  return context;
}

function AnimatedIcon() {
  return (
    <div className="animate-pulse">
      <FiZap className="w-6 h-6 text-white" />
    </div>
  );
}

function ChatListContent({ isCollapsed, searchTerm }) {
  const [isCreating, setIsCreating] = useState(false);
  const { 
    chats, 
    addNewChat, 
    removeChat, 
    currentChat, 
    loading, 
    error 
  } = useChatContext();

  const handleCreateNewChat = async () => {
    if (isCreating) return;
    try {
      setIsCreating(true);
      await createNewChat();
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    await removeChat(chatId);
  };

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-2">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-2 text-red-500 text-sm">
            {error}
          </div>
        )}
        {filteredChats.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full px-4 ${isCollapsed ? 'hidden' : ''}`}>
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <FiMessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              No chats yet
            </h3>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Start a new chat to begin the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isCollapsed={isCollapsed}
                isActive={currentChat?.id === chat.id}
                onDelete={(e) => handleDeleteChat(chat.id, e)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatItem({ chat, isCollapsed, isActive, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const { setCurrentChat, toggleFavorite } = useChatContext();

  const handleClick = () => {
    setCurrentChat(chat);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(chat.id);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group flex items-center gap-3 p-2 cursor-pointer
        transition-all duration-300
        ${isCollapsed 
          ? 'mx-auto w-12 h-12 justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700' 
          : `rounded-lg ${isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`
        }
      `}
    >
      <div className={`flex-shrink-0 ${isCollapsed ? 'flex items-center justify-center' : ''}`}>
        <FiMessageCircle className={`transition-all duration-300 ${
          isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
        } ${isActive && !isCollapsed ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`} />
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {chat.title || 'New Chat'}
              </p>
              <button
                onClick={handleFavoriteClick}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ease-in-out
                  ${chat.favorite 
                    ? 'text-yellow-400 hover:text-yellow-500 dark:text-yellow-500 dark:hover:text-yellow-400' 
                    : 'text-gray-400 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-500'
                  }
                  hover:bg-gray-200 dark:hover:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                  transform hover:scale-110 active:scale-95`}
                aria-label={chat.favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <FiStar
                  className={`h-5 w-5 transform transition-transform duration-200 ${
                    chat.favorite ? 'scale-110' : 'scale-100'
                  }`}
                  fill={chat.favorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={chat.favorite ? "0" : "2"}
                />
              </button>
            </div>
          </div>

          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Delete chat"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

function FolderListContent({ isCollapsed }) {
  const [folders, setFolders] = useState([
    { id: 'favorites', name: 'Favorites', icon: FiFolder },
  ]);
  const [showModal, setShowModal] = useState(false);
  const { chats } = useChatContext();
  const [isFoldersOpen, setIsFoldersOpen] = useState(false);

  const handleAddFolder = (name) => {
    const newFolder = {
      id: Date.now(),
      name,
      icon: FiFolder
    };
    setFolders(prev => [...prev, newFolder]);
  };

  return (
    <div className="py-4">
      <div className={`flex items-center ${isCollapsed ? 'justify-center space-x-2' : 'justify-between px-6'} py-3`}>
        {!isCollapsed ? (
          <button 
            onClick={() => setIsFoldersOpen(!isFoldersOpen)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {isFoldersOpen ? (
              <FiChevronDown className="w-5 h-5 mr-3 transition-transform" />
            ) : (
              <FiChevronRight className="w-5 h-5 mr-3 transition-transform" />
            )}
            <span className="text-lg font-medium">Folders</span>
            {folders.length > 0 && (
              <span className="ml-3 px-2.5 py-1 text-sm font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                {folders.length}
              </span>
            )}
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <FiFolder className="w-8 h-8 text-gray-400" />
            {folders.length > 0 && (
              <span className="mt-2 px-2 py-0.5 text-sm font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                {folders.length}
              </span>
            )}
          </div>
        )}
        <button 
          onClick={() => setShowModal(true)}
          className={`p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors`}
        >
          <FiPlus className="w-5 h-5" />
        </button>
      </div>

      <div className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center space-y-4' : ''}`}>
        {folders.map(folder => (
          <div key={folder.id} className={`group relative flex items-center ${isCollapsed ? 'justify-center w-12 h-12' : 'justify-between p-2'} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-300`}>
            <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
              <folder.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {!isCollapsed && (
                <span className="text-sm text-gray-700 dark:text-gray-200">{folder.name}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddFolderModal({ isOpen, onClose, onAdd }) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onAdd(folderName.trim());
      setFolderName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Create New Folder
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter folder name"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SearchResults({ isCollapsed, searchTerm }) {
  const { chats } = useChatContext();
  
  if (!searchTerm) return null;
  
  const searchResults = chats.filter(chat => {
    const chatTitle = chat.title || '';
    const messages = chat.messages || [];
    const messageContent = messages.map(msg => msg.content || '').join(' ');
    const searchString = `${chatTitle} ${messageContent}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="mb-6">
      {!isCollapsed && (
        <div className="flex items-center justify-between mb-2 px-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Search Results
          </h2>
          <span className="text-xs text-gray-400">
            {searchResults.length} found
          </span>
        </div>
      )}
      <div className="space-y-1">
        {searchResults.map(chat => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isCollapsed={isCollapsed}
            isActive={false}
          />
        ))}
      </div>
    </div>
  );
}

export function SidebarComponents({ onCollapsedChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { chats, createNewChat } = useChatContext();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    if (onCollapsedChange) {
      onCollapsedChange(!isCollapsed);
    }
  };

  const handleCreateNewChat = async () => {
    if (isCollapsed) {
      handleToggle(); 
      setTimeout(() => {
        createNewChat();
      }, 300); 
    } else {
      await createNewChat();
    }
  };

  const handleSearchIconClick = () => {
    handleToggle();
    if (isCollapsed) {
      // Focus the search input after the sidebar expands
      setTimeout(() => {
        const searchInput = document.getElementById('chat-search');
        if (searchInput) {
          searchInput.focus();
        }
      }, 300);
    }
  };

  return (
    <div className="relative">
      <div className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 ease-in-out overflow-visible ${
        isCollapsed ? 'w-[100px]' : 'w-[304px]'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`
            h-16 
            flex items-center 
            bg-gradient-to-r from-blue-600 to-blue-700
            shadow-lg
            transition-all duration-300
            ${isCollapsed ? 'justify-center px-4' : 'px-6'}
          `}>
            <div className={`
              flex items-center gap-4
              transition-all duration-300
              ${isCollapsed ? 'justify-center' : ''}
            `}>
              <div className={`
                w-10 h-10
                flex items-center justify-center
                rounded-xl
                bg-white/10
                backdrop-blur-sm
                shadow-inner
                transition-all duration-300
                group
                hover:bg-white/20
                hover:scale-105
              `}>
                <RiRobot2Fill className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
              
              <div className={`
                flex flex-col
                transition-all duration-300
                ${isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 relative'}
              `}>
                <h1 className="text-lg font-bold text-white tracking-wide whitespace-nowrap">
                  AI Assistant
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-xs text-blue-100 font-medium whitespace-nowrap opacity-90">
                    Online
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and New Chat section */}
          <div className={`p-2 flex items-center ${isCollapsed ? 'flex-col gap-4' : 'gap-2'}`}>
            <div className={`relative ${isCollapsed ? 'w-12 h-12' : 'flex-1'}`}>
              <input
                id="chat-search"
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                  rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                  hover:border-gray-300 dark:hover:border-gray-600
                  shadow-sm hover:shadow-md
                  text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                  transition-all duration-300 ${
                  isCollapsed ? 'opacity-0 absolute pointer-events-none' : 'opacity-100'
                }`}
                disabled={isCollapsed}
              />
              <button 
                onClick={handleSearchIconClick}
                className={`${isCollapsed 
                  ? 'absolute inset-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm' 
                  : 'absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
                } transition-all duration-300 z-10`}
                aria-label={isCollapsed ? "Expand sidebar and search" : "Search conversations"}
              >
                <FiSearch className={`text-gray-500 dark:text-gray-400 transition-all duration-300 ${
                  isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                }`} />
              </button>
            </div>
            <button
              onClick={handleCreateNewChat}
              className={`transition-all duration-300 ${
                isCollapsed 
                  ? 'w-12 h-12 flex items-center justify-center rounded-xl bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm' 
                  : 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label={isCollapsed ? "Expand sidebar and create new chat" : "Create new chat"}
            >
              <FiPlus className={`transition-all duration-300 ${
                isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
              }`} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Chat list or empty state */}
            <div className="flex-1 overflow-y-auto">
              {searchTerm ? (
                <SearchResults isCollapsed={isCollapsed} searchTerm={searchTerm} />
              ) : (
                <ChatListContent isCollapsed={isCollapsed} searchTerm={searchTerm} />
              )}
            </div>
          </div>

          <div
            className={`fixed top-1/2 transform -translate-y-1/2 z-50 
              ${isCollapsed ? 'left-[100px]' : 'left-[304px]'}
              transition-all duration-500 ease-in-out
            `}
          >
            <button 
              onClick={handleToggle}
              className={`
                relative
                flex items-center justify-center
                w-10 h-10
                bg-gradient-to-br from-blue-500 to-blue-600
                hover:from-blue-600 hover:to-blue-700
                text-white
                rounded-full
                shadow-lg
                transition-all duration-500 ease-in-out
                hover:shadow-blue-500/50 hover:shadow-xl
                group
              `}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <div className={`
                relative
                transition-all duration-500 ease-in-out
                transform
                ${isCollapsed ? 'rotate-180' : 'rotate-0'}
              `}>
                <FiChevronRight className="w-5 h-5 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
