const mongoose = require('mongoose');

const ResourceUsageSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    enum: ['Groq-LLM', 'Groq-Whisper', 'Groq-Vision', 'ElevenLabs-TTS', 'SMTP-Email'],
    unique: true
  },
  provider: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    enum: ['tokens', 'characters', 'requests', 'seconds'],
    default: 'tokens'
  },
  dailyLimit: {
    type: Number,
    default: 0
  },
  // Track Registered Users (Admins/Farmers)
  totalRegisteredUsage: { type: Number, default: 0 },
  todayRegisteredUsage: { type: Number, default: 0 },
  
  // Track Public/Guest Users
  totalPublicUsage: { type: Number, default: 0 },
  todayPublicUsage: { type: Number, default: 0 },

  history: [{
    date: { type: Date, default: Date.now },
    registeredUsage: Number,
    publicUsage: Number
  }],
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Method to increment usage with category awareness
ResourceUsageSchema.statics.recordUsage = async function(serviceName, amount, category = 'registered') {
  const today = new Date().setHours(0, 0, 0, 0);
  const isPublic = category === 'public';
  
  let record = await this.findOne({ serviceName });
  if (!record) {
    const providers = {
      'Groq-LLM': 'Groq',
      'Groq-Whisper': 'Groq',
      'Groq-Vision': 'Groq',
      'ElevenLabs-TTS': 'ElevenLabs',
      'SMTP-Email': 'SendGrid/SMTP'
    };
    const units = {
      'Groq-LLM': 'tokens',
      'Groq-Whisper': 'seconds',
      'Groq-Vision': 'tokens',
      'ElevenLabs-TTS': 'characters',
      'SMTP-Email': 'requests'
    };
    
    record = new this({
      serviceName,
      provider: providers[serviceName] || 'Unknown',
      unit: units[serviceName] || 'requests'
    });
  }

  // Reset counters if it's a new day
  const lastUpdate = new Date(record.lastUsed).setHours(0, 0, 0, 0);
  if (today > lastUpdate) {
    record.history.push({ 
      date: record.lastUsed, 
      registeredUsage: record.todayRegisteredUsage,
      publicUsage: record.todayPublicUsage
    });
    if (record.history.length > 30) record.history.shift();
    record.todayRegisteredUsage = 0;
    record.todayPublicUsage = 0;
  }

  if (isPublic) {
    record.todayPublicUsage += amount;
    record.totalPublicUsage += amount;
  } else {
    record.todayRegisteredUsage += amount;
    record.totalRegisteredUsage += amount;
  }
  
  record.lastUsed = new Date();
  return await record.save();
};

module.exports = mongoose.model('ResourceUsage', ResourceUsageSchema);
