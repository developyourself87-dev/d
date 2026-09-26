import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { motion } from 'framer-motion';

// Component for curved text animation
const CurvedText = ({ text, className }) => {
  const characters = text.split('');
  
  return (
    <div className={`relative flex justify-center h-32 md:h-40 mb-4 ${className}`} dir="ltr">
      <div className="relative w-full h-full flex justify-center items-end pb-8">
        {characters.map((char, i) => {
          // Calculate angle for an arc (parabola roughly)
          const middle = characters.length / 2;
          const offset = i - middle + 0.5;
          const angle = offset * 4; // degrees
          const yOffset = Math.abs(offset) * Math.abs(offset) * 1.5; // Parabolic Y offset
          
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 50, rotate: angle }}
              animate={{ opacity: 1, y: yOffset, rotate: angle }}
              transition={{ duration: 0.2, delay: i * 0.01, type: 'spring' }}
              className="inline-block transform origin-bottom"
              style={{
                display: char === ' ' ? 'inline' : 'inline-block',
                width: char === ' ' ? '0.5em' : 'auto'
              }}
            >
              {char}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
};

const Home = () => {
  const { t, i18n } = useTranslation();
  const [trainer, setTrainer] = useState(null);
  const [works, setWorks] = useState([]);
  const [comments, setComments] = useState([]);
  
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState(null);
  const [commentData, setCommentData] = useState({ name: '', email: '', comment: '', rating: 5 });
  const [commentStatus, setCommentStatus] = useState(null);

  const getTranslated = (obj, field) => {
    if (!obj) return '';
    const lang = i18n.language;
    if (lang === 'ar' || !obj.translations || !obj.translations[lang]) return obj[field] || '';
    return obj.translations[lang][field] || obj[field] || '';
  };

  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const [{ data: trainerData }, { data: worksData }, { data: commentsData }, { data: settingsData }] = await Promise.all([
        supabase.from('trainer_profile').select('*').single(),
        supabase.from('works').select('*').eq('is_visible', true).order('sort_order'),
        supabase.from('comments').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(6),
        supabase.from('site_settings').select('*').single()
      ]);
      if (trainerData) setTrainer(trainerData);
      if (worksData) setWorks(worksData);
      if (commentsData) setComments(commentsData);
      if (settingsData) setSiteSettings(settingsData);
    }
    fetchData();
  }, []);

  const getClipPath = (shape) => {
    switch (shape) {
      case 'square': return 'none';
      case 'rounded': return 'inset(0 round 24px)';
      case 'hexagon': return 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      case 'circle':
      default: return 'circle(50% at 50% 50%)';
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('loading');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      if (!response.ok) throw new Error();
      setContactStatus('success');
      setContactData({ name: '', email: '', message: '' });
    } catch {
      setContactStatus('error');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setCommentStatus('loading');
    try {
      const { error } = await supabase.from('comments').insert([
        { ...commentData, status: 'pending' }
      ]);
      if (error) throw error;
      
      await supabase.from('notifications').insert([{
        type: 'new_comment',
        title: 'تعليق جديد',
        message: `تعليق جديد من ${commentData.name}`
      }]).catch(() => {});

      setCommentStatus('success');
      setCommentData({ name: '', email: '', comment: '', rating: 5 });
    } catch {
      setCommentStatus('error');
    }
  };

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* ═══════ HERO / TRAINER SECTION ═══════ */}
      <section className="video-overlay min-h-[90vh] flex items-center relative overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-70">
          <source src="https://cdn.pixabay.com/video/2020/08/09/46906-449623346_large.mp4" type="video/mp4" />
        </video>
        
        <div className="container mx-auto px-4 relative z-10 py-20 flex flex-col items-center">
          
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-8"
          >
            {trainer?.image_url ? (
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-700"></div>
                <img src={trainer.image_url} alt={trainer?.name} className="relative rounded-full w-40 h-40 md:w-56 md:h-56 object-cover border-4 border-dark-border shadow-2xl" />
              </div>
            ) : (
              <div className="rounded-full w-40 h-40 md:w-56 md:h-56 bg-dark-surface flex items-center justify-center text-text-subtle border-4 border-dark-border shadow-2xl relative z-10">صورة</div>
            )}
          </motion.div>

          <CurvedText text={getTranslated(trainer, 'name') || 'اسم المدربة'} className="text-4xl md:text-6xl lg:text-7xl font-black text-text-main drop-shadow-lg" />
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
            className="text-xl md:text-2xl gradient-text font-bold tracking-widest mb-16 text-center"
          >
            {getTranslated(trainer, 'professional_title') || 'الصفة المهنية'}
          </motion.h2>

          {/* Asymmetrical Layout for Bio/Experience/Qualifications */}
          <div className="w-full max-w-6xl relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            
            <motion.div 
              initial={{ opacity: 0, x: 50, rotate: 5 }} 
              whileInView={{ opacity: 1, x: 0, rotate: -2 }} 
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="md:w-1/2 glass-card p-6 md:p-8 rounded-3xl glow-border relative z-10"
            >
              <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-widest">نبذة شخصية</h3>
              <p className="text-text-muted text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {getTranslated(trainer, 'bio') || 'نبذة مختصرة تظهر هنا...'}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -50, rotate: -5 }} 
              whileInView={{ opacity: 1, x: 0, rotate: 3 }} 
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="md:w-1/2 flex flex-col gap-6"
            >
              {getTranslated(trainer, 'experience') && (
                <div className="glass-card p-6 rounded-3xl glow-border shadow-lg">
                  <h3 className="text-sm font-bold text-secondary mb-2 uppercase tracking-widest">الخبرات</h3>
                  <p className="whitespace-pre-wrap text-text-muted text-sm leading-relaxed">{getTranslated(trainer, 'experience')}</p>
                </div>
              )}
              {getTranslated(trainer, 'qualifications') && (
                <div className="glass-card p-6 rounded-3xl glow-border shadow-lg ml-0 md:-ml-12">
                  <h3 className="text-sm font-bold text-secondary mb-2 uppercase tracking-widest">المؤهلات</h3>
                  <p className="whitespace-pre-wrap text-text-muted text-sm leading-relaxed">{getTranslated(trainer, 'qualifications')}</p>
                </div>
              )}
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* ═══════ ACHIEVEMENTS / WORKS SECTION ═══════ */}
      <section className="py-20 md:py-32 relative neon-grid">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: false }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black gradient-text mb-4">{t('works')}</h2>
            <p className="text-text-subtle text-sm md:text-base uppercase tracking-widest">إنجازات ومشاريع بارزة</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {works.map((work) => (
              <motion.div key={work.id} variants={fadeUp} className="glass-card rounded-3xl overflow-hidden glow-border group hover:-translate-y-2 transition-all duration-500">
                {work.image_url && (
                  <div className="overflow-hidden relative h-56">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <img src={work.image_url} alt={work.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    {work.achievement_date && (
                      <span className="absolute bottom-4 left-4 z-20 text-xs font-bold text-primary px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-primary/30">
                        {new Date(work.achievement_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-xl font-bold text-text-main mb-3">{work.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed line-clamp-3">{work.description}</p>
                </div>
              </motion.div>
            ))}
            {works.length === 0 && (
              <div className="col-span-full text-center text-text-subtle py-10">لا توجد إنجازات مضافة حالياً.</div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS / COMMENTS SECTION ═══════ */}
      <section className="py-20 md:py-32 bg-dark-surface border-y border-dark-border">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: false }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black gradient-text mb-4">{t('comments')}</h2>
            <p className="text-text-subtle text-sm md:text-base uppercase tracking-widest">آراء المشاركين وتجاربهم</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          >
            {comments.map((comment) => (
              <motion.div key={comment.id} variants={fadeUp} className="glass-card p-8 rounded-3xl glow-border flex flex-col justify-between">
                <div>
                  <div className="flex text-primary mb-6 text-xl">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < (comment.rating || 5) ? 'text-primary' : 'text-text-subtle opacity-30'}>★</span>
                    ))}
                  </div>
                  <p className="text-text-muted mb-6 text-sm leading-relaxed italic">"{comment.comment}"</p>
                </div>
                <div className="font-bold text-text-main text-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-xs">{comment.name.charAt(0)}</div>
                  {comment.name}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Add Comment Form */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: false }} variants={fadeUp} className="max-w-2xl mx-auto glass-card p-8 md:p-10 rounded-3xl glow-border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
            <h3 className="text-2xl font-bold mb-8 text-center text-text-main">أضف رأيك</h3>
            {commentStatus === 'success' ? (
              <div className="bg-primary/10 text-primary p-6 rounded-2xl text-center border border-primary/20 font-bold">شكراً لك! تم إرسال تعليقك وسيظهر بعد المراجعة.</div>
            ) : (
              <form onSubmit={handleCommentSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="الاسم الكامل" required value={commentData.name} onChange={e => setCommentData({...commentData, name: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" />
                  <input type="email" placeholder="البريد الإلكتروني" required value={commentData.email} onChange={e => setCommentData({...commentData, email: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" dir="ltr" />
                </div>
                <div className="glass-card p-4 rounded-xl border border-dark-border flex items-center gap-4">
                  <label className="text-sm font-bold text-text-muted">التقييم:</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button type="button" key={star} onClick={() => setCommentData({...commentData, rating: star})} className={`text-3xl transition-transform hover:scale-110 ${commentData.rating >= star ? 'text-primary drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]' : 'text-text-subtle opacity-40'}`}>★</button>
                    ))}
                  </div>
                </div>
                <textarea placeholder="ما هو رأيك..." required value={commentData.comment} onChange={e => setCommentData({...commentData, comment: e.target.value})} className="w-full neon-input p-4 rounded-xl h-32 text-sm resize-none"></textarea>
                <button type="submit" disabled={commentStatus === 'loading'} className="w-full neon-btn py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  {commentStatus === 'loading' ? t('loading') : (
                    <>{t('submit')} <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════ CONTACT SECTION ═══════ */}
      <section id="contact" className="py-20 md:py-32 neon-grid">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: false }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black gradient-text mb-4">{t('contact')}</h2>
            <p className="text-text-subtle text-sm md:text-base uppercase tracking-widest">تواصل معنا مباشرة</p>
          </motion.div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: false }} variants={fadeUp}>
            {contactStatus === 'success' ? (
              <div className="bg-primary/10 text-primary p-8 rounded-3xl text-center text-lg border border-primary/20 glow-border font-bold">تم إرسال رسالتك بنجاح! سنقوم بالرد عليك قريباً.</div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6 glass-card p-8 md:p-12 rounded-3xl glow-border">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">الاسم</label>
                    <input type="text" required value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">البريد الإلكتروني</label>
                    <input type="email" required value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">الرسالة</label>
                  <textarea required value={contactData.message} onChange={e => setContactData({...contactData, message: e.target.value})} className="w-full neon-input p-4 rounded-xl h-40 text-sm resize-none"></textarea>
                </div>
                <button type="submit" disabled={contactStatus === 'loading'} className="w-full md:w-auto md:px-12 neon-btn py-4 rounded-xl text-sm font-bold mx-auto block mt-8">
                  {contactStatus === 'loading' ? t('loading') : 'إرسال الرسالة'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
