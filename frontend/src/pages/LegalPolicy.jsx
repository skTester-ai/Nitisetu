import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Trash2, CheckCircle2, Server, EyeOff } from 'lucide-react';
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

export default function LegalPolicy() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = C(isDark);

  const sections = [
    {
      id: 'dpdp',
      icon: <Shield size={22} />,
      title: t('lp_sec1_title'),
      description: t('lp_sec1_desc')
    },
    {
      id: 'ephemeral',
      icon: <Trash2 size={22} />,
      title: t('lp_sec2_title'),
      description: t('lp_sec2_desc')
    },
    {
      id: 'encryption',
      icon: <Lock size={22} />,
      title: t('lp_sec3_title'),
      description: t('lp_sec3_desc')
    },
    {
      id: 'ai_processing',
      icon: <Server size={22} />,
      title: t('lp_sec4_title'),
      description: t('lp_sec4_desc')
    }
  ];

  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 100px' }}>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: GREEN_GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="white" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: c.text }}>{t('lp_badge')}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 20px', lineHeight: 1.1, color: c.text }}>
            {t('lp_title').split(' ').slice(0, 3).join(' ')} <span style={{ background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('lp_title').split(' ').slice(3).join(' ')}</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: c.textSec, maxWidth: '600px', margin: '0 auto' }}>{t('lp_subtitle')}</p>
        </motion.div>

        {/* Content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {sections.map((s, i) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: '24px',
                padding: '40px',
                boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(101,67,33,0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: c.bgGlass, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: isDark ? '#4ade80' : '#166534' }}>
                {s.icon}
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '14px', color: c.text }}>{s.title}</h3>
              <p style={{ fontSize: '1rem', lineHeight: 1.6, color: c.textSec }}>{s.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.6 }}
          style={{ marginTop: '80px', padding: '40px', borderRadius: '24px', background: c.bgGlass, border: `1px solid ${c.border}`, textAlign: 'center' }}
        >
          <p style={{ color: c.textMute, fontSize: '0.95rem', margin: 0 }}>
            <CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#16a34a' }} />
            {t('lp_audit')}
          </p>
        </motion.div>
      </div>
      <LandingFooter />
    </div>
  );
}
