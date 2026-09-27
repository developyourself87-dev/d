import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const RegistrationModal = ({ course, onClose }) => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', privacyConsent: false });
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchQuestions() {
      const { data } = await supabase
        .from('registration_questions')
        .select('*, question_options(*)')
        .eq('course_id', course.id)
        .order('sort_order');
      if (data) setQuestions(data);
    }
    fetchQuestions();
  }, [course.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.privacyConsent) {
      setError(t('error_privacy', 'يجب الموافقة على سياسة الخصوصية'));
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const regId = crypto.randomUUID();
      const { error: regErr } = await supabase.from('registrations').insert([{
        id: regId,
        course_id: course.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        privacy_consent: formData.privacyConsent
      }]);
      if (regErr) throw new Error("فشل في حفظ البيانات: " + regErr.message);

      const answerRecords = Object.entries(answers).map(([qId, val]) => ({
        registration_id: regId,
        question_id: qId,
        answer_text: val
      }));

      if (answerRecords.length > 0) {
        const { error: ansErr } = await supabase.from('registration_answers').insert(answerRecords);
        if (ansErr) throw new Error("فشل في حفظ بعض الإجابات.");
      }

      try {
        if (import.meta.env.VITE_API_URL) {
          fetch(`${import.meta.env.VITE_API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: course.id, ...formData, answers })
          }).catch(e => console.log("Backend offline, WhatsApp skipped.", e));
        }
      } catch(e) {}

      setSuccess(true);
      setTimeout(() => { 
        if (course.redirect_url && course.redirect_url.trim() !== '') {
          try {
            new URL(course.redirect_url);
            window.location.href = course.redirect_url;
            return;
          } catch (e) {
            console.error("Invalid redirect URL", e);
          }
        }
        onClose(); 
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } }
  };
  
  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0, y: 50 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 500 } },
    exit: { scale: 0.9, opacity: 0, transition: { duration: 0.1 } }
  };

  const modalContent = (
    <AnimatePresence>
      {success ? (
        <motion.div 
          key="success"
          variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
          className="fixed inset-0 bg-dark/95 backdrop-blur-3xl flex items-center justify-center z-[99999] p-4 md:p-8"
        >
          <motion.div variants={modalVariants} className="glass-card rounded-3xl p-10 max-w-md w-full text-center glow-border shadow-2xl">
            <div className="text-7xl text-primary mb-6 drop-shadow-[0_0_15px_rgba(0,242,254,0.5)]">✓</div>
            <h2 className="text-3xl font-black text-text-main mb-4">{t('reg_success_title', 'تم التسجيل بنجاح!')}</h2>
            <p className="text-text-muted mb-6 leading-relaxed">{t('thanks_reg', 'شكراً لتسجيلك في دورة ')} <br/><span className="text-primary font-bold">"{course.title}"</span><br/> تم حفظ بياناتك بنجاح.</p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          key="form"
          variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
          className="fixed inset-0 bg-dark/95 backdrop-blur-3xl flex items-center justify-center z-[99999] p-4 md:p-8"
        >
          <motion.div variants={modalVariants} exit="exit" className="glass-card rounded-3xl max-w-2xl w-full relative glow-border shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary z-10"></div>
            <button onClick={onClose} className="absolute top-5 left-5 text-text-subtle hover:text-primary text-3xl font-bold transition-transform hover:scale-110 hover:rotate-90 z-20">&times;</button>
            
            <div className="p-6 md:p-8 flex-shrink-0 border-b border-dark-border bg-dark-surface/50 z-10">
              <h2 className="text-xl md:text-2xl font-black text-text-main mb-2">{t('reg_in', 'التسجيل في:')} <br className="md:hidden"/><span className="gradient-text">{course.title}</span></h2>
              <p className="text-text-muted text-xs md:text-sm">الرجاء إدخال بياناتك بدقة لإتمام عملية التسجيل.</p>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto flex-grow custom-scrollbar">
              {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 font-bold border border-red-500/20 text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 glass-card p-5 rounded-2xl border border-dark-border shadow-inner">
                  <div className="col-span-full">
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">{t('full_name', 'الاسم الكامل')} <span className="text-primary">*</span></label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full neon-input p-3 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">{t('phone', 'رقم الهاتف')} <span className="text-primary">*</span></label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full neon-input p-3 rounded-xl text-sm" dir="ltr" placeholder="+966 5X XXX XXXX" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">{t('email', 'البريد الإلكتروني')} <span className="text-primary">*</span></label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full neon-input p-3 rounded-xl text-sm" dir="ltr" />
                  </div>
                </div>

                {/* Dynamic Questions */}
                {questions.length > 0 && (
                   <div className="space-y-5 bg-dark-surface/30 p-5 rounded-2xl border border-dark-border">
                     <h3 className="font-bold text-sm gradient-text border-b border-dark-border pb-3 uppercase tracking-widest">{t('extra_questions', 'أسئلة إضافية')}</h3>
                     {questions.map(q => (
                       <div key={q.id}>
                         <label className="block text-xs font-bold text-text-main mb-2">
                           {q.question_text} {q.is_required && <span className="text-primary">*</span>}
                         </label>
                         
                         {q.question_type === 'short_text' && (
                           <input type="text" required={q.is_required} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full neon-input p-3 rounded-xl text-sm" />
                         )}
                         
                         {q.question_type === 'single_choice' && (
                           <select required={q.is_required} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full neon-input p-3 rounded-xl text-sm appearance-none bg-no-repeat bg-right" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300F2FE'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'left 1rem center', backgroundSize: '1.2em 1.2em', paddingLeft: '2.5rem'}}>
                             <option value="">{t('choose_answer', 'اختر إجابة...')}</option>
                             {q.question_options?.sort((a,b)=>a.sort_order - b.sort_order).map(opt => (
                               <option key={opt.id} value={opt.option_text}>{opt.option_text}</option>
                             ))}
                           </select>
                         )}
                       </div>
                     ))}
                   </div>
                )}

                <div className="pt-4 border-t border-dark-border mt-4">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" required checked={formData.privacyConsent} onChange={e => setFormData({...formData, privacyConsent: e.target.checked})} className="peer w-5 h-5 appearance-none border-2 border-dark-border rounded-lg checked:border-primary checked:bg-primary transition-all cursor-pointer" />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span className="text-xs font-medium text-text-muted group-hover:text-text-main transition-colors">{t('privacyConsent')}</span>
                  </label>
                </div>

                <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4">
                  <button type="button" onClick={onClose} className="px-6 py-3 border border-dark-border rounded-xl text-text-muted hover:text-text-main hover:border-text-subtle transition-all text-sm font-bold tracking-widest uppercase">{t('cancel', 'إلغاء')}</button>
                  <button type="submit" disabled={loading} className="px-10 py-3 neon-btn rounded-xl disabled:opacity-50 text-sm font-bold tracking-widest uppercase shadow-lg">
                    {loading ? t('loading') : t('submit')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default RegistrationModal;
