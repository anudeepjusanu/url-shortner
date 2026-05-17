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
const INDIA_PHONE_REGEX = /^[6-9]\d{9}$/;

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
  Math.floor(1000 + Math.random() * 9000).toString();

const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
};

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    // Look up user by googleId first, then by email (case-insensitive)
    let existingUser = await User.findOne({ googleId: googleUser.googleId });

    const emailRegex = new RegExp(`^${escapeRegex(googleUser.email)}$`, 'i');
    if (!existingUser) {
      existingUser = await User.findOne({ email: { $regex: emailRegex } });
    }

    if (existingUser) {
      // Existing user — log them in immediately (account linking)
      if (!existingUser.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account deactivated',
        });
      }

      existingUser.lastLogin = new Date();

      // Track whether account is being linked this login
      const wasLinked = !existingUser.googleId;

      // Update googleId if not already set (account linking)
      if (!existingUser.googleId) {
        console.log('Account linking: Adding Google ID to existing manual account');
        existingUser.googleId = googleUser.googleId;
      }

      // Update email if it changed (Google users can change emails)
      if (existingUser.email !== googleUser.email) {
        existingUser.email = googleUser.email;
      }

      // Update name fields if they're empty and Google provides them
      if (!existingUser.firstName && googleUser.firstName) {
        existingUser.firstName = googleUser.firstName;
      }
      if (!existingUser.lastName && googleUser.lastName) {
        existingUser.lastName = googleUser.lastName;
      }

      await existingUser.save();
      await setUserCache(existingUser);

      const { accessToken, refreshToken } = generateTokens(existingUser._id);

      return res.json({
        success: true,
        message: 'Login successful',
        isExistingUser: true,
        accountLinked: wasLinked, // Indicate if account was just linked
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

    // Validate phone number is Saudi or India format
    const isSaudiNumber = SAUDI_PHONE_REGEX.test(phoneNumber);
    const isIndiaNumber = INDIA_PHONE_REGEX.test(phoneNumber);
    
    if (!isSaudiNumber && !isIndiaNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid mobile number (Saudi: 5XXXXXXXX or India: 9XXXXXXXXX)',
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

    // Determine country code based on phone number format
    const countryCode = isSaudiNumber ? '+966' : '+91';
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // Update session with new OTP
    session.otp = otp;
    session.phone = fullPhoneNumber;
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

    // OTP verified — check if user exists by googleId first, then email (case-insensitive)
    let existingUserForLinking = await User.findOne({ googleId: session.googleId });

    const emailRegex = new RegExp(`^${escapeRegex(session.email)}$`, 'i');
    if (!existingUserForLinking) {
      existingUserForLinking = await User.findOne({ email: { $regex: emailRegex } });
    }
    
    let user;
    if (existingUserForLinking) {
      // Account linking: This shouldn't happen normally, but handle it gracefully
      console.log('Account linking during Google signup: User exists, linking Google ID');
      
      if (!existingUserForLinking.googleId) {
        existingUserForLinking.googleId = session.googleId;
      }
      
      // Update email if it changed
      if (existingUserForLinking.email !== session.email) {
        existingUserForLinking.email = session.email;
      }
      
      // Update phone if provided and not already set
      if (session.phone && !existingUserForLinking.phone) {
        existingUserForLinking.phone = session.phone;
      }
      
      // Update name if not already set
      if (!existingUserForLinking.firstName && session.firstName) {
        existingUserForLinking.firstName = session.firstName;
      }
      if (!existingUserForLinking.lastName && session.lastName) {
        existingUserForLinking.lastName = session.lastName;
      }
      
      existingUserForLinking.lastLogin = new Date();
      await existingUserForLinking.save();
      user = existingUserForLinking;
      console.log('Account linked successfully during Google signup:', user.email);
    } else {
      // Create new user account
      const clientIP = getClientIP(req);
      let registrationLocation = null;
      try {
        registrationLocation = await getLocationFromIP(clientIP);
      } catch (locError) {
        console.error('Failed to get location:', locError.message);
      }

      user = new User({
        email: session.email,
        firstName: session.firstName,
        lastName: session.lastName || undefined,
        phone: session.phone,
        googleId: session.googleId,
        isEmailVerified: true,
        registrationLocation,
      });

      try {
        await user.save();
      } catch (saveError) {
        // Handle duplicate key errors (race condition or missing index)
        if (saveError.code === 11000) {
          console.log('Duplicate key error during Google signup, re-querying existing user');
          let fallbackUser = await User.findOne({ googleId: session.googleId });
          if (!fallbackUser) {
            fallbackUser = await User.findOne({ email: { $regex: emailRegex } });
          }
          if (fallbackUser) {
            fallbackUser.lastLogin = new Date();
            await fallbackUser.save();
            user = fallbackUser;
          } else {
            throw saveError;
          }
        } else {
          throw saveError;
        }
      }
    }

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
