'use client';
import { useState, useRef, useEffect } from 'react';
import { FiGlobe, FiFileText, FiCode, FiBox, FiSend, FiSearch, FiUpload, FiPlus, FiMessageCircle, FiEdit2, FiMessageSquare, FiPlusCircle, FiEdit } from 'react-icons/fi';
import { useChatContext } from './SidebarComponents';
import axios from 'axios';
import Image from 'next/image';
import { useUser } from '@/app/_context/UserContext';
import useNotifications from '@/app/_hooks/useNotifications';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:9000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

const SERVER_URL = 'http://localhost:9000';

// Add request interceptor for debugging and token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Making request to:', config.baseURL + config.url);
  console.log('Request headers:', config.headers);
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
api.interceptors.response.use((response) => {
  console.log('Response:', response.data);
  // Only check state if it exists in the response
  if (response.data && response.data.hasOwnProperty('state') && !response.data.state) {
    throw new Error(response.data.error || response.data.message || 'Server error');
  }
  return response;
}, (error) => {
  console.error('Response error:', error.response?.data || error);
  const errorMessage = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'An error occurred';
  return Promise.reject(new Error(errorMessage));
});

export function AiAssistant({ isSidebarCollapsed }) {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const { currentChat, addNewChat, updateChatMessages, updateChatTitle } = useChatContext();
  const chatContainerRef = useRef(null);
  const messageEndRef = useRef(null);
  const { profileImage, userName } = useUser();
  const { user } = useUser();
  const { fetchNotifications } = useNotifications();
  const [selectedFeature, setSelectedFeature] = useState('');
  const { addNotification } = useNotifications();

  // Function to safely create a notification
  const createNotification = async (type, title, message) => {
    try {
      await addNotification({
        title: title,
        message: message,
        type: type,
        read: false
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  // Handle sidebar collapse state
  const handleSidebarCollapse = (collapsed) => {
    isSidebarCollapsed = collapsed;
  };

  // Load messages when switching chats
  useEffect(() => {
    if (!isLoading) {
      setMessages(currentChat?.messages || []);
      setSelectedFeature('');
    }
  }, [currentChat?.id]);

  // Save messages when they change
  useEffect(() => {
    if (currentChat?.id) {
      updateChatMessages(currentChat.id, messages);
      
      // Update chat title for new chats
      if (messages.length === 1 && messages[0].type === 'user') {
        updateChatTitle(currentChat.id, messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : ''));
      }
    }
  }, [messages]);

  const features = [
    {
      icon: <FiMessageSquare className="w-8 h-8 text-blue-500" />,
      title: 'General Chat',
      color: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      icon: <FiPlusCircle className="w-8 h-8 text-green-500" />,
      title: 'Create Task',
      color: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      icon: <FiEdit className="w-8 h-8 text-purple-500" />,
      title: 'Update Tasks',
      color: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Additional scroll interval for reliability
  useEffect(() => {
    if (messages.length > 0) {
      const scrollInterval = setInterval(scrollToBottom, 100);
      setTimeout(() => clearInterval(scrollInterval), 1000);
      return () => clearInterval(scrollInterval);
    }
  }, [messages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage.trim(),
    };

    setIsLoading(true);
    setInputMessage('');

    try {
      // If this is a new conversation
      if (!currentChat) {
        const response = await api.post('/ai/conv/new', {
          title: inputMessage.slice(0, 30) + (inputMessage.length > 30 ? '...' : ''),
          messages: [{ 
            sender: 'user',
            message: inputMessage,
            timestamp: new Date()
          }]
        });

        if (!response.data?.conversation?._id) {
          throw new Error('Failed to create conversation');
        }

        const newChat = {
          id: response.data.conversation._id,
          title: inputMessage.slice(0, 30) + (inputMessage.length > 30 ? '...' : ''),
          messages: [userMessage],
          isTemporary: false
        };

        addNewChat(newChat, true);
        setMessages([userMessage]);

        // Get AI response
        try {
          const aiResponse = await api.post('/ai/conv/ask', {
            message: inputMessage,
            convId: newChat.id
          });

          if (!aiResponse.data?.response) {
            throw new Error('No response from AI');
          }

          const aiMessage = {
            type: 'ai',
            content: aiResponse.data.response,
          };

          const updatedMessages = [userMessage, aiMessage];
          setMessages(updatedMessages);
          updateChatMessages(newChat.id, updatedMessages);
          await fetchNotifications();
        } catch (aiError) {
          console.error('AI Error:', aiError);
          const errorMessage = aiError.response?.data?.error || aiError.message;
          const isSafetyError = errorMessage.includes('SAFETY') || errorMessage.includes('safety');
          
          const aiErrorMessage = {
            type: 'ai',
            content: isSafetyError 
              ? "I apologize, but I cannot process that request as it may contain sensitive or inappropriate content. Please rephrase your message in a more appropriate way."
              : "I encountered an error while processing your message. Please try again or rephrase your request.",
          };
          const updatedMessages = [userMessage, aiErrorMessage];
          setMessages(updatedMessages);
          updateChatMessages(newChat.id, updatedMessages);
        }
      } else {
        // Add user message immediately
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        
        try {
          const aiResponse = await api.post('/ai/conv/ask', {
            message: inputMessage,
            convId: currentChat.id
          });

          if (!aiResponse.data?.response) {
            throw new Error('No response from AI');
          }

          const aiMessage = {
            type: 'ai',
            content: aiResponse.data.response,
          };

          const newMessages = [...updatedMessages, aiMessage];
          setMessages(newMessages);
          updateChatMessages(currentChat.id, newMessages);
          await fetchNotifications();
        } catch (aiError) {
          console.error('AI Error:', aiError);
          const errorMessage = aiError.response?.data?.error || aiError.message;
          const isSafetyError = errorMessage.includes('SAFETY') || errorMessage.includes('safety');
          
          const aiErrorMessage = {
            type: 'ai',
            content: isSafetyError 
              ? "I apologize, but I cannot process that request as it may contain sensitive or inappropriate content. Please rephrase your message in a more appropriate way."
              : "I encountered an error while processing your message. Please try again or rephrase your request.",
          };
          const newMessages = [...updatedMessages, aiErrorMessage];
          setMessages(newMessages);
          updateChatMessages(currentChat.id, newMessages);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        type: 'ai',
        content: error.message === 'Not authenticated' 
          ? 'Please log in to use the AI assistant.' 
          : `Error: ${error.message}`,
      };
      setMessages([...messages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new general conversation
  const createGeneralConversation = async () => {
    const initialMessage = 'hello i want to start a general conversation';
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const userMessage = {
        type: 'user',
        content: initialMessage,
      };

      // Create a new conversation
      const response = await api.post('/ai/conv/new', {
        title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''),
        messages: [{ 
          sender: 'user',
          message: initialMessage,
          timestamp: new Date()
        }]
      });

      if (!response.data?.conversation?._id) {
        throw new Error('Failed to create conversation');
      }

      const newChat = {
        id: response.data.conversation._id,
        title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''),
        messages: [userMessage],
        isTemporary: false
      };

      // Update chat list
      addNewChat(newChat, true);
      setMessages([userMessage]);

      // Get AI response
      try {
        const aiResponse = await api.post('/ai/conv/ask', {
          message: initialMessage,
          convId: newChat.id
        });

        if (!aiResponse.data?.response) {
          throw new Error('No response from AI');
        }

        const aiMessage = {
          type: 'ai',
          content: aiResponse.data.response,
        };

        const updatedMessages = [userMessage, aiMessage];
        setMessages(updatedMessages);
        updateChatMessages(newChat.id, updatedMessages);
        await fetchNotifications();
      } catch (aiError) {
        console.error('AI Error:', aiError);
        const errorMessage = aiError.response?.data?.error || aiError.message;
        const isSafetyError = errorMessage.includes('SAFETY') || errorMessage.includes('safety');
        
        const aiErrorMessage = {
          type: 'ai',
          content: isSafetyError 
            ? "I apologize, but I cannot process that request as it may contain sensitive or inappropriate content. Please rephrase your message in a more appropriate way."
            : "I encountered an error while processing your message. Please try again or rephrase your request.",
        };
        const updatedMessages = [userMessage, aiErrorMessage];
        setMessages(updatedMessages);
        updateChatMessages(newChat.id, updatedMessages);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        type: 'ai',
        content: error.message === 'Not authenticated' 
          ? 'Please log in to use the AI assistant.' 
          : `Error: ${error.message}`,
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new task conversation
  const createTaskConversation = async () => {
    const initialMessage = 'hello i want to create new task';
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const userMessage = {
        type: 'user',
        content: initialMessage,
      };

      // Create a new conversation
      const response = await api.post('/ai/conv/new', {
        title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''),
        messages: [{ 
          sender: 'user',
          message: initialMessage,
          timestamp: new Date()
        }]
      });

      if (!response.data?.conversation?._id) {
        throw new Error('Failed to create conversation');
      }

      const newChat = {
        id: response.data.conversation._id,
        title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''),
        messages: [userMessage],
        isTemporary: false
      };

      // Update chat list
      addNewChat(newChat, true);
      setMessages([userMessage]);

      // Get AI response
      try {
        const aiResponse = await api.post('/ai/conv/ask', {
          message: initialMessage,
          convId: newChat.id
        });

        if (!aiResponse.data?.response) {
          throw new Error('No response from AI');
        }

        const aiMessage = {
          type: 'ai',
          content: aiResponse.data.response,
        };

        const updatedMessages = [userMessage, aiMessage];
        setMessages(updatedMessages);
        updateChatMessages(newChat.id, updatedMessages);
        await fetchNotifications();

      } catch (aiError) {
        console.error('AI Error:', aiError);
        const errorMessage = aiError.response?.data?.error || aiError.message;
        const isSafetyError = errorMessage.includes('SAFETY') || errorMessage.includes('safety');
        
        const aiErrorMessage = {
          type: 'ai',
          content: isSafetyError 
            ? "I apologize, but I cannot process that request as it may contain sensitive or inappropriate content. Please rephrase your message in a more appropriate way."
            : "I encountered an error while processing your message. Please try again or rephrase your request.",
        };
        const updatedMessages = [userMessage, aiErrorMessage];
        setMessages(updatedMessages);
        updateChatMessages(newChat.id, updatedMessages);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        type: 'ai',
        content: error.message === 'Not authenticated' 
          ? 'Please log in to use the AI assistant.' 
          : `Error: ${error.message}`,
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create an update tasks conversation
  const createUpdateTasksConversation = async () => {
    const initialMessage = 'hello i want to Update My Tasks';
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const userMessage = {
        type: 'user',
        content: initialMessage,
      };

      // Create a new conversation
      const response = await api.post('/ai/conv/new', {
        title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''),
        messages: [{ 
          sender: 'user',
          message: initialMessage,
          timestamp: new Date()
        }]
      });

      if (!response.data?.conversation?._id) {
        throw new Error('Failed to create conversation');
      }

      const newChat = {
        id: response.data.conversation._id,
        title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''),
        messages: [userMessage],
        isTemporary: false
      };

      // Update chat list
      addNewChat(newChat, true);
      setMessages([userMessage]);

      // Get AI response
      try {
        const aiResponse = await api.post('/ai/conv/ask', {
          message: initialMessage,
          convId: newChat.id
        });

        if (!aiResponse.data?.response) {
          throw new Error('No response from AI');
        }

        const aiMessage = {
          type: 'ai',
          content: aiResponse.data.response,
        };

        const updatedMessages = [userMessage, aiMessage];
        setMessages(updatedMessages);
        updateChatMessages(newChat.id, updatedMessages);
        await fetchNotifications();

      } catch (aiError) {
        console.error('AI Error:', aiError);
        const errorMessage = aiError.response?.data?.error || aiError.message;
        const isSafetyError = errorMessage.includes('SAFETY') || errorMessage.includes('safety');
        
        const aiErrorMessage = {
          type: 'ai',
          content: isSafetyError 
            ? "I apologize, but I cannot process that request as it may contain sensitive or inappropriate content. Please rephrase your message in a more appropriate way."
            : "I encountered an error while processing your message. Please try again or rephrase your request.",
        };
        const updatedMessages = [userMessage, aiErrorMessage];
        setMessages(updatedMessages);
        updateChatMessages(newChat.id, updatedMessages);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        type: 'ai',
        content: error.message === 'Not authenticated' 
          ? 'Please log in to use the AI assistant.' 
          : `Error: ${error.message}`,
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureClick = async (feature) => {
    setSelectedFeature(feature);
    
    if (feature === 'General Chat') {
      await createGeneralConversation();
    } else if (feature === 'Create Task') {
      await createTaskConversation();
    } else if (feature === 'Update Tasks') {
      await createUpdateTasksConversation();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pb-40">
        {messages.length === 0 ? (
          <div className="flex-1 p-6">
            <div className="relative mb-8 mt-4">
              <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 tracking-tight">
                Create Tasks with AI Assistant
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`${feature.color} ${feature.textColor} p-4 rounded-xl cursor-pointer
                    transform transition-all duration-300 hover:scale-105
                    hover:shadow-lg hover:shadow-${feature.textColor}/20
                    border-2 border-transparent hover:border-current/10
                    backdrop-blur-sm backdrop-saturate-150
                    group relative overflow-hidden`}
                  onClick={() => handleFeatureClick(feature.title)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 dark:from-black/0 dark:to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      {feature.icon}
                    </div>
                    <span className="text-base font-semibold tracking-wide">{feature.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-4 bg-transparent scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          >
            <div className="flex flex-col space-y-4 min-h-full pb-32">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-6 px-10`}>
                  {msg.type !== 'user' && (
                    <div className="w-[44px] h-[44px] rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mr-3 flex-shrink-0 border-2 border-white dark:border-gray-800 ring-1 ring-blue-100 dark:ring-blue-900">
                      <Image
                        src="/images/chatbot.png"
                        alt="AI Assistant"
                        width={44}
                        height={44}
                        className="rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div 
                    className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl py-3 px-4 sm:px-6 ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20 border border-blue-400/20' 
                        : 'bg-white dark:bg-gray-800 shadow-lg shadow-gray-500/10 border border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className={`text-sm whitespace-pre-wrap break-words ${
                        msg.type === 'user' ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                      }`}>
                        {msg.type === 'ai' ? msg.content.replace(/^(Assistant: )+/g, '') : msg.content}
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-opacity-10 border-current">
                        <span className={`text-xs font-semibold tracking-wide uppercase ${
                          msg.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {msg.type === 'user' ? 'You' : 'StarCompany'}
                        </span>
                      </div>
                    </div>
                    {msg.type === 'user' && (
                      <div className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center absolute -right-14 top-1/2 -translate-y-1/2 flex-shrink-0 shadow-xl shadow-blue-400/20 border-2 border-white/90 dark:border-gray-800 ring-2 ring-blue-400/30 hover:scale-105 hover:rotate-3 transform transition-all duration-300 group">
                        {profileImage ? (
                          <Image
                            src={profileImage.startsWith('http') ? profileImage : `${SERVER_URL}${profileImage}`}
                            alt={userName || 'User'}
                            width={44}
                            height={44}
                            className="rounded-full object-cover w-[42px] h-[42px] group-hover:scale-95 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/user-avatar.svg';
                              e.target.className = 'text-white w-8 h-8 group-hover:scale-95 transition-transform duration-300';
                            }}
                          />
                        ) : (
                          <Image
                            src="/images/user-avatar.svg"
                            alt={userName || 'User'}
                            width={32}
                            height={32}
                            className="text-white group-hover:scale-95 transition-transform duration-300"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} className="h-4" />
            </div>
          </div>
        )}
      </div>

      <div className={`flex-none fixed bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-50 dark:border-gray-900 z-10 mt-32 transition-all duration-300 ${
        isSidebarCollapsed ? 'left-[100px]' : 'left-[304px]'
      } right-0`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Message StarCompany or @mention agent"
                className="w-full px-6 py-4 pr-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`p-3 rounded-xl ${
                    isLoading 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:scale-95'
                  } transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center group`}
                >
                  <FiSend className={`w-5 h-5 ${!isLoading && 'group-hover:-rotate-12'} transition-transform duration-200`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-start space-x-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <button 
                type="button" 
                className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors duration-200"
                onClick={createGeneralConversation}
                disabled={isLoading}
              >
                <FiMessageCircle className="w-4 h-4" />
                <span>General Chat</span>
              </button>
              <button 
                type="button" 
                className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors duration-200"
                onClick={createTaskConversation}
                disabled={isLoading}
              >
                <FiPlus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
              <button 
                type="button" 
                className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors duration-200"
                onClick={createUpdateTasksConversation}
                disabled={isLoading}
              >
                <FiEdit2 className="w-4 h-4" />
                <span>Update Tasks</span>
              </button>
            </div>

            <div className="text-center text-xs text-gray-400 mt-4">
              By using AI Assistant you agree to the Terms and Privacy.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
