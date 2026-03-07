import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const languageMap = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  mr: 'Marathi (मराठी)',
  bn: 'Bengali (বাংলা)',
  te: 'Telugu (తెలుగు)',
  ta: 'Tamil (தமிழ்)',
  gu: 'Gujarati (ગુજરાતી)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)'
};

export default function LanguageSwitcher({ 
  placement = 'down', 
  isCollapsed = false, 
  onSelect = null, 
  currentLanguage = null 
}) {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    if (onSelect) {
      onSelect(code);
    } else {
      i18n.changeLanguage(code);
    }
    setIsOpen(false);
  };

  const bgGlass = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255,255,255,0.6)';
  const border = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const accentHover = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.04)';
  const dropdownBg = isDark ? '#0f172a' : '#ffffff';
  
  const activeCode = currentLanguage || i18n.language;
  const currentLangName = languageMap[activeCode] || 'English';

  return (
    <div className="relative" ref={dropdownRef} style={{ width: isCollapsed ? 'auto' : '100%' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '8px',
          background: bgGlass, border: `1px solid ${border}`, borderRadius: isCollapsed ? '10px' : '8px', 
          padding: isCollapsed ? '0' : '6px 12px', cursor: 'pointer', transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)', color: textPrimary, 
          width: isCollapsed ? '38px' : '100%', 
          height: isCollapsed ? '38px' : 'auto',
          minWidth: isCollapsed ? '38px' : '0'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = accentHover}
        onMouseOut={(e) => e.currentTarget.style.background = bgGlass}
        title={isCollapsed ? currentLangName : ''}
      >
        <Globe size={isCollapsed ? 18 : 16} color={textSecondary} style={{ flexShrink: 0 }} />
        {!isCollapsed && (
          <span style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentLangName.split(' ')[0]}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', left: 0,
              ...(placement === 'up' ? { bottom: '100%', marginBottom: '8px' } : { top: '100%', marginTop: '8px' }),
              width: '200px', maxHeight: '300px', overflowY: 'auto',
              background: dropdownBg, border: `1px solid ${border}`,
              borderRadius: '12px', padding: '8px', zIndex: 50,
              boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
            }}
          >
            {Object.entries(languageMap).map(([code, name]) => {
               const isActive = activeCode === code;
               return (
                  <button
                    key={code}
                    onClick={() => handleSelect(code)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '8px 12px', background: isActive ? accentHover : 'transparent',
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      color: isActive ? textPrimary : textSecondary,
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                       if (!isActive) {
                          e.currentTarget.style.background = accentHover;
                          e.currentTarget.style.color = textPrimary;
                       }
                    }}
                    onMouseOut={(e) => {
                       if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = textSecondary;
                       }
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500 }}>
                      {name}
                    </span>
                    {isActive && <Check size={14} style={{ color: 'var(--accent-emerald)' }} />}
                  </button>
               )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
