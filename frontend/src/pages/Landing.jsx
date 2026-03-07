import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  Zap, Shield, Brain, FileText, Users, BarChart3, Mic, Globe,
  Star, ArrowRight, ArrowUp, ArrowDown, CheckCircle, Sun, Moon, Menu, X,
  Cpu, Lock, Languages, HeartHandshake, Wheat, MapPin,
  Github, Sprout, TrendingUp, Clock, CheckCircle2, Search, Info, Check, Quote
} from 'lucide-react';
import FluidGlass from '../components/FluidGlass';
import LandingNav from '../components/layout/LandingNav';
import LandingFooter from '../components/common/LandingFooter';
import Plasma from '../components/Plasma';
import Silk from '../components/Silk';
import CircularText from '../components/CircularText';

/* ─── Agricultural color system ─────────────────────────── */
const C = (isDark) => ({
  bg:         isDark ? '#060d06'                      : '#faf7ee',
  bg2:        isDark ? '#0c170c'                      : '#f2ead8',
  bgCard:     isDark ? 'rgba(12,24,12,0.92)'          : 'rgba(255,253,244,0.97)',
  bgGlass:    isDark ? 'rgba(34,197,94,0.05)'         : 'rgba(101,67,33,0.07)',
  border:     isDark ? 'rgba(34,197,94,0.12)'         : 'rgba(101,67,33,0.18)',
  borderGlow: isDark ? 'rgba(34,197,94,0.3)'          : 'rgba(22,101,52,0.32)',
  text:       isDark ? '#e8f5e0'                      : '#1a2a0e',
  textSec:    isDark ? '#6b9a60'                      : '#3d5c28',
  textMute:   isDark ? '#3d5e38'                      : '#8a7750',
  navBg:      isDark ? 'rgba(6,13,6,0.3)'             : 'rgba(250,247,238,0.35)',
  sectionAlt: isDark ? 'rgba(255,255,255,0.025)'      : 'rgba(101,67,33,0.055)',
});

const GREEN_GRAD  = 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #4ade80 100%)';
const GOLD_GRAD   = 'linear-gradient(135deg, #92400e 0%, #ca8a04 60%, #fbbf24 100%)';
const HERO_GRAD = (isDark) => isDark
  ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22,163,74,0.22) 0%, rgba(6,13,6,0) 70%)'
  : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,120,40,0.13) 0%, rgba(250,247,238,0) 70%)';

const FU = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };
const S  = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function InView({ children, id, style }) {
  const ref = useRef(null);
  const ok  = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section id={id} ref={ref} initial="hidden" animate={ok ? 'visible' : 'hidden'} variants={S} style={style}>
      {children}
    </motion.section>
  );
}

