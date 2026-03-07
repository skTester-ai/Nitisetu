const express = require('express');
const router = express.Router();
const { chatWithKrishiMitra, translateChatMessages } = require('../services/llmService');
const ChatMessage = require('../models/ChatMessage');
const ChatSession = require('../models/ChatSession');
const { protect } = require('../middleware/auth');
const logger = require('../config/logger');

/**
 * @route   GET /api/chat/sessions
 * @desc    Get all chat sessions for the authenticated user
 * @access  Private
 */
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id })
      .sort({ updatedAt: -1 });

    res.json(sessions);
  } catch (error) {
    logger.error('Fetch Chat Sessions Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch chat sessions' });
  }
});

/**
 * @route   POST /api/chat/sessions
 * @desc    Create a new chat session
 * @access  Private
 */
router.post('/sessions', protect, async (req, res) => {
  try {
    const { title } = req.body;
    const session = new ChatSession({
      user: req.user.id,
      title: title || 'New Conversation'
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    logger.error('Create Chat Session Error:', error.message);
    res.status(500).json({ message: 'Failed to create chat session' });
  }
});

/**
 * @route   GET /api/chat/sessions/:sessionId/messages
 * @desc    Get all messages for a specific session
 * @access  Private
 */
router.get('/sessions/:sessionId/messages', protect, async (req, res) => {
  try {
    // Verify session belongs to user
    const session = await ChatSession.findOne({ 
      _id: req.params.sessionId, 
      user: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const messages = await ChatMessage.find({ session: req.params.sessionId })
      .sort({ timestamp: 1 });
    
    res.json(messages);
  } catch (error) {
    logger.error('Fetch Session Messages Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch session messages' });
  }
});

/**
 * @route   DELETE /api/chat/sessions/:sessionId
 * @desc    Delete a specific chat session and its messages
 * @access  Private
 */
router.delete('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ 
      _id: req.params.sessionId, 
      user: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete all messages in the session
    await ChatMessage.deleteMany({ session: req.params.sessionId });
    // Delete the session itself
    await ChatSession.findByIdAndDelete(req.params.sessionId);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    logger.error('Delete Session Error:', error.message);
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

/**
 * @route   DELETE /api/chat/clear
 * @desc    Clear all chat history for the authenticated user
 * @access  Private
 */
router.delete('/clear', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all messages for this user
    await ChatMessage.deleteMany({ user: userId });
    
    // Delete all sessions for this user
    await ChatSession.deleteMany({ user: userId });

    res.json({ success: true, message: 'All chat history cleared' });
  } catch (error) {
    logger.error('Clear Chat History Error:', error.message);
    res.status(500).json({ message: 'Failed to clear chat history' });
  }
});

/**
 * @route   POST /api/chat
 * @desc    Chat with Krishi Mitra AI Assistant
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { query, history, language, sessionId } = req.body;
    const profile = req.user.profile || {};

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    let currentSessionId = sessionId;

    // If no sessionId provided, create a new one
    if (!currentSessionId) {
      const session = new ChatSession({
        user: req.user.id,
        title: query.substring(0, 30) + (query.length > 30 ? '...' : '')
      });
      await session.save();
      currentSessionId = session._id;
    } else {
      // Update session title if it's currently "New Conversation" and we have a query
      const session = await ChatSession.findById(currentSessionId);
      if (session && session.title === 'New Conversation') {
        session.title = query.substring(0, 30) + (query.length > 30 ? '...' : '');
        await session.save();
      }
    }

    // 1. Save user message to DB
    const userMsg = new ChatMessage({
      user: req.user.id,
      session: currentSessionId,
      role: 'user',
      content: query
    });
    await userMsg.save();

    // 2. Get AI response
    const response = await chatWithKrishiMitra(query, history, profile, language || 'en');

    // 3. Save assistant message to DB
    const assistantMsg = new ChatMessage({
      user: req.user.id,
      session: currentSessionId,
      role: 'assistant',
      content: response
    });
    await assistantMsg.save();

    // 4. Update session updatedAt
    await ChatSession.findByIdAndUpdate(currentSessionId, { updatedAt: Date.now() });

    res.json({ 
      response, 
      sessionId: currentSessionId 
    });
  } catch (error) {
    logger.error('Chat API Error:', error.message);
    res.status(500).json({ 
      message: 'Failed to chat with Krishi Mitra',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/chat/translate
 * @desc    Translate chat history to a new language
 * @access  Private
 */
router.post('/translate', protect, async (req, res) => {
  try {
    const { messages, targetLanguage } = req.body;
    if (!messages || !targetLanguage) {
      return res.status(400).json({ message: 'Messages and targetLanguage are required' });
    }

    const translated = await translateChatMessages(messages, targetLanguage);
    res.json(translated);
  } catch (error) {
    logger.error('Chat Translation API Error:', error.message);
    res.status(500).json({ message: 'Failed to translate chat history' });
  }
});

module.exports = router;
