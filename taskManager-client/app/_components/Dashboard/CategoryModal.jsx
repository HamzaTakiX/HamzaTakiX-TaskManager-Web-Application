'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiSearch, 
  FiFolder, 
  FiPlusCircle,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiList,
  FiPenTool,
  FiCode,
  FiServer,
  FiLayout,
  FiCheckSquare,
  FiShield,
  FiSettings,
  FiDatabase,
  FiShare2,
  FiBook,
  FiTool,
  FiChevronDown
} from 'react-icons/fi';

const EmptyState = ({ icon: Icon, title, description, type = 'default' }) => {
  const colors = {
    default: { bg: 'bg-gray-50', icon: 'text-gray-400', ring: 'ring-gray-200' },
    success: { bg: 'bg-green-50', icon: 'text-green-500', ring: 'ring-green-200' },
    warning: { bg: 'bg-yellow-50', icon: 'text-yellow-500', ring: 'ring-yellow-200' },
    error: { bg: 'bg-red-50', icon: 'text-red-500', ring: 'ring-red-200' },
    info: { bg: 'bg-blue-50', icon: 'text-blue-500', ring: 'ring-blue-200' }
  };

  const color = colors[type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-12 text-center px-4"
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`${color.bg} p-4 rounded-full mb-4 ring-4 ${color.ring} relative`}
      >
        <Icon className={`w-8 h-8 ${color.icon}`} />
        {type === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full ring-4 ring-red-200"
          />
        )}
      </motion.div>
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg font-semibold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-gray-500 max-w-sm"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

