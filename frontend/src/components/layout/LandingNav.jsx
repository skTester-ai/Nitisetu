import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, Sun, Moon, Menu, X, Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';

const GREEN_GRAD = 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #4ade80 100%)';

export default function LandingNav() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const isDark = theme === 'dark';

  const bg      = isDark ? 'rgba(6,13,6,0.3)'         : 'rgba(250,247,238,0.35)';
  const border  = isDark ? 'rgba(34,197,94,0.15)'     : 'rgba(22,101,52,0.15)';
  const text    = isDark ? '#e8f5e0'                  : '#0f2010';
  const textSec = isDark ? '#6b9a60'                  : '#3a5e30';
  const glass   = isDark ? 'rgba(34,197,94,0.05)'    : 'rgba(22,101,52,0.05)';

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const LINKS = [
    { label: t('nav_features'),     href: '/#features' },
    { label: t('nav_audience'), href: '/#audience' },
    { label: t('nav_tech'),   href: '/#technology' },
    { label: t('nav_contact', 'Contact'), href: '/#contact' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: scrolled ? bg : (isDark ? 'rgba(6,13,6,0.0)' : 'rgba(250,247,238,0.0)'),
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? `1px solid ${border}` : '1px solid transparent',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '62px', padding: '0 28px' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginRight: '32px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: GREEN_GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,163,74,0.4)' }}>
            <Sprout size={17} color="white" />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span style={{ background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('app_name_prefix')}</span>
            <span style={{ color: text }}>{t('app_name_suffix')}</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '7px 14px',
              borderRadius: '8px', fontSize: '0.88rem', fontWeight: 500, color: textSec,
              transition: 'color 0.2s, background 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.color = text; e.currentTarget.style.background = glass; }}
              onMouseOut={e => { e.currentTarget.style.color = textSec; e.currentTarget.style.background = 'none'; }}
            >
              {t('nav_home', 'Home')}
            </button>
          </a>
          {LINKS.map(l => (
            <a key={l.label} href={l.href} style={{ textDecoration: 'none' }} onClick={(e) => {
              if (window.location.pathname === '/' && l.href.startsWith('/#')) {
                e.preventDefault();
                document.querySelector(l.href.replace('/', ''))?.scrollIntoView({ behavior: 'smooth' });
              }
            }}>
              <button style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '7px 14px',
                borderRadius: '8px', fontSize: '0.88rem', fontWeight: 500, color: textSec,
                transition: 'color 0.2s, background 0.2s',
              }}
                onMouseOver={e => { e.currentTarget.style.color = text; e.currentTarget.style.background = glass; }}
                onMouseOut={e => { e.currentTarget.style.color = textSec; e.currentTarget.style.background = 'none'; }}
              >{l.label}</button>
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          <LanguageSwitcher />

          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} title={isDark ? t('sb_light_mode') : t('sb_dark_mode')} style={{
            background: glass, border: `1px solid ${border}`, borderRadius: '8px',
            padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s',
          }}>
            {isDark ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#166534" />}
          </motion.button>

          {user ? (
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{
                background: GREEN_GRAD, color: '#fff', border: 'none', borderRadius: '10px',
                padding: '9px 22px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(22,163,74,0.4)',
                whiteSpace: 'nowrap',
              }}>{t('lp_go_dashboard')}</motion.button>
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: glass, color: isDark ? '#4ade80' : '#166534',
                  border: `1px solid ${border}`, borderRadius: '9px',
                  padding: '8px 18px', fontSize: '0.87rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.12)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = glass; }}
                >{t('btn_signin')}</button>
              </Link>

              <Link to="/check" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{
                  background: GREEN_GRAD, color: '#fff', border: 'none', borderRadius: '9px',
                  padding: '8px 18px', fontSize: '0.87rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(22,163,74,0.4)',
                  whiteSpace: 'nowrap',
                }}>{t('btn_free_check')}</motion.button>
              </Link>
            </>
          )}

          {/* Hamburger (mobile) */}
          <button onClick={() => setOpen(!open)} style={{
            background: 'none', border: `1px solid ${border}`, borderRadius: '8px',
            padding: '7px', cursor: 'pointer', color: textSec, display: 'none',
          }} className="ln-hamburger">
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ 
          background: isDark ? 'rgba(6,13,6,0.98)' : 'rgba(246,250,242,0.98)', 
          borderTop: `1px solid ${border}`, 
          padding: '16px 28px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          position: 'absolute',
          top: '62px',
          left: 0,
          right: 0,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <a href="/" onClick={() => setOpen(false)} style={{ textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600, color: text, padding: '12px 14px', borderRadius: '12px', display: 'block', background: glass }}>
            {t('nav_home', 'Home')}
          </a>
          {LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={(e) => { 
                if(window.location.pathname === '/' && l.href.startsWith('/#')) {
                   e.preventDefault(); 
                   document.querySelector(l.href.replace('/', ''))?.scrollIntoView({behavior: 'smooth'}); 
                } 
                setOpen(false); 
              }} 
              style={{ textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600, color: text, padding: '12px 14px', borderRadius: '12px', display: 'block', background: glass }}>
              {l.label}
            </a>
          ))}
          {!user && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: `1px solid ${border}` }}>
                <Link to="/login" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '12px', borderRadius: '12px', background: glass, color: isDark ? '#4ade80' : '#166534', border: `1px solid ${border}`, fontSize: '1rem', fontWeight: 600 }}>{t('btn_signin')}</button>
                </Link>
                <Link to="/check" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                  <button className="btn-glow" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem' }}>{t('btn_free_check')}</button>
                </Link>
             </div>
          )}
        </div>
      )}

      <style>{`
        @media(max-width: 768px) {
          .ln-hamburger { display: flex !important }
          nav > div > div:nth-child(2) { display: none !important } /* Hide desktop links */
          nav > div > div:nth-child(3) > a > button { display: none !important } /* Hide desktop login/check buttons */
        }
      `}</style>
    </nav>
  );
}
