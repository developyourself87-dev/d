import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      home: "الرئيسية",
      courses: "الدورات",
      contact: "اتصل بنا",
      aboutTrainer: "عن المدربة",
      works: "الإنجازات",
      comments: "آراء المشاركين",
      register: "سجل الآن",
      privacyConsent: "أوافق على سياسة الخصوصية",
      submit: "إرسال",
      successMsg: "تمت العملية بنجاح!",
      errorMsg: "حدث خطأ، يرجى المحاولة لاحقاً.",
      loading: "جاري التحميل...",
      adminDashboard: "لوحة التحكم",
      language: "اللغة"
    }
  },
  en: {
    translation: {
      home: "Home",
      courses: "Courses",
      contact: "Contact Us",
      aboutTrainer: "About Trainer",
      works: "Achievements",
      comments: "Testimonials",
      register: "Register Now",
      privacyConsent: "I agree to the privacy policy",
      submit: "Submit",
      successMsg: "Operation successful!",
      errorMsg: "An error occurred, please try again.",
      loading: "Loading...",
      adminDashboard: "Dashboard",
      language: "Language"
    }
  },
  fr: {
    translation: {
      home: "Accueil",
      courses: "Cours",
      contact: "Contactez-nous",
      aboutTrainer: "À propos du Formateur",
      works: "Réalisations",
      comments: "Témoignages",
      register: "S'inscrire",
      privacyConsent: "J'accepte la politique de confidentialité",
      submit: "Envoyer",
      successMsg: "Opération réussie !",
      errorMsg: "Une erreur s'est produite, veuillez réessayer.",
      loading: "Chargement...",
      adminDashboard: "Tableau de bord",
      language: "Langue"
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
