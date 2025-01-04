import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const conversationSchema = new Schema({
    title: {
        type: String,
        required: false,  // Make title optional
        default: 'New Chat'
    },
    user: {
            type: mongoose.Schema.Types.Mixed,  // This allows both String and ObjectId
            ref: 'User', 
            required: true,
            index: true  // Add index for better query performance
    },
    favorite: {
        type: Boolean,
        default: false
    },
    messages: [
        {
            sender: {
                type: String,
                enum: ['user', 'bot'],
                required: true
            },
            message: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true,  // Adds createdAt and updatedAt
    versionKey: false  // Removes __v field
});

// Ensure indexes are created
conversationSchema.index({ user: 1, createdAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;