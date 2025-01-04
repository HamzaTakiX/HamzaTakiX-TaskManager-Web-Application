'use client'

import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi'

export default function Pagination({ currentPage, totalPages, onPageChange, color = 'blue' }) {
  const getActiveButtonColor = () => {
    return {
      bg: color === 'green' ? 'bg-green-600' : 'bg-blue-600',
      hover: color === 'green' ? 'hover:bg-green-700' : 'hover:bg-blue-700',
      text: color === 'green' ? 'text-green-600' : 'text-blue-600',
      border: color === 'green' ? 'border-green-200' : 'border-blue-200',
      hoverBg: color === 'green' ? 'hover:bg-green-50' : 'hover:bg-blue-50'
    };
  };

  const renderPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    const colors = getActiveButtonColor()

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <motion.button
          key={i}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(i)}
          className={`
            px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
            border shadow-sm
            ${currentPage === i
              ? `${colors.bg} text-white border-transparent ${colors.hover}`
              : `text-gray-600 border-gray-200 ${colors.hoverBg} hover:border-gray-300`
            }
          `}
        >
          {i}
        </motion.button>
      )
    }
    return pages
  }

  const colors = getActiveButtonColor()
  const navButtonClass = `
    p-2 rounded-lg transition-all duration-200 border shadow-sm
    flex items-center justify-center
    disabled:opacity-50 disabled:cursor-not-allowed
    text-gray-600 border-gray-200 ${colors.hoverBg} hover:border-gray-300
  `

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center text-sm text-gray-500 font-medium">
        Page <span className={`mx-1 font-semibold ${colors.text}`}>{currentPage}</span> of <span className={`ml-1 font-semibold ${colors.text}`}>{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        {/* First Page */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={navButtonClass}
          title="First Page"
        >
          <FiChevronsLeft className="w-5 h-5" />
        </motion.button>

        {/* Previous Page */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={navButtonClass}
          title="Previous Page"
        >
          <FiChevronLeft className="w-5 h-5" />
        </motion.button>

        {/* Page Numbers */}
        <div className="flex items-center gap-2">
          {renderPageNumbers()}
        </div>

        {/* Next Page */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={navButtonClass}
          title="Next Page"
        >
          <FiChevronRight className="w-5 h-5" />
        </motion.button>

        {/* Last Page */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={navButtonClass}
          title="Last Page"
        >
          <FiChevronsRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  )
}
