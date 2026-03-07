import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { sendOTP } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sendOTP(email.trim(), 'password_reset');
      if (res.success) {
        addToast(t('otp_sent_title', 'Code Sent'), t('otp_sent_desc', 'Please check your email for the reset code.'), 'success');
        // Navigate to reset password page and pass email in state
        navigate('/resetpassword', { state: { email } });
      } else {
        addToast(t('fp_failed', 'Request Failed'), res.error, 'error');
      }
    } catch (err) {
      addToast(t('fp_toast_failed'), err.response?.data?.error || 'Could not process request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      {/* Decorative background */}
      <div style={{ position: 'fixed', top: '20%', right: '10%', width: '300px', height: '300px', background: 'var(--accent-indigo)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative', zIndex: 1, borderRadius: '24px' }}
      >
        <button 
          onClick={() => navigate('/login')} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', marginBottom: '32px', cursor: 'pointer', fontWeight: 500 }}
        >
          <ArrowLeft size={18} /> {t('fp_back_login', 'Back to Login')}
        </button>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)', marginBottom: '20px' }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            {t('fp_title_main', 'Forgot')} <span className="gradient-text">{t('fp_title_accent', 'Password?')}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {t('fp_subtitle', "No worries! Enter your registered email and we'll send you a 6-digit code to reset your password.")}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 600 }}>
              {t('fp_email_label', 'Email Address')}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark"
                style={{ padding: '16px 16px 16px 48px', borderRadius: '16px' }}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-glow"
            style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : <>{t('fp_btn_send', 'Send Code')} <ArrowRight size={20} /></>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
