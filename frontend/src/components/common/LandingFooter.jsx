import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const GREEN_GRAD = 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #4ade80 100%)';

const C = (isDark) => ({
  bg:         isDark ? '#060d06'                      : '#faf7ee',
  border:     isDark ? 'rgba(34,197,94,0.12)'         : 'rgba(101,67,33,0.18)',
  text:       isDark ? '#e8f5e0'                      : '#1a2a0e',
  textMute:   isDark ? '#3d5e38'                      : '#8a7750',
});

export default function LandingFooter() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const c = C(isDark);

  const NAV = [
    { label: t('nav_features', 'Features'), id: '/#features' },
    { label: t('nav_audience', 'Who We Serve'), id: '/#audience' },
    { label: t('nav_tech', 'Technology'), id: '/#technology' },
    { label: t('nav_contact', 'Contact'), id: 'mailto:patil.abhay214@gmail.com' },
  ];

  return (
    <footer style={{ borderTop: `1px solid ${c.border}`, background: isDark ? '#060d06' : '#ede6d0', padding: '36px 30px 28px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', marginBottom: '28px' }}>
        <div style={{ maxWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: GREEN_GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sprout size={15} color="white" />
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              <span style={{ background: GREEN_GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Niti</span>
              <span style={{ color: c.text }}>Setu</span>
            </span>
          </div>
          <p style={{ fontSize: '0.83rem', color: c.textMute, lineHeight: 1.65 }}>{t('lp_footer_desc')}</p>
        </div>

        <div style={{ display: 'flex', gap: '44px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>{t('lp_footer_navigate')}</p>
            {NAV.map(n => (
              <a key={n.id} href={n.id} style={{ display: 'block', textDecoration: 'none', fontSize: '0.86rem', color: c.textMute, padding: '4px 0', textAlign: 'left', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = c.text} onMouseOut={e => e.currentTarget.style.color = c.textMute}>{n.label}</a>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>{t('lp_footer_portal')}</p>
            {(user 
              ? [[t('lp_go_dashboard', 'Go to Dashboard →'), '/dashboard']] 
              : [[t('btn_free_check', 'Free Check'), '/check'], [t('btn_signin', 'Sign In'), '/login'], [t('btn_register', 'Register'), '/register']]
            ).map(([l, to]) => (
              <Link key={l} to={to} style={{ display: 'block', fontSize: '0.86rem', color: c.textMute, padding: '4px 0', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = c.text}
                onMouseOut={e => e.currentTarget.style.color = c.textMute}
              >{l}</Link>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Legal & Resources</p>
            {[["FAQ", '/faq'], ["Privacy Policy", '/privacy']].map(([l, to]) => (
              <Link key={l} to={to} style={{ display: 'block', fontSize: '0.86rem', color: c.textMute, padding: '4px 0', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = c.text}
                onMouseOut={e => e.currentTarget.style.color = c.textMute}
              >{l}</Link>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Contact Us</p>
            <a href="mailto:patil.abhay214@gmail.com" style={{ display: 'block', textDecoration: 'none', fontSize: '0.86rem', color: c.textMute, padding: '4px 0', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = c.text} onMouseOut={e => e.currentTarget.style.color = c.textMute}>
              patil.abhay214@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1180px', margin: '0 auto', borderTop: `1px solid ${c.border}`, paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ fontSize: '0.78rem', color: c.textMute }}>{t('lp_footer_copyright', '© 2026 Niti Setu. All rights reserved.')}</p>
        <p style={{ fontSize: '0.78rem', color: c.textMute }}>{t('lp_footer_made', 'Empowering rural citizens.')}</p>
      </div>
    </footer>
  );
}
