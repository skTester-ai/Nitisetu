import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, Trash2, CheckCircle2, AlertCircle, Info, AlertTriangle, Clock
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

const ICONS = {
  success: <CheckCircle2 size={16} color="var(--accent-emerald)" />,
  error: <AlertCircle size={16} color="var(--accent-rose)" />,
  warning: <AlertTriangle size={16} color="var(--accent-amber)" />,
  info: <Info size={16} color="var(--accent-indigo)" />,
};

export default function NotificationCenter({ isOpen, onClose }) {
  const { history, clearHistory } = useToast();
  const { i18n } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 9998, backdropFilter: 'blur(4px)'
            }}
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '400px', maxWidth: '100vw',
              background: 'var(--bg-primary)',
              borderLeft: '1px solid var(--border-glass)',
              boxShadow: '-10px 0 50px rgba(0,0,0,0.5)',
              zIndex: 9999, display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px', borderBottom: '1px solid var(--border-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={20} style={{ color: 'var(--accent-indigo)' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Notifications</h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px',
                  borderRadius: '50%', color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
                  <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>No past notifications found.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {history.map((log) => {
                    const date = new Date(log.timestamp);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateString = date.toLocaleDateString(i18n.language.startsWith('en') ? 'en-US' : i18n.language);

                    return (
                      <div key={log.id} style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
                        borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px'
                      }}>
                        <div style={{ marginTop: '2px' }}>{ICONS[log.type]}</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.title}</h4>
                          {log.message && (
                            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {log.message}
                            </p>
                          )}
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> {dateString} • {timeString}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div style={{ padding: '20px', borderTop: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}>
                <button
                  onClick={clearHistory}
                  style={{
                    width: '100%', padding: '12px', background: 'rgba(244, 63, 94, 0.1)',
                    color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.2)',
                    borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                >
                  <Trash2 size={16} /> Clear All History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
