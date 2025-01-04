import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,  // This allows both String and ObjectId
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['success', 'error', 'profile', 'task', 'message', 'reminder', 'mention', 'settings', 'friend', 'update', 'info'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'notifications' // Explicitly set collection name
});

// Index for faster queries
notificationSchema.index({ userId: 1, timestamp: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
