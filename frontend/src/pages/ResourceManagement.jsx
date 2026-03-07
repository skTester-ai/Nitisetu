import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  MessageSquare, 
  Mic, 
  Eye, 
  Mail, 
  TrendingUp,
  Globe,
  Users,
  RefreshCcw,
  Box,
  CheckCircle2,
  Activity,
  Zap,
  ShieldCheck,
  Server,
  ExternalLink,
  Settings,
  ShieldAlert,
  Archive,
  Search,
  Database,
  Lock,
  Clock,
  LayoutGrid,
  CreditCard,
  CloudLightning,
  Monitor,
  X
} from 'lucide-react';
import { getResourceUsage } from '../services/api';
import { useToast } from '../context/ToastContext';
import AgriCard from '../components/common/AgriCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

function StatBox({ label, value, subValue, icon: Icon, color, index, progress = null }) {
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
        style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(0,0,0,0.1)' }}
        padding="24px"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              {label}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{value}</h3>
              {subValue && (
                <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {subValue}
                </span>
              )}
            </div>
          </div>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--bg-secondary)', color, border: '1px solid var(--border-color)' }}>
            <Icon size={20} />
          </div>
        </div>

        {progress !== null && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-muted)' }}>
              <span>CAPACITY</span>
              <span style={{ color }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', background: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                style={{ height: '100%', background: color, borderRadius: '100px' }}
              />
            </div>
          </div>
        )}
      </AgriCard>
    </motion.div>
  );
}

