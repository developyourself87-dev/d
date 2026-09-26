const axios = require('axios');

async function runTests() {
  console.log("=== بدء الاختبار التقني ===");
  const API_URL = 'http://localhost:5000/api';
  
  try {
    // 1. Test Health
    console.log("1. جاري اختبار حالة الخادم...");
    const healthRes = await axios.get('http://localhost:5000/health');
    console.log("   حالة الخادم:", healthRes.data);

    // 2. Test Contact Us Endpoint
    console.log("2. جاري اختبار نقطة نهاية (Contact Us)...");
    const contactData = {
      name: "مستخدم تجريبي",
      email: "test@example.com",
      message: "هذه رسالة تجريبية من السكربت الآلي."
    };
    
    try {
      const contactRes = await axios.post(`${API_URL}/contact`, contactData);
      console.log("   نتيجة الإرسال:", contactRes.data);
    } catch (err) {
      console.error("   خطأ في رسالة اتصل بنا:", err.response?.data || err.message);
    }

    // 3. Test Registration Endpoint
    // We need a dummy courseId. Since we don't know any valid UUID in the DB, this might fail with "Course not found", which is expected if the DB is empty.
    // If it fails with "Course not found", we know the DB connection works and it properly queried the courses table!
    console.log("3. جاري اختبار نقطة نهاية (Registration)...");
    const regData = {
      courseId: "00000000-0000-0000-0000-000000000000",
      name: "طالب تجريبي",
      email: "student@example.com",
      phone: "0555555555",
      privacyConsent: true,
      answers: {}
    };

    try {
      const regRes = await axios.post(`${API_URL}/register`, regData);
      console.log("   نتيجة التسجيل:", regRes.data);
    } catch (err) {
      console.error("   استجابة نظام التسجيل (متوقعة إذا لم يكن هناك دورات):", err.response?.data || err.message);
    }
    
    console.log("=== انتهى الاختبار ===");
  } catch (error) {
    console.error("فشل الاختبار العام:", error.message);
  }
}

runTests();
