const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { sendWhatsAppMessage } = require('../services/whatsapp');

router.post('/', async (req, res) => {
  try {
    const { courseId, name, email, phone, privacyConsent, answers } = req.body;

    if (!courseId || !name || !email || !phone || !privacyConsent) {
      return res.status(400).json({ error: 'Missing required fields or privacy consent not checked' });
    }

    // 1. Fetch course details to get the custom WhatsApp message
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, whatsapp_message, registration_redirect_type, registration_redirect_url')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 2. Save Registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert({
        course_id: courseId,
        name,
        email,
        phone,
        privacy_consent: privacyConsent
      })
      .select()
      .single();

    if (regError) {
      return res.status(500).json({ error: 'Failed to save registration', details: regError.message });
    }

    // 3. Save Answers if provided
    if (answers && Object.keys(answers).length > 0) {
      const answerRecords = Object.entries(answers).map(([question_id, answer_text]) => ({
        registration_id: registration.id,
        question_id,
        answer_text: typeof answer_text === 'object' ? JSON.stringify(answer_text) : String(answer_text)
      }));

      const { error: ansError } = await supabase
        .from('registration_answers')
        .insert(answerRecords);

      if (ansError) {
        console.error("Failed to save answers:", ansError);
      }
    }

    // 4. Create Notification
    await supabase.from('notifications').insert({
      type: 'new_registration',
      title: 'تسجيل جديد',
      message: `تم تسجيل مشارك جديد (${name}) في دورة: ${course.title}`,
      related_id: registration.id
    });

    // 5. Send WhatsApp Message
    // Make sure phone number is formatted correctly for WhatsApp API (e.g. 213XXXXXXXXX)
    let formattedPhone = phone.replace(/\D/g, ''); 
    // Basic Algerian prefix fallback if local number provided (assuming 05/06/07 start)
    if (formattedPhone.startsWith('0') && formattedPhone.length === 10) {
      formattedPhone = '213' + formattedPhone.substring(1);
    }
    
    let messageText = course.whatsapp_message || `مرحباً ${name}، شكراً لتسجيلك في دورة ${course.title}.`;
    messageText = messageText.replace('{{name}}', name).replace('{{course}}', course.title);

    const waResult = await sendWhatsAppMessage(formattedPhone, messageText);

    // 6. Log WhatsApp Status
    await supabase.from('whatsapp_logs').insert({
      registration_id: registration.id,
      phone: formattedPhone,
      message: messageText,
      status: waResult.success ? 'sent' : 'failed',
      provider_message_id: waResult.messageId || null,
      error_message: waResult.error || null,
      sent_at: waResult.success ? new Date() : null,
      failed_at: !waResult.success ? new Date() : null
    });

    if (!waResult.success) {
      await supabase.from('notifications').insert({
        type: 'whatsapp_failed',
        title: 'فشل إرسال WhatsApp',
        message: `فشل إرسال رسالة إلى ${name} (دورة: ${course.title}). السبب: ${waResult.error}`,
        related_id: registration.id
      });
    }

    // 7. Return Response
    return res.status(200).json({
      success: true,
      registrationId: registration.id,
      redirectType: course.registration_redirect_type,
      redirectUrl: course.registration_redirect_url
    });

  } catch (err) {
    console.error("Registration endpoint error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
