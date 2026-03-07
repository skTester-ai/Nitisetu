import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, ShieldCheck, Mail, Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const validatePassword = (pass) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[@$!%*?&]/.test(pass);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast(t('rp_mismatch', 'Passwords do not match'), t('rp_mismatch_desc', 'Please ensure both password fields are identical.'), 'error');
      return;
    }
    
    if (!validatePassword(password)) {
      addToast(
        t('rp_invalid_password', 'Security Violation'), 
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)', 
        'error'
      );
      return;
    }
    
    setLoading(true);
    try {
      const res = await resetPassword({ email: email.trim(), otp: otp.trim(), password: password.trim() });
      if (res.success) {
        addToast(t('rp_success_title', 'Password Updated'), t('rp_toast_success', 'Your password has been reset successfully.'), 'success');
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        addToast(t('rp_failed', 'Reset Failed'), res.error || 'The system rejected this request', 'error');
      }
    } catch (err) {
      addToast('Reset Failed', err.response?.data?.error || 'Security check failed. Please verify your OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      {/* Decorative background */}
      <div style={{ position: 'fixed', bottom: '20%', left: '10%', width: '300px', height: '300px', background: 'var(--accent-emerald)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }}></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '460px', padding: '48px', position: 'relative', zIndex: 1, borderRadius: '28px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: success ? 'var(--gradient-success)' : 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: 'var(--shadow-glow)' }}>
            {success ? <CheckCircle2 size={32} color="white" /> : <Lock size={32} color="white" />}
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '8px' }}>
            {success ? t('rp_success_title', 'Success!') : t('rp_title', 'Reset Password')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {success ? t('rp_success_desc', 'Your password has been changed. Redirecting to login...') : t('rp_subtitle', 'Enter the 6-digit code sent to your email and choose a new secure password.')}
          </p>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.9rem' }}
            >
              Redirecting...
            </motion.div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {!location.state?.email && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  <Mail size={16} className="text-indigo-400" /> {t('login_email', 'Email Address')}
                </label>
                <input
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="input-dark" placeholder="Verify your email"
                  style={{ padding: '14px 16px', borderRadius: '14px' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                <ShieldCheck size={16} className="text-emerald-400" /> {t('otp_label', 'Verification Code')}
              </label>
              <input
                type="text" required maxLength={6}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input-dark" placeholder="6-DIGIT CODE"
                style={{ padding: '14px', textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px', fontWeight: 800, borderRadius: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                <Lock size={16} className="text-indigo-400" /> {t('rp_new_password', 'New Password')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="input-dark" placeholder="Minimum 8 characters"
                  style={{ 
                    padding: '14px 48px 14px 16px', borderRadius: '14px',
                    borderColor: password.length > 0 ? (validatePassword(password) ? 'var(--accent-emerald)' : 'var(--accent-rose)') : 'var(--border-glass)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                <ShieldCheck size={16} className="text-emerald-400" /> {t('rp_confirm_password', 'Confirm Password')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'} required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="input-dark" placeholder="Repeat new password"
                  style={{ 
                    padding: '14px 48px 14px 16px', borderRadius: '14px',
                    borderColor: (confirmPassword && password) ? (confirmPassword === password ? 'var(--accent-emerald)' : 'var(--accent-rose)') : 'var(--border-glass)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                  Passwords do not match
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  Passwords match!
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || otp.length < 6}
              className="btn-glow"
              style={{ marginTop: '8px', padding: '16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, opacity: (otp.length < 6 || loading) ? 0.7 : 1 }}
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : t('rp_btn_update', 'Reset Password')}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
