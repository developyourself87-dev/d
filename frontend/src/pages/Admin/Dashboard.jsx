import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { supabase } from '../../services/supabase';

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');

  // Core Data
  const [stats, setStats] = useState({ courses: 0, registrations: 0, comments: 0, surveys: 0, surveySubs: 0, works: 0 });
  const [courses, setCourses] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [works, setWorks] = useState([]);
  const [comments, setComments] = useState([]);
  
  // Settings & Profile
  const [siteSettings, setSiteSettings] = useState({});
  const [trainerProfile, setTrainerProfile] = useState({});

  // Languages State
  const [languages, setLanguages] = useState([]);
  const [editingLang, setEditingLang] = useState('ar');
  const [newLang, setNewLang] = useState({ code: '', name: '' });

  // Basic CRUD States
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({});
  const [isEditingWork, setIsEditingWork] = useState(false);
  const [currentWork, setCurrentWork] = useState({});
  
  // Advanced Unified Survey Builder State
  const [unifiedSurvey, setUnifiedSurvey] = useState(null); 

  // Course Questions Builder State
  const [managingCourseQuestionsFor, setManagingCourseQuestionsFor] = useState(null);
  const [courseQuestions, setCourseQuestions] = useState([]);
  const [newCourseQuestion, setNewCourseQuestion] = useState({ question_text: '', question_type: 'short_text', is_required: true, optionsStr: '' });

  // Archive States
  const [archiveView, setArchiveView] = useState({ type: null, item: null });
  const [archiveParticipants, setArchiveParticipants] = useState([]);
  const [archiveAnswersMap, setArchiveAnswersMap] = useState({});

  const [admissionNumber, setAdmissionNumber] = useState('');

  useEffect(() => {
    // الخروج من الصفحة يساوي تسجيل خروج (Force sign out on page load)
    supabase.auth.signOut();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    // Honeypot check: If the bot/user fills the admission number, reject them
    if (admissionNumber.trim() !== '') {
      setLoginError('بيانات الدخول غير صحيحة.');
      return;
    }

    // Security check: email format required by the user (Hidden from UI)
    if (!loginEmail.endsWith('@gggg.com') && loginEmail !== 'xxx@gggg.com') {
      setLoginError('بيانات الدخول غير صحيحة.');
      return;
    }

    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoginLoading(false);

    if (error) {
      setLoginError('بيانات الدخول غير صحيحة.');
    } else if (data.session) {
      setIsAuthenticated(true);
    }
  };

  async function fetchData() {
    try {
      if (activeTab === 'overview') {
        const fetchCount = async (table) => {
          try {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) throw error;
            return count || 0;
          } catch (e) {
            console.error(`Error fetching count for ${table}:`, e);
            const { data } = await supabase.from(table).select('id');
            return data ? data.length : 0;
          }
        };

        const [courses, registrations, comments, surveys, surveySubs, works] = await Promise.all([
          fetchCount('courses'),
          fetchCount('registrations'),
          fetchCount('comments'),
          fetchCount('surveys'),
          fetchCount('survey_submissions'),
          fetchCount('works')
        ]);

        setStats({ courses, registrations, comments, surveys, surveySubs, works });
      } else if (activeTab === 'courses') {
        const { data } = await supabase.from('courses').select('*').order('sort_order');
        setCourses(data || []);
      } else if (activeTab === 'surveys') {
        const { data, error } = await supabase.from('surveys').select('*');
        if (error) console.error('Surveys fetch error:', error);
        setSurveys(data || []);
      } else if (activeTab === 'works') {
        const { data } = await supabase.from('works').select('*').order('sort_order');
        setWorks(data || []);
      } else if (activeTab === 'comments') {
        const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
        setComments(data || []);
      } else if (activeTab === 'archive') {
        const [cRes, sRes] = await Promise.all([
          supabase.from('courses').select('*').order('sort_order'),
          supabase.from('surveys').select('*')
        ]);
        setCourses(cRes.data || []);
        setSurveys(sRes.data || []);
      } else if (activeTab === 'settings') {
        const [setRes, profRes, langRes] = await Promise.all([
          supabase.from('site_settings').select('*').single(),
          supabase.from('trainer_profile').select('*').single(),
          supabase.from('site_languages').select('*').order('created_at')
        ]);
        if (setRes.data) {
          if (!setRes.data.translations) setRes.data.translations = {};
          setSiteSettings(setRes.data);
        }
        if (profRes.data) {
          if (!profRes.data.translations) profRes.data.translations = {};
          setTrainerProfile(profRes.data);
        }
        if (langRes.data) {
          setLanguages(langRes.data);
        } else {
          // Fallback if table doesn't exist yet
          setLanguages([{code: 'ar', name: 'العربية', is_default: true}]);
        }
      }
    } catch (error) {
      console.error("Fetch Data Error: ", error);
    }
  }

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const { error: err1 } = await supabase.from('site_settings').update(siteSettings).eq('id', siteSettings.id);
      if (err1) throw err1;
      
      const { error: err2 } = await supabase.from('trainer_profile').update(trainerProfile).eq('id', trainerProfile.id);
      if (err2) throw err2;
      
      alert("تم حفظ كافة الإعدادات بنجاح!");
    } catch (error) {
      alert("خطأ أثناء الحفظ: " + error.message);
    }
  };

  const handleAddLanguage = async (e) => {
    e.preventDefault();
    if (!newLang.code || !newLang.name) return;
    try {
      const { error } = await supabase.from('site_languages').insert([{ code: newLang.code.toLowerCase(), name: newLang.name, is_default: false }]);
      if (error) throw error;
      setNewLang({ code: '', name: '' });
      fetchData();
    } catch(err) { alert("حدث خطأ أثناء إضافة اللغة: " + err.message); }
  };

  const updateSetting = (field, value) => {
    if (editingLang === 'ar') {
      setSiteSettings({...siteSettings, [field]: value});
    } else {
      setSiteSettings({...siteSettings, translations: {...(siteSettings.translations||{}), [editingLang]: {...(siteSettings.translations?.[editingLang]||{}), [field]: value}}});
    }
  };

  const updateProfile = (field, value) => {
    if (editingLang === 'ar') {
      setTrainerProfile({...trainerProfile, [field]: value});
    } else {
      setTrainerProfile({...trainerProfile, translations: {...(trainerProfile.translations||{}), [editingLang]: {...(trainerProfile.translations?.[editingLang]||{}), [field]: value}}});
    }
  };

  const getSetting = (field) => editingLang === 'ar' ? (siteSettings?.[field] || '') : (siteSettings?.translations?.[editingLang]?.[field] || '');
  const getProfile = (field) => editingLang === 'ar' ? (trainerProfile?.[field] || '') : (trainerProfile?.translations?.[editingLang]?.[field] || '');

  // --- WORKS CRUD (Ultimate Fix) ---
  const saveWork = async (e) => {
    e.preventDefault();
    try {
      const workData = { ...currentWork };
      if (!workData.title || !workData.image_url) { alert("العنوان ورابط الصورة مطلوبان!"); return; }
      if (!workData.achievement_date) workData.achievement_date = null;

      if (workData.id) {
        const { error } = await supabase.from('works').update(workData).eq('id', workData.id);
        if (error) throw error;
      } else {
        delete workData.id; // Extremely important to avoid "null value in column id" error
        const { error } = await supabase.from('works').insert([workData]);
        if (error) throw error;
      }
      setIsEditingWork(false); 
      fetchData();
      alert("تم حفظ الإنجاز بنجاح");
    } catch (error) {
      alert("حدث خطأ أثناء حفظ الإنجاز: " + error.message);
    }
  };
  const deleteWork = async (id) => { if(window.confirm('حذف الإنجاز نهائياً؟')) { await supabase.from('works').delete().eq('id', id); fetchData(); } };

  // --- COURSES CRUD (Restored Info) ---
  const saveCourse = async (e) => {
    e.preventDefault();
    try {
      const courseData = { ...currentCourse };
      if (!courseData.title) { alert("عنوان الدورة مطلوب"); return; }
      if (!courseData.course_date) courseData.course_date = null; // Fix postgres date error
      
      if (courseData.id) {
        const { error } = await supabase.from('courses').update(courseData).eq('id', courseData.id);
        if (error) throw error;
      } else {
        delete courseData.id; // Prevent null ID error
        const { error } = await supabase.from('courses').insert([courseData]);
        if (error) throw error;
      }
      setIsEditingCourse(false); 
      fetchData();
    } catch (error) {
      alert("حدث خطأ أثناء حفظ الدورة: " + error.message);
    }
  };
  const deleteCourse = async (id) => { if(window.confirm('حذف الدورة؟')) { await supabase.from('courses').delete().eq('id', id); fetchData(); } };

  const loadCourseBuilder = async (item) => {
    setManagingCourseQuestionsFor(item);
    const { data } = await supabase.from('registration_questions').select(`*, question_options(*)`).eq('course_id', item.id).order('sort_order');
    setCourseQuestions(data || []);
  };
  const saveCourseQuestion = async (e) => {
    e.preventDefault();
    const { data: qData } = await supabase.from('registration_questions').insert([{
      course_id: managingCourseQuestionsFor.id, question_text: newCourseQuestion.question_text, question_type: newCourseQuestion.question_type, is_required: newCourseQuestion.is_required
    }]).select().single();

    if (qData && newCourseQuestion.question_type === 'single_choice') {
      const opts = newCourseQuestion.optionsStr.split(',').map(o => o.trim()).filter(o => o);
      if (opts.length > 0) await supabase.from('question_options').insert(opts.map((opt, idx) => ({ question_id: qData.id, option_text: opt, sort_order: idx })));
    }
    setNewCourseQuestion({ question_text: '', question_type: 'short_text', is_required: true, optionsStr: '' });
    loadCourseBuilder(managingCourseQuestionsFor);
  };
  const deleteCourseQuestion = async (id) => {
    if(window.confirm('حذف السؤال؟')) { await supabase.from('registration_questions').delete().eq('id', id); loadCourseBuilder(managingCourseQuestionsFor); }
  };

  // --- UNIFIED SURVEY BUILDER ---
  const openNewSurveyBuilder = () => {
    setUnifiedSurvey({
      id: null, title: '', description: '', image_url: '', is_visible: true,
      image_layout: 'centered', image_shape: 'square', image_border_enabled: false, image_border_color: '#0d9488',
      questions: []
    });
  };

  const openEditSurveyBuilder = async (survey) => {
    const { data: qData } = await supabase.from('survey_questions').select('*, survey_question_options(*)').eq('survey_id', survey.id).order('sort_order');
    const formattedQuestions = (qData || []).map(q => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      is_required: q.is_required,
      optionsStr: (q.survey_question_options || []).sort((a,b)=>a.sort_order-b.sort_order).map(o => o.option_text).join(',')
    }));
    setUnifiedSurvey({ ...survey, questions: formattedQuestions });
  };

  const addQuestionToUnifiedSurvey = () => {
    setUnifiedSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, { question_text: '', question_type: 'short_text', is_required: true, optionsStr: '' }]
    }));
  };

  const updateUnifiedQuestion = (index, field, value) => {
    const updatedQuestions = [...unifiedSurvey.questions];
    updatedQuestions[index][field] = value;
    setUnifiedSurvey({ ...unifiedSurvey, questions: updatedQuestions });
  };

  const removeUnifiedQuestion = (index) => {
    const updatedQuestions = [...unifiedSurvey.questions];
    updatedQuestions.splice(index, 1);
    setUnifiedSurvey({ ...unifiedSurvey, questions: updatedQuestions });
  };

  const saveUnifiedSurvey = async (e) => {
    e.preventDefault();
    if (!unifiedSurvey.title) { alert("يجب إدخال عنوان الاستبيان"); return; }
    
    try {
      const surveyPayload = {
        title: unifiedSurvey.title, description: unifiedSurvey.description, image_url: unifiedSurvey.image_url, is_visible: unifiedSurvey.is_visible,
        image_layout: unifiedSurvey.image_layout, image_shape: unifiedSurvey.image_shape, 
        image_border_enabled: unifiedSurvey.image_border_enabled, image_border_color: unifiedSurvey.image_border_color
      };

      let finalSurveyId = unifiedSurvey.id;

      if (unifiedSurvey.id) {
        const { error } = await supabase.from('surveys').update(surveyPayload).eq('id', unifiedSurvey.id);
        if (error) throw error;
      } else {
        const { data: insertedSurvey, error } = await supabase.from('surveys').insert([surveyPayload]).select().single();
        if (error) throw error;
        finalSurveyId = insertedSurvey.id;
      }

      // Overwrite Questions
      await supabase.from('survey_questions').delete().eq('survey_id', finalSurveyId);

      for (let i = 0; i < unifiedSurvey.questions.length; i++) {
        const q = unifiedSurvey.questions[i];
        if (!q.question_text) continue;

        const { data: insertedQ, error: qErr } = await supabase.from('survey_questions').insert([{
          survey_id: finalSurveyId, question_text: q.question_text, question_type: q.question_type, is_required: q.is_required, sort_order: i
        }]).select().single();
        if (qErr) throw qErr;

        if (q.question_type === 'single_choice' && q.optionsStr) {
          const opts = q.optionsStr.split(',').map(o => o.trim()).filter(o => o);
          if (opts.length > 0) {
            await supabase.from('survey_question_options').insert(opts.map((opt, idx) => ({ question_id: insertedQ.id, option_text: opt, sort_order: idx })));
          }
        }
      }

      setUnifiedSurvey(null);
      await fetchData(); // Make sure it refreshes the lists!
      copyLink(finalSurveyId);
    } catch (error) {
      alert("خطأ أثناء حفظ الاستبيان: " + error.message);
    }
  };

  const deleteSurvey = async (id) => { if(window.confirm('حذف الاستبيان بالكامل؟')) { await supabase.from('surveys').delete().eq('id', id); fetchData(); } };

  const copyLink = (id) => {
    const url = `${window.location.origin}/survey/${id}`;
    navigator.clipboard.writeText(url);
    alert('تم الحفظ! الرابط المباشر للمجيبين هو:\n' + url);
  };

  // --- ARCHIVE LOGIC ---
  const loadArchiveDetails = async (item, type) => {
    setArchiveView({ type, item });
    try {
      if (type === 'course') {
        const { data: regs } = await supabase.from('registrations').select('*').eq('course_id', item.id).order('created_at', { ascending: false });
        setArchiveParticipants(regs || []);
        const { data: ans } = await supabase.from('registration_answers').select('*, registration_questions(question_text)');
        const ansMap = {};
        (ans || []).forEach(a => { if (!ansMap[a.registration_id]) ansMap[a.registration_id] = []; ansMap[a.registration_id].push(a); });
        setArchiveAnswersMap(ansMap);
      } else {
        const { data: subs } = await supabase.from('survey_submissions').select('*').eq('survey_id', item.id).order('submitted_at', { ascending: false });
        setArchiveParticipants(subs || []);
        const { data: ans } = await supabase.from('survey_answers').select('*, survey_questions(question_text)');
        const ansMap = {};
        (ans || []).forEach(a => { if (!ansMap[a.submission_id]) ansMap[a.submission_id] = []; ansMap[a.submission_id].push(a); });
        setArchiveAnswersMap(ansMap);
      }
    } catch (e) {
      console.error(e);
      setArchiveParticipants([]);
      setArchiveAnswersMap({});
    }
  };
  const deleteArchiveParticipant = async (id) => {
    if (window.confirm('حذف المشارك نهائياً؟')) {
      const table = archiveView.type === 'course' ? 'registrations' : 'survey_submissions';
      await supabase.from(table).delete().eq('id', id);
      loadArchiveDetails(archiveView.item, archiveView.type);
    }
  }

  // --- COMMENTS ---
  const handleUpdateCommentStatus = async (id, status) => { await supabase.from('comments').update({ status }).eq('id', id); fetchData(); };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 text-slate-900">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2 text-primary">تسجيل الدخول الآمن</h1>
        <p className="text-slate-500 text-sm mb-6">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
        
        {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold border border-red-200">{loginError}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4 text-right">
          <div>
            <label className="block text-sm font-bold mb-1">البريد الإلكتروني</label>
            <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50 text-left" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">رقم القبول</label>
            <input type="text" value={admissionNumber} onChange={e => setAdmissionNumber(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50 text-left" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">كلمة المرور</label>
            <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50 text-left" dir="ltr" />
          </div>
          <button type="submit" disabled={loginLoading} className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-lg font-bold transition-colors mt-4">
            {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row" dir="rtl">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <h1 className="font-bold text-lg">لوحة التحكم</h1>
        <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="text-2xl focus:outline-none">
          {isMobileSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileSidebarOpen(false)}></div>
      )}
      
      <aside className={`w-64 bg-slate-900 text-white flex-col h-screen sticky top-0 z-50 transition-transform transform ${isMobileSidebarOpen ? 'translate-x-0 fixed right-0' : 'translate-x-full fixed right-0'} md:translate-x-0 md:sticky md:flex`}>
        <div className="p-6 text-xl font-bold border-b border-slate-800 flex justify-between items-center">
          <span>لوحة التحكم</span>
          <button className="md:hidden text-white" onClick={() => setIsMobileSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {['overview','settings','courses','surveys','archive','works','comments'].map(tab => (
            <button key={tab} onClick={() => {
              setActiveTab(tab); setManagingCourseQuestionsFor(null); setUnifiedSurvey(null); 
              setArchiveView({type:null, item:null}); setIsEditingCourse(false); setIsEditingWork(false);
              setIsMobileSidebarOpen(false); // Close sidebar on mobile after clicking
            }} 
              className={`w-full text-right p-3 rounded-lg transition-colors ${activeTab === tab ? 'bg-primary font-bold' : 'hover:bg-slate-800'}`}>
              {tab === 'overview' ? 'نظرة عامة (الكل)' : tab === 'settings' ? 'الإعدادات والملف' : tab === 'courses' ? 'إدارة الدورات' : tab === 'surveys' ? 'منشئ الاستبيانات' : tab === 'archive' ? 'الأرشيف الشامل' : tab === 'works' ? 'الإنجازات (الأعمال)' : 'التعليقات'}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* OVERVIEW (Fixed: Using length instead of count for accuracy) */}
        {activeTab === 'overview' && (
          <div><h2 className="text-3xl font-bold mb-6">نظرة عامة على النظام</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm"><h3 className="text-slate-500 mb-2 font-bold">الدورات المطروحة</h3><p className="text-4xl font-bold text-blue-600">{stats.courses}</p></div>
              <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm"><h3 className="text-slate-500 mb-2 font-bold">تسجيلات الدورات (مشاركين)</h3><p className="text-4xl font-bold text-green-600">{stats.registrations}</p></div>
              <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm"><h3 className="text-slate-500 mb-2 font-bold">الاستبيانات المُنتجة</h3><p className="text-4xl font-bold text-purple-600">{stats.surveys}</p></div>
              <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm"><h3 className="text-slate-500 mb-2 font-bold">إجابات الاستبيانات (مشاركين)</h3><p className="text-4xl font-bold text-orange-600">{stats.surveySubs}</p></div>
              <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-sm"><h3 className="text-slate-500 mb-2 font-bold">الإنجازات (الأعمال)</h3><p className="text-4xl font-bold text-teal-600">{stats.works}</p></div>
              <div className="bg-white p-6 rounded-xl border border-pink-200 shadow-sm"><h3 className="text-slate-500 mb-2 font-bold">التعليقات (المراجعات)</h3><p className="text-4xl font-bold text-pink-600">{stats.comments}</p></div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-3xl font-bold">الإعدادات واللغات</h2>
              <button onClick={saveSettings} className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-lg font-bold shadow-lg">حفظ كافة التعديلات</button>
            </div>

            {/* Language Management Section */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-xl font-bold border-b pb-2 text-primary">إدارة لغات الموقع</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm mb-1 font-bold">رمز اللغة (مثال: es)</label>
                  <input type="text" value={newLang.code} onChange={e=>setNewLang({...newLang, code:e.target.value})} className="w-full border p-3 rounded bg-slate-50" dir="ltr" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1 font-bold">اسم اللغة (مثال: Español)</label>
                  <input type="text" value={newLang.name} onChange={e=>setNewLang({...newLang, name:e.target.value})} className="w-full border p-3 rounded bg-slate-50" />
                </div>
                <button onClick={handleAddLanguage} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800">إضافة اللغة</button>
              </div>
              <div className="flex gap-2 flex-wrap pt-4">
                <span className="p-2 text-slate-500 font-bold text-sm">اللغات المتوفرة:</span>
                {(languages || []).map(l => (
                  <span key={l.code} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-bold border">{l.name} ({l.code})</span>
                ))}
              </div>
            </div>

            {/* Language Switcher for editing */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-4">
              <span className="font-bold text-blue-800">أنت الآن تقوم بتعديل البيانات للغة:</span>
              <div className="flex gap-2">
                {(languages || []).map(l => (
                  <button key={l.code} onClick={() => setEditingLang(l.code)} className={`px-4 py-2 rounded-lg font-bold transition-colors ${editingLang === l.code ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 hover:bg-blue-100'}`}>
                    {l.name} {l.is_default && '(الافتراضية)'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-xl font-bold border-b pb-2 text-primary">معلومات الاتصال والمظهر العام</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1 font-bold">عنوان الموقع (اللوجو)</label><input type="text" value={getSetting('site_title')} onChange={e=>updateSetting('site_title', e.target.value)} className="w-full border p-3 rounded bg-slate-50" /></div>
                
                <div>
                  <label className="block text-sm mb-1 font-bold">اللون الرئيسي للموقع (Theme Color)</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={siteSettings?.primary_color || '#00F2FE'} onChange={e=>setSiteSettings({...siteSettings, primary_color:e.target.value})} className="h-12 w-20 cursor-pointer rounded border bg-slate-50 p-1" disabled={editingLang !== 'ar'} />
                    <span className="text-slate-500 font-mono" dir="ltr">{siteSettings?.primary_color || '#00F2FE'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1 font-bold">شكل الصورة الرئيسية للمدربة (وفي اللوجو)</label>
                  <select value={siteSettings?.profile_shape || 'circle'} onChange={e=>setSiteSettings({...siteSettings, profile_shape:e.target.value})} className="w-full border p-3 rounded bg-slate-50" disabled={editingLang !== 'ar'}>
                    <option value="circle">دائرة</option>
                    <option value="square">مربع قياسي</option>
                    <option value="rounded">مربع دائري الزوايا</option>
                    <option value="hexagon">خماسي المظهر</option>
                  </select>
                </div>

                <div><label className="block text-sm mb-1 font-bold">رقم الهاتف</label><input type="text" value={siteSettings?.phone || ''} onChange={e=>setSiteSettings({...siteSettings, phone:e.target.value})} className="w-full border p-3 rounded bg-slate-50" dir="ltr" disabled={editingLang !== 'ar'} /></div>
                <div><label className="block text-sm mb-1 font-bold">البريد الإلكتروني</label><input type="email" value={siteSettings?.email || ''} onChange={e=>setSiteSettings({...siteSettings, email:e.target.value})} className="w-full border p-3 rounded bg-slate-50" dir="ltr" disabled={editingLang !== 'ar'} /></div>
                <div><label className="block text-sm mb-1 font-bold">رابط فيسبوك</label><input type="text" value={siteSettings?.facebook_url || ''} onChange={e=>setSiteSettings({...siteSettings, facebook_url:e.target.value})} className="w-full border p-3 rounded bg-slate-50" dir="ltr" disabled={editingLang !== 'ar'} /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-xl font-bold border-b pb-2 text-primary">الملف الشخصي للمدربة (يظهر في الواجهة الرئيسية)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1 font-bold">الاسم الكامل</label><input type="text" value={getProfile('name')} onChange={e=>updateProfile('name', e.target.value)} className="w-full border p-3 rounded bg-slate-50" /></div>
                <div><label className="block text-sm mb-1 font-bold">رابط الصورة الشخصية (URL)</label><input type="text" value={trainerProfile?.image_url || ''} onChange={e=>setTrainerProfile({...trainerProfile, image_url:e.target.value})} className="w-full border p-3 rounded bg-slate-50" dir="ltr" disabled={editingLang !== 'ar'} /></div>
                <div className="col-span-full"><label className="block text-sm mb-1 font-bold">الصفة المهنية (مثال: مدربة معتمدة)</label><input type="text" value={getProfile('professional_title')} onChange={e=>updateProfile('professional_title', e.target.value)} className="w-full border p-3 rounded bg-slate-50" /></div>
                <div className="col-span-full"><label className="block text-sm mb-1 font-bold">نبذة تعريفية (قسم من نحن)</label><textarea value={getProfile('bio')} onChange={e=>updateProfile('bio', e.target.value)} className="w-full border p-3 rounded bg-slate-50 h-24"></textarea></div>
                <div className="col-span-full"><label className="block text-sm mb-1 font-bold">الخبرات (تظهر كنقاط)</label><textarea value={getProfile('experience')} onChange={e=>updateProfile('experience', e.target.value)} className="w-full border p-3 rounded bg-slate-50 h-24"></textarea></div>
                <div className="col-span-full"><label className="block text-sm mb-1 font-bold">المؤهلات (تظهر كنقاط)</label><textarea value={getProfile('qualifications')} onChange={e=>updateProfile('qualifications', e.target.value)} className="w-full border p-3 rounded bg-slate-50 h-24"></textarea></div>
              </div>
            </div>
          </div>
        )}

        {/* WORKS */}
        {activeTab === 'works' && !isEditingWork && (
          <div>
            <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold">الإنجازات (الأعمال السابقة)</h2><button onClick={() => {setIsEditingWork(true); setCurrentWork({title: '', image_url: '', is_visible:true});}} className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg font-bold">+ إضافة إنجاز جديد</button></div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-right"><thead className="bg-slate-50 border-b"><tr><th className="p-4">العنوان</th><th className="p-4">تاريخ الإنجاز</th><th className="p-4">إجراءات</th></tr></thead><tbody className="divide-y">
                {(works || []).map(w => (
                  <tr key={w.id}><td className="p-4 font-bold">{w.title}</td><td className="p-4">{w.achievement_date || 'غير محدد'}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={()=>{setCurrentWork(w);setIsEditingWork(true);}} className="bg-blue-100 text-blue-700 px-4 py-1 rounded font-bold hover:bg-blue-200">تعديل</button>
                    <button onClick={()=>deleteWork(w.id)} className="bg-red-100 text-red-700 px-4 py-1 rounded font-bold hover:bg-red-200">حذف</button>
                  </td></tr>
                ))}
                {(!works || works.length === 0) && <tr><td colSpan="3" className="p-8 text-center text-slate-500">لا توجد إنجازات مسجلة بعد.</td></tr>}
              </tbody></table>
            </div>
          </div>
        )}
        {activeTab === 'works' && isEditingWork && (
          <div className="bg-white p-8 rounded-xl border shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-primary">{currentWork.id ? 'تعديل الإنجاز' : 'إضافة إنجاز جديد'}</h2>
            <form onSubmit={saveWork} className="space-y-4">
              <div><label className="block text-sm mb-1 font-bold">عنوان الإنجاز <span className="text-red-500">*</span></label><input required value={currentWork.title||''} onChange={e=>setCurrentWork({...currentWork, title:e.target.value})} className="w-full border p-3 rounded bg-slate-50" /></div>
              <div><label className="block text-sm mb-1 font-bold">الوصف</label><textarea value={currentWork.description||''} onChange={e=>setCurrentWork({...currentWork, description:e.target.value})} className="w-full border p-3 rounded bg-slate-50 h-24"></textarea></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1 font-bold">التاريخ</label><input type="date" value={currentWork.achievement_date||''} onChange={e=>setCurrentWork({...currentWork, achievement_date:e.target.value})} className="w-full border p-3 rounded bg-slate-50" /></div>
                <div><label className="block text-sm mb-1 font-bold">رابط الصورة (URL) <span className="text-red-500">*</span></label><input type="text" required value={currentWork.image_url||''} onChange={e=>setCurrentWork({...currentWork, image_url:e.target.value})} className="w-full border p-3 rounded bg-slate-50" dir="ltr" placeholder="https://..." /></div>
              </div>
              <label className="flex items-center gap-2 mt-4"><input type="checkbox" checked={currentWork.is_visible!==false} onChange={e=>setCurrentWork({...currentWork, is_visible:e.target.checked})} className="w-5 h-5 text-primary" /> عرض هذا الإنجاز للزوار</label>
              <div className="flex gap-4 mt-8 pt-4 border-t"><button type="submit" className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-lg font-bold">حفظ البيانات</button><button type="button" onClick={()=>setIsEditingWork(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-8 py-3 rounded-lg font-bold">إلغاء الرجوع</button></div>
            </form>
          </div>
        )}

        {/* SURVEYS */}
        {activeTab === 'surveys' && !unifiedSurvey && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-3xl font-bold mb-2">منشئ الاستبيانات الشامل</h2><p className="text-slate-500">صفحة مخصصة لصناعة الاستبيانات من الألف إلى الياء، وتوليد روابط لها.</p></div>
              <button onClick={openNewSurveyBuilder} className="bg-primary hover:bg-secondary text-white px-6 py-3 rounded-lg font-bold text-lg shadow-md">+ إنشاء صفحة استبيان جديدة</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-right"><thead className="bg-slate-50 border-b"><tr><th className="p-4">الاستبيانات المتوفرة (الروابط المنتجة)</th><th className="p-4">الإجراءات</th></tr></thead><tbody className="divide-y">
                  {(surveys || []).map(s => (
                    <tr key={s.id}>
                      <td className="p-4">
                        <div className="font-bold text-lg mb-1">{s.title}</div>
                        <div className="text-sm text-slate-500">حالة الرابط: {s.is_visible ? <span className="text-green-600">متاح للزوار</span> : <span className="text-red-500">مغلق</span>}</div>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => copyLink(s.id)} className="bg-green-100 text-green-700 px-4 py-2 rounded font-bold hover:bg-green-200">نسخ رابط المشاركة</button>
                        <button onClick={() => openEditSurveyBuilder(s)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-bold hover:bg-blue-200">تعديل الاستبيان</button>
                        <button onClick={() => deleteSurvey(s.id)} className="bg-red-100 text-red-700 px-4 py-2 rounded font-bold hover:bg-red-200">حذف</button>
                      </td>
                    </tr>
                  ))}
                  {(!surveys || surveys.length === 0) && <tr><td colSpan="2" className="p-8 text-center text-slate-500">لا توجد استبيانات. انقر على الزر أعلاه لإنتاج استبيان جديد بالكامل في صفحة واحدة.</td></tr>}
              </tbody></table>
            </div>
          </div>
        )}
        
        {activeTab === 'surveys' && unifiedSurvey && (
          <div className="bg-white p-8 rounded-xl border shadow-lg relative">
            <button onClick={() => setUnifiedSurvey(null)} className="absolute top-6 left-6 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold hover:bg-slate-200">&larr; تراجع وإلغاء</button>
            <h2 className="text-3xl font-bold mb-8 text-primary border-b pb-4">{unifiedSurvey.id ? 'تعديل الاستبيان' : 'تصميم وإنتاج استبيان جديد'}</h2>
            
            <form onSubmit={saveUnifiedSurvey} className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div><h3 className="text-2xl font-bold">المعلومات ومظهر الصفحة</h3></div>
                <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl border">
                  <div><label className="block text-sm mb-1 font-bold">عنوان الاستبيان الرئيسي <span className="text-red-500">*</span></label><input required value={unifiedSurvey.title} onChange={e=>setUnifiedSurvey({...unifiedSurvey, title:e.target.value})} className="w-full border p-3 rounded" /></div>
                  <div><label className="block text-sm mb-1 font-bold">وصف أو مقدمة ترحيبية</label><textarea value={unifiedSurvey.description} onChange={e=>setUnifiedSurvey({...unifiedSurvey, description:e.target.value})} className="w-full border p-3 rounded h-12"></textarea></div>
                  <div className="col-span-full border-t pt-4 mt-2"><h4 className="font-bold text-slate-700 mb-4">صورة بداية الاستبيان وأشكالها (اختياري)</h4></div>
                  <div><label className="block text-sm mb-1 font-bold">رابط الصورة (URL)</label><input type="text" value={unifiedSurvey.image_url} onChange={e=>setUnifiedSurvey({...unifiedSurvey, image_url:e.target.value})} className="w-full border p-3 rounded" dir="ltr" /></div>
                  <div><label className="block text-sm mb-1 font-bold">شكل الصورة الافتتاحية</label><select value={unifiedSurvey.image_shape} onChange={e=>setUnifiedSurvey({...unifiedSurvey, image_shape:e.target.value})} className="w-full border p-3 rounded"><option value="square">مربع قياسي</option><option value="circle">دائرة</option><option value="triangle">مثلث</option><option value="star">نجمة خماسية</option></select></div>
                  <div><label className="block text-sm mb-1 font-bold">حجم وتخطيط الصورة</label><select value={unifiedSurvey.image_layout} onChange={e=>setUnifiedSurvey({...unifiedSurvey, image_layout:e.target.value})} className="w-full border p-3 rounded"><option value="centered">متوسطة في المنتصف</option><option value="full">كبيرة تأخذ كل العرض (Banner)</option></select></div>
                  <div className="flex flex-col gap-2 justify-center"><label className="flex items-center gap-2 font-bold cursor-pointer"><input type="checkbox" checked={unifiedSurvey.image_border_enabled} onChange={e=>setUnifiedSurvey({...unifiedSurvey, image_border_enabled:e.target.checked})} className="w-5 h-5 text-primary" /> تفعيل وضع إطار للصورة</label>{unifiedSurvey.image_border_enabled && (<div className="flex items-center gap-2 mt-2"><span className="text-sm">لون الإطار:</span> <input type="color" value={unifiedSurvey.image_border_color} onChange={e=>setUnifiedSurvey({...unifiedSurvey, image_border_color:e.target.value})} className="h-10 w-full cursor-pointer rounded" /></div>)}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div><h3 className="text-2xl font-bold">الأسئلة (تُنتج في نفس الصفحة)</h3></div>
                  <button type="button" onClick={addQuestionToUnifiedSurvey} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-slate-800">+ إنتاج سؤال جديد</button>
                </div>
                <div className="space-y-4">
                  {unifiedSurvey.questions.length === 0 && <div className="p-8 text-center bg-blue-50 text-blue-800 rounded-xl border border-blue-200">انقر على الزر أعلاه لإنتاج أسئلتك المخصصة.</div>}
                  {unifiedSurvey.questions.map((q, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 border rounded-xl relative shadow-sm">
                      <button type="button" onClick={() => removeUnifiedQuestion(idx)} className="absolute top-4 left-4 bg-red-100 text-red-600 px-3 py-1 rounded text-sm font-bold hover:bg-red-200">حذف السؤال</button>
                      <h4 className="font-bold text-lg mb-4 text-primary">السؤال رقم {idx + 1}</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><label className="block text-sm mb-1 font-bold">نص السؤال</label><input required value={q.question_text} onChange={e => updateUnifiedQuestion(idx, 'question_text', e.target.value)} className="w-full border p-3 rounded" /></div>
                        <div>
                          <label className="block text-sm mb-1 font-bold">نوع الإجابة المطلوبة من الزائر</label>
                          <select value={q.question_type} onChange={e => updateUnifiedQuestion(idx, 'question_type', e.target.value)} className="w-full border p-3 rounded"><option value="short_text">نصية (كتابة حرة)</option><option value="single_choice">اختيار إجابة من قائمة (خيارات)</option><option value="date">تاريخ (يظهر تقويم)</option><option value="location">مكان أو موقع</option><option value="number">أرقام فقط</option></select>
                        </div>
                        {q.question_type === 'single_choice' && (<div className="col-span-full"><label className="block text-sm mb-1 font-bold">الخيارات المتاحة للزائر (افصل بينها بفاصلة , )</label><input required value={q.optionsStr} onChange={e => updateUnifiedQuestion(idx, 'optionsStr', e.target.value)} className="w-full border p-3 rounded" /></div>)}
                        <div className="col-span-full mt-2"><label className="flex items-center gap-2 font-bold cursor-pointer"><input type="checkbox" checked={q.is_required} onChange={e => updateUnifiedQuestion(idx, 'is_required', e.target.checked)} className="w-5 h-5 text-primary" /> سؤال إجباري (لا يمكن تخطيه)</label></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-8"><button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl text-2xl shadow-xl transition-transform transform hover:scale-[1.01]">إنتاج الاستبيان وحفظه نهائياً ✓</button></div>
            </form>
          </div>
        )}

        {/* COURSES (Restored Full Info) */}
        {activeTab === 'courses' && !managingCourseQuestionsFor && !isEditingCourse && (
          <div>
            <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold">إدارة الدورات التدريبية</h2><button onClick={() => { setIsEditingCourse(true); setCurrentCourse({title:'', is_visible:true}); }} className="bg-primary text-white px-6 py-2 rounded-lg font-bold">+ إضافة دورة تدريبية</button></div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-right"><thead className="bg-slate-50 border-b"><tr><th className="p-4">اسم الدورة</th><th className="p-4">إجراءات</th></tr></thead><tbody className="divide-y">
                  {(courses || []).map(c => (
                    <tr key={c.id}><td className="p-4 font-bold">{c.title}</td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => loadCourseBuilder(c)} className="bg-purple-100 text-purple-700 px-4 py-1 rounded font-bold hover:bg-purple-200">تخصيص أسئلة التسجيل</button>
                        <button onClick={() => { setCurrentCourse(c); setIsEditingCourse(true); }} className="bg-blue-100 text-blue-700 px-4 py-1 rounded font-bold hover:bg-blue-200">تعديل الدورة</button>
                        <button onClick={() => deleteCourse(c.id)} className="bg-red-100 text-red-700 px-4 py-1 rounded font-bold hover:bg-red-200">حذف</button>
                      </td>
                    </tr>
                  ))}
                  {(!courses || courses.length === 0) && <tr><td colSpan="2" className="p-8 text-center text-slate-500">لا توجد دورات.</td></tr>}
              </tbody></table>
            </div>
          </div>
        )}
        {activeTab === 'courses' && isEditingCourse && (
          <div className="bg-white p-8 rounded-xl border shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-primary">{currentCourse.id ? 'تعديل الدورة' : 'إضافة دورة'}</h2>
            <form onSubmit={saveCourse} className="space-y-4">
              <div><label className="block text-sm mb-1 font-bold">عنوان الدورة <span className="text-red-500">*</span></label><input required value={currentCourse.title||''} onChange={e=>setCurrentCourse({...currentCourse, title:e.target.value})} className="w-full border p-3 rounded bg-slate-50" /></div>
              <div><label className="block text-sm mb-1 font-bold">وصف الدورة</label><textarea value={currentCourse.description||''} onChange={e=>setCurrentCourse({...currentCourse, description:e.target.value})} className="w-full border p-3 rounded bg-slate-50 h-24"></textarea></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1 font-bold">مدة الدورة (مثال: 3 أيام)</label><input type="text" value={currentCourse.duration||''} onChange={e=>setCurrentCourse({...currentCourse, duration:e.target.value})} className="w-full border p-3 rounded bg-slate-50" /></div>
                <div><label className="block text-sm mb-1 font-bold">تاريخ البداية</label><input type="date" value={currentCourse.course_date||''} onChange={e=>setCurrentCourse({...currentCourse, course_date:e.target.value})} className="w-full border p-3 rounded bg-slate-50" /></div>
                <div className="col-span-full"><label className="block text-sm mb-1 font-bold">رابط صورة الدورة</label><input type="text" value={currentCourse.image_url||''} onChange={e=>setCurrentCourse({...currentCourse, image_url:e.target.value})} className="w-full border p-3 rounded bg-slate-50" dir="ltr" /></div>
              </div>
              <label className="flex items-center gap-2 font-bold mt-4"><input type="checkbox" checked={currentCourse.is_visible!==false} onChange={e=>setCurrentCourse({...currentCourse, is_visible:e.target.checked})} className="w-5 h-5 text-primary" /> إظهار الدورة للزوار في الموقع</label>
              <div className="flex gap-4 mt-8 pt-4 border-t"><button type="submit" className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-lg font-bold">حفظ الدورة</button><button type="button" onClick={()=>setIsEditingCourse(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-8 py-3 rounded-lg font-bold">إلغاء</button></div>
            </form>
          </div>
        )}
        
        {/* COURSE QUESTIONS BUILDER */}
        {(managingCourseQuestionsFor) && (
          <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
            <div className="flex items-center gap-4 mb-6"><button onClick={() => setManagingCourseQuestionsFor(null)} className="text-slate-500 text-2xl">&rarr;</button><h2 className="text-2xl font-bold">أسئلة تسجيل دورة: {managingCourseQuestionsFor.title}</h2></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">الأسئلة الحالية</h3>
                {(courseQuestions || []).map(q => (
                  <div key={q.id} className="p-4 bg-slate-50 border rounded flex justify-between">
                    <div><p className="font-bold">{q.question_text}</p><p className="text-sm text-slate-500">النوع: {q.question_type}</p></div>
                    <button onClick={() => deleteCourseQuestion(q.id)} className="text-red-500">حذف</button>
                  </div>
                ))}
              </div>
              <form onSubmit={saveCourseQuestion} className="space-y-4 bg-slate-50 p-6 rounded-xl border">
                <h3 className="font-bold text-lg">إضافة سؤال جديد للتسجيل بالدورة</h3>
                <div><label className="block text-sm mb-1 font-bold">السؤال</label><input required value={newCourseQuestion.question_text} onChange={e=>setNewCourseQuestion({...newCourseQuestion, question_text:e.target.value})} className="w-full border p-3 rounded" /></div>
                <div><label className="block text-sm mb-1 font-bold">النوع</label><select value={newCourseQuestion.question_type} onChange={e=>setNewCourseQuestion({...newCourseQuestion, question_type:e.target.value})} className="w-full border p-3 rounded"><option value="short_text">نصية</option><option value="single_choice">اختيارات</option></select></div>
                {newCourseQuestion.question_type === 'single_choice' && <div><label className="block text-sm mb-1 font-bold">الخيارات (بفاصلة)</label><input required value={newCourseQuestion.optionsStr} onChange={e=>setNewCourseQuestion({...newCourseQuestion, optionsStr:e.target.value})} className="w-full border p-3 rounded" /></div>}
                <button type="submit" className="w-full bg-primary text-white p-3 rounded font-bold">إضافة السؤال</button>
              </form>
            </div>
          </div>
        )}

        {/* ARCHIVE */}
        {activeTab === 'archive' && !archiveView.item && (
          <div>
            <h2 className="text-3xl font-bold mb-6">الأرشيف الشامل (إجابات الجمهور)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-purple-700 border-b pb-2">الاستبيانات العامة</h3>
                <div className="space-y-4">
                  {(surveys || []).map(s => (<div key={s.id} onClick={() => loadArchiveDetails(s, 'survey')} className="bg-white p-4 rounded-xl border cursor-pointer hover:border-purple-500 transition-colors"><h4 className="font-bold">{s.title}</h4></div>))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-blue-700 border-b pb-2">الدورات التدريبية</h3>
                <div className="space-y-4">
                  {(courses || []).map(c => (<div key={c.id} onClick={() => loadArchiveDetails(c, 'course')} className="bg-white p-4 rounded-xl border cursor-pointer hover:border-blue-500 transition-colors"><h4 className="font-bold">{c.title}</h4></div>))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'archive' && archiveView.item && (
           <div>
           <div className="flex items-center gap-4 mb-6"><button onClick={() => setArchiveView({type:null, item:null})} className="text-slate-500 text-2xl">&rarr;</button><h2 className="text-3xl font-bold">سجل مشاركات: {archiveView.item.title}</h2></div>
           <div className="space-y-6">
             {(archiveParticipants || []).map(participant => (
               <div key={participant.id} className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-start border-b pb-4 mb-4">
                   <div><h3 className="font-bold text-xl">{participant.name}</h3><p className="text-slate-500 text-sm">{participant.email || '-'} | <span dir="ltr">{participant.phone || '-'}</span></p></div>
                   <button onClick={() => deleteArchiveParticipant(participant.id)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded font-bold">حذف الإجابة</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(archiveAnswersMap[participant.id] || []).map((ans, i) => (
                     <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                       <p className="text-sm text-slate-500 mb-2 font-bold">{ans.registration_questions?.question_text || ans.survey_questions?.question_text}</p>
                       <p className="font-bold text-lg text-slate-800">{ans.answer_text}</p>
                     </div>
                   ))}
                   {(!archiveAnswersMap[participant.id] || archiveAnswersMap[participant.id].length === 0) && <p className="text-slate-500 text-sm">بدون إجابات إضافية</p>}
                 </div>
               </div>
             ))}
             {(!archiveParticipants || archiveParticipants.length === 0) && <p className="text-slate-500 py-8 text-center">لا توجد مشاركات حتى الآن.</p>}
           </div>
         </div>
        )}
        
        {/* COMMENTS */}
        {activeTab === 'comments' && (
          <div><h2 className="text-3xl font-bold mb-6">المراجعات والتعليقات</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {(comments || []).map(c => (
                <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border"><div className="flex justify-between items-start mb-2"><h4 className="font-bold">{c.name}</h4><span className={`text-xs p-1 rounded font-bold ${c.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>{c.status}</span></div><p className="mb-4">"{c.comment}"</p><div className="flex gap-2">{c.status !== 'approved' && <button onClick={() => handleUpdateCommentStatus(c.id, 'approved')} className="bg-green-100 text-green-700 px-3 py-1 rounded font-bold hover:bg-green-200">قبول وإظهار</button>}<button onClick={() => handleUpdateCommentStatus(c.id, 'hidden')} className="bg-slate-200 px-3 py-1 rounded font-bold hover:bg-slate-300">إخفاء</button></div></div>
              ))}
              {(!comments || comments.length === 0) && <p className="col-span-2 text-center py-8 text-slate-500">لا توجد تعليقات.</p>}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
export default Dashboard;
