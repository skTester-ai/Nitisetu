import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  FileText,
  Zap,
  Clock,
  TrendingUp,
  ArrowRight,
  PieChart as PieChartIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AgriCard from "../components/common/AgriCard";
import ShinyText from "../components/ShinyText";
import { useAuth } from "../context/AuthContext";
import { getSchemes, getProfiles, getHealth, getAnalytics } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

function StatCard({ icon: Icon, label, value, color, index }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{ height: "100%" }}
    >
      <AgriCard
        animate={true}
        className="agri-card"
        style={{
          padding: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          height: "100%",
        }}
        padding="24px"
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${color}25`,
            zIndex: 1,
          }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <div style={{ zIndex: 1 }}>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              fontWeight: 500,
              marginBottom: "4px",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            {value}
          </p>
        </div>
      </AgriCard>
    </motion.div>
  );
}

function SchemeCard({ scheme, index }) {
  const { t } = useTranslation();
  const categoryColors = {
    income_support: "#10b981",
    infrastructure: "#6366f1",
    energy: "#f59e0b",
    other: "#8b5cf6",
  };
  const color = categoryColors[scheme.category] || "#8b5cf6";

  return (
    <motion.div
      custom={index + 4}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{ height: '100%' }}
    >
      <AgriCard
        animate={true}
        className="agri-card relative z-10"
        style={{ 
          padding: "24px", 
          height: '180px', // Fixed height for absolute uniformity
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}
        padding="24px"
      >
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Header Area */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: "16px",
            }}
          >
            <div style={{ flex: 1, paddingRight: '12px', minWidth: 0 }}>
              <h3
                style={{ 
                  fontSize: "0.95rem", 
                  fontWeight: 700, 
                  marginBottom: "4px",
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'var(--text-primary)'
                }}
              >
                {scheme.name}
              </h3>
              <p style={{ 
                fontSize: "0.75rem", 
                color: "var(--text-secondary)", 
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {scheme.description || "Government scheme document"}
              </p>
            </div>
            <span
              className="badge"
              style={{
                background: `${color}12`,
                color,
                border: `1px solid ${color}20`,
                whiteSpace: 'nowrap',
                fontSize: '0.6rem',
                flexShrink: 0
              }}
            >
              {scheme.category?.replace("_", " ").toUpperCase() || t('sh_other')}
            </span>
          </div>
          
          {/* Stats Bar - Forced to bottom */}
          <div style={{ marginTop: 'auto', display: "flex", gap: "32px", paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ minWidth: '60px' }}>
              <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "2px", textTransform: 'uppercase', fontWeight: 600 }}>
                {t('db_chunks')}
              </p>
              <p style={{ fontSize: "1.1rem", fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {scheme.totalChunks}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "2px", textTransform: 'uppercase', fontWeight: 600 }}>
                {t('db_processed')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-emerald)" }}>
                <div className="pulse-dot" style={{ width: '5px', height: '5px' }} />
                {t('db_active')}
              </div>
            </div>
          </div>
        </div>
      </AgriCard>
    </motion.div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [s, p, h, a] = await Promise.allSettled([
          getSchemes(),
          getProfiles(),
          getHealth(),
          getAnalytics()
        ]);
        if (s.status === 'fulfilled') setSchemes(s.value.data || []);
        if (p.status === 'fulfilled') setProfiles(p.value.data || []);
        if (h.status === 'fulfilled') setHealth(h.value);
        if (a.status === 'fulfilled' && a.value?.success) setAnalytics(a.value.data);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalChunks = schemes.reduce((sum, s) => sum + (s.totalChunks || 0), 0);

  return (
    <div>
      {/* Header */}
    <AgriCard
      animate={true}
      className="agri-card"
      style={{ padding: isMobile ? '20px' : '32px', marginBottom: isMobile ? '20px' : '32px' }}
      padding={isMobile ? "20px" : "32px"}
    >
      <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {t('db_welcome')} 
          <ShinyText text={t('app_name')} disabled={false} speed={3} className="gradient-text !inline" />
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentUser?.role === 'superadmin' ? 'Monitoring Platform as Central Admin' : 
           (currentUser?.role === 'admin' ? 'Governing Schemes as Platform Administrator' : t('db_subtitle'))}
        </p>
      </div>

      {/* Stats Grid */}
      <div 
        className="dashboard-stats-grid"
        style={{
          display: "grid",
          gap: "16px",
          marginBottom: "0px",
        }}
      >
        <StatCard
          icon={FileText}
          label={t('db_schemes_loaded')}
          value={analytics?.rawStats?.totalSchemes || schemes.length}
          color="#6366f1"
          index={0}
        />
        <StatCard
          icon={BarChart3}
          label={t('db_total_checks')}
          value={analytics?.rawStats?.totalChecks || 0}
          color="#8b5cf6"
          index={1}
        />
        <StatCard
          icon={Users}
          label={t('db_farmer_profiles')}
          value={analytics?.rawStats?.totalProfiles || profiles.length}
          color="#10b981"
          index={2}
        />
        <StatCard
          icon={Zap}
          label={t('db_system_status')}
          value={health?.status === "ok" ? t('db_online') : t('db_offline')}
          color="#f59e0b"
          index={3}
        />
      </div>
    </AgriCard>

      {/* ── Analytics Visualizations (Admins Only) ── */}
      {analytics && (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
        <motion.div
           initial="hidden" animate="visible" variants={fadeUp} custom={4}
           style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div className="dashboard-charts-grid-main" style={{ display: 'grid', gap: '24px' }}>
            {/* Checks Over Time */}
            <AgriCard index={4} padding="24px" className="agri-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--accent-indigo)" />
                {t('db_checks_chart')}
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                {analytics.checksOverTime.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={analytics.checksOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                      <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-agri)', 
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-card)'
                        }}
                        itemStyle={{ color: 'var(--accent-indigo)', fontSize: '13px', fontWeight: 600 }}
                        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}
                        cursor={{fill: 'var(--bg-glass)', opacity: 0.4}}
                      />
                      <Bar dataKey="count" name={t('db_total_checks')} fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('db_no_data')}</div>
                )}
              </div>
            </AgriCard>

            {/* Eligibility Split */}
            <AgriCard index={5} padding="24px" className="agri-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={18} color="var(--accent-emerald)" />
                {t('db_eligibility_split')}
              </h3>
              <div style={{ flex: 1, width: '100%', minHeight: '220px', position: 'relative' }}>
                {(analytics.eligibilitySplit.eligible > 0 || analytics.eligibilitySplit.notEligible > 0) ? (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Eligible', value: analytics.eligibilitySplit.eligible || 0 },
                            { name: 'Not Eligible', value: analytics.eligibilitySplit.notEligible || 0 }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="var(--accent-emerald)" />
                          <Cell fill="var(--accent-rose)" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            background: 'var(--bg-secondary)', 
                            border: '1px solid var(--border-agri)', 
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-card)'
                          }}
                          itemStyle={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}
                          labelStyle={{ display: 'none' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('db_no_data')}</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-emerald)' }} /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('db_eligible')} ({analytics.eligibilitySplit.eligible})</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-rose)' }} /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('db_not_eligible')} ({analytics.eligibilitySplit.notEligible})</span></div>
              </div>
            </AgriCard>
          </div>

          <div className="dashboard-charts-grid" style={{ display: 'grid', gap: '24px' }}>
            {/* Top schemes */}
            <AgriCard index={6} padding="24px" className="agri-card">
               <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--accent-sky)" />
                {t('db_top_schemes')}
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                {analytics.topSchemes.length > 0 ? (
                   <ResponsiveContainer>
                    <BarChart layout="vertical" data={analytics.topSchemes} margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="_id" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={150} tickFormatter={(v) => v.length > 20 ? v.substring(0, 20) + '...' : v} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-agri)', 
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-card)'
                        }}
                        itemStyle={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}
                        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}
                        cursor={{fill: 'var(--bg-glass)', opacity: 0.4}}
                      />
                      <Bar dataKey="count" name="Matches" fill="var(--accent-sky)" radius={[0, 4, 4, 0]} barSize={24}>
                        {analytics.topSchemes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('db_no_data')}</div>
                )}
              </div>
            </AgriCard>

            {/* Demographics by State */}
            <AgriCard index={7} padding="24px" className="agri-card">
               <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#f59e0b" />
                {t('db_farmer_by_state')}
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                {analytics.profilesByState.length > 0 ? (
                   <ResponsiveContainer>
                    <BarChart data={analytics.profilesByState} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.length > 10 ? v.substring(0, 10) + '...' : v} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-agri)', 
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-card)'
                        }}
                        itemStyle={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}
                        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}
                        cursor={{fill: 'var(--bg-glass)', opacity: 0.4}}
                      />
                      <Bar dataKey="count" name="Farmers" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={36}>
                        {analytics.profilesByState.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('db_no_data')}</div>
                )}
              </div>
            </AgriCard>

          </div>
        </motion.div>
      )}

      {/* Quick Action */}
      <AgriCard
        animate={true}
        className="agri-card gradient-border"
        style={{ 
          padding: isMobile ? '20px' : "32px", 
          marginBottom: isMobile ? '20px' : "32px",
          border: 'none'
        }}
        padding={isMobile ? '20px' : "32px"}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? "20px" : "0",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: isMobile ? "1.1rem" : "1.25rem",
                fontWeight: 700,
                marginBottom: "8px",
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={20} style={{ color: "var(--accent-indigo)" }} />
              </div>
              {t('db_check_title')}
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: '500px' }}>
              {t('db_check_desc')}
            </p>
          </div>
          <Link to="/dashboard/check" style={{ textDecoration: "none" }}>
            <button
              className="btn-glow"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                whiteSpace: "nowrap",
                padding: '14px 28px'
              }}
            >
              {t('db_start_check')} <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </AgriCard>

    <AgriCard
      animate={true}
      className="agri-card"
      style={{ padding: isMobile ? '20px' : '32px', marginBottom: isMobile ? '20px' : '32px' }}
      padding={isMobile ? "20px" : "32px"}
    >
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{t('db_loaded_schemes')}</h2>
        <Link
          to="/dashboard/schemes"
          style={{
            fontSize: "0.85rem",
            color: "var(--accent-indigo)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          {t('db_view_all')}
        </Link>
      </div>

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shimmer"
              style={{ height: "130px", borderRadius: "16px" }}
            />
          ))}
        </div>
      ) : (
        <div
          className="dashboard-schemes-grid"
          style={{
            display: "grid",
            gap: "24px",
            width: "100%",
          }}
        >
          {schemes.slice(0, 6).map((scheme, i) => (
            <SchemeCard key={scheme._id} scheme={scheme} index={i} />
          ))}
          {schemes.length === 0 && (
            <div
              className="agri-card"
              style={{
                padding: "40px",
                textAlign: "center",
                gridColumn: "1 / -1",
              }}
            >
              <FileText
                size={40}
                style={{ color: "var(--text-muted)", margin: "0 auto 12px" }}
              />
              <p style={{ color: "var(--text-secondary)" }}>
              {t('db_no_schemes')}
              </p>
            </div>
          )}
        </div>
      )}
    </AgriCard>
    </div>
  );
}
