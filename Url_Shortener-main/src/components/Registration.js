import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import OTPDialog from "./OTPDialog";
import logo from '../assets/logo.png';
import "./Registration.css";

const Registration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    agreeToData: false,
    receiveUpdates: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpData, setOtpData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Clear any existing errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }

    // Clear global error
    if (error) {
      clearError();
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    let firstErrorField = null;

    // Required fields validation
    if (!formData.fullName.trim()) {
      errors.fullName = t('auth.register.errorFullNameRequired') || 'This field is required';
      if (!firstErrorField) firstErrorField = 'fullName';
    }

    if (!formData.email.trim()) {
      errors.email = t('auth.register.errorEmailRequired') || 'This field is required';
      if (!firstErrorField) firstErrorField = 'email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('auth.register.errorEmailInvalid');
      if (!firstErrorField) firstErrorField = 'email';
    }

    if (!formData.password) {
      errors.password = t('auth.register.errorPasswordRequired') || 'This field is required';
      if (!firstErrorField) firstErrorField = 'password';
    } else if (formData.password.length < 8) {
      errors.password = t('auth.register.errorPasswordLength');
      if (!firstErrorField) firstErrorField = 'password';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t('auth.register.errorConfirmPasswordRequired') || 'This field is required';
      if (!firstErrorField) firstErrorField = 'confirmPassword';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('auth.register.errorPasswordMismatch');
      if (!firstErrorField) firstErrorField = 'confirmPassword';
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = t('auth.register.errorTermsRequired') || 'This field is required';
      if (!firstErrorField) firstErrorField = 'agreeToTerms';
    }

    if (!formData.agreeToData) {
      errors.agreeToData = t('auth.register.errorDataConsentRequired') || 'This field is required';
      if (!firstErrorField) firstErrorField = 'agreeToData';
    }

    setFormErrors(errors);
    
    // Focus the first field with an error
    if (firstErrorField) {
      setTimeout(() => {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({});
    if (error) clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare registration data (excluding confirmPassword and checkboxes)
      // Split fullName into firstName and lastName for backend
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
      
      const registrationData = {
        firstName,
        lastName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() ? `+966${formData.phone.replace(/\s/g, '')}` : undefined,
      };

      // Call registration API
      const result = await register(registrationData);

      if (result.success) {
        // Registration successful - navigate to dashboard
        navigate("/dashboard");
      } else if (result.otpRequired && result.otpData) {
        // OTP is required - show OTP dialog
        console.log('OTP required, showing dialog with data:', result.otpData);
        setOtpData(result.otpData);
        setShowOTPDialog(true);
      }
      // Errors are handled by the AuthContext and displayed in the UI
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleVerifyOTP = async (otp) => {
    try {
      // Prepare registration data with OTP
      // Split fullName into firstName and lastName for backend
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
      
      const registrationData = {
        firstName,
        lastName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() ? `+966${formData.phone.replace(/\s/g, '')}` : undefined,
        otp: otp
      };

      // Call registration API with OTP
      const result = await register(registrationData);

      if (result.success) {
        // Registration successful - close dialog and navigate to dashboard
        setShowOTPDialog(false);
        navigate("/dashboard");
      } else if (result.error) {
        // Throw error to be caught by OTPDialog
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      // Re-throw to let OTPDialog handle it
      throw error;
    }
  };

  const handleResendOTP = async () => {
    try {
      // Prepare registration data without OTP to resend
      // Split fullName into firstName and lastName for backend
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
      
      const registrationData = {
        firstName,
        lastName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() ? `+966${formData.phone.replace(/\s/g, '')}` : undefined,
      };

      // Call registration API again to resend OTP
      const result = await register(registrationData);

      if (result.otpRequired && result.otpData) {
        setOtpData(result.otpData);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  const handleGoogleSignup = () => {
    // Handle Google signup
    console.log("Google signup clicked");
  };

  return (
    <div className="registration-container">
      {/* Left Panel - Brand and Features */}
      <div className="left-panel">
        <div className="left-content">
          {/* Brand Section */}
          <div className="brand-section">
            <div className="brand-logo">
              <img 
                src={logo} 
                alt="LaghhuLink Logo" 
                className="auth-logo-img"
              />
            </div>
            <h1 className="brand-title">{t('auth.register.brandTitle')}</h1>
            <p className="brand-subtitle">{t('auth.register.brandSubtitle')}</p>
          </div>

          {/* Features List */}
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2962)">
                    <path
                      d="M13.7187 0.218726C14.0125 -0.0750244 14.4875 -0.0750244 14.7781 0.218726L15.7781 1.21873C16.0718 1.51248 16.0718 1.98748 15.7781 2.2781L13.0594 4.99685L14.2781 6.2156C14.4937 6.43123 14.5562 6.7531 14.4406 7.03435C14.325 7.3156 14.05 7.49685 13.7469 7.49685H9.24998C8.83435 7.49685 8.49998 7.16248 8.49998 6.74685V2.24998C8.49998 1.94685 8.68122 1.67185 8.96247 1.55623C9.24372 1.4406 9.5656 1.5031 9.78123 1.71873L11 2.93748L13.7187 0.218726ZM2.24998 8.49998H6.74998C7.1656 8.49998 7.49998 8.83435 7.49998 9.24998V13.75C7.49998 14.0531 7.31873 14.3281 7.03748 14.4437C6.75623 14.5594 6.43435 14.4969 6.21873 14.2812L4.99998 13.0625L2.28123 15.7812C1.98748 16.075 1.51248 16.075 1.22185 15.7812L0.218726 14.7812C-0.0750244 14.4875 -0.0750244 14.0125 0.218726 13.7219L2.93748 11.0031L1.71873 9.78123C1.5031 9.5656 1.4406 9.24372 1.55623 8.96247C1.67185 8.68122 1.94685 8.49998 2.24998 8.49998Z"
                      fill="#3B82F6"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2962">
                      <path d="M0 0H16V16H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="feature-content">
                <h3>{t('auth.register.feature1Title')}</h3>
                <p>{t('auth.register.feature1Description')}</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2965)">
                    <path
                      d="M2 2C2 1.44687 1.55313 1 1 1C0.446875 1 0 1.44687 0 2V12.5C0 13.8813 1.11875 15 2.5 15H15C15.5531 15 16 14.5531 16 14C16 13.4469 15.5531 13 15 13H2.5C2.225 13 2 12.775 2 12.5V2ZM14.7063 4.70625C15.0969 4.31563 15.0969 3.68125 14.7063 3.29063C14.3156 2.9 13.6812 2.9 13.2906 3.29063L10 6.58437L8.20625 4.79063C7.81563 4.4 7.18125 4.4 6.79063 4.79063L3.29063 8.29062C2.9 8.68125 2.9 9.31563 3.29063 9.70625C3.68125 10.0969 4.31563 10.0969 4.70625 9.70625L7.5 6.91563L9.29375 8.70938C9.68437 9.1 10.3188 9.1 10.7094 8.70938L14.7094 4.70937L14.7063 4.70625Z"
                      fill="#3B82F6"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2965">
                      <path d="M0 0H16V16H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="feature-content">
                <h3>{t('auth.register.feature2Title')}</h3>
                <p>{t('auth.register.feature2Description')}</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <g clip-path="url(#clip0_775_2968)">
                    <path
                      d="M8.00001 0C8.14376 0 8.28751 0.03125 8.41876 0.090625L14.3031 2.5875C14.9906 2.87813 15.5031 3.55625 15.5 4.375C15.4844 7.475 14.2094 13.1469 8.82501 15.725C8.30314 15.975 7.69689 15.975 7.17501 15.725C1.79064 13.1469 0.515639 7.475 0.500014 4.375C0.496889 3.55625 1.00939 2.87813 1.69689 2.5875L7.58439 0.090625C7.71251 0.03125 7.85626 0 8.00001 0ZM8.00001 2.0875V13.9C12.3125 11.8125 13.4719 7.19062 13.5 4.41875L8.00001 2.0875Z"
                      fill="#3B82F6"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2968">
                      <path d="M0 0H16V16H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="feature-content">
                <h3>{t('auth.register.feature3Title')}</h3>
                <p>{t('auth.register.feature3Description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="right-panel">
        {/* Language Toggle */}
        <div className="language-toggle">
          <button
            className="lang-toggle-btn"
            onClick={() => changeLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#F9FAFB';
              e.target.style.borderColor = '#D1D5DB';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff';
              e.target.style.borderColor = '#E5E7EB';
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="2" />
              <path
                d="M2 7h10M7 2c1.5 0 3 2.686 3 6s-1.5 6-3 6-3-2.686-3-6 1.5-6 3-6z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            {currentLanguage === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        <div className="form-wrapper">
          {/* Header */}
          <div className="form-header">
            <h2>{t('auth.register.title')}</h2>
            <p>{t('auth.register.subtitle')}</p>
          </div>

          {/* Google Sign Up */}
          {/* <button type="button" className="google-btn" onClick={handleGoogleSignup}>
            <svg width="20" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.9892 10.1871C18.9892 9.36767 18.9246 8.76973 18.7847 8.14966H9.68848V11.848H15.0277C14.9201 12.767 14.3388 14.1512 13.047 15.0813L13.0289 15.205L15.905 17.4969L16.1042 17.5173C17.9342 15.7789 18.9892 13.221 18.9892 10.1871Z"
                fill="#4285F4"
              />
              <path
                d="M9.68813 19.9314C12.3039 19.9314 14.4999 19.0455 16.1039 17.5174L13.0467 15.0813C12.2286 15.6682 11.1306 16.0779 9.68813 16.0779C7.12612 16.0779 4.95165 14.3395 4.17651 11.9366L4.06289 11.9465L1.07231 14.3273L1.0332 14.4391C2.62638 17.6946 5.89889 19.9314 9.68813 19.9314Z"
                fill="#34A853"
              />
              <path
                d="M4.17667 11.9366C3.972 11.3165 3.85486 10.6521 3.85486 9.96562C3.85486 9.27905 3.972 8.61468 4.16591 7.99462L4.1605 7.86257L1.13246 5.44363L1.03339 5.49211C0.37677 6.84302 0 8.36005 0 9.96562C0 11.5712 0.37677 13.0881 1.03339 14.4391L4.17667 11.9366Z"
                fill="#FBBC05"
              />
              <path
                d="M9.68807 3.85336C11.5073 3.85336 12.7344 4.66168 13.4342 5.33718L16.1649 2.59107C14.4823 0.994704 12.3039 0 9.68807 0C5.89883 0 2.62632 2.23672 1.0332 5.49214L4.16573 7.99466C4.95162 5.59183 7.12608 3.85336 9.68807 3.85336Z"
                fill="#EB4335"
              />
            </svg>
            {t('auth.register.googleSignup')}
          </button>

          <div className="divider">
            <hr />
            <span>{t('auth.register.divider')}</span>
          </div> */}

          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <div className="error-content">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#DC2626"/>
                  <path d="M8 4V8M8 12H8.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form className="registration-form" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div className="form-field">
              <label htmlFor="fullName">{t('auth.register.fullName')}</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder={t('auth.register.fullNamePlaceholder')}
                value={formData.fullName}
                onChange={handleInputChange}
                className={formErrors.fullName ? 'error' : ''}
                required
              />
              {formErrors.fullName && (
                <span className="field-error">{formErrors.fullName}</span>
              )}
            </div>

            {/* Email Field */}
            <div className="form-field">
              <label htmlFor="email">{t('auth.register.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder={t('auth.register.emailPlaceholder')}
                value={formData.email}
                onChange={handleInputChange}
                className={formErrors.email ? 'error' : ''}
                required
              />
              {formErrors.email && (
                <span className="field-error">{formErrors.email}</span>
              )}
            </div>

            {/* Phone Field */}
            {/* <div className="form-field">
              <label htmlFor="phone">{t('auth.register.phone')}</label>
              <div className="phone-input-wrapper">
                <span className="country-code">+966</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder={t('auth.register.phonePlaceholder')}
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div> */}

            {/* Password Field */}
            <div className="form-field">
              <label htmlFor="password">{t('auth.register.password')}</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder={t('auth.register.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? 'error' : ''}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg
                    width="18"
                    height="16"
                    viewBox="0 0 18 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: 'block', minWidth: '18px', minHeight: '16px' }}
                  >
                    <path
                      d="M1 8s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ stroke: '#9CA3AF' }}
                    />
                    <circle
                      cx="9"
                      cy="8"
                      r="3"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      style={{ stroke: '#9CA3AF' }}
                    />
                  </svg>
                </button>
              </div>
              {formErrors.password && (
                <span className="field-error">{formErrors.password}</span>
              )}
              {!formErrors.password && (
                <p className="password-hint">
                  {t('auth.register.passwordHint')}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-field">
              <label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={formErrors.confirmPassword ? 'error' : ''}
                required
              />
              {formErrors.confirmPassword && (
                <span className="field-error">{formErrors.confirmPassword}</span>
              )}
            </div>

            {/* Checkboxes */}
            <div className="checkboxes-section">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  required
                />
                <label htmlFor="agreeToTerms">
                  {t('auth.register.termsAgree')}{" "}
                  <a href="/terms-and-conditions" className="text-link">
                    {t('auth.register.terms')}
                  </a>{" "}
                  {t('auth.register.and')}{" "}
                  <a href="/privacy-policy" className="text-link">
                    {t('auth.register.privacy')}
                  </a>
                </label>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="agreeToData"
                  name="agreeToData"
                  checked={formData.agreeToData}
                  onChange={handleInputChange}
                  required
                />
                <label htmlFor="agreeToData">
                  {t('auth.register.pdplConsent')}
                </label>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="receiveUpdates"
                  name="receiveUpdates"
                  checked={formData.receiveUpdates}
                  onChange={handleInputChange}
                />
                <label htmlFor="receiveUpdates">
                  {t('auth.register.marketingConsent')}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`create-account-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="register-spinner"
                  style={{
                    marginRight: '8px',
                    animation: 'spin 1s linear infinite'
                  }}
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="37.7"
                    strokeDashoffset="37.7"
                    strokeLinecap="round"
                    style={{
                      animation: 'spin-dash 1.5s ease-in-out infinite'
                    }}
                  />
                </svg>
              )}
              {loading ? t('auth.register.creating') : t('auth.register.button')}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="signin-section">
            <p>
              {t('auth.register.haveAccount')}
              <button
                type="button"
                className="signin-link"
                onClick={() => navigate("/login")}
              >
                {t('auth.register.signIn')}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Dialog */}
      <OTPDialog
        isOpen={showOTPDialog}
        onClose={() => setShowOTPDialog(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        email={otpData?.email || formData.email}
        loading={loading}
      />
    </div>
  );
};

export default Registration;
