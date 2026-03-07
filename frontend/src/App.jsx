import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GlobalLoader from './components/common/GlobalLoader';
import KrishiMitra from './components/common/KrishiMitra';
import Aurora from './components/Aurora';
// Lazy load the heaviest pages that will contain 3D components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schemes = lazy(() => import('./pages/Schemes'));
const Landing = lazy(() => import('./pages/Landing'));
const EligibilityCheck = lazy(() => import('./pages/EligibilityCheck'));
const GraphExplorer = lazy(() => import('./pages/GraphExplorer'));
const FAQ = lazy(() => import('./pages/FAQ'));
const LegalPolicy = lazy(() => import('./pages/LegalPolicy'));
const ResourceManagement = lazy(() => import('./pages/ResourceManagement'));

import Sidebar from './components/layout/Sidebar';
import LandingNav from './components/layout/LandingNav';
import HistoryPage from './pages/History';
import Farmers from './pages/Farmers';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import UsersPage from './pages/Users';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastContainer } from './components/Toast';
import './index.css';

/* ── Authenticated app shell with Sidebar ── */
const ChatDashboard = lazy(() => import('./pages/ChatDashboard'));

function AppShell() {
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      const nextValue = !isSidebarCollapsed;
      setIsSidebarCollapsed(nextValue);
      localStorage.setItem('sidebar_collapsed', nextValue);
    }
  };
  
  return (
    <ProtectedRoute>
      <div style={{ position: 'relative', display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* Sidebar - Desktop-Side or Mobile-Overlay */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar} 
          isMobile={isMobile}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Header */}
        {isMobile && (
          <header style={{
            height: '64px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="white" />
              </div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                <span className="gradient-text">Niti</span>
                <span style={{ color: 'var(--text-primary)' }}>-Setu</span>
              </h1>
            </div>
            <button 
              onClick={toggleSidebar}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Menu size={20} />
            </button>
          </header>
        )}

        <main style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          marginLeft: isMobile ? '0' : (isSidebarCollapsed ? '80px' : '260px'),
          padding: isMobile ? '20px 16px' : '32px 40px',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          minWidth: 0,
          width: '100%',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* ── Public auth pages (with shared landing nav + agricultural background) ── */
function AuthShell() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bg = isDark
    ? 'radial-gradient(ellipse at top, #0c170c 0%, #060d06 70%)'
    : 'linear-gradient(160deg, #faf7ee 0%, #f2ead8 45%, #f7f2e4 100%)';
  const dotColor = isDark ? 'rgba(34,197,94,0.05)' : 'rgba(101,67,33,0.07)';

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: bg,
      backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px), ${bg}`,
      backgroundSize: '28px 28px, 100% 100%',
    }}>
      {!isMobile && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none' }}>
          <Aurora
            colorStops={
              isDark 
              ? ['#16a34a', '#166534', '#060d06'] 
              : ['#4ade80', '#16a34a', '#dcfce7']
            }
            speed={0.3}
          />
        </div>
      )}
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <LandingNav />
        <Outlet />
      </div>
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  in: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transitionEnd: {
      transform: 'none',
      filter: 'none'
    }
  },
  out: { opacity: 0, scale: 1.02, filter: 'blur(4px)' }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Wrapper for animated routes
const PageWrapper = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <div style={{ height: '100%', width: '100%' }}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ height: '100%', width: '100%' }}
    >
      {children}
    </motion.div>
  );
};

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing page */}
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />

        {/* Public auth pages — share the LandingNav */}
        <Route element={<AuthShell />}>
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/forgotpassword" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
          <Route path="/resetpassword" element={<PageWrapper><ResetPassword /></PageWrapper>} />
          {/* Public Eligibility Check Tool (unauthenticated / guest) */}
          <Route path="/check" element={<PageWrapper><EligibilityCheck /></PageWrapper>} />

          {/* Public Content Pages within AuthShell */}
          <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
          <Route path="/privacy" element={<PageWrapper><LegalPolicy /></PageWrapper>} />
        </Route>
        <Route path="/dashboard" element={<AppShell />}>
          <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
          {/* Authenticated Eligibility Check renders INSIDE the Sidebar layout */}
          <Route path="check" element={<PageWrapper><EligibilityCheck /></PageWrapper>} />
          <Route path="schemes" element={<PageWrapper><Schemes /></PageWrapper>} />
          <Route path="farmers" element={<ProtectedRoute requiredRole="admin"><PageWrapper><Farmers /></PageWrapper></ProtectedRoute>} />
          <Route path="history" element={<PageWrapper><HistoryPage /></PageWrapper>} />
          <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="users" element={<ProtectedRoute requiredRole="admin"><PageWrapper><UsersPage /></PageWrapper></ProtectedRoute>} />
          <Route path="graph" element={<ProtectedRoute requiredRole="admin"><PageWrapper><GraphExplorer /></PageWrapper></ProtectedRoute>} />
          <Route path="chat" element={<PageWrapper><ChatDashboard /></PageWrapper>} />
          <Route path="resources" element={<ProtectedRoute requiredRole="admin"><PageWrapper><ResourceManagement /></PageWrapper></ProtectedRoute>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<GlobalLoader />}>
            <AnimatedRoutes />
          </Suspense>
          <KrishiMitra />
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
