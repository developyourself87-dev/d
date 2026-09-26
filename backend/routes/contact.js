const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Basic spam protection (e.g., checking for links if not allowed, or just relying on CAPTCHA in frontend if added later)
    let isSpam = false;
    let spamReason = null;

    if (message.includes('http://') || message.includes('https://')) {
      isSpam = true;
      spamReason = 'Contains URLs';
    }

    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        message,
        is_spam: isSpam,
        spam_reason: spamReason
      });

    if (error) {
      return res.status(500).json({ error: 'Failed to save message', details: error.message });
    }

    return res.status(200).json({ success: true, message: 'Message received successfully' });

  } catch (err) {
    console.error("Contact endpoint error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
