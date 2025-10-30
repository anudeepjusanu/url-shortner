import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);
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
      // Call login API
      const result = await login(formData.email.trim().toLowerCase(), formData.password);

      if (result.success) {
        // Login successful - navigate to dashboard
        navigate("/dashboard");
      }
      // Errors are handled by the AuthContext and displayed in the UI
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGoogleLogin = () => {
    // Handle Google login
    console.log("Google login clicked");
  };

  const handleForgotPassword = () => {
    // Handle forgot password
    console.log("Forgot password clicked");
    // TODO: Implement forgot password functionality
  };

  return (
    <div className="login-container">
      {/* Left Panel - Brand and Features */}
      <div className="left-panel">
        <div className="left-content">
          {/* Brand Section */}
          <div className="brand-section">
            <div className="brand-logo">
              <div className="logo-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="24"
                  viewBox="0 0 30 24"
                  fill="none"
                >
                  <g clipPath="url(#clip0_775_2923)">
                    <path
                      d="M27.1781 12.5484C29.8266 9.90001 29.8266 5.61095 27.1781 2.96251C24.8344 0.618761 21.1406 0.314073 18.4453 2.24064L18.3703 2.2922C17.6953 2.77501 17.5406 3.71251 18.0235 4.38282C18.5063 5.05314 19.4438 5.21251 20.1141 4.7297L20.1891 4.67814C21.6938 3.6047 23.7516 3.77345 25.0547 5.08126C26.5313 6.55782 26.5313 8.94845 25.0547 10.425L19.7953 15.6938C18.3188 17.1703 15.9281 17.1703 14.4516 15.6938C13.1438 14.3859 12.975 12.3281 14.0485 10.8281L14.1 10.7531C14.5828 10.0781 14.4235 9.14064 13.7531 8.66251C13.0828 8.18439 12.1406 8.33907 11.6625 9.00939L11.611 9.08439C9.67971 11.775 9.9844 15.4688 12.3281 17.8125C14.9766 20.461 19.2656 20.461 21.9141 17.8125L27.1781 12.5484ZM2.8219 11.4516C0.173462 14.1 0.173462 18.3891 2.8219 21.0375C5.16565 23.3813 8.8594 23.686 11.5547 21.7594L11.6297 21.7078C12.3047 21.225 12.4594 20.2875 11.9766 19.6172C11.4938 18.9469 10.5563 18.7875 9.88596 19.2703L9.81096 19.3219C8.30627 20.3953 6.24846 20.2266 4.94534 18.9188C3.46877 17.4375 3.46877 15.0469 4.94534 13.5703L10.2047 8.30626C11.6813 6.8297 14.0719 6.8297 15.5485 8.30626C16.8563 9.61407 17.025 11.6719 15.9516 13.1766L15.9 13.2516C15.4172 13.9266 15.5766 14.8641 16.2469 15.3422C16.9172 15.8203 17.8594 15.6656 18.3375 14.9953L18.3891 14.9203C20.3203 12.225 20.0156 8.53126 17.6719 6.18751C15.0235 3.53907 10.7344 3.53907 8.08596 6.18751L2.8219 11.4516Z"
                      fill="#1F2937"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2923">
                      <path d="M0 0H30V24H0V0Z" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
            <h1 className="brand-title">LinkSa</h1>
            <p className="brand-subtitle">Welcome back to your dashboard</p>
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
                  <g clipPath="url(#clip0_775_2962)">
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
                <h3>Manage Your Links</h3>
                <p>Access all your shortened URLs in one place</p>
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
                  <g clipPath="url(#clip0_775_2965)">
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
                <h3>Track Performance</h3>
                <p>View detailed analytics and insights</p>
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
                  <g clipPath="url(#clip0_775_2968)">
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
                <h3>Secure & Reliable</h3>
                <p>Your data is protected with enterprise security</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="right-panel">
        {/* Language Toggle */}
        <div className="language-toggle">
          <button className="lang-toggle-btn">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="7" cy="7" r="6" stroke="#6B7280" strokeWidth="2" />
              <path
                d="M2 7h10M7 2c1.5 0 3 2.686 3 6s-1.5 6-3 6-3-2.686-3-6 1.5-6 3-6z"
                stroke="#6B7280"
                strokeWidth="2"
              />
            </svg>
            العربية
          </button>
        </div>

        <div className="form-wrapper">
          {/* Header */}
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {/* Google Sign In */}
          <div className="google-section">
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleLogin}
            >
              <svg
                width="19"
                height="20"
                viewBox="0 0 19 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
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
              Sign in with Google
            </button>

            <div className="divider">
              <hr />
              <span>Or sign in with email</span>
            </div>
          </div>

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

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className={formErrors.email ? 'error' : ''}
                required
              />
              {formErrors.email && (
                <span className="field-error">{formErrors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? 'error' : ''}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg
                    width="18"
                    height="16"
                    viewBox="0 0 18 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 8s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="9"
                      cy="8"
                      r="3"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
              {formErrors.password && (
                <span className="field-error">{formErrors.password}</span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <button
                type="button"
                className="forgot-password-link"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`sign-in-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1V4M8 12V15M15 8H12M4 8H1M12.7279 3.27208L10.6066 5.39345M5.39345 10.6066L3.27208 12.7279M12.7279 12.7279L10.6066 10.6066M5.39345 5.39345L3.27208 3.27208" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="signup-section">
            <p>
              Don't have an account?
              <button
                type="button"
                className="signup-link"
                onClick={() => navigate("/register")}
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;