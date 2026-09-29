import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { motion } from 'framer-motion';

const SurveyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function loadSurvey() {
      try {
        const { data: sData, error: sErr } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', id)
          .eq('is_visible', true)
          .single();

        if (sErr || !sData) throw new Error('الاستبيان غير موجود أو غير متاح حالياً.');
        setSurvey(sData);

        const { data: qData } = await supabase
          .from('survey_questions')
          .select('*, survey_question_options(*)')
          .eq('survey_id', id)
          .order('sort_order');
        setQuestions(qData || []);
        
        // Record page view
        supabase.from('page_views').insert([{ page_type: 'survey', page_id: id }]).then();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSurvey();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const subId = crypto.randomUUID();
      const { error: subErr } = await supabase
        .from('survey_submissions')
        .insert([{ 
          id: subId, 
          survey_id: id, 
          name: formData.name, 
          email: formData.email, 
          phone: formData.phone 
        }]);

      if (subErr) {
        console.error("Submission Error:", subErr);
        throw new Error("فشل حفظ البيانات الأساسية. " + subErr.message);
      }

      const answerRecords = Object.entries(answers).map(([qId, val]) => ({
        submission_id: subId,
        question_id: qId,
        answer_text: val
      }));

      if (answerRecords.length > 0) {
        const { error: ansErr } = await supabase.from('survey_answers').insert(answerRecords);
        if (ansErr) {
          console.error("Answers Error:", ansErr);
          throw new Error("فشل حفظ بعض الإجابات المخصصة.");
        }
      }
      
      if (survey.redirect_url) {
        setIsRedirecting(true);
        window.location.href = survey.redirect_url;
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      alert("حدث خطأ أثناء الإرسال: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getClipPath = (shape) => {
    switch (shape) {
      case 'circle': return 'circle(50% at 50% 50%)';
      case 'triangle': return 'polygon(50% 0%, 0% 100%, 100% 100%)';
      case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      default: return 'none';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center neon-grid"><div className="w-12 h-12 rounded-full border-4 border-dark-border border-t-primary animate-spin"></div></div>;
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4 neon-grid">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-10 rounded-3xl glow-border text-center max-w-md w-full shadow-2xl">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-xl font-bold text-text-main mb-6 leading-relaxed">{error}</h1>
        <Link to="/" className="neon-btn py-3 px-8 rounded-xl font-bold uppercase tracking-widest block">العودة للرئيسية</Link>
      </motion.div>
    </div>
  );
  
  if (isRedirecting) return (
    <div className="min-h-screen flex items-center justify-center p-4 neon-grid">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="glass-card p-10 rounded-3xl glow-border text-center max-w-md w-full shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-dark-border border-t-primary animate-spin"></div>
        </div>
        <h1 className="text-3xl font-black text-text-main mb-4">جاري التوجيه...</h1>
        <p className="text-text-muted mb-4 leading-relaxed font-bold text-red-400">الرجاء الانتظار وعدم إغلاق الصفحة، جاري توجيهك للمرحلة التالية.</p>
      </motion.div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4 neon-grid">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="glass-card p-10 rounded-3xl glow-border text-center max-w-md w-full shadow-2xl">
        <div className="text-7xl text-primary mb-6 drop-shadow-[0_0_15px_rgba(0,242,254,0.5)]">✓</div>
        <h1 className="text-3xl font-black text-text-main mb-4">تم الإرسال بنجاح!</h1>
        <p className="text-text-muted mb-8 leading-relaxed">شكراً لوقتك في تعبئة هذا الاستبيان. نقدر لك مساهمتك.</p>
        <Link to="/" className="w-full block neon-btn py-4 rounded-xl font-bold tracking-widest uppercase">العودة للرئيسية</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen py-12 md:py-20 px-4 flex flex-col items-center neon-grid" dir="rtl">
      
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-3xl">
        
        {survey.image_url && (
          <div className={`mb-8 ${survey.image_layout === 'full' ? 'w-full max-w-4xl' : 'w-56 h-56 md:w-64 md:h-64'} mx-auto flex justify-center relative group`}>
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>
            <div 
              style={{ 
                backgroundColor: survey.image_border_enabled ? survey.image_border_color : 'transparent',
                padding: survey.image_border_enabled ? '8px' : '0',
                clipPath: getClipPath(survey.image_shape)
              }} 
              className={`${survey.image_layout === 'full' ? 'w-full' : 'w-full h-full relative z-10'}`}
            >
              <img 
                src={survey.image_url} 
                alt={survey.title} 
                className="w-full h-full object-cover shadow-2xl"
                style={{ clipPath: getClipPath(survey.image_shape) }}
              />
            </div>
          </div>
        )}

        <div className="glass-card p-6 md:p-10 rounded-3xl glow-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
          
          <h1 className="text-2xl md:text-3xl font-black text-text-main mb-3 mt-2">{survey.title}</h1>
          {survey.description && <p className="text-text-muted text-sm md:text-base leading-relaxed mb-8 pb-6 border-b border-dark-border">{survey.description}</p>}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="glass-card p-6 rounded-2xl border border-dark-border shadow-inner space-y-5 bg-dark-surface/50">
              <h2 className="text-sm font-bold gradient-text uppercase tracking-widest border-b border-dark-border pb-3">المعلومات الأساسية</h2>
              <div>
                <label className="block font-bold mb-2 text-text-muted text-xs uppercase tracking-widest">الاسم الكامل <span className="text-primary">*</span></label>
                <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" placeholder="أدخل اسمك" />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-bold mb-2 text-text-muted text-xs uppercase tracking-widest">البريد الإلكتروني</label>
                  <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block font-bold mb-2 text-text-muted text-xs uppercase tracking-widest">رقم الهاتف</label>
                  <input type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" dir="ltr" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((q, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  key={q.id} 
                  className="p-6 rounded-2xl border border-dark-border bg-dark-surface/30 shadow-sm hover:border-primary/30 transition-colors"
                >
                  <label className="block text-sm font-bold text-text-main mb-4">
                    {q.question_text} {q.is_required && <span className="text-primary">*</span>}
                  </label>

                  {q.question_type === 'short_text' && (
                    <input type="text" required={q.is_required} onChange={e=>setAnswers({...answers, [q.id]: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" placeholder="إجابتك..." />
                  )}
                  
                  {q.question_type === 'number' && (
                    <input type="number" required={q.is_required} onChange={e=>setAnswers({...answers, [q.id]: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" placeholder="أدخل رقماً..." />
                  )}
                  
                  {q.question_type === 'date' && (
                    <input type="date" required={q.is_required} onChange={e=>setAnswers({...answers, [q.id]: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" />
                  )}
                  
                  {q.question_type === 'location' && (
                    <input type="text" required={q.is_required} onChange={e=>setAnswers({...answers, [q.id]: e.target.value})} className="w-full neon-input p-4 rounded-xl text-sm" placeholder="المدينة، الحي..." />
                  )}
                  
                  {q.question_type === 'single_choice' && (
                    <div className="space-y-3">
                      {q.survey_question_options?.sort((a,b)=>a.sort_order-b.sort_order).map(opt => (
                        <label key={opt.id} className="flex items-center gap-4 p-4 rounded-xl border border-dark-border hover:border-primary/50 cursor-pointer transition-all glass-card group">
                          <div className="relative flex items-center justify-center">
                            <input type="radio" name={q.id} value={opt.option_text} required={q.is_required} onChange={e=>setAnswers({...answers, [q.id]: e.target.value})} className="peer w-5 h-5 appearance-none border-2 border-dark-border rounded-full checked:border-primary checked:bg-transparent transition-all cursor-pointer" />
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                          </div>
                          <span className="font-medium text-text-muted text-sm group-hover:text-text-main transition-colors">{opt.option_text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="pt-8">
              <button type="submit" disabled={loading} className="w-full neon-btn py-4 rounded-xl text-sm font-bold tracking-widest uppercase shadow-lg disabled:opacity-50">
                {loading ? 'جاري الإرسال...' : 'إرسال الإجابات'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SurveyPage;
