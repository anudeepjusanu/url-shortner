const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const config = require('../config/environment');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const { getLocationFromIP, getClientIP } = require('../services/geoLocationService');

const SAUDI_PHONE_REGEX = /^5\d{8}$/;

const googleClient = new OAuth2Client({
  clientId: config.GOOGLE_AUTH.CLIENT_ID,
  clientSecret: config.GOOGLE_AUTH.CLIENT_SECRET,
});

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
  const refreshToken = jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRE,
  });
  return { accessToken, refreshToken };
};

const generateOtpCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
};

const buildUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  role: user.role,
  organization: user.organization,
  isEmailVerified: user.isEmailVerified,
  lastLogin: user.lastLogin,
});

const setUserCache = async (user) => {
  await cacheSet(
    `user:${user._id}`,
    {
      id: user._id,
      email: user.email,
      role: user.role,
      organization: user.organization,
    },
    config.CACHE_TTL.USER_CACHE,
  );
};

const verifyGoogleToken = async (params) => {
  const { credential, accessToken } = params;

  // If credential (ID token) provided, verify with google-auth-library
  if (credential) {
    const audiences = [
      config.GOOGLE_AUTH.CLIENT_ID,
      config.GOOGLE_AUTH.IOS_CLIENT_ID,
      config.GOOGLE_AUTH.ANDROID_CLIENT_ID,
    ].filter(Boolean);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: audiences.length > 0 ? audiences : undefined,
    });

    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      picture: payload.picture || '',
      emailVerified: payload.email_verified || false,
    };
  }

  // If access token provided, call Google userinfo API
  if (accessToken) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      googleId: data.sub,
      email: data.email,
      firstName: data.given_name || '',
      lastName: data.family_name || '',
      picture: data.picture || '',
      emailVerified: data.email_verified !== false,
    };
  }

  throw new Error('No credential or access token provided');
};

