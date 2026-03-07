import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Zap, Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, googleAuth, user, loading } = useAuth();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await login(email.trim(), password.trim());
      if (res.success) {
        addToast(t('login_success'), t('login_welcome_back'), 'success');
      } else {
        addToast(t('login_auth_failed'), res.error, 'error');
      }
    } catch (err) {
      addToast(t('toast_system_error'), t('login_system_error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsSubmitting(true);
    try {
      const res = await googleAuth(credentialResponse.credential);
      if (res.success) {
        addToast(t('login_success'), t('login_google_success'), 'success');
      } else {
        addToast(t('login_auth_failed'), res.error, 'error');
      }
    } catch (err) {
      addToast(t('toast_system_error'), t('login_system_error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 62px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative', zIndex: 1 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)', marginBottom: '16px' }}>
            <Zap size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '4px' }}>{t('login_title', 'Welcome Back')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('login_subtitle', 'Sign in to Niti-Setu Engine')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Mail size={14} /> {t('login_email', 'Email Address')}
            </label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-dark" placeholder={t('login_email_ph', 'Enter your email')}
            />
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Lock size={14} /> {t('login_password', 'Password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-dark" placeholder={t('login_password_ph', 'Enter your password')}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting} className="btn-glow"
            style={{ marginTop: '12px', padding: '14px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '1rem' }}
          >
            {isSubmitting ? <><Loader2 size={20} className="spin" /> {t('login_authenticating', 'Authenticating...')}</> : t('btn_signin', 'Sign In')}
          </motion.button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('login_or', 'OR')}</span>
          <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              addToast(t('login_google_failed'), t('login_google_failed_desc'), 'error');
            }}
            theme="filled_black"
            shape="rectangular"
            size="large"
          />
        </div>

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Link to="/forgotpassword" style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s', }}>{t('login_forgot', 'Forgot your password?')}</Link>
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {t('login_no_account', 'Don\'t have an account?')} <Link to="/register" style={{ color: 'var(--accent-indigo)', fontWeight: 600, textDecoration: 'none' }}>{t('btn_register', 'Register')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}


