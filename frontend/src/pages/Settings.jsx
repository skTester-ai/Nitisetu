import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, KeyRound, Loader2, Save, Plus, X, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateDetails, updatePassword, sendOTP, getSchemes, sendWhatsAppOTP, verifyWhatsAppOTP } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import AgriCard from '../components/common/AgriCard';

export default function Settings() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [details, setDetails] = useState({ 
    name: user?.name || '', 
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    activeSchemes: user?.activeSchemes || [] 
  });
  const [allSchemes, setAllSchemes] = useState([]);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSchemeName, setCustomSchemeName] = useState('');
  
  // WhatsApp Verification State
  const [whatsappOTP, setWhatsappOTP] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  useEffect(() => {
    if (user) {
      setDetails({
        name: user.name || '',
        email: user.email || '',
        contactNumber: user.contactNumber ? user.contactNumber.replace('+91', '') : '',
        activeSchemes: user.activeSchemes || []
      });
    }
  }, [user]);

  useEffect(() => {
    getSchemes().then(r => setAllSchemes(r.data || []));
  }, []);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setDetailsLoading(true);
    try {
      const res = await updateDetails(details);
      if (res.success) {
        // Refresh local user state if the API provides it
        if (res.data) setUser(res.data);
        addToast(t('toast_profile_update'), t('toast_profile_update'), 'success');
      }
    } catch (err) {
      addToast(t('toast_analysis_failed'), err.response?.data?.error || t('toast_analysis_failed'), 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast(t('rp_mismatch'), t('rp_mismatch'), 'error');
      return;
    }
    setPasswordLoading(true);
    try {
      await updatePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      addToast(t('st_change_password'), t('rp_toast_success'), 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(t('toast_analysis_failed'), err.response?.data?.error || t('toast_analysis_failed'), 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setPasswordLoading(true);
    addToast(t('otp_sent_title', 'Sending Code'), t('pf_loading', 'Initiating password reset...'), 'info');
    try {
      const res = await sendOTP(user.email, 'password_reset');
      if (res.success) {
        addToast(t('otp_sent_title', 'Code Sent'), t('otp_sent_desc', 'Please check your email for the reset code.'), 'success');
        navigate('/resetpassword', { state: { email: user.email } });
      }
    } catch (err) {
      addToast(t('toast_system_error'), err.response?.data?.error || t('toast_system_error'), 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendWhatsAppOTP = async () => {
    if (!details.contactNumber) {
      addToast('Error', 'Please enter a WhatsApp number first', 'error');
      return;
    }
    setVerificationLoading(true);
    try {
      const res = await sendWhatsAppOTP(details.contactNumber);
      if (res.success) {
        setShowVerification(true);
        addToast(t('otp_sent_title'), 'A 6-digit code has been sent to your WhatsApp', 'success');
      }
    } catch (err) {
      addToast(t('toast_system_error'), err.response?.data?.error || 'Failed to send WhatsApp code', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyWhatsAppOTP = async () => {
    if (!whatsappOTP || whatsappOTP.length !== 6) {
      addToast('Error', 'Please enter a valid 6-digit code', 'error');
      return;
    }
    setVerificationLoading(true);
    try {
      const res = await verifyWhatsAppOTP(details.contactNumber, whatsappOTP);
      if (res.success) {
        // Update both local and context state
    const updatedUser = { 
          ...user, 
          isPhoneVerified: true, 
          contactNumber: details.contactNumber.startsWith('+91') ? details.contactNumber : '+91' + details.contactNumber 
        };
        setUser(updatedUser);
        setShowVerification(false);
        setWhatsappOTP('');
        addToast('Verified!', 'Your WhatsApp number is now successfully verified', 'success');
      }
    } catch (err) {
      addToast(t('toast_system_error'), err.response?.data?.error || 'Verification failed', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
    <AgriCard
      animate={true}
      className="agri-card"
      style={{ padding: '32px', marginBottom: '24px' }}
      padding="32px"
    >
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          <User size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)' }} />
          {t('st_title')}
          <span 
            className={`badge ${user?.role === 'superadmin' ? 'badge-primary' : (user?.role === 'admin' ? 'badge-warning' : 'badge-success')}`}
            style={{ marginLeft: '12px', fontSize: '0.65rem', padding: '4px 10px', verticalAlign: 'middle' }}
          >
            {user?.role === 'superadmin' ? 'Central Admin' : (user?.role === 'admin' ? t('sb_admin') : t('sb_farmer'))}
          </span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {t('st_profile_desc')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Update Details */}
        <form
          onSubmit={handleDetailsSubmit}
          className="agri-card"
          style={{ padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <User size={20} style={{ color: 'var(--accent-violet)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('st_profile_info')}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '16px' }}>
            <div>
              <label style={labelStyle}>{t('st_full_name')}</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="text" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('st_email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>WhatsApp Number</label>
                {user?.isPhoneVerified && details.contactNumber === user.contactNumber ? (
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                     Verified ✔
                  </span>
                ) : (
                  details.contactNumber && (
                    <button 
                      type="button" 
                      onClick={handleSendWhatsAppOTP} 
                      disabled={verificationLoading}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}
                    >
                      {verificationLoading ? 'Sending...' : 'Verify via WhatsApp'}
                    </button>
                  )
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: 'var(--text-muted)',
                  borderRight: '1px solid var(--border-color)',
                  paddingRight: '10px',
                  height: '24px'
                }}>
                  <Zap size={16} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>+91</span>
                </div>
                <input 
                  type="text" 
                  maxLength={10}
                  value={details.contactNumber} 
                  onChange={(e) => setDetails({ ...details, contactNumber: e.target.value.replace(/\D/g, '') })} 
                  className="input-dark" 
                  style={{ paddingLeft: '75px' }} 
                  placeholder="9876543210" 
                />
              </div>
            </div>

            {showVerification && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ gridColumn: '1 / -1', background: 'rgba(99, 102, 241, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid var(--accent-indigo)' }}
              >
                <label style={labelStyle}>Enter 6-Digit WhatsApp Verification Code</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={whatsappOTP} 
                    onChange={(e) => setWhatsappOTP(e.target.value.replace(/\D/g, ''))} 
                    className="input-dark" 
                    style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }}
                    placeholder="000000"
                  />
                  <button 
                    type="button" 
                    onClick={handleVerifyWhatsAppOTP}
                    disabled={verificationLoading}
                    className="btn-glow"
                    style={{ padding: '0 24px' }}
                  >
                    {verificationLoading ? <Loader2 size={18} className="spin" /> : 'Verify'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowVerification(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
            <label style={{ ...labelStyle, marginBottom: '12px' }}>
              <KeyRound size={16} style={{ color: 'var(--accent-indigo)' }} /> 
              {t('st_active_enrollments')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allSchemes.map(scheme => {
                const isEnrolled = details.activeSchemes?.includes(scheme.name);
                return (
                  <button
                    key={scheme._id}
                    type="button"
                    onClick={() => {
                      const current = details.activeSchemes || [];
                      const next = isEnrolled 
                        ? current.filter(s => s !== scheme.name)
                        : [...current, scheme.name];
                      setDetails({ ...details, activeSchemes: next });
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '100px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: isEnrolled ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)',
                      color: isEnrolled ? 'black' : 'var(--text-secondary)',
                      border: `1px solid ${isEnrolled ? 'var(--accent-indigo)' : 'var(--border-glass)'}`
                    }}
                  >
                    {scheme.name}
                  </button>
                );
              })}

              {/* Display custom schemes already in activeSchemes but not in allSchemes */}
              {details.activeSchemes?.filter(s => !allSchemes.some(as => as.name === s)).map(customName => (
                <button
                  key={customName}
                  type="button"
                  onClick={() => {
                    const next = details.activeSchemes.filter(s => s !== customName);
                    setDetails({ ...details, activeSchemes: next });
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'var(--accent-indigo)',
                    color: 'black',
                    border: '1px solid var(--accent-indigo)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {customName} <X size={12} />
                </button>
              ))}

              {!showCustomInput && (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--accent-indigo)',
                    border: '1px dashed var(--accent-indigo)',
                  }}
                >
                  <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {t('pf_not_listed')}
                </button>
              )}
            </div>

            {showCustomInput && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={customSchemeName}
                  onChange={(e) => setCustomSchemeName(e.target.value)}
                  placeholder={t('pf_enter_scheme_ph')}
                  className="input-dark"
                  style={{ flex: 1, padding: '8px 12px' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customSchemeName.trim()) {
                      const next = [...(details.activeSchemes || []), customSchemeName.trim()];
                      setDetails({ ...details, activeSchemes: [...new Set(next)] });
                      setCustomSchemeName('');
                      setShowCustomInput(false);
                    }
                  }}
                  className="btn-glow"
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  {t('pf_add')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomSchemeName('');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {t('cm_cancel')}
                </button>
              </div>
            )}
          </div>

          <motion.button type="submit" disabled={detailsLoading} className="btn-glow" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {detailsLoading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {detailsLoading ? t('st_saving') : t('st_save')}
          </motion.button>
        </form>

        {/* Update Password */}
        <form
          onSubmit={handlePasswordSubmit}
          className="agri-card"
          style={{ padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Lock size={20} style={{ color: 'var(--accent-amber)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('st_change_password')}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>{t('st_current_password')}</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}
                >
                  {t('login_forgot', 'Forgot your password?')}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} placeholder={t('st_current_password')} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('st_new_password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} placeholder={t('st_new_password')} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('st_confirm_password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input required type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="input-dark" style={{ paddingLeft: '36px' }} placeholder={t('st_confirm_password')} />
              </div>
            </div>
          </div>
          <motion.button type="submit" disabled={passwordLoading} className="btn-glow" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--gradient-amber)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}>
            {passwordLoading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {passwordLoading ? t('st_updating') : t('st_update_password')}
          </motion.button>
        </form>
      </div>
    </AgriCard>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px',
};
