const axios = require('axios');

const AUTHENTICA_API = 'https://api.authentica.sa/api/v2';
const AUTHENTICA_KEY = "$2y$10$/JIkKbANcOor4YMkpEUDhu3GsySiTZkNFy9nwV4g6uQ.m9s8LlF6G"; // Store securely

const sendOtp = async ({  email, otp, method = 'email', template_id = 31 }) => {
  // Development mode - log OTP to console for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔐 ===== OTP SENT =====');
    // console.log('📱 Phone:', phone || 'N/A');
    console.log('📧 Email:', email || 'N/A');
    console.log('🔢 OTP Code:', otp);
    console.log('======================\n');
  }
  console.log('Sending OTP via Authentica API...');
  console.log('Email:', email);
  console.log('Method:', method);

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
      // When method is SMS, use fallback_email for email fallback
      payload.fallback_email = email;
    }

    console.log('Authentica payload:', JSON.stringify(payload, null, 2));

    return await axios.post(`${AUTHENTICA_API}/send-otp`, payload, {
      headers: {
        'Accept': 'application/json',
        'X-Authorization': AUTHENTICA_KEY,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Authentica API Error:', error.response?.data || error.message);
    // In development, still allow login even if Authentica fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Authentica failed, but allowing in dev mode. Check console for OTP.');
      return { data: { success: true, message: 'OTP logged to console (Authentica unavailable)' } };
    }
    throw error;
  }
};

const verifyOtp = async ({ email, otp }) => {
  return axios.post(`${AUTHENTICA_API}/verify-otp`, {
    // phone,
    email,
    otp
  }, {
    headers: {
      'Accept': 'application/json',
      'X-Authorization': AUTHENTICA_KEY,
      'Content-Type': 'application/json'
    }
  });
};

module.exports = { sendOtp, verifyOtp };