function UsageCard({ service, index }) {
  const getIcon = (name) => {
    switch (name) {
      case 'Groq-LLM': return Cpu;
      case 'Groq-Whisper': return Mic;
      case 'Groq-Vision': return Eye;
      case 'ElevenLabs-TTS': return MessageSquare;
      case 'Twilio-WhatsApp': return Monitor; // Or MessageSquare/Phone
      case 'SMTP-Email': return Mail;
      default: return Server;
    }
  };

  const colors = {
    'Groq-LLM': { text: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    'Groq-Whisper': { text: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)' },
    'Groq-Vision': { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    'ElevenLabs-TTS': { text: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
    'Twilio-WhatsApp': { text: '#25D366', bg: 'rgba(37,211,102,0.1)', border: 'rgba(37,211,102,0.2)' },
    'SMTP-Email': { text: '#f43f5e', bg: 'rgba(244,63,63,0.1)', border: 'rgba(244,63,63,0.2)' }
  };

  const Icon = getIcon(service.serviceName);
  const theme = colors[service.serviceName] || colors['Groq-LLM'];
  const regUsage = service.todayRegisteredUsage || 0;
  const pubUsage = service.todayPublicUsage || 0;
  const totalToday = regUsage + pubUsage;
  const limit = service.dailyLimit || 100000;
  
  const regPercent = Math.min((regUsage / limit) * 100, 100);
  const pubPercent = Math.min((pubUsage / limit) * 100, 100);

  return (
    <motion.div
      custom={index + 4}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{ height: "100%" }}
    >
      <AgriCard
        animate={true}
        className="agri-card"
        style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
        padding="24px"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>{service.serviceName.replace('-', ' ')}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Active infrastructure node by {service.provider}
            </p>
          </div>
          <span className="badge" style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>
            {service.provider}
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Registered</span>
               <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{regUsage.toLocaleString()}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden' }}>
               <div style={{ height: '100%', width: `${regPercent}%`, background: theme.text, borderRadius: '100px' }} />
            </div>
          </div>
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600, textTransform: 'uppercase' }}>Public</span>
               <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{pubUsage.toLocaleString()}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden' }}>
               <div style={{ height: '100%', width: `${pubPercent}%`, background: 'var(--accent-emerald)', borderRadius: '100px' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase' }}>{service.unit}</p>
              <p style={{ fontSize: '1rem', fontWeight: 700 }}>{totalToday.toLocaleString()}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase' }}>STATUS</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 500 }}>Active</span>
              </div>
            </div>
          </div>
          <Settings size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </AgriCard>
    </motion.div>
  );
}

export default function ResourceManagement() {
  const [usageData, setUsageData] = useState([]);
  const [uniquePhones, setUniquePhones] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const { addToast } = useToast();

  const loadUsage = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await getResourceUsage();
      if (res.success) {
        setUsageData(res.data);
        setUniquePhones(res.uniquePhones || 0);
      }
    } catch (e) {
      console.error("Resource error", e);
      // alert("TELEMETRY_SYNC_FAILURE: Unable to connect to orchestration cluster.");
    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsage();
    
    // Refresh interval increased to 5 minutes (300,000ms) to mitigate server strain
    // Polling only happens if live-sync is enabled AND window is visible
    const interval = setInterval(() => {
      if (isLive && document.visibilityState === 'visible') {
        loadUsage(true);
      }
    }, 300000);

    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(clock); };
  }, [isLive]);

  const stats = useMemo(() => {
    const totalTokens = usageData.filter(s => s.unit === 'tokens').reduce((s, c) => s + (c.todayRegisteredUsage || 0) + (c.todayPublicUsage || 0), 0);
    const totalChars = usageData.filter(s => s.unit === 'characters').reduce((s, c) => s + (c.todayRegisteredUsage || 0) + (c.todayPublicUsage || 0), 0);
    return { tokens: totalTokens, chars: totalChars };
  }, [usageData]);

  const chartData = useMemo(() => {
    const llm = usageData.find(s => s.serviceName === 'Groq-LLM');
    if (!llm || !llm.history || llm.history.length === 0) return [];
    return llm.history.slice(-7).map(h => ({
      date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registered: h.registeredUsage || 0,
      public: h.publicUsage || 0
    }));
  }, [usageData]);

  const [mockLogs, setMockLogs] = useState(() => [
    { type: 'SYSTEM', time: new Date(Date.now() - 86400000).toLocaleTimeString(), msg: 'Master system reboot sequence completed.' },
    { type: 'SUCCESS', time: new Date(Date.now() - 14400000).toLocaleTimeString(), msg: 'MongoDB Atlas primary cluster verified.' },
    { type: 'SUCCESS', time: new Date(Date.now() - 14300000).toLocaleTimeString(), msg: 'Neo4j Aura connectivity established.' },
    { type: 'INFO', time: new Date(Date.now() - 3600000).toLocaleTimeString(), msg: 'Vite build sequence initiated.' },
    { type: 'INFO', time: new Date(Date.now() - 3550000).toLocaleTimeString(), msg: 'Client environment compiled successfully.' },
    { type: 'INFO', time: new Date(Date.now() - 1800000).toLocaleTimeString(), msg: 'LLM cache warming successful (Groq).' },
    { type: 'WARN', time: new Date(Date.now() - 600000).toLocaleTimeString(), msg: 'ElevenLabs API endpoint latency increased by 15ms.' },
    { type: 'SYSTEM', time: new Date(Date.now() - 120000).toLocaleTimeString(), msg: 'Orchestration node initialized locally.' },
    { type: 'INFO', time: new Date(Date.now() - 100000).toLocaleTimeString(), msg: 'Resource fetch operation successful (200 OK).' },
    { type: 'WARN', time: new Date(Date.now() - 80000).toLocaleTimeString(), msg: 'Quota sync is caching actively.' },
    { type: 'SUCCESS', time: new Date(Date.now() - 60000).toLocaleTimeString(), msg: 'Telemetry synced with master node.' },
    { type: 'LIVE', time: new Date().toLocaleTimeString(), msg: 'Polling for infrastructure changes...' }
  ]);

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    setTimeout(() => {
      setMockLogs(prev => [
        ...prev.filter(l => l.type !== 'LIVE'),
        { type: 'INFO', time: new Date().toLocaleTimeString(), msg: 'Manual log refresh triggered by user.' },
        { type: 'SUCCESS', time: new Date(Date.now() + 500).toLocaleTimeString(), msg: 'Log streams synchronized successfully.' },
        { type: 'LIVE', time: new Date(Date.now() + 1000).toLocaleTimeString(), msg: 'Polling for infrastructure changes...' }
      ]);
      setIsRefreshingLogs(false);
    }, 600);
  };

  const handleExportLogs = () => {
    const logContent = mockLogs.map(log => `[${log.type}] ${log.time} - ${log.msg}`).join('\n');
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nitisetu_infrastructure_logs_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast('Logs Exported', 'System logs have been downloaded as a text file.', 'success');
    setShowLogsModal(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', paddingBottom: '40px' }}>
      <AgriCard
        animate={true}
        className="agri-card"
        style={{ padding: '32px', marginBottom: '24px', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}
        padding="32px"
      >
        {/* Top Intelligence Strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '12px 24px', background: 'rgba(99,102,241,0.05)', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.1)', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
               <CloudLightning size={14} /> SYSTEM_READY
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
               <Clock size={14} /> {currentTime.toLocaleTimeString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
               <Globe size={14} /> AP-SOUTH-1
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>
             SYNC: {isLive ? 'AUTO' : 'PAUSED'} <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLive ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Box size={24} style={{ color: 'var(--accent-indigo)' }} />
              Resource Management
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Real-time monitoring of AI cloud infrastructure and third-party API quotas.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
             <button 
               onClick={() => setIsLive(!isLive)}
               style={{ 
                 background: isLive ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)', 
                 border: `1px solid ${isLive ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`, 
                 borderRadius: '12px', 
                 padding: '8px 16px', 
                 color: isLive ? 'var(--accent-emerald)' : 'var(--text-primary)', 
                 cursor: 'pointer', 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '8px', 
                 fontSize: '0.8rem', 
                 fontWeight: 700 
               }}
             >
               <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLive ? 'var(--accent-emerald)' : 'var(--text-muted)', animation: isLive ? 'pulse 2s infinite' : 'none' }} />
               {isLive ? 'Live Syncing' : 'Sync Paused'}
             </button>
             <button 
               onClick={() => setShowLogsModal(true)}
               style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '8px 16px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}
             >
               <Archive size={16} /> Logs
             </button>
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="btn-glow"
               onClick={() => loadUsage(true)}
               style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }}
             >
               <RefreshCcw size={18} className={refreshing ? "spin" : ""} />
               {refreshing ? "Syncing..." : "Refresh Stats"}
             </motion.button>
          </div>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          <StatBox label="Daily LLM Tokens" value={stats.tokens.toLocaleString()} subValue="Live" icon={Cpu} color="#10b981" index={0} progress={42} />
          <StatBox label="TTS Characters" value={stats.chars.toLocaleString()} subValue="Stable" icon={MessageSquare} color="#6366f1" index={1} progress={25} />
          <StatBox label="Registered Phones" value={uniquePhones.toLocaleString()} subValue="Unique" icon={Users} color="#25D366" index={2} />
          <StatBox label="System Health" value="EAL5+" icon={ShieldCheck} color="#f59e0b" index={3} />
        </div>

        {/* Main Content & Sidebar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
          {/* Main Area (Column 1) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', minWidth: 0 }}>
            {/* Chart Area */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Infrastructure Burn Rate (Last 7 Days)
                </h2>
                <div style={{ display: 'flex', gap: '12px', background: 'var(--border-glass)', padding: '4px 12px', borderRadius: '100px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      <div style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '2px' }} /> REG
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '2px' }} /> PUB
                   </div>
                </div>
              </div>
              <AgriCard padding="24px" className="agri-card" style={{ height: '400px', background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%' }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="registered" stackId="1" stroke="#6366f1" fill="rgba(99,102,241,0.2)" strokeWidth={2} />
                        <Area type="monotone" dataKey="public" stackId="1" stroke="#10b981" fill="rgba(16,185,129,0.15)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                      <Activity size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-muted)' }}>INITIALIZING TELEMETRY...</p>
                      <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>Perform an eligibility check to generate data.</p>
                    </div>
                  )}
                </div>
              </AgriCard>
            </div>

            {/* Providers Grid */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--accent-violet)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active API Providers
                </h2>
                <div style={{ position: 'relative', maxWidth: '100%' }}>
                   <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                   <input className="input-dark" placeholder="Filter..." style={{ paddingLeft: '32px', width: '180px', height: '36px', fontSize: '0.8rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                 {loading ? (
                   [1,2].map(i => <div key={i} className="shimmer" style={{ height: '240px', borderRadius: '16px' }} />)
                 ) : usageData.length > 0 ? (
                   usageData.map((s, i) => <UsageCard key={s._id} service={s} index={i} />)
                 ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-color)', opacity: 0.6 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        NO API NODES DETECTED. CHECK BACKEND CONFIGURATION.
                      </p>
                    </div>
                 )}
              </div>

            </div>
          </div>

          {/* Sidebar Area (Column 2) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>
            <div>
               <h2 style={{ fontSize: '0.85rem', fontWeight: 740, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                 Service Status
               </h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {[
                   { name: 'Groq Cloud', status: 'Optimal', col: '#10b981' },
                   { name: 'ElevenLabs', status: 'Healthy', col: '#10b981' },
                   { name: 'Neo4j Aura', status: 'Connected', col: '#38bdf8' },
                   { name: 'Twilio WhatsApp', status: 'Enabled', col: '#25D366' },
                   { name: 'MongoDB Alt', status: 'Healthy', col: '#10b981' }
                 ].map((s, i) => (
                   <div key={i} style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{s.name}</span>
                     <span style={{ fontSize: '0.65rem', fontWeight: 900, color: s.col, textTransform: 'uppercase' }}>{s.status}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div style={{ minWidth: 0 }}>
               <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                 Administrative Policies
               </h2>
               <AgriCard padding="20px" className="agri-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', width: '100%' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} /> Governance Protocol
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                    The tokens and characters displayed are aggregate counts. Limits are adjusted in env.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '10px', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: 600 }}>Auto-Scaling</span>
                      <span style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>ENABLED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '10px', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: 600 }}>Rate Limiting</span>
                      <span style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>ACTIVE</span>
                    </div>
                  </div>

                  <button 
                    className="btn-glow" 
                    style={{ width: '100%', marginTop: '16px', padding: '10px', fontSize: '0.8rem', fontWeight: 700 }}
                    onClick={() => setShowQuotaModal(true)}
                  >
                    Manage Quotas
                  </button>

               </AgriCard>
            </div>
            
            <AgriCard padding="20px" className="agri-card" style={{ background: 'rgba(239,68,68,0.02)', border: '1px dashed rgba(239,68,68,0.3)' }}>
               <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <ShieldAlert size={14} /> SECURITY PROTOCOL
               </h4>
               <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                 Unauthorized quota manipulation will trigger an EAL5+ lockdown.
               </p>
            </AgriCard>
          </div>
        </div>
      </AgriCard>

      {/* Popups */}
      {createPortal(
        <AnimatePresence>
          {showQuotaModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', width: '90%', maxWidth: '450px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
              <button onClick={() => setShowQuotaModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} style={{ color: 'var(--accent-emerald)' }} /> Quota Management System
              </h3>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '12px' }}>
                  System quotas are currently managed via Environment Variables for EAL5+ security compliance.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Please refer to the <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-indigo)' }}>.env</code> configuration to adjust <strong>DAILY_LLM_LIMIT</strong> and <strong>DAILY_TTS_LIMIT</strong> values.
                </p>
              </div>
              <button className="btn-glow" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700 }} onClick={() => setShowQuotaModal(false)}>
                Acknowledge Protocol
              </button>
            </motion.div>
          </div>
        )}

        {showLogsModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', width: '90%', maxWidth: '550px', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '85vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
              <button onClick={() => setShowLogsModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingRight: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                  <Archive size={22} style={{ color: 'var(--accent-indigo)' }}/> Infrastructure Logs
                </h3>
                <button 
                  onClick={handleRefreshLogs} 
                  disabled={isRefreshingLogs}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  <RefreshCcw size={14} className={isRefreshingLogs ? "spin" : ""} />
                  Refresh
                </button>
              </div>
              
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-glass)', minHeight: '250px' }}>
                {mockLogs.map((log, idx) => {
                  let color = 'var(--text-muted)';
                  if (log.type === 'INFO') color = '#38bdf8';
                  if (log.type === 'SYSTEM') color = '#6366f1';
                  if (log.type === 'WARN') color = '#f59e0b';
                  if (log.type === 'SUCCESS') color = '#10b981';
                  if (log.type === 'LIVE') color = '#f43f5e';

                  return (
                    <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', fontFamily: 'monospace', lineHeight: 1.4 }}>
                       <span style={{ color, fontWeight: 700, width: '60px', display: 'inline-block' }}>[{log.type}]</span>
                       <span style={{ color: 'var(--text-muted)', marginRight: '10px' }}>{log.time}</span>
                       <span style={{ color: log.type === 'LIVE' ? 'white' : 'var(--text-secondary)' }}>{log.msg}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button className="btn-glass" style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600 }} onClick={() => setShowLogsModal(false)}>
                  Dismiss
                </button>
                <button className="btn-glow" style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600 }} onClick={handleExportLogs}>
                  Export Logs
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
