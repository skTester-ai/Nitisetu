import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '../NotificationCenter';
import LanguageSwitcher from '../common/LanguageSwitcher';
import {
  LayoutDashboard,
  Search,
  FileText,
  History,
  Zap,
  ChevronRight,
  Users,
  LogOut,
  Bell,
  Settings,
  Sun,
  Moon,
  Network,
  MessageSquare,
  Server,
  Menu,
  ChevronLeft,
  Shield
} from 'lucide-react';

const navItems = [
  { to: '/dashboard/', icon: LayoutDashboard, label: 'dashboard' },
  { to: '/dashboard/check', icon: Search, label: 'eligibility_check' },
  { to: '/dashboard/schemes', icon: FileText, label: 'schemes' },
  { to: '/dashboard/farmers', icon: Users, label: 'farmers' },
  { to: '/dashboard/users', icon: Users, label: 'users' },
  { to: '/dashboard/history', icon: History, label: 'history' },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'krishi_mitra' },
  { to: '/dashboard/graph', icon: Network, label: 'knowledge_graph' },
  { to: '/dashboard/resources', icon: Server, label: 'resources' },
  { to: '/dashboard/settings', icon: Settings, label: 'settings' },
];

function NavButton({ item, isActive, isCollapsed, t, navTransition }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavLink
      to={item.to}
      style={{ textDecoration: 'none', position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ x: isCollapsed ? 0 : 6, background: 'var(--bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? '0' : '14px',
          padding: '14px',
          borderRadius: '14px',
          cursor: 'pointer',
          background: isActive ? 'var(--bg-primary)' : 'transparent',
          border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
          boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <item.icon
          size={20}
          style={{
            color: isActive ? 'var(--accent-indigo)' : 'var(--text-muted)',
            transition: 'color 0.2s',
            flexShrink: 0
          }}
        />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={navTransition}
              style={{
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                flex: 1,
                whiteSpace: 'nowrap'
              }}
            >
              {t(`sb_${item.label}`)}
            </motion.span>
          )}
        </AnimatePresence>
        {!isCollapsed && isActive && (
          <ChevronRight size={16} style={{ color: 'var(--accent-indigo)' }} />
        )}
      </motion.div>

      {/* Floating Tooltip for Collapsed State */}
      <AnimatePresence>
        {isCollapsed && isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 10 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '8px 12px',
              borderRadius: '8px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              zIndex: 1000,
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            {t(`sb_${item.label}`)}
          </motion.div>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

export default function Sidebar({ isCollapsed, onToggle, isMobile, isMobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const taglines = {
    superadmin: 'Central System Orchestrator',
    admin: 'Rural Empowerment Lead',
    farmer: 'Cultivating Digital Growth'
  };

  const currentTagline = taglines[user?.role] || 'Agriculture Intelligence';

  const sidebarVariants = {
    expanded: { x: 0, width: '260px', padding: '24px 16px' },
    collapsed: { x: 0, width: '80px', padding: '24px 10px' },
    mobileClosed: { x: '-100%', width: '280px', padding: '24px 16px' },
    mobileOpen: { x: 0, width: '280px', padding: '24px 16px' }
  };

  const navTransition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] };

  const filteredNavItems = navItems.filter(item => {
    const adminPages = ['farmers', 'users', 'knowledge_graph', 'resources'];
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    if (!isAdmin && adminPages.includes(item.label)) return false;
    return true;
  });

  const currentVariant = isMobile 
    ? (isMobileOpen ? 'mobileOpen' : 'mobileClosed')
    : (isCollapsed ? 'collapsed' : 'expanded');

  return (
    <>
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
            }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={isMobile ? 'mobileClosed' : (isCollapsed ? 'collapsed' : 'expanded')}
        animate={currentVariant}
        variants={sidebarVariants}
        transition={navTransition}
        style={{
          height: '100vh',
          maxHeight: '100vh',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1100,
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: isMobile && isMobileOpen ? '20px 0 50px rgba(0,0,0,0.3)' : 'none'
        }}
        className="custom-scrollbar"
      >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--text-muted);
          border-radius: 20px;
          border: 2px solid transparent;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: var(--accent-indigo);
        }
      `}</style>
      
      {/* Header section (layout animated) */}
      <div style={{ position: 'relative', marginBottom: isCollapsed ? '20px' : '32px', display: 'flex', flexDirection: isCollapsed ? 'column' : 'row', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <motion.div
            layout
            whileHover={{ rotate: 15, scale: 1.1 }}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(99, 102, 241, 0.2)',
              flexShrink: 0,
            }}
          >
            <Zap size={22} color="white" />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={navTransition}
                style={{ overflow: 'hidden' }}
              >
                <h1 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                  <span className="gradient-text">{t('app_name_prefix', 'Niti')}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{t('app_name_suffix', '-Setu')}</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {!isMobile && (
          <motion.button 
            layout
            onClick={onToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-primary)', 
              width: '28px', 
              height: '28px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              flexShrink: 0
            }}
          >
            {isCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
          </motion.button>
        )}
      </div>

      {/* Navigation section */}
      <nav style={{ flexGrow: 1, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/dashboard/' && location.pathname.startsWith(item.to));
          return (
            <div key={item.label} onClick={isMobile ? onCloseMobile : undefined}>
              <NavButton item={item} isActive={isActive} isCollapsed={!isMobile && isCollapsed} t={t} navTransition={navTransition} />
            </div>
          );
        })}
      </nav>

      {/* Support Links */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isCollapsed ? 'column' : 'row',
        gap: isCollapsed ? '12px' : '16px', 
        justifyContent: 'center', 
        alignItems: 'center',
        margin: '20px 0', 
        padding: '0 8px',
        fontSize: '0.75rem',
        flexShrink: 0
      }}>
        <Link to="/faq" target="_blank" title="FAQ" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }} onMouseOver={e=>e.currentTarget.style.color='var(--accent-indigo)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-muted)'}>
          <FileText size={isCollapsed ? 18 : 14} />
          {!isCollapsed && <span>FAQ</span>}
        </Link>
        {!isCollapsed && <span style={{ color: 'var(--border-glass)' }}>|</span>}
        <Link to="/privacy" target="_blank" title="Privacy Policy" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }} onMouseOver={e=>e.currentTarget.style.color='var(--accent-indigo)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-muted)'}>
          <Shield size={isCollapsed ? 18 : 14} />
          {!isCollapsed && <span>Privacy</span>}
        </Link>
      </div>

      {/* Footer / User Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', flexShrink: 0 }}>
        <motion.div
          layout
          transition={navTransition}
          style={{
            padding: isCollapsed ? '12px 8px' : '16px',
            borderRadius: '16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isCollapsed ? 'center' : 'stretch',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            gap: isCollapsed ? '16px' : '12px'
          }}
        >
          {/* User Profile info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0, boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)' }}
            >
              {user?.name?.charAt(0) || 'U'}
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }} 
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={navTransition}
                  style={{ overflow: 'hidden', minWidth: 0 }}
                >
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
                  <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.01em', marginTop: '2px' }}>{currentTagline}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isCollapsed ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={logout}
                title={t('sb_logout')}
                style={{ flex: 1, padding: '10px 8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(244,63,94,0.08)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.1)', borderRadius: '10px', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(244,63,94,0.15)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
              >
                <LogOut size={16} /> <span style={{ whiteSpace: 'nowrap' }}>{t('sb_logout')}</span>
              </button>
              <button
                onClick={() => setIsNotifOpen(true)}
                title={t('lp_footer_portal')}
                style={{ width: '42px', padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-indigo)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '10px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
              >
                <Bell size={18} />
              </button>
            </motion.div>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
               <button onClick={logout} title={t('sb_logout')} style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.1)', borderRadius: '10px', width: '38px', height: '38px', cursor: 'pointer', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(244,63,94,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(244,63,94,0.08)'}>
                 <LogOut size={18} />
               </button>
               <button onClick={() => setIsNotifOpen(true)} title={t('lp_footer_portal')} style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '10px', width: '38px', height: '38px', cursor: 'pointer', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(99, 102, 241, 0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(99, 102, 241, 0.08)'}>
                 <Bell size={18} />
               </button>
             </div>
          )}
        </motion.div>

        {/* Global Controls Row */}
        <motion.div
          layout
          transition={navTransition}
          style={{
            padding: isCollapsed ? '10px 8px' : '10px 14px',
            borderRadius: '16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: isCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCollapsed ? '12px' : '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ flex: isCollapsed ? 'none' : 1, width: isCollapsed ? '100%' : 'auto', display: 'flex', justifyContent: 'center' }}>
            <LanguageSwitcher placement="up" isCollapsed={isCollapsed} />
          </div>
          {!isCollapsed && <div style={{ width: '1px', height: '28px', background: 'var(--border-color)', flexShrink: 0 }} />}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isCollapsed ? (
              <button 
                onClick={toggleTheme} 
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'} 
                style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: '10px', width: '38px', height: '38px', cursor: 'pointer', color: theme === 'light' ? 'var(--accent-amber)' : 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
                onMouseOver={e=>e.currentTarget.style.background='rgba(255,165,0,0.2)'}
                onMouseOut={e=>e.currentTarget.style.background='rgba(255,165,0,0.1)'}
              >
                {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <motion.div animate={{ rotate: theme === 'light' ? 0 : 180 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
                  {theme === 'light' ? <Sun size={16} style={{ color: 'var(--accent-amber)' }} /> : <Moon size={16} style={{ color: 'var(--accent-indigo)' }} />}
                </motion.div>
                <button
                  onClick={toggleTheme}
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                  style={{
                    position: 'relative', width: '44px', height: '24px', borderRadius: '100px', border: 'none', cursor: 'pointer', padding: 0,
                    background: theme === 'light' ? 'rgba(255, 170, 0, 0.4)' : 'rgba(99, 102, 241, 0.4)', transition: 'background 0.4s ease', flexShrink: 0,
                  }}
                >
                  <motion.div animate={{ x: theme === 'light' ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      </motion.aside>
    </>
  );
}
