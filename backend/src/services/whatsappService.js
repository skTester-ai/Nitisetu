const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config/env');
const { transcribeAudio, chatWithKrishiMitra } = require('./llmService');
const logger = require('../config/logger');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');

// Twilio credentials from Config
const accountSid = config.twilioAccountSid;
const authToken = config.twilioAuthToken;
const whatsappFrom = config.twilioWhatsappNumber;

// Initialize Twilio client only if credentials are provided
let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Main handler for incoming WhatsApp messages (text or voice)
 */
const handleIncomingMessage = async (payload) => {
  const from = payload.From; // format: whatsapp:+91xxxxxxxxxx
  const body = payload.Body;
  const mediaUrl = payload.MediaUrl0;
  const mediaType = payload.MediaContentType0;

  try {
    let userMessage = body;
    
    // 1. Handle Voice Note
    if (mediaUrl && mediaType && mediaType.startsWith('audio/')) {
      logger.info(`Processing WhatsApp voice note from ${from}`);
      const tempPath = path.join(os.tmpdir(), `whatsapp_voice_${Date.now()}.ogg`);
      
      const response = await axios({
        method: 'get',
        url: mediaUrl,
        responseType: 'stream',
        auth: { username: accountSid, password: authToken }
      });

      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Transcribe the voice note
      userMessage = await transcribeAudio(tempPath, 'mr'); 
      logger.info(`WhatsApp Voice Transcribed: "${userMessage}"`);
      
      // Cleanup
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }

    if (!userMessage || userMessage.trim() === "") {
        if (mediaUrl) {
             await sendWhatsAppMessage(from, "I couldn't hear the audio clearly. Could you please try again or type your question?");
        }
        return;
    }

    // 2. Identify Unique User by Contact Number
    // 2. Map Sender to Farmer Profile (Identity Search)
    const contactNumber = from.replace('whatsapp:', '');
    
    // First, find the user who has verified this phone number
    const user = await User.findOne({ contactNumber, isPhoneVerified: true });
    
    let profiles = [];
    if (user) {
      // Find ALL profiles linked to this unique user account
      profiles = await FarmerProfile.find({ userId: user._id }).lean();
    } else {
      // Fallback: Check if there's a profile with this number directly (legacy/guest verification)
      const directProfile = await FarmerProfile.findOne({ contactNumber }).lean();
      if (directProfile) profiles = [directProfile];
    }
    
    // 3. Handle Guest Mode Logic
    if (profiles.length === 0) {
      const guestContext = `[ADMIN NOTE: 
      - This user is NOT registered. 
      - IMPORTANT: Start your message by politely mentioning: "We have noticed that you are not registered with Niti Setu yet! 🌾"
      - Their phone number ${contactNumber} does not exist in our database.
      - Remind them that registration requires a UNIQUE Email and Phone Number for security.
      - Provide a warm welcome, brief answer, and follow the GUEST HANDLING rules to invite registration at ${config.frontendUrl}/register to unlock personalized benefits.]`;
      
      const aiResponse = await chatWithKrishiMitra(userMessage, [], null, 'en', 'guest', guestContext);
      await sendWhatsAppMessage(from, aiResponse);
      return;
    }

    // 4. Generate AI Response for Registered Users (Unified Account Identity)
    const accountName = user?.name || profiles[0]?.name || "Farmer";
    const systemRole = user?.role || 'Farmer';
    const profilesCount = profiles.length;
    const profilesList = profiles.map((p, i) => `   - Farmer: *${p.name}* (${p.cropType} in ${p.district})`).join('\n');

    const registeredOptions = `
    • View your *Eligibility History* 📊
    • Check new *Schemes* 📂
    • Update your *Farmer Profile* 🚜
    • Ask about *Weather or Market Prices* 🌦️
    `;

    // Create a virtual profile for the LLM to use the correct name in the greeting
    const virtualProfile = {
      ...profiles[0], // Keep location/crops context for background knowledge
      name: accountName, // OVERRIDE name with Account Holder for greeting
      role: systemRole
    };

    const registeredContext = `[ADMIN NOTE: 
    - CRITICAL IDENTITY: You are talking to the ACCOUNT OWNER: *${accountName}*. 
    - SYSTEM ROLE: They are a verified *${systemRole === 'admin' ? 'Administrator' : 'Farmer'}*.
    - DATA CONTEXT: This user manages ${profilesCount} farmer profiles under their email.
    - PROFILES INVENTORY (For your reference):
${profilesList}
    - MANDATORY INSTRUCTION: GREETING MUST BE "Namaskar ${accountName}! 🙏" (or regional equivalent). 
    - DO NOT call the user by farmer names like "Suresh" or "Niranjan". 
    - ACKNOWLEDGE that they are the master account owner managing these ${profilesCount} profiles.
    - OPTIONS: ${registeredOptions}]`;
    
    const aiResponse = await chatWithKrishiMitra(userMessage, [], virtualProfile, 'en', 'registered', registeredContext);
    
    // 5. Send Response Back to User
    await sendWhatsAppMessage(from, aiResponse);

  } catch (error) {
    logger.error('WhatsApp Service Error:', error);
    await sendWhatsAppMessage(from, "I'm having some trouble processing your message right now, Brother. Please try again later.");
  }
};

/**
 * Send a WhatsApp message via Twilio API
 */
const sendWhatsAppMessage = async (to, text) => {
  if (!client) {
    logger.warn('Twilio client not initialized. Cannot send WhatsApp message.');
    return;
  }

  try {
    await client.messages.create({
      from: whatsappFrom,
      to: to,
      body: text
    });
    logger.info(`WhatsApp reply sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send WhatsApp message:', error);
  }
};

/**
 * Send a verification OTP via WhatsApp
 */
const sendWhatsAppOTP = async (phoneNumber, otp) => {
  const formattedPhone = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
  const message = `🔔 *Niti Setu Security Protocol*\n\nYour 6-digit verification code is: *${otp}*\n\nThis code is valid for 10 minutes. Do not share it with anyone. 🌾`;
  return await sendWhatsAppMessage(formattedPhone, message);
};

module.exports = {
  handleIncomingMessage,
  sendWhatsAppMessage,
  sendWhatsAppOTP
};
