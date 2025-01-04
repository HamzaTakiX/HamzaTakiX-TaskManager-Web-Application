'use client'

import { FiClipboard } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useTask } from '@/app/_context/TaskContext'

export default function NoTasks() {
  const iconVariants = {
    initial: { rotate: -10, scale: 0.8 },
    animate: {
      rotate: [0, -10, 10, -10, 0],
      scale: 1,
      transition: {
        rotate: {
          repeat: Infinity,
          repeatType: "reverse",
          duration: 4,
          ease: "easeInOut",
        },
        scale: {
          duration: 0.3,
        }
      }
    },
    hover: {
      scale: 1.1,
      rotate: 0,
      transition: {
        rotate: {
          duration: 0.3
        }
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center w-full h-[60vh]"
    >
      <div className="flex flex-col items-center space-y-6 text-center">
        <motion.div 
          variants={iconVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          className="p-6 bg-blue-50 rounded-full ring-8 ring-blue-50/50"
        >
          <FiClipboard className="w-12 h-12 text-blue-500" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-gray-900">No Tasks Found</h3>
          <p className="text-base text-gray-500 max-w-sm">
            There are currently no tasks that are completed or in progress. Tasks marked as "Done" or "In Progress" will appear here.
          </p>
          <div className="flex flex-col items-center mt-4 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                In Progress
              </span>
              <span className="text-gray-500">or</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                Done
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Tasks with these statuses will be displayed here
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
