import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { authAPI } from "../services/api";
import OTPDialog from "./OTPDialog";
import "./ForgotPasswordDialog.css";

const ForgotPasswordDialog = ({ isOpen, onClose, email: initialEmail }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [formData, setFormData] = useState({
    email: initialEmail || "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);

  const validateEmail = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = t('auth.forgotPassword.errorEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('auth.forgotPassword.errorEmailInvalid');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!formData.newPassword) {
      errors.newPassword = t('auth.forgotPassword.errorPasswordRequired');
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = t('auth.forgotPassword.errorPasswordMinLength');
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t('auth.forgotPassword.errorPasswordRequired');
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = t('auth.forgotPassword.errorPasswordsNotMatch');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    if (error) {
      setError("");
    }
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.sendPasswordResetOTP(formData.email.trim().toLowerCase());
      
      console.log('Send OTP response:', response);
      
      // Log OTP for development testing
      if (response.otp) {
        console.log('\n🔐 ===== PASSWORD RESET OTP =====');
        console.log('📧 Email:', formData.email);
        console.log('🔢 OTP Code:', response.otp);
        console.log('================================\n');
      }
      
      if (response.success) {
        // Show OTP dialog (same as registration flow)
        setShowOTPDialog(true);
      } else {
        setError(response.message || t('auth.forgotPassword.errorGeneral'));
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || t('auth.forgotPassword.errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP (called from OTPDialog)
  const handleVerifyOTP = async (otp) => {
    try {
      // Verify OTP first
      const response = await authAPI.verifyPasswordResetOTP({
        email: formData.email.trim().toLowerCase(),
        otp
      });
      
      if (response.success) {
        // OTP verified, close OTP dialog and show password form
        setShowOTPDialog(false);
        setStep(3);
      } else {
        throw new Error(response.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      throw err; // Re-throw to let OTPDialog handle it
    }
  };

  // Resend OTP (called from OTPDialog)
  const handleResendOTP = async () => {
    try {
      const response = await authAPI.sendPasswordResetOTP(formData.email.trim().toLowerCase());
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to resend code');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      throw err;
    }
  };

  // Step 3: Reset password with verified OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPasswordWithOTP({
        email: formData.email.trim().toLowerCase(),
        newPassword: formData.newPassword
      });
      
      if (response.success) {
        // Success - close dialog
        onClose(true);
      } else {
        setError(response.message || t('auth.forgotPassword.errorGeneral'));
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || t('auth.forgotPassword.errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      email: initialEmail || "",
      newPassword: "",
      confirmPassword: ""
    });
    setError("");
    setFormErrors({});
    setShowOTPDialog(false);
    onClose(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="forgot-password-overlay" onClick={handleClose}>
        <div className="forgot-password-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <h2>{step === 3 ? t('auth.forgotPassword.newPasswordTitle') : t('auth.forgotPassword.title')}</h2>
            <button className="close-btn" onClick={handleClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="dialog-body">
            {/* Error Display */}
            {error && (
              <div className="message-banner error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="currentColor"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              // Step 1: Email Input
              <form onSubmit={handleSendOTP}>
                <p className="dialog-subtitle">{t('auth.forgotPassword.subtitle')}</p>
                
                <div className="form-field">
                  <label htmlFor="forgot-email">{t('auth.forgotPassword.email')}</label>
                  <input
                    type="email"
                    id="forgot-email"
                    name="email"
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    value={formData.email}
                    onChange={handleInputChange}
                    className={formErrors.email ? 'error' : ''}
                    autoFocus
                  />
                  {formErrors.email && (
                    <span className="field-error">{formErrors.email}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="spinner">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="37.7" strokeDashoffset="37.7" strokeLinecap="round" />
                    </svg>
                  )}
                  {loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendOtp')}
                </button>
              </form>
            ) : step === 3 ? (
              // Step 3: New Password Form
              <form onSubmit={handleResetPassword}>
                <p className="dialog-subtitle">{t('auth.forgotPassword.newPasswordSubtitle')}</p>

                {/* New Password Field */}
                <div className="form-field">
                  <label htmlFor="newPassword">{t('auth.forgotPassword.newPassword')}</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      placeholder={t('auth.forgotPassword.newPasswordPlaceholder')}
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className={formErrors.newPassword ? 'error' : ''}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                        <path d="M1 8s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="8" r="3" stroke="#9CA3AF" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                  {formErrors.newPassword && (
                    <span className="field-error">{formErrors.newPassword}</span>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="form-field">
                  <label htmlFor="confirmPassword">{t('auth.forgotPassword.confirmPassword')}</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={formErrors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                        <path d="M1 8s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="8" r="3" stroke="#9CA3AF" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <span className="field-error">{formErrors.confirmPassword}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="spinner">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="37.7" strokeDashoffset="37.7" strokeLinecap="round" />
                    </svg>
                  )}
                  {loading ? t('auth.forgotPassword.resetting') : t('auth.forgotPassword.resetPassword')}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      {/* OTP Dialog - Same as Registration */}
      <OTPDialog
        isOpen={showOTPDialog}
        onClose={() => {
          setShowOTPDialog(false);
        }}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        email={formData.email}
        loading={loading}
      />
    </>
  );
};

export default ForgotPasswordDialog;
