import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  History, CheckCircle2, XCircle, Clock, FileText, User, Calendar, ChevronDown, ChevronUp, Trash2, RefreshCw
} from 'lucide-react';
import { getProfiles, getEligibilityHistory, deleteEligibilityCheck, deleteProfile } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import AgriCard from '../components/common/AgriCard';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

function HistoryCard({ check, index, onDelete }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isEligible = check.eligible;
  const date = new Date(check.createdAt || check.checkedAt);

  return (
    <AgriCard
      className="agri-card"
      animate={true}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      style={{ padding: '24px', cursor: 'pointer' }}
      padding="24px"
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: isEligible ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${isEligible ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
            }}
          >
            {isEligible ? <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} /> :
              <XCircle size={20} style={{ color: 'var(--accent-rose)' }} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
              {check.schemeName || t('hs_scheme_fallback')}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`}>
                {isEligible ? t('hs_eligible') || 'Eligible' : t('hs_not_eligible') || 'Not Eligible'}
              </span>
              <span className={`badge badge-${check.confidence === 'high' ? 'success' : check.confidence === 'medium' ? 'warning' : 'info'}`}>
                {check.confidence}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {date.toLocaleDateString(i18n.language.startsWith('en') ? 'en-US' : i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {check.responseTime}s
            </p>
          </div>
          {expanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> :
            <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ 
            marginTop: '20px', 
            paddingTop: '20px', 
            borderTop: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>{t('hs_reason')}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{check.reason}</p>
          </div>

          {check.citation && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>{t('hs_citation')}</p>
              <blockquote style={{
                padding: '12px 16px', borderRadius: '10px', borderLeft: '3px solid var(--accent-amber)',
                background: 'rgba(245,158,11,0.05)', fontStyle: 'italic',
                fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                "{check.citation}"
              </blockquote>
            </div>
          )}

          {check.benefitAmount && (
            <p style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              {t('hs_benefit')}: ₹{Number(check.benefitAmount).toLocaleString()}
            </p>
          )}

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(check._id, check.schemeName); }}
              style={{
                background: 'none', border: 'none', color: 'var(--accent-rose)', 
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                cursor: 'pointer', padding: '6px 12px', borderRadius: '6px'
              }}
            >
              <Trash2 size={14} /> {t('hs_delete_record')}
            </button>
          </div>
        </motion.div>
      )}
    </AgriCard>
  );
}

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    getProfiles()
      .then((p) => {
        const profs = p.data || [];
        setProfiles(profs);
        if (profs.length > 0) setSelectedProfile(profs[0]._id);
      })
      .finally(() => setLoadingProfiles(false));
  }, []);

  useEffect(() => {
    if (!selectedProfile) return;
    setLoading(true);
    getEligibilityHistory(selectedProfile)
      .then((h) => setChecks(h.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProfile]);

  const handleDeleteRequest = (id, schemeName) => {
    setItemToDelete({ type: 'record', id, name: schemeName || t('hs_scheme_fallback') });
  };

  const confirmDeleteRecord = async () => {
    if (!itemToDelete || itemToDelete.type !== 'record') return;
    try {
      await deleteEligibilityCheck(itemToDelete.id);
      setChecks(checks.filter((c) => c._id !== itemToDelete.id));
      addToast(t('success') || 'Success', t('toast_record_deleted_desc'), 'success');
    } catch (e) {
      console.error('Failed to delete check', e);
      addToast(t('us_error_title'), t('us_error_fetch'), 'error');
    } finally {
      setItemToDelete(null);
    }
  };

  const handleReuseProfile = () => {
    const profile = profiles.find(p => p._id === selectedProfile);
    if (profile) {
      navigate('/dashboard/check', { state: { profile } });
    }
  };

  const handleDeleteProfileRequest = () => {
    const profile = profiles.find(p => p._id === selectedProfile);
    setItemToDelete({ type: 'profile', id: selectedProfile, name: profile ? profile.name : 'Unknown Farmer' });
  };

  const confirmDeleteProfile = async () => {
    if (!itemToDelete || itemToDelete.type !== 'profile') return;
    setLoading(true);
    try {
      await deleteProfile(itemToDelete.id);
      const remainingProfiles = profiles.filter(p => p._id !== itemToDelete.id);
      setProfiles(remainingProfiles);
      
      if (remainingProfiles.length > 0) {
        setSelectedProfile(remainingProfiles[0]._id);
      } else {
        setSelectedProfile('');
        setChecks([]);
      }
      addToast(t('success') || 'Success', t('toast_profile_deleted_desc'), 'success');
    } catch (e) {
      console.error('Failed to delete profile', e);
      addToast(t('us_error_title'), 'Could not delete the farmer profile', 'error');
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  return (
    <AgriCard
      animate={true}
      className="agri-card"
      style={{ padding: '32px', marginBottom: '24px' }}
      padding="32px"
    >
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          <History size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-cyan)' }} />
          {t('hs_title')}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {t('hs_subtitle')}
        </p>
      </div>

      {/* Profile Selector */}
      <div style={{ padding: '0px', marginBottom: '24px' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} /> {t('hs_tbl_farmer')}
        </label>
        {loadingProfiles ? (
          <div className="shimmer" style={{ height: '44px', borderRadius: '12px' }} />
        ) : profiles.length === 0 ? (
          <div style={{
            padding: '12px 16px', background: 'rgba(255,255,255,0.03)', 
            borderRadius: '12px', border: '1px solid var(--border-glass)',
            color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic'
          }}>
            {t('hs_empty')}
          </div>
        ) : (
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="select-dark"
          >
            {profiles.map((p) => (
              <option key={p._id} value={p._id}>{p.name} — {p.state} ({p.landHolding} acres)</option>
            ))}
          </select>
        )}
        
        {!loadingProfiles && profiles.length > 0 && selectedProfile && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button
              onClick={handleDeleteProfileRequest}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '8px 16px', fontSize: '0.85rem',
                background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)',
                border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '12px',
                cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
            >
              <Trash2 size={14} /> {t('hs_delete_profile')}
            </button>
            <button
              onClick={handleReuseProfile}
              className="btn-glow"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '8px 16px', fontSize: '0.85rem'
              }}
            >
              <RefreshCw size={14} /> {t('hs_run_new_check')}
            </button>
          </div>
        )}
      </div>

      {/* History List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer" style={{ height: '90px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : checks.length === 0 ? (
        <AgriCard
          animate={true}
          className="agri-card"
          style={{ padding: '60px', textAlign: 'center' }}
          padding="60px"
        >
          <History size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{t('hs_no_checks')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('hs_no_checks_desc')}</p>
        </AgriCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {checks.map((check, i) => (
            <HistoryCard key={check._id} check={check} index={i} onDelete={handleDeleteRequest} />
          ))}
        </div>
      )}

      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={itemToDelete.type === 'record' ? confirmDeleteRecord : confirmDeleteProfile}
          title={itemToDelete.type === 'record' ? "Delete Eligibility Record?" : "Delete Profile & History?"}
          message={itemToDelete.type === 'record' 
            ? "Are you sure you want to delete this eligibility check result? This action cannot be undone."
            : "Are you sure you want to permanently delete this profile and its entire request history? This action cannot be undone."}
          itemName={itemToDelete.name}
        />
      )}
    </AgriCard>
  );
}
