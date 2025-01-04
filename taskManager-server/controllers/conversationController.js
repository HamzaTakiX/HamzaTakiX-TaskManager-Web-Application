import * as conversationService from '../services/conversationService.js';
import chatbotController  from '../controllers/chatbotController.js';

export const createConversation = async (req, res) => {
    try {
        console.log('Creating new conversation:', req.body);
        const { title, messages } = req.body;
        const user = req.user.userId;
        
        if (!user) {
            return res.status(401).json({ 
                message: 'User not authenticated', 
                state: false 
            });
        }
        
        // Create initial conversation data
        const conversationData = {
            title: title || 'New Chat',
            user,
            messages: messages || []
        };

        console.log('Creating conversation with data:', conversationData);
        const conversation = await conversationService.createConversation(conversationData);
        console.log('Created conversation:', conversation);
        
        // Format the response
        const formattedConversation = {
            _id: conversation._id,
            title: conversation.title,
            messages: conversation.messages.map(msg => ({
                sender: msg.sender,
                message: msg.message,
                timestamp: msg.timestamp
            })),
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
        };
        
        res.status(201).json({ 
            message: 'Conversation created successfully', 
            state: true, 
            conversation: formattedConversation
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ 
            message: error.message, 
            state: false,
            stack: error.stack 
        });
    }
};

export const getConversationsByUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversations = await conversationService.getConversationsByUser(userId);
        res.status(200).json({ conversations, state: true });
    } catch (error) {
        res.status(500).json({ message: error.message, state: false });
    }
};

export const getConversationById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = req.params.id;
        const conversation = await conversationService.getConversationById(conversationId, userId);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
        res.status(200).json({ conversation, state: true });
    } catch (error) {
        res.status(500).json({ message: error.message, state: false });
    }
};

export const addMessageToConversation = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('User:', req.user);
        
        const { message, convId } = req.body;
        if (!message || !convId) {
            return res.status(400).json({ 
                error: 'Missing required fields', 
                state: false,
                details: { message: !!message, convId: !!convId }
            });
        }

        // First verify the conversation exists and belongs to the user
        const conversation = await conversationService.getConversationById(convId, req.user.userId);
        if (!conversation) {
            return res.status(404).json({
                error: 'Conversation not found',
                state: false
            });
        }

        try {
            // Get all previous messages for context
            const previousMessages = conversation.messages || [];
            
            console.log('\n=== Processing Message ===');
            console.log('User:', req.user.userId);
            console.log('Message:', message);
            console.log('Previous messages:', previousMessages.length);
            
            // Pass the conversation history to processMessage
            const result = await chatbotController.processMessage(
                req.user.userId, 
                message,
                previousMessages
            );
            
            console.log('\n=== AI Response Result ===');
            console.log('Success:', result?.success);
            console.log('Has task:', !!result?.task);
            console.log('Has error:', !!result?.error);
            
            if (!result || (!result.aiResponse && !result.error)) {
                throw new Error('Invalid response received from AI');
            }

            // Add new messages
            const newMessages = [
                { sender: 'user', message, timestamp: new Date() }
            ];

            // Add bot response with appropriate status
            let botMessage = result.aiResponse || 'I apologize, but I encountered an error while processing your message.';
            
            // If this was a task creation attempt, add the status
            if (result.task) {
                botMessage += `\n\n✅ Task "${result.task.title}" has been created successfully!`;
            } else if (result.error) {
                botMessage += `\n\n❌ Error: ${result.error}`;
            }

            newMessages.push({ 
                sender: 'bot', 
                message: botMessage, 
                timestamp: new Date() 
            });
            
            const updatedConversation = await conversationService.addMessageToConversation(convId, newMessages);
            console.log('\n=== Conversation Updated ===');
            console.log('New message count:', newMessages.length);
            
            if (!updatedConversation) {
                throw new Error('Failed to update conversation');
            }
            
            // Format the response
            const formattedConversation = {
                _id: updatedConversation._id,
                title: updatedConversation.title,
                messages: updatedConversation.messages.map(msg => ({
                    sender: msg.sender,
                    message: msg.message,
                    timestamp: msg.timestamp
                })),
                createdAt: updatedConversation.createdAt,
                updatedAt: updatedConversation.updatedAt
            };
            
            res.json({ 
                response: botMessage,
                state: true,
                conversation: formattedConversation
            });
        } catch (aiError) {
            console.error('AI processing error:', aiError);
            
            // Add only the user's message to keep the conversation going
            const userMessage = [{ sender: 'user', message, timestamp: new Date() }];
            await conversationService.addMessageToConversation(convId, userMessage);
            
            res.status(500).json({ 
                error: 'Failed to process message with AI',
                details: aiError.message,
                state: false
            });
        }
    } catch (error) {
        console.error('Error in addMessageToConversation:', error);
        res.status(500).json({ 
            error: error.message, 
            state: false,
            stack: error.stack
        });
    }
};

export const updateConversationTitle = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = req.params.id;
        const { title } = req.body;
        await conversationService.updateConversationTitle(conversationId, userId, title);
        res.json({ message: 'Title updated successfully', state: true });
    } catch (error) {
        res.status(500).json({ message: error.message, state: false });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = req.params.id;
        await conversationService.deleteConversation(conversationId, userId);
        res.json({ message: 'Conversation deleted successfully', state: true });
    } catch (error) {
        res.status(500).json({ message: error.message, state: false });
    }
};

export const toggleFavorite = async (req, res) => {
    try {
        console.log('Received favorite toggle request:', {
            id: req.params.id,
            userId: req.user?.userId,
            body: req.body
        });
        
        if (!req.user || !req.user.userId) {
            console.log('No user found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { id } = req.params;
        if (!id) {
            console.log('No conversation ID provided');
            return res.status(400).json({
                success: false,
                message: 'Conversation ID is required'
            });
        }

        const { favorite } = req.body;
        if (typeof favorite !== 'boolean') {
            console.log('Invalid favorite value:', favorite);
            return res.status(400).json({
                success: false,
                message: 'Favorite must be a boolean value'
            });
        }
        
        console.log('Fetching conversation from database...');
        const conversation = await conversationService.getConversationById(id, req.user.userId);
        
        if (!conversation) {
            console.log('Conversation not found:', id);
            return res.status(404).json({ 
                success: false, 
                message: 'Conversation not found' 
            });
        }
        console.log('Found conversation:', conversation);

        console.log('Updating conversation with favorite status:', favorite);
        const updatedConversation = await conversationService.updateConversation(
            id,
            req.user.userId,
            { favorite }
        );

        if (!updatedConversation) {
            console.log('Failed to update conversation');
            return res.status(500).json({
                success: false,
                message: 'Failed to update conversation'
            });
        }
        console.log('Updated conversation:', updatedConversation);

        res.json({ 
            success: true, 
            favorite: updatedConversation.favorite 
        });
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
        res.status(500).json({ 
            success: false, 
            message: 'Error toggling favorite status',
            error: error.message,
            code: error.code
        });
    }
};
