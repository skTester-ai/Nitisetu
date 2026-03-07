import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const ICONS = {
  success: <CheckCircle2 size={20} color="var(--accent-emerald)" />,
  error:   <AlertCircle  size={20} color="var(--accent-rose)" />,
  warning: <AlertTriangle size={20} color="var(--accent-amber)" />,
  info:    <Info         size={20} color="var(--accent-indigo)" />,
};

const BORDERS = {
  success: 'rgba(16, 185, 129, 0.35)',
  error:   'rgba(244, 63, 94, 0.35)',
  warning: 'rgba(245, 158, 11, 0.35)',
  info:    'rgba(99, 102, 241, 0.35)',
};

const TINTS = {
  success: 'rgba(16, 185, 129, 0.06)',
  error:   'rgba(244, 63, 94, 0.06)',
  warning: 'rgba(245, 158, 11, 0.06)',
  info:    'rgba(99, 102, 241, 0.06)',
};

export const Toast = ({ toast }) => {
  const { removeToast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'rgba(14, 20, 14, 0.96)' : 'rgba(255, 253, 244, 0.97)';
  const shadow  = isDark ? '0 10px 40px rgba(0,0,0,0.4)' : '0 8px 32px rgba(101,67,33,0.18)';
  const titleC  = isDark ? '#e8f5e0' : '#1a2a0e';
  const msgC    = isDark ? '#6b9a60' : '#3d5c28';
  const closeC  = isDark ? '#3d5e38' : '#8a7750';
  const closeCH = isDark ? '#e8f5e0' : '#1a2a0e';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
      style={{
        width: '320px',
        padding: '16px',
        background: bg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        boxShadow: shadow,
        border: `1px solid ${BORDERS[toast.type]}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      {/* Tinted wash */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: TINTS[toast.type], pointerEvents: 'none',
      }} />

      <div style={{ flexShrink: 0, zIndex: 1 }}>
        {ICONS[toast.type]}
      </div>

      <div style={{ flex: 1, zIndex: 1 }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: titleC, marginBottom: '3px' }}>
          {toast.title}
        </h4>
        {toast.message && (
          <p style={{ margin: 0, fontSize: '0.83rem', color: msgC, lineHeight: 1.5 }}>
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: closeC, zIndex: 1, borderRadius: '50%', transition: 'color 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.color = closeCH}
        onMouseOut={(e) => e.currentTarget.style.color = closeC}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
