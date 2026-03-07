import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Loader2, Shield, Calendar, Mail, User, Trash2, AlertTriangle, X, ShieldAlert, Plus, ShieldCheck, UserCog, ArrowUpCircle } from 'lucide-react';
import { getAllUsers, deleteUser, provisionAdmin, updateUserRole } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import AgriCard from '../components/common/AgriCard';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [provisionMode, setProvisionMode] = useState(null); // 'existing' or 'new'
  const [showProvisionConfirm, setShowProvisionConfirm] = useState(false);
  const [userToUpgrade, setUserToUpgrade] = useState(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleToConfirm, setRoleToConfirm] = useState(null); // { userId, roleName, isUpgrade }
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'admin' });
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      addToast(t('us_error_title', 'Error'), t('us_error_fetch', 'Failed to fetch users'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionAdmin = async () => {
    setIsProvisioning(true);
    try {
      const res = await provisionAdmin(newAdmin);
      if (res.success) {
        addToast(t('us_provision_success', 'Admin Created'), t('us_provision_desc', 'Provisioning email has been dispatched to the new administrator.'), 'success');
        setShowAddAdmin(false);
        setShowProvisionConfirm(false);
        setNewAdmin({ name: '', email: '', role: 'admin' });
        fetchUsers(); // Refresh list
      } else {
        addToast(t('us_error_title', 'Error'), res.error || 'Failed to provision admin', 'error');
      }
    } catch (err) {
      addToast(t('us_error_title', 'Error'), 'Provisioning failed due to a system error', 'error');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userToUpgrade || !roleToConfirm) return;
    const { roleName } = roleToConfirm;
    setIsUpdatingRole(true);
    try {
      const res = await updateUserRole(userToUpgrade._id, roleName);
      if (res.success) {
        addToast(t('us_role_updated', 'Role Updated'), `User ${userToUpgrade.name} tier successfully calibrated to ${roleName}.`, 'success');
        setUserToUpgrade(null);
        setRoleToConfirm(null);
        fetchUsers();
      } else {
        addToast(t('us_error_title', 'Error'), res.error || 'Failed to update role', 'error');
      }
    } catch (err) {
      addToast(t('us_error_title', 'Error'), 'Role update failed', 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(userToDelete._id);
      if (res.success) {
        addToast(t('us_deleted_title', 'User Deleted'), t('us_deleted_desc', 'The account has been removed from the directory.'), 'success');
        setUsers(users.filter(u => u._id !== userToDelete._id));
        setUserToDelete(null);
      } else {
        addToast(t('us_error_title', 'Error'), res.error || 'Failed to delete user', 'error');
      }
    } catch (err) {
      addToast(t('us_error_title', 'Error'), 'A system error occurred during deletion', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <AgriCard
        animate={true}
        className="agri-card"
        style={{ padding: '32px', marginBottom: '24px' }}
        padding="32px"
      >
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
              <Users size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)' }} />
              {t('us_title', 'User Management')}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {t('us_subtitle', 'View all registered users and administrators across the platform')}
            </p>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="#ef4444" />
            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Development Phase</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '250px', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={t('us_search_ph', 'Search users by name, email or role...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark"
              style={{ paddingLeft: '44px', width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-info" style={{ marginRight: '8px' }}>{filteredUsers.length} {t('us_total_users', 'Users')}</span>
            {currentUser?.role === 'superadmin' && (
              <button 
                onClick={() => setShowAddAdmin(true)}
                className="btn-glow flex items-center gap-2"
                style={{ borderRadius: '12px', padding: '10px 20px', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> {t('us_add_admin', 'Add New Admin')}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--accent-indigo)' }} />
            <p>{t('us_loading', 'Loading users...')}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '16px', color: 'var(--text-primary)' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{t('us_no_results', 'No users found')}</p>
            <p style={{ fontSize: '0.9rem' }}>{t('us_no_results_desc', 'Try adjusting your search filters')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t('us_col_user', 'User')}</th>
                  <th style={thStyle}>{t('us_col_role', 'Role')}</th>
                  <th style={thStyle}>{t('us_col_joined', 'Joined Date')}</th>
                  <th style={thStyle}>{t('us_col_actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <motion.tr 
                    key={u._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ background: 'var(--bg-card)', borderRadius: '12px' }}
                  >
                    <td style={{ ...tdStyle, borderRadius: '12px 0 0 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Mail size={12} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span 
                        className={`badge ${u.role === 'superadmin' ? 'badge-super' : (u.role === 'admin' ? 'badge-warning' : 'badge-success')}`} 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          ...(u.role === 'superadmin' ? {
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            padding: '6px 12px',
                            fontWeight: 800,
                            letterSpacing: '0.02em'
                          } : {})
                        }}
                      >
                        {u.role === 'superadmin' ? <ShieldCheck size={14} /> : (u.role === 'admin' ? <Shield size={12} /> : <User size={12} />)}
                        {u.role === 'superadmin' ? 'CENTRAL ADMIN' : (u.role === 'admin' ? t('role_admin', 'Administrator') : t('role_farmer', 'Farmer'))}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {new Date(u.createdAt).toLocaleDateString(i18n.language.startsWith('en') ? 'en-US' : i18n.language, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {currentUser?.role === 'superadmin' && u.email !== 'admin@nitisetu.gov.in' && (
                          <motion.button
                            whileHover={{ scale: 1.1, color: 'var(--accent-indigo)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setUserToUpgrade(u)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
                            title="Manage Privileges"
                          >
                            <UserCog size={18} />
                          </motion.button>
                        )}
                        {u._id !== currentUser?.id && u.role !== 'superadmin' && (
                          <motion.button
                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setUserToDelete(u)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AgriCard>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div style={{ position: 'fixed', inset: 0, left: localStorage.getItem('sidebar_collapsed') === 'true' ? '80px' : '260px', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setUserToDelete(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#ef4444' }}>
                  <AlertTriangle size={32} />
                </div>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Dangerous Action: Delete Account
                </h2>
                
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                  You are about to permanently remove <strong>{userToDelete.name}</strong> ({userToDelete.email}) from the Niti-Setu platform.
                </p>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '20px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} /> Privacy & Compliance Notice
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>This action is IRREVERSIBLE and removes all associated profile data.</li>
                    <li>Pursuant to <strong>IT Act (2000)</strong> and Data Protection standards, account removal must be intentional and authorized.</li>
                    <li><em>Feature Note:</em> This administrative control is currently in <strong>Beta / Development Phase</strong>.</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                  <button
                    disabled={isDeleting}
                    onClick={() => setUserToDelete(null)}
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={handleDeleteUser}
                    style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={18} /> Confirm Delete</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddAdmin && (
          <div style={{ position: 'fixed', inset: 0, left: localStorage.getItem('sidebar_collapsed') === 'true' ? '80px' : '260px', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProvisioning && setShowAddAdmin(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {provisionMode === 'new' ? 'New Admin Registration' : (provisionMode === 'existing' ? 'Elevate Existing User' : 'Administrative Onboarding')}
                </h2>
                <button onClick={() => { setShowAddAdmin(false); setProvisionMode(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              {!provisionMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.95rem' }}>
                    Select the onboarding protocol for the new administrative account:
                  </p>
                  <button
                    onClick={() => setProvisionMode('new')}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Plus size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>New Registration</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Create a fresh account and dispatch credentials.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowAddAdmin(false)} // This just closes and they can use the table, 
                    // BUT let's make it smarter: if they click 'existing', we just scroll them to table or show a search
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Search size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>Search Existing User</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Promote a developer or farmer from the directory.</p>
                    </div>
                  </button>
                </div>
              )}

              {provisionMode === 'new' && (
                <form onSubmit={(e) => { e.preventDefault(); setShowProvisionConfirm(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={newAdmin.name} 
                    onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                    className="input-dark" 
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address</label>
                  <input 
                    required
                    type="email" 
                    value={newAdmin.email} 
                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="input-dark" 
                    placeholder="admin@nitisetu.gov.in"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Account Role</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setNewAdmin({...newAdmin, role: 'admin'})}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${newAdmin.role === 'admin' ? 'var(--accent-indigo)' : 'var(--border-glass)'}`, background: newAdmin.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)', color: newAdmin.role === 'admin' ? 'var(--accent-indigo)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      Regional Admin
                    </button>
                    {newAdmin.email === 'admin@nitisetu.gov.in' && (
                      <button
                        type="button"
                        onClick={() => setNewAdmin({...newAdmin, role: 'superadmin'})}
                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${newAdmin.role === 'superadmin' ? 'var(--accent-indigo)' : 'var(--border-glass)'}`, background: newAdmin.role === 'superadmin' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)', color: newAdmin.role === 'superadmin' ? 'var(--accent-indigo)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Central Admin
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '12px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', padding: '16px', borderRadius: '16px' }}>
                  <p style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                    <strong>Provisioning Protocol:</strong> An onboarding email with a temporary credential and safety instructions will be dispatched immediately upon creation.
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={isProvisioning}
                  className="btn-glow" 
                  style={{ padding: '16px', borderRadius: '16px', fontWeight: 800, marginTop: '8px' }}
                >
                  {isProvisioning ? <Loader2 size={18} className="spin" /> : 'Provision Account'}
                </button>
                <button type="button" onClick={() => setProvisionMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>Back to selection</button>
              </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Provision Confirmation Modal */}
      <AnimatePresence>
        {showProvisionConfirm && (
          <div style={{ position: 'fixed', inset: 0, left: localStorage.getItem('sidebar_collapsed') === 'true' ? '80px' : '260px', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProvisionConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-indigo)' }}>
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Confirm Administrative Action</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                Are you sure you want to provision <strong>{newAdmin.name}</strong> as a <strong>{newAdmin.role.toUpperCase()}</strong>? This will dispatch an automated email with security credentials.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowProvisionConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleProvisionAdmin} disabled={isProvisioning} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--accent-indigo)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isProvisioning ? <Loader2 size={16} className="spin" /> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Jurisdictional Protocol Modal (Upgrade/Downgrade Flow) */}
      <AnimatePresence>
        {userToUpgrade && (
          <div style={{ position: 'fixed', inset: 0, left: localStorage.getItem('sidebar_collapsed') === 'true' ? '80px' : '260px', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isUpdatingRole && setUserToUpgrade(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="glass-card" 
              style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', border: '1px solid var(--border-glass)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Jurisdictional Protocol</h2>
                </div>
                <button onClick={() => setUserToUpgrade(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Active Subject</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                   <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{userToUpgrade.name}</span>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({userToUpgrade.email})</span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Select the target administrative tier. This action will trigger a formal notification and calibrate system permissions.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { 
                    id: 'superadmin', 
                    title: 'Central Orchestrator', 
                    desc: 'Primary governance and system-wide orchestration authority.',
                    icon: ShieldCheck,
                    color: 'var(--accent-indigo)',
                    isReserved: true
                  },
                  { 
                    id: 'admin', 
                    title: 'Regional Administrator', 
                    desc: 'Authority over local schemes, farmers, and regional pipelines.',
                    icon: Shield,
                    color: 'var(--accent-amber)',
                    isReserved: false
                  },
                  { 
                    id: 'farmer', 
                    title: 'Field Partner', 
                    desc: 'Standard jurisdictional access for agricultural intelligence.',
                    icon: User,
                    color: 'var(--accent-emerald)',
                    isReserved: false
                  }
                ].filter(role => !role.isReserved || userToUpgrade.email === 'admin@nitisetu.gov.in').map((role) => {
                  const isCurrent = userToUpgrade.role === role.id;
                  const roleRanks = { superadmin: 3, admin: 2, farmer: 1 };
                  const isDowngrade = roleRanks[role.id] < roleRanks[userToUpgrade.role];
                  
                  return (
                    <button
                      key={role.id}
                      disabled={isUpdatingRole || isCurrent}
                      onClick={() => {
                        const roleRanks = { superadmin: 3, admin: 2, farmer: 1 };
                        setRoleToConfirm({
                          roleName: role.id,
                          isUpgrade: roleRanks[role.id] > roleRanks[userToUpgrade.role],
                          title: role.title
                        });
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        padding: '16px', 
                        borderRadius: '20px', 
                        border: `1px solid ${isCurrent ? role.color : 'var(--border-glass)'}`, 
                        background: isCurrent ? `${role.color}15` : 'rgba(255,255,255,0.02)', 
                        textAlign: 'left', 
                        cursor: isCurrent ? 'default' : 'pointer',
                        opacity: isCurrent ? 0.8 : (isUpdatingRole ? 0.5 : 1),
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseOver={e => !isUpdatingRole && !isCurrent && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseOut={e => !isUpdatingRole && !isCurrent && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    >
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '14px', 
                        background: isCurrent ? role.color : 'var(--bg-secondary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: isCurrent ? 'white' : 'var(--text-muted)',
                        flexShrink: 0 
                      }}>
                        <role.icon size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {role.title}
                          {isCurrent && (
                            <span style={{ fontSize: '0.65rem', background: role.color, color: role.id === 'admin' ? '#000' : '#fff', padding: '2px 8px', borderRadius: '100px', fontWeight: 800 }}>ACTIVE JURISDICTION</span>
                          )}
                          {!isCurrent && isDowngrade && (
                            <span style={{ fontSize: '0.65rem', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '2px 8px', borderRadius: '100px', fontWeight: 800 }}>STRATEGIC REALIGNMENT</span>
                          )}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{role.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {isUpdatingRole && (
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--accent-indigo)' }}>
                  <Loader2 size={20} className="spin" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Calibrating Tier Access...</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Impact Authorization Prompt */}
      <AnimatePresence>
        {roleToConfirm && (
          <div style={{ position: 'fixed', inset: 0, left: localStorage.getItem('sidebar_collapsed') === 'true' ? '80px' : '260px', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isUpdatingRole && setRoleToConfirm(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: '440px', padding: '40px', borderRadius: '32px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: roleToConfirm.isUpgrade ? 'rgba(99, 102, 241, 0.1)' : 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: roleToConfirm.isUpgrade ? 'var(--accent-indigo)' : 'var(--accent-rose)' }}>
                {roleToConfirm.isUpgrade ? <ArrowUpCircle size={32} /> : <ShieldAlert size={32} />}
              </div>
              
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
                {roleToConfirm.isUpgrade ? 'Confirm Operational Elevation' : 'Confirm Jurisdictional Downgrade'}
              </h3>
              
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                You are about to calibrate <strong>{userToUpgrade.name}'s</strong> access to the <strong>{roleToConfirm.title}</strong> tier. 
                {roleToConfirm.isUpgrade 
                  ? " This will grant broad administrative permissions and access to classified systemic resources."
                  : " This action will restrict access to administrative modules and revoke significant operational authority."
                }
              </p>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '16px', marginBottom: '32px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                 <strong>Security Protocol:</strong> Changing account permissions is a high-sensitivity action. Notification emails will be dispatched to the subject and central audit logs updated.
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => setRoleToConfirm(null)} 
                  disabled={isUpdatingRole}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateRole} 
                  disabled={isUpdatingRole} 
                  style={{ 
                    flex: 1, padding: '14px', borderRadius: '12px', 
                    background: roleToConfirm.isUpgrade ? 'var(--accent-indigo)' : 'var(--accent-rose)', 
                    color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
                  }}
                >
                  {isUpdatingRole ? <Loader2 size={18} className="spin" /> : 'Confirm Calibration'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '0 16px 8px 16px',
  color: 'var(--text-muted)',
  fontWeight: 500,
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '16px',
  borderTop: '1px solid var(--border-color)',
  borderBottom: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
};
