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
  try {
    const { email, phone } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const otp = generateOtpCode();

    // Store OTP in cache with email as key for 5 minutes
    const otpKey = `registration_otp:${email}`;
    await cacheSet(otpKey, otp, 5 * 60); // 5 minutes TTL

    // Determine method based on available contact info
    const method = normalizedPhone ? "sms" : "email";
    const targetPhone = normalizedPhone || undefined;

    // Send OTP via SMS or email (Authentica handles fallback)
    await otpService.sendOtp({ email, phone: targetPhone, otp, method });

    const message = normalizedPhone
      ? "OTP sent to your phone number. Please verify to complete registration."
      : "OTP sent to your email. Please verify to complete registration.";

    return res.status(200).json({
      success: true,
      message,
      data: {
        email,
        phone: normalizedPhone ? maskPhone(normalizedPhone) : undefined,
        otpSent: true,
      },
    });
  } catch (error) {
    console.error("Send registration OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const register = async (req, res) => {
  console.log("Registration request body:", req.body);
  try {
    const { email, password, fullName, phone, otp } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // If OTP not provided, store registration data and send OTP
    if (!otp) {
      try {
        const generatedOtp = generateOtpCode();

        // Store both OTP and registration data in cache for 5 minutes
        const otpKey = `registration_otp:${email}`;
        const dataKey = `registration_data:${email}`;

        // Hash the password before caching so plaintext is never persisted in Redis
        const hashedPassword = await bcrypt.hash(password, 12);

        await cacheSet(otpKey, generatedOtp, 5 * 60); // 5 minutes TTL
        await cacheSet(
          dataKey,
          JSON.stringify({ email, hashedPassword, fullName, phone: normalizedPhone }),
          5 * 60,
        );

        // Determine method based on available contact info
        const method = normalizedPhone ? "sms" : "email";
        const targetPhone = normalizedPhone || undefined;

        // Send OTP via SMS or email (Authentica handles fallback)
        await otpService.sendOtp({
          email,
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
            email,
            phone: normalizedPhone ? maskPhone(normalizedPhone) : undefined,
          },
        });
      } catch (err) {
        console.error("Send registration OTP error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    } else {
      // Verify OTP from cache
      const otpKey = `registration_otp:${email}`;
      const dataKey = `registration_data:${email}`;

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

      // Get user's location from IP
      const clientIP = getClientIP(req);
      let registrationLocation = null;
      try {
        registrationLocation = await getLocationFromIP(clientIP);
        console.log("User registration location:", registrationLocation);
      } catch (locError) {
        console.error("Failed to get location:", locError.message);
      }

      // Split fullName into firstName / lastName for the schema
      const nameParts = (registrationData.fullName || "").trim().split(/\s+/);
      const firstName = nameParts[0] || registrationData.fullName;
      const lastName = nameParts.slice(1).join(" ") || undefined;

      console.log("Creating user with email:", registrationData.email);
      const user = new User({
        email: registrationData.email,
        password: registrationData.hashedPassword,
        firstName,
        lastName,
        phone: registrationData.phone,
        isEmailVerified: true,
        registrationLocation: registrationLocation,
      });

      await user.save();
      console.log("User created:", user);

      // Send welcome email to user
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      // Send admin notification
      try {
        await emailService.sendAdminNotification(user);
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      const { accessToken, refreshToken } = generateTokens(user._id);

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
    console.error("Registration error:", error);
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

    const user = await User.findOne({ email }).select("+password");
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
        console.error("Send OTP error:", err);
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
        console.error("OTP verification error:", err);
        return res.status(401).json({
          success: false,
          message: "OTP verification failed",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    }
    console.log("Authenticated user:", user);
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
      } catch (locError) {
        console.error("Failed to capture login location:", locError.message);
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
    console.error("Login error:", error);
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

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id,
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await cacheDel(`user:${userId}`);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
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
    console.error("Get profile error:", error);
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
    console.error("Update profile error:", error);
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
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
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
    console.error("Forgot password error:", error);
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

    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
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

    if (process.env.NODE_ENV === "development") {
      console.log("📧 Password reset OTP requested for:", email);
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return res.json({
        success: true,
        message: "If the email exists, a verification code has been sent",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP in cache with email as key for 10 minutes
    const otpKey = `password_reset_otp:${email}`;
    await cacheSet(otpKey, otp, 10 * 60); // 10 minutes TTL

    if (process.env.NODE_ENV === "development") {
      console.log("🔢 Generated OTP:", otp);
      console.log("💾 OTP stored in cache with key:", otpKey);
    }

    // Send OTP via email
    try {
      await otpService.sendOtp({ email, otp, method: "email" });
      console.log("✅ OTP sent via Authentica");
    } catch (emailError) {
      console.error("❌ Failed to send OTP email:", emailError);
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
      console.log("\n🔐 ===== PASSWORD RESET OTP =====");
      console.log("📧 Email:", email);
      console.log("🔢 OTP Code:", otp);
      console.log("================================\n");
    }

    res.json(responseData);
  } catch (error) {
    console.error("Send password reset OTP error:", error);
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

    // Verify OTP
    const otpKey = `password_reset_otp:${email}`;
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
    const verifiedKey = `password_reset_verified:${email}`;
    await cacheSet(verifiedKey, "true", 10 * 60); // 10 minutes TTL

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify password reset OTP error:", error);
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

    // Check if OTP was verified (stored in verified cache)
    const verifiedKey = `password_reset_verified:${email}`;
    const isVerified = await cacheGet(verifiedKey);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP first",
      });
    }

    // Find user
    const user = await User.findOne({ email });
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
    await user.save();

    // Clear verified flag from cache
    await cacheDel(verifiedKey);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password with OTP error:", error);
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
      return res
        .status(401)
        .json({
          success: false,
          message: "No account found with this phone number",
        });
    }

    if (user.isLocked) {
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
        console.error("Send phone OTP error:", err);
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
        return res
          .status(401)
          .json({
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
      } catch (locError) {
        console.error("Failed to capture login location:", locError.message);
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
    console.error("Phone login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user's API key
const getApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find active API key or return empty
    const activeKey = user.apiKeys?.find((k) => k.isActive);

    res.json({
      success: true,
      apiKey: activeKey ? activeKey.key : null,
    });
  } catch (error) {
    console.error("Get API key error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch API key",
    });
  }
};

// Regenerate API key
const regenerateApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
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

    res.json({
      success: true,
      message: "API key regenerated successfully",
      apiKey: newApiKey,
    });
  } catch (error) {
    console.error("Regenerate API key error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate API key",
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
    console.error("Get preferences error:", error);
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
    console.error("Update preferences error:", error);
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
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};

module.exports = {
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
