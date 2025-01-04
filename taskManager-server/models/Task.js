import mongoose from 'mongoose';

const Task = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        validate: {
            validator: function(value) {
                const predefinedCategories = [
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
                // Accept either predefined categories or any custom category that's not empty
                return predefinedCategories.includes(value) || (value && value.trim().length > 0);
            },
            message: 'Invalid category. Must be either a predefined category or a non-empty custom category.'
        }
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    timeRemaining: {
        type: Number,  // Stored in days
        default: function() {
            return Math.ceil((this.dueDate - this.startDate) / (1000 * 60 * 60 * 24));
        }
    },
    pinned: {
        type: Boolean,
        default: false,
        required: false
    },
    favorite: {
        type: Boolean,
        default: false,
        required: false
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        required: [true, 'Priority is required'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'Done', 'Cancled'],
        default: 'To Do',
        required: [true, 'Status is required']
    },
    user: {
        type: mongoose.Schema.Types.Mixed,  // This allows both String and ObjectId
        ref: 'User', 
        required: [true, 'User ID is required']
    },
    manual: {
        type: Boolean,
        default: false
    },
    validation: {
        type: Boolean,
        default: false
    },
    cancelled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for calculating time remaining
Task.virtual('daysLeft').get(function() {
    return Math.ceil((this.dueDate - new Date()) / (1000 * 60 * 60 * 24));
});

export default mongoose.model('Task', Task);
