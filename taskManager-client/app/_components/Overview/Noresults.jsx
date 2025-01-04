'use client'

import { motion } from 'framer-motion'
import { FiSearch, FiInbox } from 'react-icons/fi'
import { RiSearchEyeLine } from 'react-icons/ri'
import { useTheme } from '@/app/_context/ThemeContext'

const NoSearchResults = ({ query, onClearSearch }) => {
  const { theme, themes } = useTheme()
  const currentTheme = themes[theme] || themes.light

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center p-12 ${currentTheme.text}`}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: 0.2,
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        className="relative mb-8"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full blur-xl"
        />
        <div className="relative flex items-center justify-center">
          <motion.div 
            className="text-6xl text-blue-500"
            animate={{ 
              rotate: [0, 10, 0, -10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <RiSearchEyeLine className="relative z-10" />
          </motion.div>
          <motion.div 
            className="absolute text-4xl text-purple-400 opacity-50"
            initial={{ scale: 0.8, x: -5, y: -5 }}
            animate={{ 
              scale: [0.8, 1, 0.8],
              x: [-5, 0, -5],
              y: [-5, 0, -5],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <FiInbox />
          </motion.div>
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-semibold mb-2"
      >
        No matching tasks found
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-500 text-center mb-4"
      >
        {query ? `No tasks match "${query}"` : 'No tasks available'}
      </motion.p>

      {query && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onClearSearch}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Clear Search
        </motion.button>
      )}
    </motion.div>
  )
}

export default NoSearchResults