// Step 1: Authenticate with Google token
const googleAuthenticate = async (req, res) => {
  try {
    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google credential or access token is required',
      });
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleToken({ credential, accessToken });
    } catch (err) {
      console.error('Google token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credential',
      });
    }

    if (!googleUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Google account email is not verified',
      });
    }

    // Check if user exists with this email
    const existingUser = await User.findOne({ email: googleUser.email });

    if (existingUser) {
      // Existing user — log them in immediately
      if (!existingUser.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account deactivated',
        });
      }

      existingUser.lastLogin = new Date();

      // Update googleId if not already set
      if (!existingUser.googleId) {
        existingUser.googleId = googleUser.googleId;
      }

      await existingUser.save();
      await setUserCache(existingUser);

      const { accessToken, refreshToken } = generateTokens(existingUser._id);

      return res.json({
        success: true,
        message: 'Login successful',
        isExistingUser: true,
        data: {
          user: buildUserResponse(existingUser),
          accessToken,
          refreshToken,
        },
      });
    }

    // New user — create a temporary session for phone verification
    const sessionToken = jwt.sign(
      {
        googleId: googleUser.googleId,
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        picture: googleUser.picture,
      },
      config.JWT_SECRET,
      { expiresIn: '10m' },
    );

    // Store Google user data in cache for 10 minutes
    const cacheKey = `google_signup:${sessionToken}`;
    await cacheSet(
      cacheKey,
      JSON.stringify({
        googleId: googleUser.googleId,
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        picture: googleUser.picture,
        otpAttempts: 0,
        otpResends: 0,
        locked: false,
      }),
      10 * 60,
    );

    return res.json({
      success: true,
      message: 'Mobile number verification required',
      isExistingUser: false,
      data: {
        sessionToken,
        requiresPhoneVerification: true,
      },
    });
  } catch (error) {
    console.error('Google authenticate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Step 2: Send OTP to Saudi phone number for new Google user
const sendGoogleSignupOTP = async (req, res) => {
  try {
    const { sessionToken, phoneNumber } = req.body;

    if (!sessionToken || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Session token and phone number are required',
      });
    }

    // Validate phone number is Saudi format (starts with 5, exactly 9 digits)
    if (!SAUDI_PHONE_REGEX.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Saudi mobile number (e.g., 5XXXXXXXX)',
      });
    }

    // Verify session token
    let decoded;
    try {
      decoded = jwt.verify(sessionToken, config.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please try signing up again.',
      });
    }

    const cacheKey = `google_signup:${sessionToken}`;
    const cachedData = await cacheGet(cacheKey);

    if (!cachedData) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please try signing up again.',
      });
    }

    const session = JSON.parse(cachedData);

    if (session.locked) {
      return res.status(423).json({
        success: false,
        message: 'Verification locked due to too many failed attempts. Please try again later.',
      });
    }

    if (session.otpResends >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Maximum OTP resends reached. Please try signing up again.',
      });
    }

    const otp = generateOtpCode();

    // Update session with new OTP
    session.otp = otp;
    session.phone = `+966${phoneNumber}`;
    session.otpExpiresAt = Date.now() + 5 * 60 * 1000;
    session.otpResends = (session.otpResends || 0) + 1;

    await cacheSet(cacheKey, JSON.stringify(session), 10 * 60);

    // Send OTP via SMS
    await otpService.sendOtp({
      email: session.email,
      phone: session.phone,
      otp,
      method: 'sms',
    });

    return res.json({
      success: true,
      message: 'Verification code sent to your mobile number',
      data: {
        phone: maskPhone(session.phone),
        expiresIn: 300,
      },
    });
  } catch (error) {
    console.error('Google signup send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Step 3: Verify OTP and create account
const verifyGoogleSignupOTP = async (req, res) => {
  try {
    const { sessionToken, otp } = req.body;

    if (!sessionToken || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Session token and OTP are required',
      });
    }

    // Verify session token
    let decoded;
    try {
      decoded = jwt.verify(sessionToken, config.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please try signing up again.',
      });
    }

    const cacheKey = `google_signup:${sessionToken}`;
    const cachedData = await cacheGet(cacheKey);

    if (!cachedData) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please try signing up again.',
      });
    }

    let session = JSON.parse(cachedData);

    if (session.locked) {
      return res.status(423).json({
        success: false,
        message: 'Verification locked due to too many failed attempts. Please try again later.',
      });
    }

    if (!session.otp || !session.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No OTP was sent. Please request a verification code first.',
      });
    }

    if (Date.now() > session.otpExpiresAt) {
      return res.status(401).json({
        success: false,
        message: 'OTP expired. Please request a new one.',
      });
    }

    if (session.otp !== otp) {
      session.otpAttempts = (session.otpAttempts || 0) + 1;

      if (session.otpAttempts >= 5) {
        session.locked = true;
        await cacheSet(cacheKey, JSON.stringify(session), 10 * 60);
        return res.status(423).json({
          success: false,
          message: 'Too many failed attempts. Verification locked. Please try again later.',
        });
      }

      await cacheSet(cacheKey, JSON.stringify(session), 10 * 60);
      return res.status(401).json({
        success: false,
        message: `Invalid verification code. ${5 - session.otpAttempts} attempts remaining.`,
      });
    }

    // OTP verified — create the user account
    const clientIP = getClientIP(req);
    let registrationLocation = null;
    try {
      registrationLocation = await getLocationFromIP(clientIP);
    } catch (locError) {
      console.error('Failed to get location:', locError.message);
    }

    const user = new User({
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName || undefined,
      phone: session.phone,
      googleId: session.googleId,
      isEmailVerified: true,
      registrationLocation,
    });

    await user.save();

    // Clear session from cache
    await cacheDel(cacheKey);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Send admin notification
    try {
      await emailService.sendAdminNotification(user);
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    await setUserCache(user);

    const { accessToken, refreshToken } = generateTokens(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: buildUserResponse(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Google signup verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Step: Cancel Google signup (discard session)
const cancelGoogleSignup = async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      const cacheKey = `google_signup:${sessionToken}`;
      await cacheDel(cacheKey);
    }

    return res.json({
      success: true,
      message: 'Sign-up cancelled',
    });
  } catch (error) {
    console.error('Cancel Google signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel sign-up',
    });
  }
};

module.exports = {
  googleAuthenticate,
  sendGoogleSignupOTP,
  verifyGoogleSignupOTP,
  cancelGoogleSignup,
};
