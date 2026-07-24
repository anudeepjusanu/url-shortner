const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiKey = require("../models/ApiKey");
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
const projectAccessService = require("../services/projectAccessService");

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

const generateTokens = (userId, tokenVersion = 0) => {
  const accessToken = jwt.sign({ userId, tokenVersion }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });

  const refreshToken = jwt.sign(
    { userId, tokenVersion },
    config.JWT_REFRESH_SECRET,
    {
      expiresIn: config.JWT_REFRESH_EXPIRE,
    },
  );

  return { accessToken, refreshToken };
};

const sendRegistrationOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail) {
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
        // Continue with OTP flow to allow account linking
      } else {
        // User already has a complete account
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
    await otpService.sendOtp({
      email: normalizedEmail,
      phone: targetPhone,
      otp,
      method,
    });

    const message = normalizedPhone
      ? "OTP sent to your phone number. Please verify to complete registration."
      : "OTP sent to your email. Please verify to complete registration.";

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
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const checkEmail = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Failed to check email",
    });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail) {
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
        // Continue with the flow to add password
      } else {
        // User already has a complete account (either manual or Google with password)
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    // Phone was already verified via /auth/phone/verify-otp — skip OTP, create user directly
    const phoneVerifiedKey = `phone_verified:${normalizedEmail}`;
    const phoneVerifiedData = await cacheGet(phoneVerifiedKey);
    if (phoneVerifiedData) {
      await cacheDel(phoneVerifiedKey);

      const hashedPassword = await bcrypt.hash(password, 12);
      const clientIP = getClientIP(req);
      let registrationLocation = null;
      try {
        registrationLocation = await getLocationFromIP(clientIP);
      } catch (_) {}

      const nameParts = (fullName || "").trim().split(/\s+/);
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(" ") || undefined;
      const verifiedPhone =
        JSON.parse(phoneVerifiedData).phone || normalizedPhone;

      let user;
      if (existingUser && existingUser.googleId && !existingUser.password) {
        existingUser.password = hashedPassword;
        if (verifiedPhone && !existingUser.phone)
          existingUser.phone = verifiedPhone;
        if (!existingUser.firstName) existingUser.firstName = firstName;
        if (!existingUser.lastName && lastName)
          existingUser.lastName = lastName;
        await existingUser.save();
        user = existingUser;
      } else {
        user = new User({
          email: normalizedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          phone: verifiedPhone,
          isEmailVerified: true,
          registrationLocation,
        });
        await user.save();
      }

      try {
        await emailService.sendWelcomeEmail(user);
      } catch (_) {}
      try {
        await emailService.sendAdminNotification(user);
      } catch (_) {}

      const { accessToken, refreshToken } = generateTokens(
        user._id,
        user.tokenVersion,
      );
      return res.status(201).json({
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
          JSON.stringify({
            email: normalizedEmail,
            hashedPassword,
            fullName,
            phone: normalizedPhone,
          }),
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
        return res.status(401).json({
          success: false,
          message: "OTP expired or invalid. Please request a new one.",
        });
      }

      if (storedOtp !== otp) {
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
      const existingUserForLinking = await User.findOne({
        email: registrationData.email,
      });

      let user;
      if (
        existingUserForLinking &&
        existingUserForLinking.googleId &&
        !existingUserForLinking.password
      ) {
        // Account linking: Add password to existing Google account

        existingUserForLinking.password = registrationData.hashedPassword;

        // Update phone if provided and not already set
        if (registrationData.phone && !existingUserForLinking.phone) {
          existingUserForLinking.phone = registrationData.phone;
        }

        // Update name if not already set
        if (registrationData.fullName) {
          const nameParts = (registrationData.fullName || "")
            .trim()
            .split(/\s+/);
          if (!existingUserForLinking.firstName) {
            existingUserForLinking.firstName =
              nameParts[0] || registrationData.fullName;
          }
          if (!existingUserForLinking.lastName && nameParts.length > 1) {
            existingUserForLinking.lastName = nameParts.slice(1).join(" ");
          }
        }

        await existingUserForLinking.save();
        user = existingUserForLinking;
      } else {
        // Get user's location from IP
        const clientIP = getClientIP(req);
        let registrationLocation = null;
        try {
          registrationLocation = await getLocationFromIP(clientIP);
        } catch (locError) {}

        // Split fullName into firstName / lastName for the schema
        const nameParts = (registrationData.fullName || "").trim().split(/\s+/);
        const firstName = nameParts[0] || registrationData.fullName;
        const lastName = nameParts.slice(1).join(" ") || undefined;

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
      }

      // Send welcome email to user
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {}

      // Send admin notification
      try {
        await emailService.sendAdminNotification(user);
      } catch (emailError) {}

      const { accessToken, refreshToken } = generateTokens(
        user._id,
        user.tokenVersion,
      );

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
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message:
          "Account temporarily locked due to too many failed login attempts",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      await user.incLoginAttempts();
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
          return res.status(401).json({
            success: false,
            message: "OTP expired or invalid. Please request a new one.",
          });
        }

        if (storedOtp !== otp) {
          return res.status(401).json({
            success: false,
            message: "Invalid OTP. Please try again.",
          });
        }

        // Clear OTP from cache after successful verification
        await cacheDel(otpKey);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: "OTP verification failed",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    }

    if (!user.isActive) {
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
      } catch (locError) {}
    }

    await user.save();

    const { accessToken, refreshToken } = generateTokens(
      user._id,
      user.tokenVersion,
    );

    await cacheSet(
      `user:${user._id}`,
      {
        id: user._id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        organization: user.organization,
        isActive: user.isActive,
        tokenVersion: user.tokenVersion,
      },
      config.CACHE_TTL.USER_CACHE,
    );

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
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Tokens issued before tokenVersion existed carry no claim — treat that
    // as version 0 so already-issued sessions keep working until the first
    // logout/password-change/deactivation actually bumps the version.
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id,
      user.tokenVersion,
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Bump tokenVersion so the access/refresh token pair this session was
    // using can no longer be replayed — without this, logout only cleared a
    // cache entry and the JWT itself stayed valid until it expired.
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    await cacheDel(`user:${userId}`);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("organization", "name slug")
      .select("-password -passwordResetToken -emailVerificationToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

const updateProfile = async (req, res) => {
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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await cacheDel(`user:${updatedUser._id}`);

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
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordCorrect =
      await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    // Invalidate every existing access/refresh token for this account — a
    // password change is a reasonable signal the old credential may have
    // been compromised, so old tokens shouldn't keep working.
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await cacheDel(`user:${user._id}`);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
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

    res.json({
      success: true,
      message: "If the email exists, a password reset link has been sent",
      resetToken:
        process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();
    await cacheDel(`user:${user._id}`);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (process.env.NODE_ENV === "development") {
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
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
    }

    // Send OTP via email
    try {
      await otpService.sendOtp({
        email: normalizedEmail,
        otp,
        method: "email",
      });
    } catch (emailError) {
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
    }

    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send verification code",
    });
  }
};

// Verify password reset OTP
const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Verify OTP
    const otpKey = `password_reset_otp:${normalizedEmail}`;
    const storedOtp = await cacheGet(otpKey);

    if (!storedOtp || storedOtp !== otp) {
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

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

// Reset password with OTP
const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Check if OTP was verified (stored in verified cache)
    const verifiedKey = `password_reset_verified:${normalizedEmail}`;
    const isVerified = await cacheGet(verifiedKey);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP first",
      });
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if new password is same as old password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }

    // Update password
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await cacheDel(`user:${user._id}`);

    // Clear verified flag from cache
    await cacheDel(verifiedKey);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

const loginWithPhoneOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    // Find user by phone number (stored in E.164 format)
    const user = await User.findOne({ phone: phoneNumber });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No account found with this phone number",
      });
    }

    if (user.isLocked) {
      return res.status(423).json({
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
        return res.status(401).json({
          success: false,
          message: "OTP expired or invalid. Please request a new one.",
        });
      }

      if (storedOtp !== otp) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid OTP. Please try again." });
      }

      await cacheDel(otpKey);
    }

    if (!user.isActive) {
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
      } catch (locError) {}
    }

    await user.save();

    const { accessToken, refreshToken } = generateTokens(
      user._id,
      user.tokenVersion,
    );

    await cacheSet(
      `user:${user._id}`,
      {
        id: user._id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        organization: user.organization,
        isActive: user.isActive,
        tokenVersion: user.tokenVersion,
      },
      config.CACHE_TTL.USER_CACHE,
    );

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
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Scope for the caller's active API key: enterprise accounts share one key
// per project (not per user); solo accounts (no organization, no Project
// entity to bind to) keep their own single account-wide key.
const apiKeyScope = (user, projectId) =>
  projectId
    ? { project: projectId, isActive: true }
    : { user: user.id, project: null, isActive: true };

// Get the project's API key (or the caller's account-wide key, for solo
// accounts). Enterprise accounts must specify a projectId — a key belongs
// to one specific project.
const getApiKey = async (req, res) => {
  try {
    // Enterprise RBAC: a Viewer on the target project still can't
    // reveal/regenerate/delete its key — same "sensitive action" treatment
    // as Custom Domains/API Keys elsewhere. No-op for solo accounts.
    const projectId = req.query.projectId || null;
    await projectAccessService.assertAccountLevelEditAccess(
      req.user,
      projectId,
    );

    const activeKey = await ApiKey.findOne(apiKeyScope(req.user, projectId));

    res.json({
      success: true,
      apiKey: activeKey ? activeKey.key : null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch API key",
    });
  }
};

// Regenerate the project's API key — deactivates the previous key for that
// same scope rather than deleting it. For a project-scoped key this affects
// every member with write access to the project at once; `user` on the new
// key records who generated it (audit only, not part of the key's scope).
const regenerateApiKey = async (req, res) => {
  try {
    const projectId = req.body.projectId || null;
    await projectAccessService.assertAccountLevelEditAccess(
      req.user,
      projectId,
    );

    await ApiKey.updateMany(apiKeyScope(req.user, projectId), {
      $set: { isActive: false },
    });

    const newApiKey = crypto.randomBytes(32).toString("hex");
    await ApiKey.create({
      user: req.user.id,
      organization: req.user.organization || null,
      project: projectId,
      name: "Default API Key",
      key: newApiKey,
      isActive: true,
    });

    res.json({
      success: true,
      message: "API key regenerated successfully",
      apiKey: newApiKey,
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: "Failed to regenerate API key",
    });
  }
};

// Delete the project's API key, without generating a replacement — the
// project returns to "No API key yet" until one is created again.
const deleteApiKey = async (req, res) => {
  try {
    const projectId = req.body.projectId || null;
    await projectAccessService.assertAccountLevelEditAccess(
      req.user,
      projectId,
    );

    await ApiKey.updateMany(apiKeyScope(req.user, projectId), {
      $set: { isActive: false },
    });

    res.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: "Failed to delete API key",
    });
  }
};

// Get user preferences
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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
    res.status(500).json({
      success: false,
      message: "Failed to fetch preferences",
    });
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Clear user cache
    await cacheDel(`user:${userId}`);

    // Delete the user document
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
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
  deleteApiKey,
  getPreferences,
  updatePreferences,
};
