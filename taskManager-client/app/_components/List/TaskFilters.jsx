import { FiSearch, FiX, FiTag, FiUser, FiFlag, FiCalendar, FiFilter, FiChevronDown } from 'react-icons/fi'
import { BsFilter, BsClockHistory } from 'react-icons/bs'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

// Predefined categories matching TaskForm
const CATEGORIES = [
  'Design',
  'Development',
  'Backend',
  'Frontend',
  'Testing',
  'Security',
  'DevOps',
  'Database',
  'API',
  'Documentation',
  'Research',
  'Maintenance',
  'Other'
];

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['In Progress', 'Completed'];
const STATUSES_OLD = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

export default function TaskFilters({ onSearch, searchQuery = '', onClearSearch, onFilterChange }) {
  const [showFilter, setShowFilter] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    category: 'all'
  });
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [showDropdowns, setShowDropdowns] = useState({
    status: false,
    category: false,
    priority: false
  });
  
  const filterRef = useRef(null)
  const searchInputRef = useRef(null)
  const customCategoryInputRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false)
        setShowDropdowns({
          status: false,
          category: false,
          priority: false
        });
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearchFocus = () => {
    setIsFocused(true)
  }

  const handleSearchBlur = () => {
    setIsFocused(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      searchInputRef.current.blur()
      onClearSearch()
    }
    if (e.key === '/' && !isFocused) {
      e.preventDefault()
      searchInputRef.current.focus()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFocused])

  const handleFilterChange = (type, value) => {
    if (type === 'category') {
      if (value === 'Other') {
        setCustomCategory('');
        setShowCustomCategoryInput(true);
      } else {
        setShowCustomCategoryInput(false);
        const newFilters = { ...filters, [type]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
      }
    } else {
      const newFilters = { ...filters, [type]: value };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
    
    setShowDropdowns(prev => ({
      ...prev,
      [type]: false
    }));
  };

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
  };

  const handleCustomCategoryApply = () => {
    if (customCategory.trim()) {
      const newFilters = { ...filters, category: customCategory.trim() };
      setFilters(newFilters);
      onFilterChange(newFilters);
      setCustomCategory(''); // Clear the input after applying
      setShowCustomCategoryInput(false);
    }
  };

  const handleCustomCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCustomCategoryApply();
    }
  };

  const toggleDropdown = (type) => {
    setShowDropdowns(prev => ({
      status: type === 'status' ? !prev.status : false,
      category: type === 'category' ? !prev.category : false,
      priority: type === 'priority' ? !prev.priority : false
    }));
  };

  return (
    <div className="bg-white px-6 py-3 border-y border-gray-200 relative z-50">
      <div className="flex items-center gap-4">
        {/* Filter Controls - Moved to the left */}
        <div className="flex items-center space-x-2" ref={filterRef}>
          {/* Priority Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('priority')}
              className={`px-3 py-2 flex items-center space-x-2 text-sm border rounded-lg ${
                filters.priority !== 'all' ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-600'
              }`}
            >
              <FiFlag className="w-4 h-4" />
              <span>{filters.priority === 'all' ? 'Priority' : filters.priority}</span>
              <FiChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showDropdowns.priority && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                >
                  <button
                    onClick={() => handleFilterChange('priority', 'all')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                      filters.priority === 'all' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    All Priorities
                  </button>
                  {PRIORITIES.map(priority => (
                    <button
                      key={priority}
                      onClick={() => handleFilterChange('priority', priority)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        filters.priority === priority ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('status')}
              className={`px-3 py-2 flex items-center space-x-2 text-sm border rounded-lg ${
                filters.status !== 'all' ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-600'
              }`}
            >
              <BsClockHistory className="w-4 h-4" />
              <span>{filters.status === 'all' ? 'Status' : filters.status}</span>
              <FiChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showDropdowns.status && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                >
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                      filters.status === 'all' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    All Statuses
                  </button>
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => handleFilterChange('status', status)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        filters.status === status ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('category')}
              className={`px-3 py-2 flex items-center space-x-2 text-sm border rounded-lg ${
                filters.category !== 'all' ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-600'
              }`}
            >
              <FiTag className="w-4 h-4" />
              <span>{filters.category === 'all' ? 'Category' : filters.category}</span>
              <FiChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showDropdowns.category && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                >
                  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50">
                    <button
                      onClick={() => handleFilterChange('category', 'all')}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        filters.category === 'all' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      All Categories
                    </button>
                    {CATEGORIES.map(category => (
                      <button
                        key={category}
                        onClick={() => handleFilterChange('category', category)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                          filters.category === category ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Custom Category Input - Next to filter buttons */}
          {showCustomCategoryInput && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center space-x-2"
            >
              <input
                ref={customCategoryInputRef}
                type="text"
                value={customCategory}
                onChange={handleCustomCategoryChange}
                onKeyDown={handleCustomCategoryKeyDown}
                placeholder="Enter category"
                className="px-3 py-2 text-sm border border-blue-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                autoFocus
              />
              <button
                onClick={handleCustomCategoryApply}
                className="px-3 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none"
              >
                Apply
              </button>
            </motion.div>
          )}

          {/* Clear Filters Button */}
          {(filters.priority !== 'all' || filters.status !== 'all' || filters.category !== 'all') && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setFilters({ priority: 'all', status: 'all', category: 'all' })
                onFilterChange({ priority: 'all', status: 'all', category: 'all' })
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              Clear Filters
            </motion.button>
          )}
        </div>

        {/* Search Box - Moved to the right */}
        <div className="flex-1">
          <div className="relative max-w-md ml-auto">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
