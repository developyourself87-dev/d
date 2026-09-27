import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import RegistrationModal from '../components/RegistrationModal';
import { motion, AnimatePresence } from 'framer-motion';

const Courses = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order');
      if (data) setCourses(data);
    }
    fetchCourses();
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Video Header */}
      <section className="video-overlay h-[60vh] md:h-[70vh] flex items-center relative overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-70">
          <source src="https://cdn.pixabay.com/video/2021/02/17/64898-514209942_large.mp4" type="video/mp4" />
        </video>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-text-main text-contrast-shadow mb-6 tracking-tight">{t('courses')}</h1>
          <p className="text-text-main text-contrast-shadow text-sm md:text-lg max-w-2xl mx-auto font-bold">اكتشف مجموعة الدورات التدريبية المتاحة وسجل الآن للبدء في رحلتك نحو التميز.</p>
        </motion.div>
      </section>

      {/* Courses Grid */}
      <section className="neon-grid py-20 md:py-32">
        <div className="container mx-auto px-4 relative z-10">
          
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {courses.map((course) => (
              <motion.div key={course.id} variants={fadeUp} className="glass-card rounded-3xl overflow-hidden glow-border group flex flex-col hover:-translate-y-2 transition-all duration-500 shadow-xl">
                {course.image_url && (
                  <div className="overflow-hidden relative h-56">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                )}
                <div className="p-8 flex-grow flex flex-col relative z-20">
                  <h3 className="text-xl font-bold text-text-main mb-3">{course.title}</h3>
                  <p className="text-text-muted text-sm mb-6 line-clamp-3 leading-relaxed">{course.description}</p>
                  
                  <div className="mt-auto space-y-3 text-sm text-text-main bg-dark-surface/50 p-4 rounded-2xl border border-dark-border mb-6">
                    {course.duration && <p className="flex justify-between items-center"><span className="text-primary font-bold">المدة:</span> <span className="font-medium text-text-muted">{course.duration}</span></p>}
                    {course.course_date && <p className="flex justify-between items-center"><span className="text-primary font-bold">التاريخ:</span> <span className="font-medium text-text-muted">{new Date(course.course_date).toLocaleDateString()}</span></p>}
                  </div>
                  
                  <button 
                    onClick={() => setSelectedCourse(course)}
                    className="w-full neon-btn py-4 px-4 rounded-xl text-sm font-bold tracking-wider uppercase"
                  >
                    {t('register')}
                  </button>
                </div>
              </motion.div>
            ))}
            {courses.length === 0 && (
              <div className="col-span-full text-center text-text-subtle py-10">لا توجد دورات متاحة حالياً.</div>
            )}
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {selectedCourse && (
          <RegistrationModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Courses;
