import React, { useState, useRef, useEffect } from 'react';
import './OTPDialog.css';

const OTPDialog = ({ isOpen, onClose, onVerify, onResend, email, loading }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      console.log('OTP Dialog opened for email:', email);
      // Focus first input when dialog opens
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }

      // Start resend timer
      setResendTimer(60);
      setCanResend(false);

      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, email]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6);
      const newOtp = [...otp];

      for (let i = 0; i < pastedData.length && index + i < 6; i++) {
        newOtp[index + i] = pastedData[i];
      }

      setOtp(newOtp);
      setError('');

      // Focus last filled input or next empty one
      const nextIndex = Math.min(index + pastedData.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
      return;
    }

    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Move to next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowRight' && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      await onVerify(otpValue);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }
  };

  const handleResend = async () => {
    if (!canResend || loading) return;

    try {
      await onResend();
      setOtp(['', '', '', '', '', '']);
      setError('');
      setResendTimer(60);
      setCanResend(false);

      // Restart timer
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="otp-dialog-overlay" onClick={onClose}>
      <div className="otp-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="otp-dialog-header">
          <div className="otp-header-left">
            <button className="otp-back-btn" onClick={onClose} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="otp-header-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1Z" stroke="#3B82F6" strokeWidth="2"/>
                <path d="M10 6V10L13 13" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="otp-dialog-title">Verify OTP</h3>
          </div>
          <button className="otp-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="otp-dialog-body">
          <div className="otp-info">
            <p>We've sent a 6-digit verification code to</p>
            <p className="otp-email">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="otp-form">
            {error && (
              <div className="otp-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#DC2626"/>
                  <path d="M8 4V8M8 12H8.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  disabled={loading}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="submit"
              className={`otp-verify-btn ${loading ? 'loading' : ''}`}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading && (
                <svg className="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="37.7" strokeDashoffset="37.7" strokeLinecap="round"/>
                </svg>
              )}
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <div className="otp-resend">
              <p>
                Didn't receive the code?{' '}
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="otp-resend-btn"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="otp-timer">Resend in {resendTimer}s</span>
                )}
              </p>
            </div>
          </form>

          <div className="otp-security-tip">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0C7.1 0 7.2 0.025 7.3 0.0625L12.5 2.25C13.05 2.475 13.45 3.025 13.45 3.625C13.44 6.125 12.4 10.675 7.7 12.8C7.3 13 6.7 13 6.3 12.8C1.6 10.675 0.56 6.125 0.55 3.625C0.55 3.025 0.95 2.475 1.5 2.25L6.7 0.0625C6.8 0.025 6.9 0 7 0ZM7 1.825V12.15C10.675 10.425 11.65 6.3 11.675 3.875L7 1.825Z" fill="#3B82F6"/>
            </svg>
            <p><strong>Security Tip:</strong> Never share your OTP with anyone. We'll never ask for your verification code.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPDialog;
