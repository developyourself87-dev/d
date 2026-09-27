import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';

// Use basic react-icons
import { FiMenu as MenuIcon, FiX as XIcon, FiSun as SunIcon, FiMoon as MoonIcon, FiFacebook as FacebookIcon, FiYoutube as YoutubeIcon, FiMail as MailIcon, FiPhone as PhoneIcon } from 'react-icons/fi';
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [siteSettings, setSiteSettings] = useState(null);

  // Theme State
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light' || false;
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  const [trainer, setTrainer] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const [{ data: settingsData }, { data: trainerData }] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('trainer_profile').select('image_url').single()
      ]);
      if (settingsData) setSiteSettings(settingsData);
      if (trainerData) setTrainer(trainerData);
    }
    fetchData();
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsMobileMenuOpen(false);
  };

  const getTranslated = (obj, field) => {
    if (!obj) return '';
    const lang = i18n.language;
    if (lang === 'ar' || !obj.translations || !obj.translations[lang]) return obj[field] || '';
    return obj.translations[lang][field] || obj[field] || '';
  };

  const languages = [
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  const getClipPath = (shape) => {
    switch (shape) {
      case 'square': return 'none';
      case 'rounded': return 'inset(0 round 16px)';
      case 'hexagon': return 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      case 'circle':
      default: return 'circle(50% at 50% 50%)';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Dynamic Theme Color Injection */}
      {siteSettings?.primary_color && (
        <style>{`
          :root {
            --grad-1: ${siteSettings.primary_color};
            --glow-border: ${siteSettings.primary_color}80;
            --glow-shadow: ${siteSettings.primary_color}33;
            --glow-hover-border: ${siteSettings.primary_color};
            --glow-hover-shadow: ${siteSettings.primary_color}99;
            --input-focus: ${siteSettings.primary_color};
            --grid-color: ${siteSettings.primary_color}1A;
          }
        `}</style>
      )}

      {/* HEADER / NAVBAR */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass-nav sticky top-0 z-50 shadow-md"
      >
        <div className="absolute inset-0 neon-grid opacity-30 pointer-events-none"></div>
        <div className="container mx-auto px-4 py-4 relative z-10">
          <div className="flex justify-between items-center">
            
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
              <Link to="/" className="flex items-center gap-3 group">
                {trainer?.image_url ? (
                  <div className="h-10 w-10 md:h-12 md:w-12 drop-shadow-[0_0_10px_var(--grad-1)] group-hover:drop-shadow-[0_0_15px_var(--grad-1)] transition-all">
                    <img 
                      src={trainer.image_url} 
                      alt="Logo" 
                      className="w-full h-full object-cover" 
                      style={{ clipPath: getClipPath(siteSettings?.profile_shape) }} 
                    />
                  </div>
                ) : (
                <div className="h-10 w-10 md:h-12 md:w-12 bg-primary rounded-full drop-shadow-[0_0_10px_var(--grad-1)]"></div>
              )}
              <span className="text-xl md:text-2xl font-black gradient-text tracking-tight group-hover:drop-shadow-[0_0_10px_var(--grad-1)] transition-all">
                {getTranslated(siteSettings, 'site_title') || 'دروب التمكين'}
              </span>
            </Link>
            </motion.div>

            <motion.nav 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}
              className="hidden md:flex items-center gap-8"
            >
              <div className="flex gap-6 items-center border-r border-dark-border pr-8 mr-2">
                <Link to="/" className={`hover:text-primary transition-all duration-300 text-sm font-bold tracking-wide ${location.pathname === '/' ? 'text-primary' : 'text-text-muted'}`}>{t('home')}</Link>
                <Link to="/courses" className={`hover:text-primary transition-all duration-300 text-sm font-bold tracking-wide ${location.pathname.includes('/courses') ? 'text-primary' : 'text-text-muted'}`}>{t('courses')}</Link>
                <a href="/#contact" className="text-text-muted hover:text-primary transition-all duration-300 text-sm font-bold tracking-wide">{t('contact')}</a>
              </div>
              
              <div className="flex items-center gap-4">
                <button onClick={() => setIsLightMode(!isLightMode)} className="text-text-muted hover:text-primary transition-colors focus:outline-none bg-btn-surface p-2 rounded-full border border-dark-border hover:border-primary/50 shadow-sm">
                  {isLightMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                </button>
                
                <div className="flex gap-2 bg-btn-surface p-1 rounded-xl border border-dark-border">
                  {languages.map(lng => (
                    <button key={lng.code} onClick={() => changeLanguage(lng.code)} className={`text-xs uppercase px-3 py-1.5 rounded-lg transition-all duration-300 font-bold ${i18n.language === lng.code ? 'text-white bg-primary shadow-md' : 'text-text-subtle hover:text-primary hover:bg-dark-border/50'}`}>
                      {lng.code}
                    </button>
                  ))}
                </div>
              </div>
            </motion.nav>

            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="md:hidden text-text-main p-2 hover:bg-dark-surface rounded-xl transition-colors border border-transparent hover:border-dark-border" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden glass-card border-t border-dark-border absolute w-full left-0 right-0 z-40 overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2 border-b border-dark-border pb-4 mb-2">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-text-main hover:text-primary hover:bg-btn-surface rounded-xl px-4 py-3 font-bold transition-all border border-transparent hover:border-dark-border">{t('home')}</Link>
                  <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-text-main hover:text-primary hover:bg-btn-surface rounded-xl px-4 py-3 font-bold transition-all border border-transparent hover:border-dark-border">{t('courses')}</Link>
                  <a href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-text-main hover:text-primary hover:bg-btn-surface rounded-xl px-4 py-3 font-bold transition-all border border-transparent hover:border-dark-border">{t('contact')}</a>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2 bg-btn-surface p-1 rounded-xl border border-dark-border">
                    <button onClick={() => { changeLanguage('ar'); setIsMobileMenuOpen(false); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${i18n.language === 'ar' ? 'bg-gradient-to-r from-primary to-secondary text-btn-text shadow-md' : 'text-text-subtle hover:text-primary hover:bg-dark-border/50'}`}>AR</button>
                    <button onClick={() => { changeLanguage('en'); setIsMobileMenuOpen(false); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${i18n.language === 'en' ? 'bg-gradient-to-r from-primary to-secondary text-btn-text shadow-md' : 'text-text-subtle hover:text-primary hover:bg-dark-border/50'}`}>EN</button>
                  </div>
                  
                  <button onClick={() => { setIsLightMode(!isLightMode); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 text-text-muted hover:text-primary p-2 bg-btn-surface rounded-xl border border-dark-border px-4 transition-colors hover:border-primary/50 shadow-sm">
                    {isLightMode ? <><SunIcon size={18} /> فاتح</> : <><MoonIcon size={18} /> داكن</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="flex-grow relative z-0">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-dark-surface neon-grid text-text-muted pt-16 pb-8 border-t border-dark-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                {trainer?.image_url ? (
                  <img src={trainer.image_url} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-cover drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]" style={{ clipPath: siteSettings?.profile_shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : siteSettings?.profile_shape === 'square' ? 'inset(0)' : 'circle(50% at 50% 50%)' }} />
                ) : (
                  <svg className="w-8 h-8 drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15 L85 35 L85 75 L50 95 L15 75 L15 35 Z" stroke="url(#gradLogoFooter)" strokeWidth="6" fill="var(--glass-bg)"/>
                    {!isLightMode && <circle cx="50" cy="50" r="3.5" fill="url(#gradLogoFooter)" />}
                    <defs>
                      <linearGradient id="gradLogoFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--grad-1)" />
                        <stop offset="100%" stopColor="var(--grad-2)" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
                <h3 className="text-2xl font-black gradient-text tracking-tight">{getTranslated(siteSettings, 'site_title') || 'دروب التمكين'}</h3>
              </div>
              <p className="text-sm text-text-subtle leading-relaxed mb-6 max-w-sm whitespace-pre-wrap">
                {getTranslated(siteSettings, 'footer_text') || 'منصة رقمية متطورة للتدريب والتطوير وتنمية المهارات الشخصية والمهنية بأحدث المعايير العالمية.'}
              </p>
              <div className="flex gap-4">
                {siteSettings?.facebook_url && <a href={siteSettings.facebook_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center text-text-subtle hover:text-primary hover:border-primary/50 transition-all shadow-sm"><FacebookIcon size={18} /></a>}
                {siteSettings?.instagram_url && <a href={siteSettings.instagram_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center text-text-subtle hover:text-[#E1306C] hover:border-[#E1306C]/50 transition-all shadow-sm"><FaInstagram size={18} /></a>}
                {siteSettings?.telegram_url && <a href={siteSettings.telegram_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center text-text-subtle hover:text-[#0088cc] hover:border-[#0088cc]/50 transition-all shadow-sm"><FaTelegramPlane size={18} /></a>}
                {siteSettings?.whatsapp && <a href={`https://wa.me/${String(siteSettings.whatsapp).replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center text-text-subtle hover:text-[#25D366] hover:border-[#25D366]/50 transition-all shadow-sm"><FaWhatsapp size={18} /></a>}
                {siteSettings?.youtube_url && <a href={siteSettings.youtube_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center text-text-subtle hover:text-red-500 hover:border-red-500/50 transition-all shadow-sm"><YoutubeIcon size={18} /></a>}
              </div>
            </div>
            
            <div className="md:pl-12">
              <h3 className="text-sm font-bold text-text-main mb-6 uppercase tracking-widest">{t('sitemap', 'خريطة الموقع')}</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to="/" className="text-text-muted hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span> {t('home')}</Link></li>
                <li><Link to="/courses" className="text-text-muted hover:text-primary transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span> {t('courses')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-text-main mb-6 uppercase tracking-widest">{t('contact', 'تواصل معنا')}</h3>
              <ul className="space-y-5 text-sm font-medium" dir="ltr">
                {siteSettings?.email && (
                  <li className="flex items-center gap-4 justify-end group">
                    <a href={`mailto:${siteSettings.email}`} className="text-text-muted group-hover:text-primary transition-colors">{siteSettings.email}</a> 
                    <div className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center text-primary shadow-sm"><MailIcon size={16} /></div>
                  </li>
                )}
                {siteSettings?.phone && (
                  <li className="flex items-center gap-4 justify-end group">
                    <a href={`tel:${siteSettings.phone}`} className="text-text-muted group-hover:text-primary transition-colors">{siteSettings.phone}</a> 
                    <div className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center text-primary shadow-sm"><PhoneIcon size={16} /></div>
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-dark-border flex justify-center items-center gap-4">
            <div className="text-xs font-bold text-text-subtle tracking-widest">
              &copy; {new Date().getFullYear()} laissaoui_dev_dz
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
