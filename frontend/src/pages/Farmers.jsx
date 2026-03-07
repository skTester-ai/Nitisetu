import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, Trash2, Edit2, Loader2, MapPin, Ruler, Search, User, Droplets, Wallet, Sprout, Shield, AlertCircle, CheckCircle2, X, Plus, Mail } from 'lucide-react';
import { getProfiles, deleteProfile, updateProfile, getSchemes } from '../services/api';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import { useTranslation } from 'react-i18next';
import AgriCard from '../components/common/AgriCard';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', ' त्रिपुरा', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function Farmers() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState([]);
  const [allSchemes, setAllSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [editingProfile, setEditingProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSchemeName, setCustomSchemeName] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, schemeRes] = await Promise.all([
        getProfiles(),
        getSchemes()
      ]);
      
      if (profileRes.success) setProfiles(profileRes.data);
      if (schemeRes.success) setAllSchemes(schemeRes.data);
      
      if (!profileRes.success) setError(profileRes.error || 'Failed to fetch profiles');
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteClick = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    try {
      setLoading(true);
      setDeleteId(null);
      await deleteProfile(id);
      await fetchData();
    } catch (err) {
      alert("Failed to delete: " + err.message);
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...editingProfile };
      payload.age = parseInt(payload.age) || null;
      payload.landHolding = parseFloat(payload.landHolding) || 0;
      payload.annualIncome = parseInt(payload.annualIncome) || 0;
      
      await updateProfile(editingProfile._id, payload);
      setEditingProfile(null);
      await fetchData();
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const filtered = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px' }}>
    <AgriCard
      animate={true}
      className="agri-card"
      style={{ padding: '32px', marginBottom: '24px' }}
      padding="32px"
    >
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            <Users size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-violet)' }} />
            {t('fm_title')}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t('fm_subtitle')}
          </p>
        </div>
        
        {/* Search */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('fm_search_ph')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-dark"
            style={{ paddingLeft: '44px', borderRadius: '20px' }}
          />
        </div>
      </div>

      {error ? (
        <div style={{ padding: '20px', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', borderRadius: '12px', marginBottom: '20px' }}>
          <AlertCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
          {error}
        </div>
      ) : loading && profiles.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--accent-indigo)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Users size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{t('fm_empty')}</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filtered.map((profile, i) => (
            <AgriCard
              key={profile._id}
              animate={true}
              transition={{ delay: i * 0.05 }}
              className="agri-card"
              style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              padding="24px"
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {profile.name || t('fm_unknown')}
                  </h3>
                  {profile.age && <span className="badge badge-info">{profile.age} {t('fm_yrs')}</span>}
                  <span className="badge badge-success">{profile.category}</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {profile.district ? `${profile.district}, ` : ''}{profile.state}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Ruler size={14} /> {profile.landHolding} {t('fm_acres')}
                  </span>
                  {profile.cropType && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sprout size={14} /> {profile.cropType}
                    </span>
                  )}
                  {profile.annualIncome > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wallet size={14} /> ₹{profile.annualIncome.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingProfile(profile)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: 'var(--accent-indigo)', width: '36px', height: '36px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Edit2 size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteClick(profile._id, profile.name)}
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
                    color: 'var(--accent-rose)', width: '36px', height: '36px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </AgriCard>
          ))}
        </div>
      )}
    </AgriCard>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProfile && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !saving && setEditingProfile(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
            />
            
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="agri-card"
              style={{ position: 'relative', width: '90%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
              padding="32px"
            >
              <button
                onClick={() => !saving && setEditingProfile(null)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} style={{ color: 'var(--accent-indigo)' }} />
                {t('pf_title')}
              </h2>
              
              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}><User size={14} /> {t('reg_name')}</label>
                    <input name="name" value={editingProfile.name || ''} onChange={handleChange} className="input-dark" required />
                  </div>
                  <div>
                    <label style={labelStyle}><User size={14} /> {t('cm_age')}</label>
                    <input name="age" type="number" value={editingProfile.age || ''} onChange={handleChange} className="input-dark" required />
                  </div>
                  <div>
                    <label style={labelStyle}><MapPin size={14} /> {t('cm_state')}</label>
                    <select name="state" value={editingProfile.state || ''} onChange={handleChange} className="select-dark" required>
                      <option value="">{t('cm_search')}</option>
                      {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}><Mail size={14} /> WhatsApp / Contact</label>
                    <input name="contactNumber" value={editingProfile.contactNumber || ''} onChange={handleChange} className="input-dark" placeholder="+91..." />
                  </div>
                  <div>
                    <label style={labelStyle}><MapPin size={14} /> {t('cm_district')}</label>
                    <input name="district" value={editingProfile.district || ''} onChange={handleChange} className="input-dark" />
                  </div>
                  <div>
                    <label style={labelStyle}><MapPin size={14} /> {t('pf_sub_region', 'Sub-Region (Dialect)')}</label>
                    <select 
                      name="subRegion" 
                      value={editingProfile.subRegion || ''} 
                      onChange={handleChange} 
                      className="select-dark"
                    >
                      <option value="">Standard (General)</option>
                      <optgroup label="Maharashtra Dialects">
                        <option value="Kolhapur">Kolhapur (Western Marathi)</option>
                        <option value="Vidarbha">Vidarbha (Varhadi)</option>
                        <option value="Marathwada">Marathwada</option>
                        <option value="Konkan">Konkan (Malvani)</option>
                        <option value="Khandesh">Khandesh (Ahirani)</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}><Ruler size={14} /> {t('cm_land')}</label>
                    <input name="landHolding" type="number" step="0.1" value={editingProfile.landHolding || ''} onChange={handleChange} className="input-dark" required />
                  </div>
                  <div>
                    <label style={labelStyle}><Sprout size={14} /> {t('cm_crop')}</label>
                    <input name="cropType" value={editingProfile.cropType || ''} onChange={handleChange} className="input-dark" />
                  </div>
                  <div>
                    <label style={labelStyle}><Shield size={14} /> {t('cm_category')}</label>
                    <select name="category" value={editingProfile.category || 'General'} onChange={handleChange} className="select-dark">
                      <option value="General">{t('cm_general')}</option>
                      <option value="SC">{t('cm_scst')}</option>
                      <option value="ST">{t('cm_scst')}</option>
                      <option value="OBC">{t('cm_obc')}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}><Wallet size={14} /> {t('cm_income')}</label>
                    <input name="annualIncome" type="number" value={editingProfile.annualIncome || ''} onChange={handleChange} className="input-dark" />
                  </div>
                  <div>
                    <label style={labelStyle}><User size={14} /> {t('pf_gender')}</label>
                    <select name="gender" value={editingProfile.gender || 'Male'} onChange={handleChange} className="select-dark">
                      <option value="Male">{t('pf_male')}</option>
                      <option value="Female">{t('pf_female')}</option>
                      <option value="Other">{t('pf_other')}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}><MapPin size={14} /> {t('pf_ownership_type')}</label>
                    <select name="ownershipType" value={editingProfile.ownershipType || 'Owner'} onChange={handleChange} className="select-dark">
                      <option value="Owner">{t('pf_owner')}</option>
                      <option value="Tenant/Sharecropper">{t('pf_tenant')}</option>
                      <option value="Co-owner">{t('pf_coowner')}</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px' }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                      <input type="checkbox" name="hasIrrigationAccess" checked={editingProfile.hasIrrigationAccess || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-indigo)' }} />
                      <Droplets size={14} /> {t('cm_has_irrigation')}
                    </label>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                      <input type="checkbox" name="hasBPLCard" checked={editingProfile.hasBPLCard || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-indigo)' }} />
                      <User size={14} /> {t('pf_bpl_card')}
                    </label>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                      <input type="checkbox" name="hasKcc" checked={editingProfile.hasKcc || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-indigo)' }} />
                      <Wallet size={14} /> {t('pf_kcc_owner')}
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px' }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                      <input type="checkbox" name="isDifferentlyAbled" checked={editingProfile.isDifferentlyAbled || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-indigo)' }} />
                      <User size={14} /> {t('pf_divyangjan')}
                    </label>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                      <input type="checkbox" name="hasAadharSeededBank" checked={editingProfile.hasAadharSeededBank || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-indigo)' }} />
                      <CheckCircle2 size={14} /> {t('pf_aadhar_seeded')}
                    </label>
                  </div>
                </div>

                {/* Active Schemes / Enrollments */}
                <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                  <label style={{ ...labelStyle, marginBottom: '12px' }}>
                    <Shield size={16} style={{ color: 'var(--accent-indigo)' }} /> 
                    {t('pf_enrolled_title')}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {allSchemes.map(scheme => {
                      const isEnrolled = editingProfile.activeSchemes?.includes(scheme.name);
                      return (
                        <button
                          key={scheme._id}
                          type="button"
                          onClick={() => {
                            const current = editingProfile.activeSchemes || [];
                            const next = isEnrolled 
                              ? current.filter(s => s !== scheme.name)
                              : [...current, scheme.name];
                            setEditingProfile({ ...editingProfile, activeSchemes: next });
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
                    {editingProfile.activeSchemes?.filter(s => !allSchemes.some(as => as.name === s)).map(customName => (
                      <button
                        key={customName}
                        type="button"
                        onClick={() => {
                          const next = editingProfile.activeSchemes.filter(s => s !== customName);
                          setEditingProfile({ ...editingProfile, activeSchemes: next });
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
                            const next = [...(editingProfile.activeSchemes || []), customSchemeName.trim()];
                            setEditingProfile({ ...editingProfile, activeSchemes: [...new Set(next)] });
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
                        Cancel
                      </button>
                    </div>
                  )}
                  {allSchemes.length === 0 && !showCustomInput && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No schemes available to select.</p>}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                  <button type="button" onClick={() => setEditingProfile(null)} disabled={saving} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)' }}>
                    {t('cm_cancel')}
                  </button>
                  <button type="submit" disabled={saving} className="btn-glow" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                    {t('st_save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteName}
        isDeleting={loading && !editingProfile}
      />
    </div>
  );
}

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
  marginBottom: '8px',
};
