import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sprout, User, Bot, Sparkles, HelpCircle, ArrowRight, 
  Volume2, VolumeX, Globe, Mic, MicOff, Trash2, Plus, 
  MessageSquare, MoreVertical, Edit3, Check, X, History as HistoryIcon,
  ChevronLeft, Search, Loader2
} from 'lucide-react';
import { 
  getChatSessions, 
  createChatSession, 
  getSessionMessages, 
  deleteChatSession, 
  clearChatHistory,
  chatWithKrishiMitra, 
  generateSpeech,
  translateChatHistory 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useVoice } from '../hooks/useVoice';
import { useToast } from '../context/ToastContext';
import AgriCard from '../components/common/AgriCard';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const ChatDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentSessionId, setCurrentSessionId] = useState(() => localStorage.getItem('current_session_id'));
  const [sessions, setSessions] = useState([]);
  const audioCache = useRef({}); 
  // Persistent multi-lingual cache for the current session's messages
  // Structure: { 'en': [...], 'hi': [...], 'mr': [...] }
  const [messageCache, setMessageCache] = useState({ 'en': [] });
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { i18n } = useTranslation();
  const [chatLanguage, setChatLanguage] = useState(() => localStorage.getItem('chat_language') || 'en');
  const { addToast } = useToast();

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

  // Listen for sync events from floating bot
  useEffect(() => {
    const handleSync = () => {
      fetchSessions(false); // Reload but don't force auto-select
      const savedSessionId = localStorage.getItem('current_session_id');
      
      setCurrentSessionId(prev => {
        if (savedSessionId !== prev) {
          // The other chatbot changed the active session! We must sync our messages.
          if (savedSessionId) {
             setIsLoading(true);
             getSessionMessages(savedSessionId).then(data => {
               setMessages(data.map(msg => ({ id: msg._id, text: msg.content, sender: msg.role === 'assistant' ? 'ai' : 'user' })));
               setIsLoading(false);
             }).catch(console.error);
          } else {
             setMessages([]);
          }
          return savedSessionId;
        }
        return prev;
      });
    };
    
    window.addEventListener('nitisetu:chat-sync', handleSync);
    return () => window.removeEventListener('nitisetu:chat-sync', handleSync);
  }, []);

  // Voice Dictation States (using useVoice hook for Whisper STT)
  const { isListening: isDictating, transcript: voiceTranscript, startListening, stopListening: stopDictation, resetTranscript } = useVoice(chatLanguage || 'hi-IN');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Sync voice transcript to input value
  useEffect(() => {
    if (voiceTranscript) {
      setInputValue(voiceTranscript);
      resetTranscript();
    }
  }, [voiceTranscript, resetTranscript]);

  // Initialize/Update 'en' cache when messages change from AI/User input
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setMessageCache(prev => ({
        ...prev,
        [chatLanguage]: messages
      }));
    }
  }, [messages, isLoading, chatLanguage]);

  // Handle Chat History Translation with Caching
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
          id: sourceMessages[index]?.id || Date.now() + index,
          text: msg.content,
          sender: msg.role === 'assistant' ? 'ai' : 'user'
        }));
        
        // Update local state and cache simultaneously
        setMessages(formatted);
        setMessageCache(prev => ({
          ...prev,
          [chatLanguage]: formatted
        }));
      } catch (err) {
        console.error('Translation sync failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (messages.length > 0 && chatLanguage) {
      handleTranslateHistory();
    }
  }, [chatLanguage]);

  // Load Sessions on Mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async (shouldAutoSelect = true) => {
    try {
      setIsSessionsLoading(true);
      const data = await getChatSessions();
      setSessions(data);
      
      // Use stored session ID if available, otherwise latest
      const savedSessionId = localStorage.getItem('current_session_id');
      if (shouldAutoSelect && data.length > 0) {
        if (savedSessionId && data.find(s => s._id === savedSessionId)) {
          handleSelectSession(savedSessionId);
        } else if (!currentSessionId && messages.length <= 1) {
          handleSelectSession(data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === currentSessionId && messages.length > 0) return;
    setCurrentSessionId(sessionId);
    localStorage.setItem('current_session_id', sessionId);
    setMessages([]);
    setMessageCache({ 'en': [] });
    setIsLoading(true);
    try {
      const data = await getSessionMessages(sessionId);
      const formatted = data.map(msg => ({
        id: msg._id,
        text: msg.content,
        sender: msg.role === 'assistant' ? 'ai' : 'user'
      }));
      setMessages(formatted);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
      // Dispatch sync event so floating bot knows we switched sessions
      window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    localStorage.removeItem('current_session_id');
    setMessages([]);
    setMessageCache({ 'en': [] });
    window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
  };

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
    { text: t('chat_sug_crops', "🌾 Best crops for this season?"), action: "llm_trigger" },
    { text: t('chat_sug_benefits', "👩‍🌾 Benefits for Women/SC/ST?"), action: "llm_trigger" },
    { text: t('chat_sug_pmkisan', "🚜 What is PM-Kisan?"), action: "llm_trigger" }
  ];

  const handleSuggestion = (suggestion) => {
    handleSend(suggestion.text);
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const currentHistory = [...messages, userMessage].slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await chatWithKrishiMitra(text, currentHistory, chatLanguage, currentSessionId);
      
      if (!currentSessionId && res.sessionId) {
        setCurrentSessionId(res.sessionId);
        localStorage.setItem('current_session_id', res.sessionId);
        window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
        fetchSessions(false); 
      }

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: res.response, 
        sender: 'ai' 
      }]);
      
      // Auto-Voice removed as per user request for manual trigger
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "Error connecting to AI. Please try again.", 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
      window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChatSession(sessionToDelete);
      setSessions(prev => prev.filter(s => s._id !== sessionToDelete));
      if (currentSessionId === sessionToDelete) {
        handleNewChat();
      }
      setShowClearConfirm(false);
    } catch (error) {
      alert("Failed to delete session");
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
      window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
    }
  };

  const handleClearAllHistory = async () => {
    setIsDeleting(true);
    try {
      await clearChatHistory();
      setSessions([]);
      handleNewChat();
      setShowClearConfirm(false);
    } catch (error) {
      alert("Failed to clear history");
    } finally {
      setIsDeleting(false);
      window.dispatchEvent(new CustomEvent('nitisetu:chat-sync'));
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

  const [speakingMsgId, setSpeakingMsgId] = useState(null);

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
      console.error("TTS Error:", err);
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      addToast('Audio Error', 'Failed to generate voice', 'error');
    }
  };

  return (
    <div className="chat-dashboard-container" style={{ maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', gap: '24px', padding: '10px' }}>
      
      {/* Sidebar - Chat History List (ChatGPT style) */}
      {/* Sidebar - Mobile Overlay Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
          />
        )}
      </AnimatePresence>

      <motion.div 
        className="chat-sidebar"
        initial={false}
        animate={{ 
          width: isMobile ? (sidebarOpen ? '280px' : '0px') : (sidebarOpen ? '320px' : '0px'), 
          opacity: (isMobile && !sidebarOpen) ? 0 : 1,
          x: isMobile ? (sidebarOpen ? 0 : -280) : 0,
          marginRight: (!isMobile && sidebarOpen) ? '0px' : '-24px' 
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'var(--bg-secondary)', 
          borderRadius: isMobile ? '0' : '24px', 
          borderRight: isMobile ? '1px solid var(--border-color)' : 'none',
          border: isMobile ? 'none' : '1px solid var(--border-glass)',
          overflow: 'hidden',
          position: isMobile ? 'fixed' : 'relative',
          left: 0,
          top: isMobile ? 0 : 'auto',
          bottom: isMobile ? 0 : 'auto',
          zIndex: isMobile ? 1100 : 1,
          flexShrink: 0,
          boxShadow: sidebarOpen ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
        }}
      >
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* New Chat Button */}
          <button 
            onClick={handleNewChat}
            className="btn-glow"
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              fontSize: '1rem',
              fontWeight: 700,
              marginBottom: '24px',
              boxShadow: '0 8px 25px rgba(22, 163, 74, 0.4)'
            }}
          >
            <Plus size={20} />
            {t('chat_new_chat', 'New Chat')}
          </button>

          {/* Sessions List Container */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
              <HistoryIcon size={14} style={{ color: 'var(--accent-indigo)' }} />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {t('chat_recent_chats', 'Recent Conversations')}
              </h3>
            </div>
            
            {isSessionsLoading ? (
              <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                <Bot size={28} className="animate-pulse text-indigo-400" />
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '16px', margin: '0 8px' }}>
                <MessageSquare size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {t('chat_no_history', 'No previous chats')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sessions.map(session => (
                  <motion.div 
                    key={session._id}
                    layoutId={session._id}
                    onClick={() => handleSelectSession(session._id)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      background: currentSessionId === session._id ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${currentSessionId === session._id ? 'transparent' : 'var(--border-glass)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    className="group"
                  >
                    <MessageSquare size={16} 
                      style={{ 
                        color: currentSessionId === session._id ? 'white' : 'var(--accent-emerald)',
                        flexShrink: 0 
                      }} 
                    />
                    <span style={{ 
                      fontSize: '0.88rem', 
                      color: currentSessionId === session._id ? 'white' : 'var(--text-primary)',
                      fontWeight: currentSessionId === session._id ? 700 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1
                    }}>
                      {session.title}
                    </span>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session._id);
                        setShowClearConfirm(true);
                      }}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '8px',
                        background: currentSessionId === session._id ? 'rgba(255,255,255,0.2)' : 'rgba(244,63,94,0.1)', 
                        border: 'none', 
                        color: currentSessionId === session._id ? 'white' : 'var(--accent-rose)',
                        cursor: 'pointer',
                        opacity: currentSessionId === session._id ? 1 : 0, // Hidden by default unless active or hovered
                        transition: 'all 0.2s ease'
                      }}
                      className="delete-btn-hover"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {sessions.length > 0 && (
            <button 
              onClick={() => {
                setSessionToDelete(null); 
                setShowClearConfirm(true);
              }}
              style={{ 
                marginTop: '16px',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(244,63,94,0.05)',
                border: '1px solid rgba(244,63,94,0.1)',
                color: 'var(--accent-rose)',
                fontSize: '0.8rem', 
                fontWeight: 700, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(244,63,94,0.05)'}
            >
              <Trash2 size={14} /> 
              {t('chat_clear_all', 'Clear All Conversations')}
            </button>
          )}
        </div>

        {/* CSS for hover effects */}
        <style dangerouslySetInnerHTML={{ __html: `
          .group:hover .delete-btn-hover {
            opacity: 1 !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--border-glass);
            border-radius: 10px;
          }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: var(--text-muted);
          }
        `}} />
      </motion.div>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Header Strip */}
        <div style={{ marginBottom: isMobile ? '12px' : '16px', display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-glass"
            style={{ padding: '8px', borderRadius: '10px' }}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <HistoryIcon size={20} />}
          </button>
          
          <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 800 }}>
            <span className="gradient-text">Krishi Mitra</span>
            {!isMobile && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '12px', fontWeight: 500 }}>
                {currentSessionId ? sessions.find(s => s._id === currentSessionId)?.title : 'New Session'}
              </span>
            )}
          </h1>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: isMobile ? '100px' : '130px' }} className="mobile-lang-switcher">
              <LanguageSwitcher 
                placement="down" 
                currentLanguage={chatLanguage}
                onSelect={(code) => setChatLanguage(code)}
              />
            </div>
          </div>
        </div>

        {/* Chat Feed */}
        <AgriCard style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: isMobile ? 'none' : '1px solid var(--border-glass)', background: 'var(--bg-primary)', borderRadius: isMobile ? '12px' : '24px' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
            {messages.length === 0 && !isLoading ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ 
                  width: '70px', height: '70px', borderRadius: '20px', 
                  background: 'var(--gradient-primary)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
                  boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
                }}>
                  <Bot size={36} color="white" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  नमस्ते! I am Krishi Mitra
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6, marginBottom: '24px', fontSize: '0.95rem' }}>
                  Your personal AI companion for irrigation, schemes, and farming techniques. Try one of these questions to start:
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '550px', width: '100%' }}>
                  {suggestions.map((s, i) => (
                    <motion.button 
                      key={i}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(34, 197, 94, 0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestion(s)}
                      style={{ 
                        padding: '14px', borderRadius: '14px', background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-glass)', color: 'var(--text-primary)',
                        textAlign: 'left', fontSize: '0.85rem', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                      }}
                    >
                      {s.text}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', 
                    background: msg.sender === 'user' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    border: '1px solid var(--border-glass)',
                    boxShadow: msg.sender === 'user' ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none'
                  }}>
                    {msg.sender === 'user' ? <User size={18} color="white" /> : <Bot size={18} color="var(--accent-indigo)" />}
                  </div>
                  <div style={{ 
                    maxWidth: '80%', padding: '12px 18px', borderRadius: '18px',
                    background: msg.sender === 'user' ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6,
                    position: 'relative'
                  }}>
                    {msg.text}

                    {msg.sender === 'ai' && (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
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
                </motion.div>
              ))
            )}
            {isLoading && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} color="var(--accent-indigo)" />
                </div>
                <div className="typing-indicator" style={{ padding: '12px' }}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Area */}
          <div style={{ padding: '24px', background: 'var(--bg-primary)' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', background: 'var(--bg-card)', 
            border: '1px solid var(--border-glass)', borderRadius: '24px', 
            padding: '8px 12px',
            transition: 'all 0.3s ease',
            boxShadow: inputValue.trim() ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
            borderColor: inputValue.trim() ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-glass)'
          }}>
            <textarea 
              value={isDictating ? "I'm listening..." : (isProcessingVoice ? "Transcribing..." : inputValue)} 
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
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
              placeholder={isDictating ? "Listening..." : "Ask Krishi Mitra..."}
              disabled={isDictating || isProcessingVoice}
              className="custom-scrollbar"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none', 
                padding: '12px 16px', fontSize: '1.05rem', 
                color: isDictating ? 'var(--accent-rose)' : 'var(--text-primary)',
                fontWeight: isDictating ? 'bold' : 'normal',
                fontStyle: isDictating ? 'italic' : 'normal',
                resize: 'none', overflowY: 'auto',
                minHeight: '48px', maxHeight: '150px', lineHeight: '24px'
              }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '4px', paddingBottom: '2px' }}>
              <button 
                onClick={toggleDictation}
                disabled={isProcessingVoice || (inputValue.trim().length > 0 && !isDictating)}
                style={{ 
                  width: (inputValue.trim() && !isDictating) ? '0px' : '44px',
                  height: '44px',
                  borderRadius: '16px', 
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
                {isProcessingVoice ? <Loader2 size={20} className="spin" /> : <Mic size={20} className={isDictating ? "pulse" : ""} />}
              </button>

              <button 
                onClick={() => handleSend(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="btn-glow" 
                style={{ 
                  width: inputValue.trim() ? '52px' : '44px',
                  height: '44px',
                  borderRadius: inputValue.trim() ? '16px' : '50%',
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
                {isLoading ? <Loader2 size={20} className="spin" /> : <Send size={20} style={{ marginLeft: inputValue.trim() ? '2px' : '0' }} />}
              </button>
            </div>
          </div>
        </div>
        </AgriCard>
      </div>

      <ConfirmDeleteModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={sessionToDelete ? handleDeleteSession : handleClearAllHistory}
        title={sessionToDelete ? "Delete Conversation?" : "Clear All History?"}
        message={sessionToDelete 
          ? "This will permanently delete this conversation and all its messages." 
          : "This will permanently delete ALL your conversations and messages with Krishi Mitra. This action cannot be undone."}
        isDeleting={isDeleting}
      />

      <style>{`
        .chat-session-item:hover .delete-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default ChatDashboard;
