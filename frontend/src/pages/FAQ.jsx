import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronDown, MessageCircle, FileText, HeartHandshake } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LandingFooter from '../components/common/LandingFooter';

const GREEN_GRAD = 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #4ade80 100%)';

const C = (isDark) => ({
  bg:         isDark ? '#060d06'                      : '#faf7ee',
  bg2:        isDark ? '#0c170c'                      : '#f2ead8',
  bgCard:     isDark ? 'rgba(12,24,12,0.92)'          : 'rgba(255,253,244,0.97)',
  bgGlass:    isDark ? 'rgba(34,197,94,0.05)'         : 'rgba(101,67,33,0.07)',
  border:     isDark ? 'rgba(34,197,94,0.12)'         : 'rgba(101,67,33,0.18)',
  borderGlow: isDark ? 'rgba(34,197,94,0.3)'          : 'rgba(22,101,52,0.32)',
  text:       isDark ? '#e8f5e0'                      : '#1a2a0e',
  textSec:    isDark ? '#6b9a60'                      : '#3d5c28',
  textMute:   isDark ? '#3d5e38'                      : '#8a7750',
});

export default function FAQ() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);
  const isDark = theme === 'dark';
  const c = C(isDark);

  const faqs = [
    {
      category: t('faq_cat_gen'),
      icon: <HelpCircle size={22} />,
      questions: [
        { q: t('faq_q1'), a: t('faq_a1') },
        { q: t('faq_q2'), a: t('faq_a2') }
      ]
    },
    {
      category: t('faq_cat_elig'),
      icon: <FileText size={22} />,
      questions: [
        { q: t('faq_q3'), a: t('faq_a3') },
        { q: t('faq_q4'), a: t('faq_a4') }
      ]
    },
    {
      category: t('faq_cat_ai'),
      icon: <MessageCircle size={22} />,
      questions: [
        { q: t('faq_q5'), a: t('faq_a5') },
        { q: t('faq_q6'), a: t('faq_a6') }
      ]
    }
  ];

  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 100px' }}>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartHandshake size={20} color="#16a34a" />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: c.textSec }}>{t('faq_title')}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 20px', lineHeight: 1.1, color: c.text }}>
            {t('faq_title').split(' ').slice(0, 2).join(' ')} <br />
            <span style={{ background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('faq_title').split(' ').slice(2).join(' ')}</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: c.textSec, maxWidth: '550px', margin: '0 auto' }}>{t('faq_subtitle')}</p>
        </motion.div>

        {/* Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
          {faqs.map((cat, catIdx) => (
            <div key={catIdx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '12px', borderBottom: `1px solid ${c.border}` }}>
                <div style={{ color: isDark ? '#4ade80' : '#16a34a' }}>{cat.icon}</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: c.text, margin: 0 }}>{cat.category}</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cat.questions.map((f, qIdx) => {
                  const id = `${catIdx}-${qIdx}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={id} style={{
                      borderRadius: '16px',
                      background: c.bgCard,
                      border: `1px solid ${isOpen ? c.borderGlow : c.border}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isOpen ? (isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(101,67,33,0.06)') : 'none'
                    }}>
                      <button 
                        onClick={() => setOpenIndex(isOpen ? null : id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', outline: 'none' }}
                      >
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: c.text }}>{f.q}</span>
                        <ChevronDown size={18} style={{ color: c.textMute, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                            <div style={{ padding: '0 24px 24px', color: c.textSec, lineHeight: 1.6, fontSize: '0.96rem' }}>
                              <p style={{ margin: 0, paddingTop: '12px', borderTop: `1px solid ${c.border}` }}>{f.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
