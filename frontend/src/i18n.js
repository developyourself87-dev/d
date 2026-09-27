import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      home: "الرئيسية",
      courses: "الدورات",
      contact: "تواصل معنا",
      aboutTrainer: "نبذة شخصية",
      works: "الإنجازات",
      comments: "آراء المتدربين",
      register: "سجل الآن",
      privacyConsent: "أوافق على سياسة الخصوصية",
      submit: "إرسال",
      successMsg: "تمت العملية بنجاح!",
      errorMsg: "حدث خطأ، يرجى المحاولة لاحقاً.",
      loading: "جاري التحميل...",
      adminDashboard: "لوحة التحكم",
      language: "اللغة",
      experience: "الخبرات",
      qualifications: "المؤهلات",
      notableWorks: "إنجازات ومشاريع بارزة",
      participantReviews: "آراء المشاركين وتجاربهم",
      addReview: "أضف رأيك",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      rating: "التقييم:",
      contactDirectly: "تواصل معنا مباشرة",
      name: "الاسم",
      message: "الرسالة",
      sendMessage: "إرسال الرسالة",
      coursesSubtitle: "اكتشف مجموعة الدورات التدريبية المتاحة وسجل الآن للبدء في رحلتك نحو التميز.",
      sitemap: "خريطة الموقع"
    }
  },
  en: {
    translation: {
      home: "Home",
      courses: "Courses",
      contact: "Contact Us",
      aboutTrainer: "Personal Bio",
      works: "Achievements",
      comments: "Testimonials",
      register: "Register Now",
      privacyConsent: "I agree to the privacy policy",
      submit: "Submit",
      successMsg: "Operation successful!",
      errorMsg: "An error occurred, please try again.",
      loading: "Loading...",
      adminDashboard: "Dashboard",
      language: "Language",
      experience: "Experience",
      qualifications: "Qualifications",
      notableWorks: "Notable achievements & projects",
      participantReviews: "Participants' reviews and experiences",
      addReview: "Add your review",
      fullName: "Full Name",
      email: "Email",
      rating: "Rating:",
      contactDirectly: "Contact us directly",
      name: "Name",
      message: "Message",
      sendMessage: "Send Message",
      coursesSubtitle: "Discover the available training courses and register now to start your journey towards excellence.",
      sitemap: "Sitemap"
    }
  },
  fr: {
    translation: {
      home: "Accueil",
      courses: "Cours",
      contact: "Contactez-nous",
      aboutTrainer: "Biographie",
      works: "Réalisations",
      comments: "Témoignages",
      register: "S'inscrire",
      privacyConsent: "J'accepte la politique de confidentialité",
      submit: "Envoyer",
      successMsg: "Opération réussie !",
      errorMsg: "Une erreur s'est produite, veuillez réessayer.",
      loading: "Chargement...",
      adminDashboard: "Tableau de bord",
      language: "Langue",
      experience: "Expériences",
      qualifications: "Qualifications",
      notableWorks: "Réalisations et projets notables",
      participantReviews: "Avis et expériences des participants",
      addReview: "Ajoutez votre avis",
      fullName: "Nom complet",
      email: "E-mail",
      rating: "Évaluation :",
      contactDirectly: "Contactez-nous directement",
      name: "Nom",
      message: "Message",
      sendMessage: "Envoyer le message",
      coursesSubtitle: "Découvrez les formations disponibles et inscrivez-vous dès maintenant pour commencer votre parcours vers l'excellence.",
      sitemap: "Plan du site"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
