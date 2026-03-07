import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getChatSessions, 
  getSessionMessages, 
  clearChatHistory, 
  chatWithKrishiMitra, 
  generateSpeech,
  translateChatHistory 
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useVoice } from '../../hooks/useVoice';
import { useToast } from '../../context/ToastContext';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  MessageSquare, X, Send, Sprout, Leaf, User, Bot, HelpCircle, 
  LayoutDashboard, Search, Volume2, VolumeX, Loader2, Home, 
  Mic, MicOff, ChevronRight, CheckCircle2, Trash2 
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const KrishiMitra = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [isAutoSpeech, setIsAutoSpeech] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { i18n } = useTranslation();
  const [chatLanguage, setChatLanguage] = useState(() => localStorage.getItem('chat_language') || 'en');
  const { addToast } = useToast();
  
  // New States for Home/Chat Views and Dictation (using useVoice hook for Whisper STT)
  const [activeTab, setActiveTab] = useState('home');
  const { isListening: isDictating, transcript: voiceTranscript, startListening, stopListening: stopDictation, resetTranscript } = useVoice(chatLanguage || 'hi-IN');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const audioCache = useRef({}); // In-memory cache for generated audio URLs
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(() => localStorage.getItem('current_session_id'));
  const [sessions, setSessions] = useState([]);

  // Sync session ID to localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('current_session_id', currentSessionId);
    } else {
      localStorage.removeItem('current_session_id');
    }
  }, [currentSessionId]);

  // Sync language to localStorage
  useEffect(() => {
    localStorage.setItem('chat_language', chatLanguage);
  }, [chatLanguage]);

  // Listen for sync events from dashboard
  useEffect(() => {
    const handleSync = () => loadHistory();
    window.addEventListener('nitisetu:chat-sync', handleSync);
    return () => window.removeEventListener('nitisetu:chat-sync', handleSync);
  }, []);

  // Sync voice transcript to input value
  useEffect(() => {
    if (voiceTranscript) {
      setInputValue(voiceTranscript);
      resetTranscript();
    }
  }, [voiceTranscript, resetTranscript]);

  // Persistent multi-lingual cache for the current session's messages
  const [messageCache, setMessageCache] = useState({ 'en': [] });

  // Initialize/Update cache ground truth when messages change from AI/User input
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setMessageCache(prev => ({
        ...prev,
        [chatLanguage]: messages
      }));
    }
  }, [messages, isLoading, chatLanguage]);

  // Update language dynamically with Caching logic
  useEffect(() => {
    const handleTranslateHistory = async () => {
      // 1. Check if we already have this translation in cache
      if (messageCache[chatLanguage] && messageCache[chatLanguage].length === messages.length) {
        setMessages(messageCache[chatLanguage]);
        return;
      }

      // 2. Identify source for translation (prefer 'en' as ground truth)
      const sourceMessages = messageCache['en'].length > 0 ? messageCache['en'] : messages;
      
      const historyToTranslate = sourceMessages.filter(m => m.text).map(m => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

      if (historyToTranslate.length === 0) return;
      
      try {
        setIsLoading(true);
        addToast('Translation Layer', `Syncing chat into ${chatLanguage.toUpperCase()}...`, 'info');
        
        let translated;
        if (chatLanguage === 'en') {
           // If switching back to English, use our original 'en' cache
           translated = messageCache['en'].map(m => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text }));
        } else {
           translated = await translateChatHistory(historyToTranslate, chatLanguage);
        }
        
        const formatted = translated.map((msg, index) => ({
          ...sourceMessages[index],
          text: msg.content,
          sender: msg.role === 'assistant' ? 'ai' : 'user'
        }));
        
        setMessages(formatted);
        setMessageCache(prev => ({
          ...prev,
          [chatLanguage]: formatted
        }));
      } catch (err) {
        console.error('Floating sync failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (messages.length > 0 && chatLanguage) {
      handleTranslateHistory();
    }
  }, [chatLanguage]);


  useEffect(() => {
    if (activeTab === 'home') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    // Only load if authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      showGreeting();
      setIsHistoryLoaded(true);
      return;
    }

    try {
      // 1. Get all sessions
      const sessionList = await getChatSessions();
      const validSessions = sessionList || [];
      setSessions(validSessions);
      
      // Use stored session ID if available, otherwise latest
      const savedSessionId = localStorage.getItem('current_session_id');
      const targetSession = (savedSessionId && validSessions.find(s => s._id === savedSessionId)) 
        ? validSessions.find(s => s._id === savedSessionId)
        : validSessions[0];

      if (targetSession) {
        setCurrentSessionId(targetSession._id);
        setMessageCache({ 'en': [] }); 
        
        // 2. Load messages for this session
        const history = await getSessionMessages(targetSession._id);
        if (history && history.length > 0) {
          const formatted = history.map(msg => ({
            id: msg._id,
            text: msg.content,
            sender: msg.role === 'assistant' ? 'ai' : 'user',
            showSuggestions: false
          }));
          setMessages(formatted);
        } else {
          showGreeting();
        }
      } else {
        showGreeting();
      }
      setIsHistoryLoaded(true);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      showGreeting();
    }
  };

  const showGreeting = () => {
    setMessages([
      { 
        id: 'initial', 
        text: t('chat_greeting', "Namaste! I am Krishi Mitra, your agricultural guide. How can I help you today?"), 
        sender: 'ai',
        showSuggestions: true 
      }
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      if (token) {
        loadHistory();
      } else {
        showGreeting();
        setIsHistoryLoaded(true);
      }
    }
  }, [isOpen]);

  const toggleDictation = async () => {
    if (isDictating) {
      setIsProcessingVoice(true);
      try {
        await stopDictation();
        addToast('Voice Processed', 'Message transcribed successfully', 'success');
      } catch (err) {
        addToast('Transcription Failed', 'Could not process audio', 'error');
      } finally {
        setIsProcessingVoice(false);
      }
    } else {
      try {
        await startListening();
      } catch (err) {
        addToast('Microphone Error', 'Could not access microphone', 'error');
      }
    }
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestions = [
    { text: t('chat_sug_eligibility', "🔍 How to check eligibility?"), action: "guide_eligibility" },
    { text: t('chat_sug_history', "📜 Show my check history"), action: "guide_history" },
    { text: t('chat_sug_schemes', "📄 View Scheme documents"), action: "guide_schemes" },
    { text: t('chat_sug_profile', "👤 How to update my profile?"), action: "guide_profile" },
    { text: t('chat_sug_crops', "🌾 Best crops for this season?"), action: "llm_trigger" },
    { text: t('chat_sug_benefits', "👩‍🌾 Benefits for Women/SC/ST?"), action: "llm_trigger" },
    { text: t('chat_sug_language', "🌐 Talk in my language"), action: "guide_language" }
  ];

  const handleSend = async (text) => {
    if (!text.trim()) return;

    setMessages(prev => prev.map(m => ({ ...m, showSuggestions: false })));

    const userMessage = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setActiveTab('chat');

    try {
      const historyItems = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await chatWithKrishiMitra(text, historyItems, chatLanguage, currentSessionId);
      
      if (!currentSessionId && res.sessionId) {
        setCurrentSessionId(res.sessionId);
        localStorage.setItem('current_session_id', res.sessionId);
        window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: res.response, sender: 'ai' }]);
      
      // Auto-Voice removed as per user request
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "I'm having trouble connecting right now. Please try again later.", 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
      // Dispatch sync event so floating bot knows we switched sessions
      window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
    }
  };

  const handleSuggestion = (suggestion) => {
    // Hide suggestions on the previous AI message
    setMessages(prev => prev.map(m => ({ ...m, showSuggestions: false })));
    
    setActiveTab('chat'); // Switch to chat mode automatically

    if (suggestion.action.startsWith('guide_')) {
      const userText = suggestion.text;
      let response = "";
      switch (suggestion.action) {
        case 'guide_eligibility':
          response = "To check your eligibility: \n1. Click 'Eligibility Check' in the sidebar.\n2. Choose 'Manual' or 'Voice' mode.\n3. Get instant results!";
          break;
        case 'guide_history':
          response = "You can view all your previous eligibility checks by clicking 'History' in the sidebar.";
          break;
        case 'guide_schemes':
          response = "Go to the 'Schemes' page to see all available government documents and official PDFs.";
          break;
        case 'guide_profile':
          response = "To update your details, go to the 'Settings' page. Accurate data ensures better results!";
          break;
        case 'guide_language':
          response = "Use the language switcher at the bottom of the sidebar to change the app language.";
          break;
        default:
          response = "I can guide you through the app. Just ask me where to find something!";
      }
      
      setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
      
      // Artificial delay for guiding
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: 'ai' }]);
        
        // Final follow up after another delay
        setTimeout(() => {
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now() + 2, 
              text: t('chat_got_it', "Got it! Anything else about Niti Setu?"), 
              sender: 'ai', 
              showSuggestions: true 
            }
          ]);
        }, 1500);
      }, 600);
    } else {
      handleSend(suggestion.text);
    }
  };
  
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  const speakMessage = async (text, msgId) => {
    if (isSpeaking && speakingMsgId === msgId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    setIsSpeaking(true);
    setSpeakingMsgId(msgId);

    try {
      const lang = chatLanguage.split('-')[0];
      const cacheKey = `${lang}::${msgId}`;
      
      let url;
      if (audioCache.current[cacheKey]) {
        url = audioCache.current[cacheKey];
      } else {
        addToast(t('sb_history'), 'Fetching natural AI voice...', 'info');
        const audioBlob = await generateSpeech(text, lang);
        url = URL.createObjectURL(audioBlob);
        audioCache.current[cacheKey] = url;
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
        addToast('Audio Error', 'Failed to play speech', 'error');
      };
      audio.play();
    } catch (err) {
      console.error("Floating TTS Error:", err);
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      addToast('Audio Error', 'Failed to generate voice', 'error');
    }
  };

  // Do not show the floating bot on the dedicated chat dashboard
  if (location.pathname === '/dashboard/chat') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.div 
        className="krishi-mitra-fab"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={30} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sprout size={32} />
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.div 
            className="absolute -top-3 -right-3 px-3 py-1.5 rounded-2xl shadow-xl border border-[var(--border-glow)] flex items-center justify-center"
            style={{ 
              background: 'var(--gradient-primary)', 
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 800,
              zIndex: 10
            }}
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
          >
            Hi! {user?.name ? user.name.split(' ')[0] : ''}
          </motion.div>
        )}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="chat-window"
            drag
            dragMomentum={false}
            dragConstraints={{ left: -window.innerWidth + 500, right: 0, top: 0, bottom: window.innerHeight - 300 }}
            initial={{ opacity: 0, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ cursor: 'auto' }}
          >

            {/* Header */}
            <div className="chat-header" style={{ 
              background: 'var(--gradient-primary)', 
              padding: '24px 20px', 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              cursor: 'move'
            }}>

              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Leaf size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Krishi Mitra</h4>
                <div className="flex items-center gap-1.5">
                  {isSpeaking ? (
                    <div 
                      onClick={stopSpeaking}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Stop Audio"
                    >
                      <div className="waveform">
                        <div className="waveform-bar" style={{ background: 'white' }}></div>
                        <div className="waveform-bar" style={{ background: 'white' }}></div>
                        <div className="waveform-bar" style={{ background: 'white' }}></div>
                        <div className="waveform-bar" style={{ background: 'white' }}></div>
                        <div className="waveform-bar" style={{ background: 'white' }}></div>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: 'white' }}>Speaking...</span>
                    </div>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <p className="text-[10px] opacity-80">{t('sb_system_online', "Farmer's Friend is Online")}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div style={{ marginRight: '8px' }}>
                  <LanguageSwitcher 
                    placement="down" 
                    currentLanguage={chatLanguage}
                    onSelect={(code) => {
                      setChatLanguage(code);
                      i18n.changeLanguage(code);
                    }}
                  />
                </div>
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70"
                  title="Clear Conversation"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <ConfirmDeleteModal
              isOpen={showClearConfirm}
              onClose={() => setShowClearConfirm(false)}
              onConfirm={async () => {
                setIsClearing(true);
                try {
                  await clearChatHistory();
                  setMessages([
                    { 
                      id: 'reset', 
                      text: t('chat_greeting', "Namaste! I am Krishi Mitra, your agricultural guide. How can I help you today?"), 
                      sender: 'ai',
                      showSuggestions: true 
                    }
                  ]);
                  setShowClearConfirm(false);
                } catch (err) {
                  alert("Failed to clear history");
                } finally {
                  setIsClearing(false);
                }
              }}
              title={t('chat_clear_title', "Clear Conversation?")}
              message={t('chat_clear_msg', "This will permanently delete all your chat messages with Krishi Mitra.")}
              isDeleting={isClearing}
            />

            {/* TAB CONTENT */}
            {activeTab === 'home' ? (
              <div className="chat-messages" style={{ padding: '0', background: 'var(--bg-primary)' }}>
                {/* Hero Greeting */}
                <div style={{ padding: '28px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)', position: 'relative', overflow: 'hidden' }}>
                  {/* Decorative background circle */}
                  <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'var(--gradient-primary)', opacity: 0.1, borderRadius: '50%', filter: 'blur(30px)' }}></div>
                  
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
                    {t('chat_home_greet', "Namaste")} {user?.name ? user.name.split(' ')[0] : 'Farmer'}!
                    <br />
                    <span style={{ opacity: 0.8, fontSize: '0.9rem', fontWeight: 600 }}>{t('chat_home_help', "How can I assist you today?") }</span>
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-glass)', width: 'fit-content', position: 'relative', zIndex: 1 }}>
                    <div className="pulse-dot"></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sb_system_online', "AI Support Online")}</span>
                  </div>
                </div>

                {/* Search Area */}
                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Ask me anything..." 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                      style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <button 
                      onClick={() => handleSend(inputValue)}
                      style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--accent-indigo)' }}
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </div>

                {/* Recent Chats Section */}
                 <div style={{ padding: '20px 20px 0' }}>
                    <div className="flex items-center justify-between mb-3">
                       <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Conversations</h3>
                       <button 
                        onClick={() => { 
                          setCurrentSessionId(null); 
                          localStorage.removeItem('current_session_id');
                          setMessages([]); 
                          showGreeting(); 
                          setActiveTab('chat'); 
                          window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
                        }} 
                        className="text-[11px] text-emerald-500 font-bold hover:underline px-3 py-1 rounded-lg bg-emerald-500/10 transition-colors"
                       >
                         {t('chat_new_chat', 'New Chat')}
                       </button>
                    </div>
                    <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                       {isHistoryLoaded && sessions.length > 0 ? (
                         sessions.slice(0, 5).map((session, idx) => (
                          <button 
                            key={session._id}
                            onClick={async () => {
                              setCurrentSessionId(session._id);
                              localStorage.setItem('current_session_id', session._id);
                              const history = await getSessionMessages(session._id);
                              if (history) {
                                setMessages(history.map(msg => ({
                                  id: msg._id,
                                  text: msg.content,
                                  sender: msg.role === 'assistant' ? 'ai' : 'user'
                                })));
                                setActiveTab('chat');
                                // Dispatch sync event so dashboard knows we switched sessions
                                window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
                              }
                            }}
                            style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px',
                              borderRadius: '16px',
                              background: currentSessionId === session._id ? 'var(--bg-glass)' : 'var(--bg-secondary)',
                              border: currentSessionId === session._id ? '1px solid var(--accent-indigo)' : '1px solid var(--border-glass)',
                              width: '100%',
                              textAlign: 'left',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '8px', 
                              background: currentSessionId === session._id ? 'var(--accent-indigo)' : 'var(--gradient-primary)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'white',
                              flexShrink: 0
                            }}>
                              <MessageSquare size={14} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {session.title || `Conversation ${idx + 1}`}
                              </p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, opacity: 0.7 }}>
                                {new Date(session.updatedAt).toLocaleDateString(i18n.language.startsWith('en') ? 'en-US' : i18n.language)}
                              </p>
                            </div>
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                          </button>
                         ))
                       ) : (
                         <div className="py-10 text-center w-full">
                            <p className="text-[13px] text-muted-foreground opacity-60 font-medium">No past conversations found</p>
                            <p className="text-[10px] text-muted-foreground opacity-40 mt-1 italic">Start your first chat with Krishi Mitra!</p>
                         </div>
                       )}
                       {!isHistoryLoaded && <div className="p-4 text-center"><Loader2 size={16} className="animate-spin mx-auto text-emerald-500" /></div>}
                    </div>
                 </div>

                {/* FAQ List */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Help</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {suggestions.slice(0, 4).map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSuggestion(s)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '14px 18px', 
                          background: 'var(--bg-secondary)', 
                          borderRadius: '16px', 
                          border: '1px solid var(--border-glass)', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.92rem', 
                          fontWeight: 500,
                          width: '100%', 
                          textAlign: 'left', 
                          cursor: 'pointer', 
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.background = 'var(--bg-glass)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(74, 222, 128, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-glass)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        }}
                      >
                        {s.text}
                        <ChevronRight size={18} color="var(--accent-indigo)" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Chat Messages Area
              <>
                <div className="chat-messages">
                  {messages.map(msg => (
                    <div key={msg.id} className="flex flex-col gap-2">
                      <div className={`message ${msg.sender === 'ai' ? 'message-ai' : 'message-user'}`} style={{ 
                        position: 'relative',
                        padding: '16px 20px',
                        borderRadius: '24px',
                        boxShadow: msg.sender === 'ai' ? '0 4px 15px rgba(0,0,0,0.1)' : '0 8px 25px rgba(22, 163, 74, 0.25)',
                        border: msg.sender === 'ai' ? '1px solid var(--border-glass)' : 'none',
                        background: msg.sender === 'ai' ? 'var(--bg-card)' : 'var(--gradient-primary)'
                      }}>
                        {msg.text}
                        
                        {msg.sender === 'ai' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-glass)' }}>
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => speakMessage(msg.text, msg.id || msg.text.substring(0,20))}
                                style={{ 
                                  background: speakingMsgId === (msg.id || msg.text.substring(0,20)) ? 'var(--accent-emerald)' : 'var(--bg-secondary)',
                                  color: speakingMsgId === (msg.id || msg.text.substring(0,20)) ? 'white' : 'var(--accent-emerald)',
                                  border: '1px solid var(--border-glass)', 
                                  padding: '6px 14px', 
                                  borderRadius: '20px',
                                  fontSize: '0.75rem', 
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                  boxShadow: speakingMsgId === (msg.id || msg.text.substring(0,20)) ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                                }}
                              >
                                {speakingMsgId === (msg.id || msg.text.substring(0,20)) ? (
                                  <>
                                    <Volume2 size={12} className="animate-pulse" /> 
                                    <div className="waveform ml-1">
                                      <div className="waveform-bar" style={{ background: 'white', opacity: 0.8 }} />
                                      <div className="waveform-bar" style={{ background: 'white', opacity: 0.8 }} />
                                      <div className="waveform-bar" style={{ background: 'white', opacity: 0.8 }} />
                                    </div>
                                  </>
                                ) : (
                                  <><Volume2 size={12} /> {t('chat_listen', "Listen")}</>
                                )}
                              </motion.button>
                          </div>
                        )}
                      </div>
                      
                      {msg.showSuggestions && (
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                          {suggestions.slice(0, 3).map((s, i) => (
                            <button 
                              key={`inline-${i}`} 
                              onClick={() => handleSuggestion(s)}
                              className="chat-btn-suggestion-inline"
                              style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '0.75rem' }}
                            >
                              {s.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="message message-ai">
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-area" style={{ padding: '16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)' }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-end', background: 'var(--bg-card)', 
                    border: '1px solid var(--border-glass)', borderRadius: '20px', 
                    padding: '6px',
                    transition: 'all 0.3s ease',
                    boxShadow: inputValue.trim() ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
                    borderColor: inputValue.trim() ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-glass)'
                  }}>
                    <textarea 
                      value={isDictating ? "I'm listening..." : (isProcessingVoice ? "Transcribing..." : inputValue)} 
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (inputValue.trim() && !isLoading) {
                            handleSend(inputValue);
                            e.target.style.height = 'auto'; // Reset after sending
                          }
                        }
                      }}
                      rows={1}
                      placeholder={isDictating ? "Listening..." : "Ask me anything..."}
                      disabled={isDictating || isProcessingVoice}
                      className="custom-scrollbar"
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none', 
                        padding: '10px 16px', fontSize: '0.95rem', 
                        color: isDictating ? 'var(--accent-rose)' : 'var(--text-primary)',
                        fontWeight: isDictating ? 'bold' : 'normal',
                        fontStyle: isDictating ? 'italic' : 'normal',
                        resize: 'none', overflowY: 'auto',
                        minHeight: '44px', maxHeight: '120px', lineHeight: '24px'
                      }}
                    />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '4px', paddingBottom: '3px' }}>
                      <button 
                        onClick={toggleDictation}
                        disabled={isProcessingVoice || (inputValue.trim().length > 0 && !isDictating)}
                        style={{ 
                          width: (inputValue.trim() && !isDictating) ? '0px' : '38px',
                          height: '38px',
                          borderRadius: '14px', 
                          cursor: (isProcessingVoice || (inputValue.trim() && !isDictating)) ? 'default' : 'pointer',
                          border: 'none',
                          background: isDictating ? 'var(--accent-rose)' : 'var(--bg-secondary)',
                          color: isDictating ? 'white' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          opacity: (inputValue.trim() && !isDictating) ? 0 : 1,
                          overflow: 'hidden',
                          boxShadow: isDictating ? '0 4px 12px rgba(244, 63, 94, 0.3)' : 'none',
                          transform: isDictating ? 'scale(1.05)' : 'scale(1)'
                        }}
                        title={isDictating ? 'Stop Listening' : 'Start Dictation'}
                      >
                        {isProcessingVoice ? <Loader2 size={16} className="spin" /> : <Mic size={16} className={isDictating ? "pulse" : ""} />}
                      </button>

                      <button 
                        onClick={() => handleSend(inputValue)}
                        disabled={isLoading || !inputValue.trim()}
                        className="btn-glow" 
                        style={{ 
                          width: inputValue.trim() ? '45px' : '38px',
                          height: '38px',
                          borderRadius: inputValue.trim() ? '14px' : '50%',
                          opacity: (!inputValue.trim() || isLoading) ? 0.3 : 1,
                          padding: 0, margin: 0, border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: inputValue.trim() ? 'var(--accent-emerald)' : 'var(--bg-glass)',
                          color: inputValue.trim() ? 'white' : 'var(--text-muted)',
                          transform: inputValue.trim() ? 'scale(1.05)' : 'scale(1)',
                          cursor: (!inputValue.trim() || isLoading) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                      >
                        {isLoading ? <Loader2 size={16} className="spin" /> : <Send size={16} style={{ marginLeft: inputValue.trim() ? '2px' : '0' }} />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Bottom Tab Navigation */}
            <div style={{ display: 'flex', borderTop: '1px solid var(--border-glass)', background: 'var(--bg-primary)' }}>
              <button 
                onClick={() => setActiveTab('home')}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'transparent', border: 'none', color: activeTab === 'home' ? 'var(--accent-indigo)' : 'var(--text-muted)', borderTop: activeTab === 'home' ? '2px solid var(--accent-indigo)' : '2px solid transparent', cursor: 'pointer' }}
              >
                <Home size={20} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Home</span>
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'transparent', border: 'none', color: activeTab === 'chat' ? 'var(--accent-indigo)' : 'var(--text-muted)', borderTop: activeTab === 'chat' ? '2px solid var(--accent-indigo)' : '2px solid transparent', cursor: 'pointer' }}
              >
                <MessageSquare size={20} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Messages</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


export default KrishiMitra;