/* ─── Smooth wavy divider ─────────────────────────────────── */
function Wave({ fill, flip }) {
  return (
    <div style={{ lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none' }}>
      <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
        <path d="M0,32 C240,60 480,0 720,32 C960,60 1200,0 1440,32 L1440,60 L0,60 Z" fill={fill} />
      </svg>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Landing() {
  const { user }             = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate             = useNavigate();
  const [open, setOpen]      = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const heroRef              = useRef(null);
  const { scrollYProgress }  = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY                = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  const isDark = theme === 'dark';
  const c      = C(isDark);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Landing page is accessible to all users (no auth redirect)
  useEffect(() => {
    const h = () => {
      setScrolled(window.scrollY > 40);
      setScrolledToBottom((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 40);
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', h);
    window.addEventListener('scroll', h);
    h();
    return () => {
      window.removeEventListener('resize', h);
      window.removeEventListener('scroll', h);
    };
  }, []);

  const go = (id) => { setOpen(false); document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }); };

  const WHY = [
    { icon: Clock,      val: t('lp_why_val1'),  label: t('lp_why_label1'),   sub: t('lp_why_sub1') },
    { icon: FileText,   val: t('lp_why_val2'),  label: t('lp_why_label2'),   sub: t('lp_why_sub2') },
    { icon: Sprout,     val: t('lp_why_val3'),  label: t('lp_why_label3'),   sub: t('lp_why_sub3') },
    { icon: TrendingUp, val: t('lp_why_val4'),  label: t('lp_why_label4'),   sub: t('lp_why_sub4') },
  ];

  const FEATURES = [
    { icon: Mic,      label: t('lp_feat1_label'), desc: t('lp_feat1_desc') },
    { icon: Brain,    label: t('lp_feat2_label'), desc: t('lp_feat2_desc') },
    { icon: FileText, label: t('lp_feat3_label'), desc: t('lp_feat3_desc') },
    { icon: BarChart3,label: t('lp_feat4_label'), desc: t('lp_feat4_desc') },
    { icon: Shield,   label: t('lp_feat5_label'), desc: t('lp_feat5_desc') },
    { icon: Globe,    label: t('lp_feat6_label'), desc: t('lp_feat6_desc') },
  ];

  const AUDIENCE = [
    { icon: Wheat,         g: GREEN_GRAD, title: t('lp_aud1_title'), desc: t('lp_aud1_desc') },
    { icon: Users,         g: GOLD_GRAD,  title: t('lp_aud2_title'), desc: t('lp_aud2_desc') },
    { icon: FileText,      g: GREEN_GRAD, title: t('lp_aud3_title'), desc: t('lp_aud3_desc') },
    { icon: HeartHandshake,g: GOLD_GRAD,  title: t('lp_aud4_title'), desc: t('lp_aud4_desc') },
  ];

  const NAV = [
    { label: t('nav_features', 'Features'), id: '#features' },
    { label: t('nav_audience', 'Who We Serve'), id: '#audience' },
    { label: t('nav_tech', 'Technology'), id: '#technology' },
    { label: t('nav_contact', 'Contact'), id: '#contact' },
  ];

  /* ── shared section wrapper ── */
  const sec = (extra = {}) => ({
    padding: '96px max(28px, calc((100vw - 1180px)/2))',
    transition: 'background 0.35s ease',
    ...extra,
  });

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: '"Inter", sans-serif', transition: 'background 0.35s ease, color 0.25s ease' }}>

      {/* ══ Navbar ══ */}
      <LandingNav />

      {/* ══ Hero ══ */}
      <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <motion.div style={{ y: heroY, position: 'absolute', inset: 0, zIndex: 0 }}>
          {!isMobile ? (
            <Plasma 
              color={isDark ? '#16a34a' : '#b47828'} 
              speed={1.2} 
              direction="forward" 
              scale={1.5} 
              opacity={isDark ? 0.35 : 0.15} 
              mouseInteractive={true} 
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: HERO_GRAD(isDark), opacity: 0.8 }} />
          )}
        </motion.div>

        {!isMobile && (
          <div style={{ position: 'absolute', top: '15%', right: '8%', zIndex: 0, opacity: isDark ? 0.4 : 0.6 }}>
            <CircularText 
              text="SMART * SCHEMES * NITI * SETU * " 
              onHover="goBonkers" 
              spinDuration={15} 
            />
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(34,197,94,0.06)' : 'rgba(22,101,52,0.05)'} 1px, transparent 1px)`, backgroundSize: '36px 36px', zIndex: 0, pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'relative', zIndex: 1, maxWidth: '820px', margin: '0 auto', padding: '160px 28px 100px', textAlign: 'center' }}>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(22,163,74,0.12)' : 'rgba(22,101,52,0.08)', border: `1px solid ${c.border}`, borderRadius: '100px', padding: '6px 18px', marginBottom: '32px' }}>
            <Wheat size={13} color={isDark ? '#4ade80' : '#166534'} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#4ade80' : '#166534', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('lp_hero_badge')}</span>
          </motion.div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: '24px', color: c.text }}>
            {t('hero_title_1')}<br />
            <span style={{ background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>{t('hero_title_2')}</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: c.textSec, maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.78 }}>
             {t('hero_subtitle')}
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={user ? "/dashboard/check" : "/check"} style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.05, boxShadow: '0 16px 48px rgba(22,163,74,0.45)' }} whileTap={{ scale: 0.97 }} style={{
                background: GREEN_GRAD, color: '#fff', border: 'none', borderRadius: '14px',
                padding: '14px 32px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
                boxShadow: '0 6px 24px rgba(22,163,74,0.4)', transition: 'box-shadow 0.3s',
              }}>
                {user ? t('lp_go_dashboard') : t('lp_hero_btn_check')} <ArrowRight size={18} />
              </motion.button>
            </Link>
            <button onClick={() => go('#features')} style={{
              background: c.bgCard, color: c.text, border: `1px solid ${c.border}`,
              borderRadius: '14px', padding: '14px 30px', fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = c.borderGlow; e.currentTarget.style.boxShadow = `0 0 0 3px ${isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,101,52,0.06)'}` }}
              onMouseOut={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {t('hero_btn_learn')}
            </button>
          </div>
          
          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.86rem', color: c.textMute }}>Contact:</span>
            <a href="mailto:patil.abhay214@gmail.com" style={{ fontSize: '0.9rem', fontWeight: 600, color: c.text, textDecoration: 'none', transition: 'color 0.2s', borderBottom: `1px dashed ${c.border}` }} onMouseOver={e => e.currentTarget.style.color = '#16a34a'} onMouseOut={e => e.currentTarget.style.color = c.text}>
              patil.abhay214@gmail.com
            </a>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: c.border, borderRadius: '18px', overflow: 'hidden', marginTop: '60px', border: `1px solid ${c.border}` }}>
            {WHY.map(w => (
              <div key={w.val} style={{ background: c.bgCard, padding: '20px 14px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 900, background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.03em' }}>{w.val}</p>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: c.text, marginTop: '2px' }}>{w.label}</p>
                <p style={{ fontSize: '0.72rem', color: c.textMute, marginTop: '3px' }}>{w.sub}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <Wave fill={c.bg2} />

      <InView id="features" style={{ ...sec(), background: c.bg2 }}>
        <motion.div variants={FU}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534' }}>{t('lp_feat_tag')}</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.15, marginTop: '10px', marginBottom: '12px' }}>{t('lp_feat_title')}</h2>
          <p style={{ fontSize: '1rem', color: c.textSec, maxWidth: '560px', lineHeight: 1.75, marginBottom: '48px' }}>{t('lp_feat_desc')}</p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.label} variants={FU}
              whileHover={{ y: -6, borderColor: c.borderGlow, boxShadow: `0 12px 40px ${isDark ? 'rgba(34,197,94,0.1)' : 'rgba(22,101,52,0.08)'}` }}
              style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '26px 22px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: i % 2 === 0 ? 'rgba(22,163,74,0.12)' : 'rgba(202,138,4,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <f.icon size={22} color={i % 2 === 0 ? (isDark ? '#4ade80' : '#166534') : '#ca8a04'} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: c.text, marginBottom: '8px' }}>{f.label}</h3>
              <p style={{ fontSize: '0.87rem', color: c.textSec, lineHeight: 1.68 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </InView>

      <Wave fill={c.bg} flip />

      <InView id="audience" style={{ ...sec(), background: c.bg }}>
        <motion.div variants={FU}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534' }}>{t('lp_aud_tag')}</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.15, marginTop: '10px', marginBottom: '12px' }}>{t('lp_aud_title')}</h2>
          <p style={{ fontSize: '1rem', color: c.textSec, maxWidth: '540px', lineHeight: 1.75, marginBottom: '48px' }}>{t('lp_aud_desc')}</p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {AUDIENCE.map(a => (
            <motion.div key={a.title} variants={FU}
              whileHover={{ y: -5, boxShadow: `0 12px 36px ${isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,101,52,0.06)'}` }}
              style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '26px 22px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: a.g, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                <a.icon size={22} color="white" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: c.text, marginBottom: '8px' }}>{a.title}</h3>
              <p style={{ fontSize: '0.87rem', color: c.textSec, lineHeight: 1.68 }}>{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </InView>

      <Wave fill={isDark ? '#060d06' : '#faf7ee'} />

      <InView id="interactive" style={{ padding: '0', background: isDark ? '#060d06' : '#faf7ee', position: 'relative' }}>
        <div style={{ textAlign: 'center', paddingTop: '80px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534' }}>
            {t('lp_interactive_explore', 'Interactive Exploration')}
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, color: c.text, marginTop: '16px', letterSpacing: '-0.03em' }}>
            {t('lp_fluid_title', 'Experience the Engine')}
          </h2>
        </div>
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
          {!isMobile ? <FluidGlass /> : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, opacity: 0.6 }}>Niti Setu Engine</h3>
            </div>
          )}
        </div>
      </InView>

      <Wave fill={c.bg2} />

      <InView id="technology" style={{ ...sec(), background: c.bg2 }}>
        <motion.div variants={FU}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534' }}>{t('lp_tech_tag')}</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.15, marginTop: '10px', marginBottom: '48px' }}>{t('lp_tech_title')}</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { icon: Cpu,       title: t('lp_tech1_title'), desc: t('lp_tech1_desc') },
            { icon: Lock,      title: t('lp_tech2_title'), desc: t('lp_tech2_desc') },
            { icon: Languages, title: t('lp_tech3_title'), desc: t('lp_tech3_desc') },
            { icon: Brain,     title: t('lp_tech4_title'), desc: t('lp_tech4_desc') },
          ].map(tech => (
            <motion.div key={tech.title} variants={FU} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '22px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <tech.icon size={20} color={isDark ? '#4ade80' : '#166534'} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: c.text, marginBottom: '6px' }}>{tech.title}</h3>
              <p style={{ fontSize: '0.85rem', color: c.textSec, lineHeight: 1.65 }}>{tech.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div variants={FU} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '20px', padding: '28px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {[t('lp_check1'),t('lp_check2'),t('lp_check3'),t('lp_check4'),t('lp_check5'),t('lp_check6'),t('lp_check7'),t('lp_check8')].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={15} color={isDark ? '#4ade80' : '#166534'} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem', color: c.textSec }}>{item}</span>
            </div>
          ))}
        </motion.div>
      </InView>

      <Wave fill={c.bg} flip />

      <InView id="contact" style={{ ...sec({ padding: '80px max(28px, calc((100vw - 820px)/2))' }), background: c.bg }}>
        <motion.div variants={FU} style={{ position: 'relative', borderRadius: '24px', padding: '60px 40px', textAlign: 'center', border: `1px solid ${c.borderGlow}`, boxShadow: isDark ? '0 0 60px rgba(22,163,74,0.06)' : '0 0 60px rgba(22,163,74,0.04)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
             {!isMobile ? (
               <Silk speed={2.5} scale={isDark ? 1.5 : 2} color={isDark ? '#166534' : '#b47828'} noiseIntensity={1.2} style={{ opacity: isDark ? 0.4 : 0.15 }} />
             ) : (
               <div style={{ position: 'absolute', inset: 0, background: isDark ? 'rgba(22,163,74,0.1)' : 'rgba(250,234,188,0.2)' }} />
             )}
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? '#4ade80' : '#166534', display: 'block', marginBottom: '12px' }}>{t('lp_cta_tag')}</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: c.text, lineHeight: 1.12, marginBottom: '16px' }}>{t('lp_cta_title1')}<br />{t('lp_cta_title2')}</h2>
            <p style={{ fontSize: '1rem', color: c.textSec, maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.78 }}>{t('lp_cta_desc')}</p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '44px' }}>
              <Link to="/check" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 14px 40px rgba(22,163,74,0.45)' }} whileTap={{ scale: 0.97 }} style={{ background: GREEN_GRAD, color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 30px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 18px rgba(22,163,74,0.4)' }}>
                  {t('lp_start_free_check')} <ArrowRight size={17} />
                </motion.button>
              </Link>
              <a href="https://github.com/abhay-patil-cse27/agri-scheme-eligibility-rag" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ background: c.bgCard, color: c.text, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '13px 30px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Github size={17} /> {t('lp_view_github')}
                </motion.button>
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: c.bgGlass, border: `1px solid ${c.border}`, borderRadius: '100px', padding: '10px 20px', backdropFilter: 'blur(4px)' }}>
                <MapPin size={15} color={isDark ? '#4ade80' : '#166534'} />
                <span style={{ fontSize: '0.88rem', color: c.textSec, fontWeight: 500 }}>{t('lp_cta_location')}</span>
                <span style={{ color: c.textMute }}>·</span>
                <span style={{ fontSize: '0.83rem', color: c.textMute }}>{t('lp_cta_student')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.86rem', color: c.textMute }}>Contact:</span>
                <a href="mailto:patil.abhay214@gmail.com" style={{ fontSize: '0.9rem', fontWeight: 600, color: c.text, textDecoration: 'none', transition: 'color 0.2s', borderBottom: `1px dashed ${c.border}` }} onMouseOver={e => e.currentTarget.style.color = '#16a34a'} onMouseOut={e => e.currentTarget.style.color = c.text}>
                  patil.abhay214@gmail.com
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </InView>

      <LandingFooter />

      <style>{`
        @media (max-width: 680px) {
          nav > div > div:nth-child(2) { display: none !important; }
          .ns-hamburger { display: flex !important; }
        }
        @media (max-width: 520px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
      <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'fixed', bottom: '28px', left: '28px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {scrolled && (
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="btn-glow flex flex-center" 
            style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowUp size={20} />
          </button>
        )}
        {!scrolledToBottom && (
          <button 
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} 
            style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, background: c.bgCard, color: c.text, border: `1px solid ${c.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseOver={e=>e.currentTarget.style.borderColor='var(--accent-indigo)'}
            onMouseOut={e=>e.currentTarget.style.borderColor=c.border}
          >
            <ArrowDown size={20} />
          </button>
        )}
      </motion.div>
    </div>
  );
}
