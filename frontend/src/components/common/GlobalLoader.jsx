import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function GlobalLoader() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark ? 'var(--bg-primary)' : 'var(--bg-primary)',
      zIndex: 9999,
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{
        position: 'relative',
        width: '64px',
        height: '64px',
        marginBottom: '24px'
      }}>
        {/* Outer glowing ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '3px solid transparent',
          borderTopColor: 'var(--accent-emerald)',
          borderRightColor: 'var(--accent-emerald)',
          borderRadius: '50%',
          animation: 'spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite'
        }} />
        {/* Inner pulsing circle */}
        <div style={{
          position: 'absolute',
          inset: '16px',
          background: 'var(--accent-emerald)',
          borderRadius: '50%',
          opacity: 0.8,
          animation: 'pulse-ring 2s ease-in-out infinite'
        }} />
      </div>
      <h2 style={{
        color: 'var(--text-primary)',
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        background: 'var(--gradient-primary)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}>
        Niti Setu
      </h2>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        marginTop: '8px'
      }}>
        Loading assets...
      </p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); transform: scale(0.9); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
