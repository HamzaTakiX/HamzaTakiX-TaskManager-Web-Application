import express from 'express';
import * as conversationController from '../controllers/conversationController.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();

// Conversation routes
router.post('/conv/ask', authenticateToken, conversationController.addMessageToConversation);
router.post('/conv/new', authenticateToken, conversationController.createConversation);
router.get('/conv', authenticateToken, conversationController.getConversationsByUser);
router.get('/conv/:id', authenticateToken, conversationController.getConversationById);
router.put('/conv/:id', authenticateToken, conversationController.updateConversationTitle);
router.put('/conv/:id/favorite', authenticateToken, conversationController.toggleFavorite);
router.delete('/conv/:id', authenticateToken, conversationController.deleteConversation);

export default router;
