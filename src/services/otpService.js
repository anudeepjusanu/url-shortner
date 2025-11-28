const axios = require('axios');

const AUTHENTICA_API = 'https://api.authentica.sa/api/v2';
const AUTHENTICA_KEY = process.env.AUTHENTICA_KEY || '<YOUR_AUTHENTICA_KEY>'; // Store securely

const sendOtp = async ({ phone, email, otp, method = 'sms', template_id = 31 }) => {
  return axios.post(`${AUTHENTICA_API}/send-otp`, {
    method,
    phone,
    template_id,
    fallback_email: email,
    otp
  }, {
    headers: {
      'Accept': 'application/json',
      'X-Authorization': AUTHENTICA_KEY,
      'Content-Type': 'application/json'
    }
  });
};

const verifyOtp = async ({ phone, email, otp }) => {
  return axios.post(`${AUTHENTICA_API}/verify-otp`, {
    phone,
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
