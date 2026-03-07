const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const logger = require('../config/logger');

// Twilio webhook endpoint for incoming WhatsApp messages
router.post('/webhook', async (req, res) => {
  try {
    // Process the message asynchronously to respond quickly to Twilio
    whatsappService.handleIncomingMessage(req.body);
    
    // Twilio expects a 200 OK and optional TwiML response
    // We send an empty TwiML for now as we'll send the reply via the REST API
    res.type('text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    logger.error('WhatsApp Webhook Error:', error);
    res.status(500).send('Error processing message');
  }
});

module.exports = router;
