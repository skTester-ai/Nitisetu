import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Zap, Loader2, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [step, setStep] = useState(1); // 1: Identity, 2: Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const { register, googleAuth, sendOTP, user, loading } = useAuth();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await sendOTP(email.trim(), 'registration');
      if (res.success) {
        addToast(t('otp_sent_title', 'OTP Sent'), t('otp_sent_desc', 'Please check your email for the verification code.'), 'success');
        setStep(2);
        setResendTimer(60);
      } else {
        addToast(t('otp_error', 'Failed to send OTP'), res.error, 'error');
      }
    } catch (err) {
      addToast(t('toast_system_error'), t('reg_system_error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePassword = (pass) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[@$!%*?&]/.test(pass);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleFinalRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      addToast(t('rp_mismatch', 'Passwords do not match'), 'Please ensure both password fields are identical.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (!validatePassword(password)) {
      addToast(
        t('reg_invalid_password', 'Security Violation'), 
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)', 
        'error'
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await register(name.trim(), email.trim(), password.trim(), otp.trim(), contactNumber.trim());
      if (res.success) {
        addToast(t('reg_success'), t('reg_welcome'), 'success');
      } else {
        addToast(t('reg_failed'), res.error || 'Identity verification failed', 'error');
      }
    } catch (err) {
      addToast('Registration Error', err.response?.data?.error || 'A system security check failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsSubmitting(true);
    try {
      const res = await googleAuth(credentialResponse.credential);
      if (res.success) {
        addToast(t('reg_success'), t('login_google_success'), 'success');
      } else {
        addToast(t('login_auth_failed'), res.error, 'error');
      }
    } catch (err) {
      addToast(t('toast_system_error'), t('reg_system_error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 62px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      
      {/* Background Decorative Elements */}
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: '300px', height: '300px', background: 'var(--accent-indigo)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }}></div>
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: '300px', height: '300px', background: 'var(--accent-emerald)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '460px', padding: '48px', position: 'relative', zIndex: 1, borderRadius: '32px' }}
      >
        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '6px', borderRadius: '10px', background: step === 1 ? 'var(--gradient-primary)' : 'rgba(99, 102, 241, 0.2)' }}></div>
          <div style={{ width: '40px', height: '6px', borderRadius: '10px', background: step === 2 ? 'var(--gradient-primary)' : 'rgba(99, 102, 241, 0.1)' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)', marginBottom: '20px' }}>
            {step === 1 ? <User size={28} color="white" /> : <ShieldCheck size={28} color="white" />}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {step === 1 ? t('reg_title', 'Create Account') : t('otp_verify_title', 'Verify Email')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '300px', lineHeight: 1.5 }}>
            {step === 1 
              ? t('reg_subtitle', 'Join Niti-Setu to access agricultural schemes and benefits.') 
              : `${t('otp_verify_subtitle', 'We sent a 6-digit code to')} ${email}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOTP}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  <User size={16} className="text-indigo-400" /> {t('reg_name', 'Full Name')}
                </label>
                <input
                  type="text" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="input-dark" placeholder={t('reg_name_ph', 'Enter your full name')}
                  style={{ padding: '16px 20px', borderRadius: '16px' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  <Mail size={16} className="text-indigo-400" /> {t('login_email', 'Email Address')}
                </label>
                <input
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-dark" placeholder={t('login_email_ph', 'name@example.com')}
                  style={{ padding: '16px 20px', borderRadius: '16px' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  <Zap size={16} className="text-amber-400" /> WhatsApp Number (Optional)
                </label>
                <input
                  type="text"
                  value={contactNumber} onChange={(e) => setContactNumber(e.target.value)}
                  className="input-dark" placeholder="e.g. +91 9876543210"
                  style={{ padding: '16px 20px', borderRadius: '16px' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Linking your WhatsApp lets you chat with Krishi Mitra via voice notes.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={isSubmitting} className="btn-glow"
                style={{ marginTop: '8px', padding: '16px', borderRadius: '16px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: 700 }}
              >
                {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <>{t('reg_btn_next', 'Continue')} <ArrowRight size={20} /></>}
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                <div style={{ height: '1px', flex: 1, background: 'var(--border-glass)' }}></div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('reg_or', 'OR')}</span>
                <div style={{ height: '1px', flex: 1, background: 'var(--border-glass)' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => addToast(t('reg_google_failed'), t('login_google_failed_desc'), 'error')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                />
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleFinalRegister}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  <ShieldCheck size={16} className="text-emerald-400" /> {t('otp_label', 'Verification Code')}
                </label>
                <input
                  type="text" required maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input-dark" placeholder="ENTER 6-DIGIT CODE"
                  style={{ 
                    padding: '16px', textAlign: 'center', fontSize: '1.5rem', 
                    letterSpacing: '8px', fontWeight: 800, borderRadius: '16px',
                    borderColor: otp.length === 6 ? 'var(--accent-emerald)' : 'var(--border-glass)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button 
                    type="button" onClick={() => setStep(1)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Change Email
                  </button>
                  <button 
                    type="button" 
                    disabled={resendTimer > 0 || isSubmitting}
                    onClick={handleSendOTP}
                    style={{ 
                      background: 'none', border: 'none', 
                      color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--accent-indigo)', 
                      fontSize: '0.85rem', fontWeight: 600, cursor: resendTimer > 0 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px' 
                    }}
                  >
                    <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  <Lock size={16} className="text-indigo-400" /> {t('login_password', 'Security Password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input-dark" placeholder={t('login_password_ph', 'Min. 8 characters')}
                    style={{ 
                      padding: '16px 50px 16px 20px', borderRadius: '16px',
                      borderColor: password.length > 0 ? (validatePassword(password) ? 'var(--accent-emerald)' : 'var(--accent-rose)') : 'var(--border-glass)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-dark" placeholder="Repeat your password"
                    style={{ 
                      padding: '16px 50px 16px 20px', borderRadius: '16px',
                      borderColor: (confirmPassword && password) ? (confirmPassword === password ? 'var(--accent-emerald)' : 'var(--accent-rose)') : 'var(--border-glass)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={isSubmitting || otp.length < 6} className="btn-glow"
                style={{ 
                  marginTop: '12px', padding: '16px', borderRadius: '16px', width: '100%', 
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', 
                  fontSize: '1.05rem', fontWeight: 800,
                  opacity: (otp.length < 6 || isSubmitting) ? 0.7 : 1
                }}
              >
                {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <>{t('reg_btn_final', 'Complete Registration')} <CheckCircle2 size={20} /></>}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {t('reg_have_account', 'Already registered?')} <Link to="/login" style={{ color: 'var(--accent-indigo)', fontWeight: 700, textDecoration: 'none' }}>{t('reg_signin_link', 'Sign In')}</Link>
        </p>
      </motion.div>
    </div>
  );
}
