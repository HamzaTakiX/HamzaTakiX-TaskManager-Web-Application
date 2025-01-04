import { useState } from 'react';
import { FiX } from 'react-icons/fi';

export function AddFolderModal({ isOpen, onClose, onAddFolder }) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onAddFolder(folderName.trim());
      setFolderName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Modal content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Folder
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter a name for your new folder
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg 
                       bg-white dark:bg-gray-900 
                       text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                       transition-colors"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       hover:bg-gray-100 dark:hover:bg-gray-700
                       rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-4 py-2 text-sm font-medium text-white
                       bg-blue-500 hover:bg-blue-600
                       disabled:bg-blue-400 disabled:cursor-not-allowed
                       rounded-lg transition-colors"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
