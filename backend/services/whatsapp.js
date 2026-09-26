const axios = require('axios');
require('dotenv').config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

const sendWhatsAppMessage = async (to, messageText) => {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn("WhatsApp API credentials missing. Simulating message send.");
    console.log(`To: ${to}, Message: ${messageText}`);
    return { success: true, messageId: 'simulated-id' };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: messageText
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return { 
      success: true, 
      messageId: response.data.messages?.[0]?.id 
    };
  } catch (error) {
    console.error("WhatsApp Error:", error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
};

module.exports = {
  sendWhatsAppMessage
};