const CategoryModal = ({ isOpen, onClose, categoryStats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  const filterOptions = {
    all: { label: 'All Categories', icon: FiFolder },
    'high-progress': { label: 'High Progress (≥ 70%)', icon: FiCheckCircle },
    'medium-progress': { label: 'Medium Progress (30-70%)', icon: FiClock },
    'low-progress': { label: 'Low Progress (< 30%)', icon: FiAlertCircle },
    'most-tasks': { label: 'Most Tasks', icon: FiList },
    'active': { label: 'Active Categories', icon: FiClock },
    'completed': { label: 'Completed Categories', icon: FiCheckSquare },
  };

  const filteredCategories = useMemo(() => {
    return Object.entries(categoryStats)
      .filter(([category]) => 
        category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(([_, stats]) => {
        const progress = (stats.completed / stats.total) * 100;
        const hasActiveTasks = stats.inProgress > 0 || stats.toDo > 0;
        
        switch (filterType) {
          case 'high-progress':
            return progress >= 70;
          case 'medium-progress':
            return progress >= 30 && progress < 70;
          case 'low-progress':
            return progress < 30;
          case 'most-tasks':
            return stats.total >= 5; // Adjust threshold as needed
          case 'active':
            return hasActiveTasks;
          case 'completed':
            return progress === 100;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const [, statsA] = a;
        const [, statsB] = b;
        
        if (filterType === 'most-tasks') {
          return statsB.total - statsA.total;
        } else {
          const progressA = (statsA.completed / statsA.total) * 100;
          const progressB = (statsB.completed / statsB.total) * 100;
          return progressB - progressA;
        }
      });
  }, [categoryStats, searchTerm, filterType]);

  const getCategoryIcon = (category) => {
    if (!category) return <FiFolder className="w-4 h-4 text-gray-400" />;
    const normalizedCategory = category.toLowerCase().trim();
    
    switch (normalizedCategory) {
      case 'design':
        return <FiPenTool className="w-5 h-5 text-purple-500" />;
      case 'development':
        return <FiCode className="w-5 h-5 text-blue-500" />;
      case 'backend':
        return <FiServer className="w-5 h-5 text-green-500" />;
      case 'frontend':
        return <FiLayout className="w-5 h-5 text-pink-500" />;
      case 'testing':
        return <FiCheckSquare className="w-5 h-5 text-yellow-500" />;
      case 'security':
        return <FiShield className="w-5 h-5 text-red-500" />;
      case 'devops':
        return <FiSettings className="w-5 h-5 text-indigo-500" />;
      case 'database':
        return <FiDatabase className="w-5 h-5 text-orange-500" />;
      case 'api':
        return <FiShare2 className="w-5 h-5 text-cyan-500" />;
      case 'documentation':
        return <FiBook className="w-5 h-5 text-teal-500" />;
      case 'research':
        return <FiSearch className="w-5 h-5 text-violet-500" />;
      case 'maintenance':
        return <FiTool className="w-5 h-5 text-gray-500" />;
      case 'other':
        return <FiFolder className="w-5 h-5 text-slate-500" />;
      default:
        return <FiFolder className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryColor = (category) => {
    if (!category) return 'bg-gray-50 text-gray-600 border-gray-200';
    const normalizedCategory = category.toLowerCase().trim();
    
    switch (normalizedCategory) {
      case 'design':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'development':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'backend':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'frontend':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'testing':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'security':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'devops':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'database':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'api':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'documentation':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'research':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'maintenance':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'other':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getCategoryProgressColor = (category) => {
    if (!category) return 'bg-gray-400';
    const normalizedCategory = category.toLowerCase().trim();
    
    switch (normalizedCategory) {
      case 'design':
        return 'bg-purple-500';
      case 'development':
        return 'bg-blue-500';
      case 'backend':
        return 'bg-green-500';
      case 'frontend':
        return 'bg-pink-500';
      case 'testing':
        return 'bg-yellow-500';
      case 'security':
        return 'bg-red-500';
      case 'devops':
        return 'bg-indigo-500';
      case 'database':
        return 'bg-orange-500';
      case 'api':
        return 'bg-cyan-500';
      case 'documentation':
        return 'bg-teal-500';
      case 'research':
        return 'bg-violet-500';
      case 'maintenance':
        return 'bg-gray-500';
      case 'other':
        return 'bg-slate-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FiFolder className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Categories Overview</h2>
                <p className="text-sm text-gray-500 mt-0.5">View and manage all your task categories</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="relative" ref={filterRef}>
                <button 
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[180px]"
                >
                  <span className="flex items-center gap-2">
                    {React.createElement(filterOptions[filterType].icon, {
                      className: "w-4 h-4 text-gray-500"
                    })}
                    <span>{filterOptions[filterType].label}</span>
                  </span>
                  <FiChevronDown 
                    className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                      showFilter ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                
                {showFilter && (
                  <div className="absolute right-0 w-64 mt-2 py-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                    {Object.entries(filterOptions).map(([value, { label, icon: Icon }]) => (
                      <button 
                        key={value}
                        onClick={() => {
                          setFilterType(value);
                          setShowFilter(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          filterType === value ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${
                          filterType === value ? 'text-indigo-600' : 'text-gray-500'
                        }`} />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[65vh] overflow-y-auto">
            {Object.keys(categoryStats).length === 0 ? (
              <EmptyState
                icon={FiPlusCircle}
                title="No Categories Available"
                description="Get started by creating your first task category. Categories help you organize and track your work more effectively."
                type="info"
              />
            ) : filteredCategories.length === 0 ? (
              <EmptyState
                icon={FiAlertCircle}
                title="No Matching Categories"
                description={`We couldn't find any categories matching "${searchTerm}". Try a different search term or adjust your filters.`}
                type="warning"
              />
            ) : (
              <div className="space-y-4">
                {filteredCategories.map(([category, stats]) => {
                  const completionPercentage = Math.round((stats.completed / stats.total) * 100) || 0;
                  const inProgressPercentage = Math.round((stats.inProgress / stats.total) * 100) || 0;
                  const toDoPercentage = Math.round((stats.toDo / stats.total) * 100) || 0;
                  const cancelledPercentage = Math.round((stats.cancelled / stats.total) * 100) || 0;

                  return (
                    <div 
                      key={category}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                            {getCategoryIcon(category)}
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {category}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">{stats.completed}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600">{stats.inProgress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiList className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">{stats.toDo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiX className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-600">{stats.cancelled}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">Total:</span>
                            <span className="text-sm text-gray-600">{stats.total}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getCategoryProgressColor(category)}`}
                          style={{ width: `${completionPercentage}%` }}
                        />
                        {inProgressPercentage > 0 && (
                          <div
                            className="absolute h-full bg-blue-500/50 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${inProgressPercentage}%`,
                              left: `${completionPercentage}%`
                            }}
                          />
                        )}
                      </div>

                      <div className="flex justify-end mt-2">
                        <span className={`text-sm font-medium ${getCategoryColor(category).split(' ')[1]}`}>
                          {completionPercentage}% Complete
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CategoryModal;
