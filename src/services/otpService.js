const axios = require('axios');

const AUTHENTICA_API = 'https://api.authentica.sa/api/v2';
const AUTHENTICA_KEY = process.env.AUTHENTICA_KEY || "$2y$10$/JIkKbANcOor4YMkpEUDhu3GsySiTZkNFy9nwV4g6uQ.m9s8LlF6G";

const isProduction = process.env.NODE_ENV === 'production';

const sendOtp = async ({ email, phone, otp, method = 'email', template_id = 31 }) => {
  if (method === 'sms' && !phone) {
    throw new Error('Phone number is required for SMS OTP');
  }

  if (method === 'email' && !email) {
    throw new Error('Email is required for email OTP');
  }

  // Non-production mode - always log OTP to console for testing
  if (!isProduction) {
    console.log('\n🔐 ===== OTP SENT =====');
    console.log('📱 Phone:', phone || 'N/A');
    console.log('📧 Email:', email || 'N/A');
    console.log('🔢 OTP Code:', otp);
    console.log('======================\n');
  }

  try {
    // Build request payload based on method
    const payload = {
      method,
      template_id,
      otp
    };

    // When method is email, use 'email' field
    if (method === 'email') {
      payload.email = email;
    } else {
      payload.phone = phone;
      if (email) {
        payload.fallback_email = email;
      }
    }

    return await axios.post(`${AUTHENTICA_API}/send-otp`, payload, {
      headers: {
        'Accept': 'application/json',
        'X-Authorization': AUTHENTICA_KEY,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Authentica API Error:', error.response?.data || error.message);
    // In non-production, still allow registration even if Authentica fails
    if (!isProduction) {
      console.warn('⚠️  Authentica failed, but allowing in dev mode. Check console for OTP.');
      return { data: { success: true, message: 'OTP logged to console (Authentica unavailable)' } };
    }
    throw error;
  }
};

const verifyOtp = async ({ email, phone, otp, method = 'email' }) => {
  const payload = { otp };

  if (method === 'sms') {
    payload.phone = phone;
  } else {
    payload.email = email;
  }

  return axios.post(`${AUTHENTICA_API}/verify-otp`, payload, {
    headers: {
      'Accept': 'application/json',
      'X-Authorization': AUTHENTICA_KEY,
      'Content-Type': 'application/json'
    }
  });
};

module.exports = { sendOtp, verifyOtp };
