const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const config = require("../config/environment");
const { cacheSet, cacheDel, cacheGet } = require("../config/redis");
const emailService = require("../services/emailService");
const { UsageTracker } = require("../middleware/usageTracker");
const otpService = require("../services/otpService");
const {
  getLocationFromIP,
  getClientIP,
} = require("../services/geoLocationService");
const { normalizeEmail } = require("../utils/normalizeEmail");
const { createLogger } = require("../utils/logger");

const logger = createLogger("AuthController");

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

const generateOtpCode = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

const normalizePhone = (phone) => {
  if (!phone) return undefined;

  let normalized = String(phone).trim();

  // Remove all whitespace
  normalized = normalized.replace(/\s+/g, "");

  // If phone starts with 0, remove it (common in many countries)
  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  // If phone doesn't start with +, add the + prefix for international format
  if (!normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }

  return normalized;
};

const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });

  const refreshToken = jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRE,
  });

  return { accessToken, refreshToken };
};

const sendRegistrationOTP = async (req, res) => {
  logger.request(req, "sendRegistrationOTP called", {
    email: req.body?.email,
    phone: req.body?.phone ? maskPhone(normalizePhone(req.body.phone)) : undefined,
  });

  try {
    const { email, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail) {
      logger.request(req, "sendRegistrationOTP validation failed: Email is required", {
        requestId: req.requestId,
      });
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // If user has a Google account but no password, allow them to add password (account linking)
      if (existingUser.googleId && !existingUser.password) {
        logger.info("Account linking: Allowing OTP for existing Google account", {
          requestId: req.requestId,
          email: normalizedEmail,
        });
        // Continue with OTP flow to allow account linking
      } else {
        // User already has a complete account
        logger.request(req, "sendRegistrationOTP failed: Email already registered", {
          requestId: req.requestId,
          email: normalizedEmail,
        });
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    const otp = generateOtpCode();

    // Store OTP in cache with normalized email as key for 5 minutes
    const otpKey = `registration_otp:${normalizedEmail}`;
    await cacheSet(otpKey, otp, 5 * 60); // 5 minutes TTL

    // Determine method based on available contact info
    const method = normalizedPhone ? "sms" : "email";
    const targetPhone = normalizedPhone || undefined;

    // Send OTP via SMS or email (Authentica handles fallback)
    await otpService.sendOtp({ email: normalizedEmail, phone: targetPhone, otp, method });

    const message = normalizedPhone
      ? "OTP sent to your phone number. Please verify to complete registration."
      : "OTP sent to your email. Please verify to complete registration.";

    logger.request(req, "sendRegistrationOTP completed", {
      requestId: req.requestId,
      email: normalizedEmail,
      method,
    });

    return res.status(200).json({
      success: true,
      message,
      data: {
        email: normalizedEmail,
        phone: normalizedPhone ? maskPhone(normalizedPhone) : undefined,
        otpSent: true,
      },
    });
  } catch (error) {
    logger.requestError(req, "sendRegistrationOTP failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const checkEmail = async (req, res) => {
  logger.request(req, "checkEmail called", { email: req.body?.email });
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const user = await User.findOne({ email: normalizedEmail });
    return res.json({
      success: true,
      exists: !!user,
      hasPassword: user ? !!user.password : false,
    });
  } catch (error) {
    logger.requestError(req, "checkEmail failed", error, { requestId: req.requestId });
    res.status(500).json({
      success: false,
      message: "Failed to check email",
    });
  }
};

const register = async (req, res) => {
  logger.request(req, "register called", {
    email: req.body?.email,
  });

  try {
    const { email, password, fullName, phone, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail) {
      logger.request(req, "register validation failed: Email is required", {
        requestId: req.requestId,
      });
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // If user has a Google account but no password, allow them to add password (account linking)
      if (existingUser.googleId && !existingUser.password) {
        // This is account linking - allow them to add password to their Google account
        logger.info("Account linking: Adding password to existing Google account", {
          requestId: req.requestId,
          email: normalizedEmail,
        });
        // Continue with the flow to add password
      } else {
        // User already has a complete account (either manual or Google with password)
        logger.request(req, "register failed: Email already registered", {
          requestId: req.requestId,
          email: normalizedEmail,
        });
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    // If OTP not provided, store registration data and send OTP
    if (!otp) {
      try {
        const generatedOtp = generateOtpCode();

        // Store both OTP and registration data in cache for 5 minutes
        const otpKey = `registration_otp:${normalizedEmail}`;
        const dataKey = `registration_data:${normalizedEmail}`;

        // Hash the password before caching so plaintext is never persisted in Redis
        const hashedPassword = await bcrypt.hash(password, 12);

        await cacheSet(otpKey, generatedOtp, 5 * 60); // 5 minutes TTL
        await cacheSet(
          dataKey,
          JSON.stringify({ email: normalizedEmail, hashedPassword, fullName, phone: normalizedPhone }),
          5 * 60,
        );

        // Determine method based on available contact info
        const method = normalizedPhone ? "sms" : "email";
        const targetPhone = normalizedPhone || undefined;

        // Send OTP via SMS or email (Authentica handles fallback)
        await otpService.sendOtp({
          email: normalizedEmail,
          phone: targetPhone,
          otp: generatedOtp,
          method,
        });

        const message = normalizedPhone
          ? "OTP sent to your phone number. Please verify to complete registration."
          : "OTP sent to your email. Please verify to complete registration.";

        logger.request(req, "register OTP sent", {
          requestId: req.requestId,
          email: normalizedEmail,
          method,
        });

        return res.status(202).json({
          success: true,
          message,
          data: {
            otpSent: true,
            email: normalizedEmail,
            phone: normalizedPhone ? maskPhone(normalizedPhone) : undefined,
          },
        });
      } catch (err) {
        logger.requestError(req, "register failed to send OTP", err, {
          requestId: req.requestId,
        });
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    } else {
      // Verify OTP from cache
      const otpKey = `registration_otp:${normalizedEmail}`;
      const dataKey = `registration_data:${normalizedEmail}`;

      const storedOtp = await cacheGet(otpKey);
      const storedData = await cacheGet(dataKey);

      if (!storedOtp || !storedData) {
        logger.request(req, "register failed: OTP expired or invalid", {
          requestId: req.requestId,
          email: normalizedEmail,
        });
        return res.status(401).json({
          success: false,
          message: "OTP expired or invalid. Please request a new one.",
        });
      }

      if (storedOtp !== otp) {
        logger.request(req, "register failed: Invalid OTP", {
          requestId: req.requestId,
          email: normalizedEmail,
        });
        return res.status(401).json({
          success: false,
          message: "Invalid OTP. Please try again.",
        });
      }

      // Parse stored registration data
      const registrationData = JSON.parse(storedData);

      // Clear OTP and data from cache after successful verification
      await cacheDel(otpKey);
      await cacheDel(dataKey);

      // Check again if user exists (for account linking scenario)
      const existingUserForLinking = await User.findOne({ email: registrationData.email });

      let user;
      if (existingUserForLinking && existingUserForLinking.googleId && !existingUserForLinking.password) {
        // Account linking: Add password to existing Google account
        logger.info("Linking password to existing Google account", {
          requestId: req.requestId,
          email: existingUserForLinking.email,
        });

        existingUserForLinking.password = registrationData.hashedPassword;

        // Update phone if provided and not already set
        if (registrationData.phone && !existingUserForLinking.phone) {
          existingUserForLinking.phone = registrationData.phone;
        }

        // Update name if not already set
        if (registrationData.fullName) {
          const nameParts = (registrationData.fullName || "").trim().split(/\s+/);
          if (!existingUserForLinking.firstName) {
            existingUserForLinking.firstName = nameParts[0] || registrationData.fullName;
          }
          if (!existingUserForLinking.lastName && nameParts.length > 1) {
            existingUserForLinking.lastName = nameParts.slice(1).join(" ");
          }
        }

        await existingUserForLinking.save();
        user = existingUserForLinking;
        logger.info("Account linked successfully", {
          requestId: req.requestId,
          email: user.email,
        });
      } else {
        // Get user's location from IP
        const clientIP = getClientIP(req);
        let registrationLocation = null;
        try {
          registrationLocation = await getLocationFromIP(clientIP);
          logger.debug("User registration location", {
            requestId: req.requestId,
            location: registrationLocation,
          });
        } catch (locError) {
          logger.warn("Failed to get location", {
            requestId: req.requestId,
            error: locError.message,
          });
        }

        // Split fullName into firstName / lastName for the schema
        const nameParts = (registrationData.fullName || "").trim().split(/\s+/);
        const firstName = nameParts[0] || registrationData.fullName;
        const lastName = nameParts.slice(1).join(" ") || undefined;

        logger.debug("Creating user", {
          requestId: req.requestId,
          email: registrationData.email,
        });
        user = new User({
          email: registrationData.email,
          password: registrationData.hashedPassword,
          firstName,
          lastName,
          phone: registrationData.phone,
          isEmailVerified: true,
          registrationLocation: registrationLocation,
        });

        await user.save();
        logger.info("User created", {
          requestId: req.requestId,
          userId: user._id,
          email: user.email,
        });
      }

      // Send welcome email to user
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        logger.warn("Failed to send welcome email", {
          requestId: req.requestId,
          error: emailError.message,
        });
      }

      // Send admin notification
      try {
        await emailService.sendAdminNotification(user);
      } catch (emailError) {
        logger.warn("Failed to send admin notification", {
          requestId: req.requestId,
          error: emailError.message,
        });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);

      logger.request(req, "register completed", {
        requestId: req.requestId,
        userId: user._id,
        email: user.email,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          },
          accessToken,
          refreshToken,
        },
      });
    }
  } catch (error) {
    logger.requestError(req, "register failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  logger.request(req, "login called", {
    email: req.body?.email,
  });

  try {
    const { email, password, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      logger.request(req, "login failed: Invalid credentials", {
        requestId: req.requestId,
        email: normalizedEmail,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.isLocked) {
      logger.request(req, "login failed: Account locked", {
        requestId: req.requestId,
        userId: user._id,
      });
      return res.status(423).json({
        success: false,
        message:
          "Account temporarily locked due to too many failed login attempts",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      await user.incLoginAttempts();
      logger.request(req, "login failed: Invalid credentials", {
        requestId: req.requestId,
        userId: user._id,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // If OTP not provided, send OTP and ask for verification
    if (!otp) {
      try {
        // Use only persisted user phone for existing users
        const phone = normalizePhone(user.phone);
        const emailAddr = user.email;

        if (!phone && !emailAddr) {
          logger.request(req, "login failed: Phone or email required for OTP", {
            requestId: req.requestId,
            userId: user._id,
          });
          return res.status(400).json({
            success: false,
            message: "Phone number or email required for OTP",
          });
        }

        const generatedOtp = generateOtpCode();

        // Store OTP in cache for 5 minutes
        const otpKey = `otp:${user._id}`;
        await cacheSet(otpKey, generatedOtp, 5 * 60); // 5 minutes TTL

        // Email login always sends OTP to email — phone OTP has its own endpoint
        await otpService.sendOtp({
          email: emailAddr,
          phone: undefined,
          otp: generatedOtp,
          method: "email",
        });

        logger.request(req, "login OTP sent", {
          requestId: req.requestId,
          userId: user._id,
          method: "email",
        });

        return res.status(202).json({
          success: true,
          message: "OTP sent to your email. Please verify.",
          data: {
            otpSent: true,
            method: "email",
            email: emailAddr,
          },
        });
      } catch (err) {
        logger.requestError(req, "login failed to send OTP", err, {
          requestId: req.requestId,
        });
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    } else {
      // Verify OTP
      try {
        // Get stored OTP from cache
        const otpKey = `otp:${user._id}`;
        const storedOtp = await cacheGet(otpKey);

        if (!storedOtp) {
          logger.request(req, "login failed: OTP expired or invalid", {
            requestId: req.requestId,
            userId: user._id,
          });
          return res.status(401).json({
            success: false,
            message: "OTP expired or invalid. Please request a new one.",
          });
        }

        if (storedOtp !== otp) {
          logger.request(req, "login failed: Invalid OTP", {
            requestId: req.requestId,
            userId: user._id,
          });
          return res.status(401).json({
            success: false,
            message: "Invalid OTP. Please try again.",
          });
        }

        // Clear OTP from cache after successful verification
        await cacheDel(otpKey);
      } catch (err) {
        logger.requestError(req, "login OTP verification failed", err, {
          requestId: req.requestId,
        });
        return res.status(401).json({
          success: false,
          message: "OTP verification failed",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    }

    logger.debug("Authenticated user", {
      requestId: req.requestId,
      userId: user._id,
      email: user.email,
    });

    if (!user.isActive) {
      logger.request(req, "login failed: Account deactivated", {
        requestId: req.requestId,
        userId: user._id,
      });
      return res.status(403).json({
        success: false,
        message: "Account deactivated",
      });
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();

    // Capture location on first login for users who registered before location tracking was added
    if (!user.registrationLocation || !user.registrationLocation.country) {
      try {
        const clientIP = getClientIP(req);
        const location = await getLocationFromIP(clientIP);
        if (location && location.country) {
          user.registrationLocation = location;
        }
      } catch (locError) {
        logger.warn("Failed to capture login location", {
          requestId: req.requestId,
          error: locError.message,
        });
      }
    }

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

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

    logger.request(req, "login completed", {
      requestId: req.requestId,
      userId: user._id,
      email: user.email,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          organization: user.organization,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.requestError(req, "login failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const refreshToken = async (req, res) => {
  logger.request(req, "refreshToken called");

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.request(req, "refreshToken failed: Refresh token required", {
        requestId: req.requestId,
      });
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      logger.request(req, "refreshToken failed: Invalid refresh token", {
        requestId: req.requestId,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id,
    );

    logger.request(req, "refreshToken completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.requestError(req, "refreshToken failed", error, {
      requestId: req.requestId,
    });
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

const logout = async (req, res) => {
  logger.request(req, "logout called", {
    userId: req.user?.id,
  });

  try {
    const userId = req.user.id;

    await cacheDel(`user:${userId}`);

    logger.request(req, "logout completed", {
      requestId: req.requestId,
      userId,
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.requestError(req, "logout failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

const getProfile = async (req, res) => {
  logger.request(req, "getProfile called", {
    userId: req.user?.id,
  });

  try {
    const user = await User.findById(req.user.id)
      .populate("organization", "name slug")
      .select("-password -passwordResetToken -emailVerificationToken");

    if (!user) {
      logger.request(req, "getProfile failed: User not found", {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.request(req, "getProfile completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    // Return user data directly for frontend compatibility
    res.json({
      success: true,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      company: user.organization?.name || "",
      jobTitle: user.role || "",
      role: user.role,
      plan: user.plan || "free",
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      data: { user },
    });
  } catch (error) {
    logger.requestError(req, "getProfile failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

const updateProfile = async (req, res) => {
  logger.request(req, "updateProfile called", {
    userId: req.user?.id,
  });

  try {
    const { firstName, lastName, phone, company, jobTitle, preferences } =
      req.body;

    const setOps = {};
    const unsetOps = {};

    if (firstName) setOps.firstName = firstName.trim();

    if (lastName !== undefined) {
      const trimmed = (lastName || "").trim();
      if (trimmed) {
        setOps.lastName = trimmed;
      } else {
        unsetOps.lastName = "";
      }
    }

    if (phone !== undefined) {
      const normalized = normalizePhone(phone);
      if (normalized === undefined) {
        unsetOps.phone = "";
      } else if (/^\+?[1-9]\d{6,14}$/.test(normalized)) {
        setOps.phone = normalized;
      }
    }

    if (company !== undefined) setOps.company = company.trim();
    if (jobTitle !== undefined) setOps.jobTitle = jobTitle.trim();

    if (preferences) {
      Object.entries(preferences).forEach(([key, value]) => {
        setOps[`preferences.${key}`] = value;
      });
    }

    const updateQuery = {};
    if (Object.keys(setOps).length > 0) updateQuery.$set = setOps;
    if (Object.keys(unsetOps).length > 0) updateQuery.$unset = unsetOps;

    const updatedUser =
      Object.keys(updateQuery).length > 0
        ? await User.findByIdAndUpdate(req.user.id, updateQuery, {
            new: true,
            runValidators: true,
          }).populate("organization", "name slug")
        : await User.findById(req.user.id).populate(
            "organization",
            "name slug",
          );

    if (!updatedUser) {
      logger.request(req, "updateProfile failed: User not found", {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await cacheDel(`user:${updatedUser._id}`);

    logger.request(req, "updateProfile completed", {
      requestId: req.requestId,
      userId: updatedUser._id,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName || null,
      email: updatedUser.email,
      phone: updatedUser.phone || "",
      company: updatedUser.company || "",
      jobTitle: updatedUser.jobTitle || "",
      data: { user: updatedUser },
    });
  } catch (error) {
    logger.requestError(req, "updateProfile failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

const changePassword = async (req, res) => {
  logger.request(req, "changePassword called", {
    userId: req.user?.id,
  });

  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      logger.request(req, "changePassword failed: User not found", {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordCorrect =
      await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      logger.request(req, "changePassword failed: Current password incorrect", {
        requestId: req.requestId,
        userId: user._id,
      });
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    logger.request(req, "changePassword completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.requestError(req, "changePassword failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

const forgotPassword = async (req, res) => {
  logger.request(req, "forgotPassword called", {
    email: req.body?.email,
  });

  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      logger.request(req, "forgotPassword: User not found (silent success)", {
        requestId: req.requestId,
        email: normalizedEmail,
      });
      return res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    logger.request(req, "forgotPassword completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      message: "If the email exists, a password reset link has been sent",
      resetToken:
        process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    logger.requestError(req, "forgotPassword failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
    });
  }
};

const resetPassword = async (req, res) => {
  logger.request(req, "resetPassword called");

  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      logger.request(req, "resetPassword failed: Invalid or expired token", {
        requestId: req.requestId,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    logger.request(req, "resetPassword completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    logger.requestError(req, "resetPassword failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (req, res) => {
  logger.request(req, "sendPasswordResetOTP called", {
    email: req.body?.email,
  });

  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (process.env.NODE_ENV === "development") {
      logger.debug("Password reset OTP requested", {
        requestId: req.requestId,
        email: normalizedEmail,
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      logger.request(req, "sendPasswordResetOTP: User not found (silent success)", {
        requestId: req.requestId,
        email: normalizedEmail,
      });
      // Return success even if user doesn't exist (security best practice)
      return res.json({
        success: true,
        message: "If the email exists, a verification code has been sent",
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP in cache with normalized email as key for 10 minutes
    const otpKey = `password_reset_otp:${normalizedEmail}`;
    await cacheSet(otpKey, otp, 10 * 60); // 10 minutes TTL

    if (process.env.NODE_ENV === "development") {
      logger.debug("Generated OTP and stored in cache", {
        requestId: req.requestId,
        otpKey,
      });
    }

    // Send OTP via email
    try {
      await otpService.sendOtp({ email: normalizedEmail, otp, method: "email" });
      logger.info("OTP sent via Authentica", {
        requestId: req.requestId,
        email: normalizedEmail,
      });
    } catch (emailError) {
      logger.warn("Failed to send OTP email", {
        requestId: req.requestId,
        error: emailError.message,
      });
      // Continue even if email fails in development
      if (process.env.NODE_ENV !== "development") {
        throw emailError;
      }
    }

    // Always return OTP in development for testing
    const responseData = {
      success: true,
      message: "Verification code has been sent to your email",
    };

    // Include OTP in response for development testing
    if (process.env.NODE_ENV === "development") {
      responseData.otp = otp;
      responseData.debug = true;
      logger.debug("Password reset OTP debug", {
        requestId: req.requestId,
        email: normalizedEmail,
        otp,
      });
    }

    logger.request(req, "sendPasswordResetOTP completed", {
      requestId: req.requestId,
      email: normalizedEmail,
    });

    res.json(responseData);
  } catch (error) {
    logger.requestError(req, "sendPasswordResetOTP failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to send verification code",
    });
  }
};

// Verify password reset OTP
const verifyPasswordResetOTP = async (req, res) => {
  logger.request(req, "verifyPasswordResetOTP called", {
    email: req.body?.email,
  });

  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Verify OTP
    const otpKey = `password_reset_otp:${normalizedEmail}`;
    const storedOtp = await cacheGet(otpKey);

    if (!storedOtp || storedOtp !== otp) {
      logger.request(req, "verifyPasswordResetOTP failed: Invalid or expired OTP", {
        requestId: req.requestId,
        email: normalizedEmail,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Clear OTP from cache (single use)
    await cacheDel(otpKey);

    // Store verified flag for 10 minutes (to allow password reset)
    const verifiedKey = `password_reset_verified:${normalizedEmail}`;
    await cacheSet(verifiedKey, "true", 10 * 60); // 10 minutes TTL

    logger.request(req, "verifyPasswordResetOTP completed", {
      requestId: req.requestId,
      email: normalizedEmail,
    });

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    logger.requestError(req, "verifyPasswordResetOTP failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

// Reset password with OTP
const resetPasswordWithOTP = async (req, res) => {
  logger.request(req, "resetPasswordWithOTP called", {
    email: req.body?.email,
  });

  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Check if OTP was verified (stored in verified cache)
    const verifiedKey = `password_reset_verified:${normalizedEmail}`;
    const isVerified = await cacheGet(verifiedKey);

    if (!isVerified) {
      logger.request(req, "resetPasswordWithOTP failed: OTP not verified", {
        requestId: req.requestId,
        email: normalizedEmail,
      });
      return res.status(400).json({
        success: false,
        message: "Please verify OTP first",
      });
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      logger.request(req, "resetPasswordWithOTP failed: User not found", {
        requestId: req.requestId,
        email: normalizedEmail,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if new password is same as old password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      logger.request(req, "resetPasswordWithOTP failed: New password same as old", {
        requestId: req.requestId,
        userId: user._id,
      });
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear verified flag from cache
    await cacheDel(verifiedKey);

    logger.request(req, "resetPasswordWithOTP completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    logger.requestError(req, "resetPasswordWithOTP failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

const loginWithPhoneOtp = async (req, res) => {
  logger.request(req, "loginWithPhoneOtp called", {
    phoneNumber: req.body?.phoneNumber ? maskPhone(req.body.phoneNumber) : undefined,
  });

  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber) {
      logger.request(req, "loginWithPhoneOtp failed: Phone number required", {
        requestId: req.requestId,
      });
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    // Find user by phone number (stored in E.164 format)
    const user = await User.findOne({ phone: phoneNumber });
    if (!user) {
      logger.request(req, "loginWithPhoneOtp failed: No account found", {
        requestId: req.requestId,
        phoneNumber: maskPhone(phoneNumber),
      });
      return res
        .status(401)
        .json({
          success: false,
          message: "No account found with this phone number",
        });
    }

    if (user.isLocked) {
      logger.request(req, "loginWithPhoneOtp failed: Account locked", {
        requestId: req.requestId,
        userId: user._id,
      });
      return res
        .status(423)
        .json({
          success: false,
          message:
            "Account temporarily locked due to too many failed login attempts",
        });
    }

    if (!otp) {
      // Step 1: Generate and send OTP
      try {
        const generatedOtp = generateOtpCode();
        const otpKey = `phone_login_otp:${user._id}`;
        await cacheSet(otpKey, generatedOtp, 5 * 60); // 5 minutes TTL

        await otpService.sendOtp({
          email: user.email,
          phone: phoneNumber,
          otp: generatedOtp,
          method: "sms",
        });

        logger.request(req, "loginWithPhoneOtp OTP sent", {
          requestId: req.requestId,
          userId: user._id,
          method: "sms",
        });

        return res.status(202).json({
          success: true,
          message: "OTP sent to your phone number. Please verify.",
          data: {
            otpSent: true,
            method: "sms",
            phone: maskPhone(phoneNumber),
          },
        });
      } catch (err) {
        logger.requestError(req, "loginWithPhoneOtp failed to send OTP", err, {
          requestId: req.requestId,
        });
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    } else {
      // Step 2: Verify OTP
      const otpKey = `phone_login_otp:${user._id}`;
      const storedOtp = await cacheGet(otpKey);

      if (!storedOtp) {
        logger.request(req, "loginWithPhoneOtp failed: OTP expired or invalid", {
          requestId: req.requestId,
          userId: user._id,
        });
        return res
          .status(401)
          .json({
            success: false,
            message: "OTP expired or invalid. Please request a new one.",
          });
      }

      if (storedOtp !== otp) {
        logger.request(req, "loginWithPhoneOtp failed: Invalid OTP", {
          requestId: req.requestId,
          userId: user._id,
        });
        return res
          .status(401)
          .json({ success: false, message: "Invalid OTP. Please try again." });
      }

      await cacheDel(otpKey);
    }

    if (!user.isActive) {
      logger.request(req, "loginWithPhoneOtp failed: Account deactivated", {
        requestId: req.requestId,
        userId: user._id,
      });
      return res
        .status(403)
        .json({ success: false, message: "Account deactivated" });
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();

    // Capture location on first login for users who registered before location tracking was added
    if (!user.registrationLocation || !user.registrationLocation.country) {
      try {
        const clientIP = getClientIP(req);
        const location = await getLocationFromIP(clientIP);
        if (location && location.country) {
          user.registrationLocation = location;
        }
      } catch (locError) {
        logger.warn("Failed to capture login location", {
          requestId: req.requestId,
          error: locError.message,
        });
      }
    }

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

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

    logger.request(req, "loginWithPhoneOtp completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          organization: user.organization,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.requestError(req, "loginWithPhoneOtp failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user's API key
const getApiKey = async (req, res) => {
  logger.request(req, "getApiKey called", {
    userId: req.user?.id,
  });

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      logger.request(req, "getApiKey failed: User not found", {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find active API key or return empty
    const activeKey = user.apiKeys?.find((k) => k.isActive);

    logger.request(req, "getApiKey completed", {
      requestId: req.requestId,
      userId: user._id,
      hasKey: !!activeKey,
    });

    res.json({
      success: true,
      apiKey: activeKey ? activeKey.key : null,
    });
  } catch (error) {
    logger.requestError(req, "getApiKey failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch API key",
    });
  }
};

// Regenerate API key
const regenerateApiKey = async (req, res) => {
  logger.request(req, "regenerateApiKey called", {
    userId: req.user?.id,
  });

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      logger.request(req, "regenerateApiKey failed: User not found", {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new API key
    const newApiKey = crypto.randomBytes(32).toString("hex");

    // Deactivate all existing keys
    if (user.apiKeys && user.apiKeys.length > 0) {
      user.apiKeys.forEach((key) => {
        key.isActive = false;
      });
    }

    // Add new key
    if (!user.apiKeys) {
      user.apiKeys = [];
    }

    user.apiKeys.push({
      name: "Default API Key",
      key: newApiKey,
      isActive: true,
      createdAt: new Date(),
    });

    await user.save();

    logger.request(req, "regenerateApiKey completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      message: "API key regenerated successfully",
      apiKey: newApiKey,
    });
  } catch (error) {
    logger.requestError(req, "regenerateApiKey failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to regenerate API key",
    });
  }
};

// Get user preferences
const getPreferences = async (req, res) => {
  logger.request(req, "getPreferences called", {
    userId: req.user?.id,
  });

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      logger.request(req, "getPreferences failed: User not found", {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.request(req, "getPreferences completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    // Return preferences with defaults
    res.json({
      success: true,
      emailNotifications:
        user.preferences?.emailNotifications?.usageAlerts !== false,
      marketingEmails:
        user.preferences?.emailNotifications?.newsletter || false,
      weeklyReports:
        user.preferences?.emailNotifications?.paymentReminders !== false,
      language: user.preferences?.language || "ar",
      timezone: user.preferences?.timezone || "Asia/Riyadh",
      theme: user.preferences?.theme || "light",
    });
  } catch (error) {
    logger.requestError(req, "getPreferences failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch preferences",
    });
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
  logger.request(req, "updatePreferences called", {
    userId: req.user?.id,
  });

  try {
    const {
      emailNotifications,
      marketingEmails,
      weeklyReports,
      language,
      timezone,
      theme,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      logger.request(req, "updatePreferences failed: User not found", {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {};
    }

    if (!user.preferences.emailNotifications) {
      user.preferences.emailNotifications = {};
    }

    // Update preferences
    if (emailNotifications !== undefined) {
      user.preferences.emailNotifications.usageAlerts = emailNotifications;
    }
    if (marketingEmails !== undefined) {
      user.preferences.emailNotifications.newsletter = marketingEmails;
    }
    if (weeklyReports !== undefined) {
      user.preferences.emailNotifications.paymentReminders = weeklyReports;
    }
    if (language !== undefined) {
      user.preferences.language = language;
    }
    if (timezone !== undefined) {
      user.preferences.timezone = timezone;
    }
    if (theme !== undefined) {
      user.preferences.theme = theme;
    }

    await user.save();

    logger.request(req, "updatePreferences completed", {
      requestId: req.requestId,
      userId: user._id,
    });

    res.json({
      success: true,
      message: "Preferences updated successfully",
      emailNotifications:
        user.preferences.emailNotifications?.usageAlerts !== false,
      marketingEmails: user.preferences.emailNotifications?.newsletter || false,
      weeklyReports:
        user.preferences.emailNotifications?.paymentReminders !== false,
      language: user.preferences.language || "ar",
      timezone: user.preferences.timezone || "Asia/Riyadh",
      theme: user.preferences.theme || "light",
    });
  } catch (error) {
    logger.requestError(req, "updatePreferences failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
    });
  }
};

const deleteAccount = async (req, res) => {
  logger.request(req, "deleteAccount called", {
    userId: req.user?.id,
  });

  try {
    const userId = req.user.id;

    // Clear user cache
    await cacheDel(`user:${userId}`);

    // Delete the user document
    await User.findByIdAndDelete(userId);

    logger.request(req, "deleteAccount completed", {
      requestId: req.requestId,
      userId,
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    logger.requestError(req, "deleteAccount failed", error, {
      requestId: req.requestId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};

module.exports = {
  checkEmail,
  sendRegistrationOTP,
  register,
  login,
  refreshToken,
  logout,
  deleteAccount,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPasswordWithOTP,
  loginWithPhoneOtp,
  getApiKey,
  regenerateApiKey,
  getPreferences,
  updatePreferences,
};
