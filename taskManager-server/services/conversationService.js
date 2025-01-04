import Conversation from '../models/Conversation.js';

export const createConversation = async (data) => {
    // Ensure we have a title or set a default
    const conversationData = {
        ...data,
        title: data.title || 'New Chat',
        messages: data.messages || []
    };
    
    const conversation = new Conversation(conversationData);
    return await conversation.save();
};

export const getConversationsByUser = async (userId) => {
    return await Conversation.find({ user: userId })
        .sort({ updatedAt: -1 })
        .populate('user', 'name email')
        .lean()
        .exec();
};

export const getConversationById = async (conversationId, userId) => {
    try {
        console.log('Getting conversation by ID:', { conversationId, userId });
        const conversation = await Conversation.findOne({
            _id: conversationId,
            user: userId
        }).sort({ 'messages.timestamp': 1 });  // Sort messages by timestamp
        console.log('Found conversation:', conversation);
        return conversation;
    } catch (error) {
        console.error('Error getting conversation:', {
            error: error.message,
            stack: error.stack,
            conversationId,
            userId
        });
        throw error;
    }
};

export const addMessageToConversation = async (conversationId, newMessages) => {
    try {
        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { 
                $push: { 
                    messages: {
                        $each: newMessages.map(msg => ({
                            ...msg,
                            timestamp: new Date()
                        }))
                    }
                },
                updatedAt: new Date()
            },
            { 
                new: true,
                sort: { 'messages.timestamp': 1 }  // Ensure messages are sorted by timestamp
            }
        );
        return conversation;
    } catch (error) {
        console.error('Error adding message to conversation:', error);
        throw error;
    }
};

export const deleteConversation = async (conversationId, userId) => {
    return await Conversation.findOneAndDelete({ 
        _id: conversationId, 
        user: userId 
    });
};

export const updateConversationTitle = async (conversationId, userId, newTitle) => {
    return await Conversation.findOneAndUpdate(
        { _id: conversationId, user: userId },
        { title: newTitle },
        { new: true }
    );
};

export const updateConversation = async (conversationId, userId, updates) => {
    try {
        console.log('Updating conversation:', {
            conversationId,
            userId,
            updates
        });
        const conversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, user: userId },
            updates,
            { new: true }
        );
        console.log('Updated conversation result:', conversation);
        return conversation;
    } catch (error) {
        console.error('Error updating conversation:', {
            error: error.message,
            stack: error.stack,
            conversationId,
            userId,
            updates
        });
        throw error;
    }
};
