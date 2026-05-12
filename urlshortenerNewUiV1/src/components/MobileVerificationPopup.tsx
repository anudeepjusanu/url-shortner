import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/services/api';
import amplitudeService from '@/services/amplitude';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TEMPORARY: India support added for testing - REMOVE BEFORE PRODUCTION
// ============================================================================
const SAUDI_NUMBER_REGEX = /^5\d{8}$/;
const INDIA_NUMBER_REGEX = /^[6-9]\d{9}$/;  // TEMPORARY - REMOVE AFTER TESTING
const SAUDI_COUNTRY_CODE = '+966';
const INDIA_COUNTRY_CODE = '+91';  // TEMPORARY - REMOVE AFTER TESTING
// ============================================================================

const RESEND_COOLDOWN = 60;
const MAX_RESENDS = 3;
const MAX_OTP_ATTEMPTS = 5;
const OTP_LENGTH = 6;

// TEMPORARY: Country options for testing - REMOVE AFTER TESTING
const COUNTRY_OPTIONS = [
  { dialCode: '+966', flag: '🇸🇦', label: 'SA', maxDigits: 9, placeholder: '5XXXXXXXX' },
  // { dialCode: '+91', flag: '🇮🇳', label: 'IN', maxDigits: 10, placeholder: '9XXXXXXXXX' },
];

interface MobileVerificationPopupProps {
  open: boolean;
  sessionToken: string;
  onClose: () => void;
}

const MobileVerificationPopup = ({ open, sessionToken, onClose }: MobileVerificationPopupProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // TEMPORARY: Country selection state for testing - REMOVE AFTER TESTING
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);
  const [countryOpen, setCountryOpen] = useState(false);

  const [step, setStep] = useState<'phone' | 'otp' | 'locked'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpResends, setOtpResends] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      clearTimers();
      setStep('phone');
      setPhoneNumber('');
      setPhoneError('');
      setOtp('');
      setOtpError('');
      setOtpAttempts(0);
      setOtpResends(0);
      setResendCooldown(0);
      setOtpExpiresAt(null);
      setTimeRemaining(null);
      setSelectedCountry(COUNTRY_OPTIONS[0]); // TEMPORARY - Reset to Saudi
      setCountryOpen(false); // TEMPORARY
    }
  }, [open, clearTimers]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (otpExpiresAt) {
      clearTimers();
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          clearTimers();
        }
      }, 1000);
      return () => clearTimers();
    }
  }, [otpExpiresAt, clearTimers]);

  const handleClose = async () => {
    clearTimers();
    try {
      await authAPI.googleCancelSignup(sessionToken);
    } catch {}
    onClose();
  };

  // TEMPORARY: Validation for both Saudi and India - REMOVE AFTER TESTING
  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) {
      setPhoneError('');
      return false;
    }
    
    // Check if it's a Saudi number (9 digits starting with 5)
    const isSaudiNumber = digits.length === 9 && SAUDI_NUMBER_REGEX.test(digits);
    
    // Check if it's an India number (10 digits starting with 6-9)
    const isIndiaNumber = digits.length === 10 && INDIA_NUMBER_REGEX.test(digits);
    
    // Validate based on selected country
    if (selectedCountry.dialCode === '+966') {
      // Saudi Arabia validation
      if (digits.length > 0 && digits[0] !== '5') {
        setPhoneError(t('Saudi mobile numbers must start with 5', 'أرقام الجوال السعودية يجب أن تبدأ بـ 5'));
        return false;
      }
      
      if (digits.length < 9) {
        setPhoneError(t('Please enter 9 digits (5XXXXXXXX)', 'الرجاء إدخال 9 أرقام (5XXXXXXXX)'));
        return false;
      }
      
      if (digits.length === 9 && !isSaudiNumber) {
        setPhoneError(t('Invalid Saudi mobile number format', 'تنسيق رقم الجوال السعودي غير صحيح'));
        return false;
      }
    } else if (selectedCountry.dialCode === '+91') {
      // India validation (TEMPORARY)
      if (digits.length > 0 && !['6', '7', '8', '9'].includes(digits[0])) {
        setPhoneError(t('Indian mobile numbers must start with 6, 7, 8, or 9', 'أرقام الجوال الهندية يجب أن تبدأ بـ 6 أو 7 أو 8 أو 9'));
        return false;
      }
      
      if (digits.length < 10) {
        setPhoneError(t('Please enter 10 digits (9XXXXXXXXX)', 'الرجاء إدخال 10 أرقام (9XXXXXXXXX)'));
        return false;
      }
      
      if (digits.length === 10 && !isIndiaNumber) {
        setPhoneError(t('Invalid Indian mobile number format', 'تنسيق رقم الجوال الهندي غير صحيح'));
        return false;
      }
    }
    
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TEMPORARY: Allow up to 10 digits for India - REMOVE AFTER TESTING
    const value = e.target.value.replace(/\D/g, '').slice(0, selectedCountry.maxDigits);
    setPhoneNumber(value);
    
    // Real-time validation - show errors immediately
    if (value.length > 0) {
      validatePhone(value);
    } else {
      setPhoneError('');
    }
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phoneNumber)) return;

    setIsSendingOtp(true);
    setOtpError('');

    try {
      await authAPI.googleSendOTP(sessionToken, phoneNumber);

      setOtpResends((prev) => prev + 1);
      setResendCooldown(RESEND_COOLDOWN);
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
      setTimeRemaining(300);
      setOtp('');
      setStep('otp');

      toast({
        title: t('Code Sent', 'تم إرسال الرمز'),
        description: t(
          `Verification code sent to your mobile number`,
          `تم إرسال رمز التحقق إلى رقم جوالك`
        ),
      });
    } catch (error: any) {
      setPhoneError(error.message || t('Failed to send code', 'فشل إرسال الرمز'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResends >= MAX_RESENDS || resendCooldown > 0) return;

    setIsSendingOtp(true);
    setOtpError('');

    try {
      await authAPI.googleSendOTP(sessionToken, phoneNumber);

      setOtpResends((prev) => prev + 1);
      setResendCooldown(RESEND_COOLDOWN);
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
      setTimeRemaining(300);
      setOtp('');

      toast({
        title: t('Code Resent', 'تم إعادة إرسال الرمز'),
        description: t(
          'A new verification code has been sent',
          'تم إرسال رمز تحقق جديد'
        ),
      });
    } catch (error: any) {
      setOtpError(error.message || t('Failed to resend code', 'فشل إعادة إرسال الرمز'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      setOtpError(t('Please enter the 6-digit code', 'الرجاء إدخال الرمز المكون من 6 أرقام'));
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      const response = await authAPI.googleVerifyOTP(sessionToken, otp);

      if (response.success) {
        clearTimers();
        amplitudeService.trackRegistrationCompleted(response.data.user?.id, {
          email: response.data.user?.email,
          role: response.data.user?.role,
          registration_method: 'google',
        });

        toast({
          title: t('Account Created', 'تم إنشاء الحساب'),
          description: t('Welcome!', 'مرحباً بك!'),
        });

        onClose();
        navigate('/dashboard');
      }
    } catch (error: any) {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);

      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        setStep('locked');
        clearTimers();
        setOtpError('');
        return;
      }

      setOtpError(
        error.message ||
          t(
            `Invalid code. ${MAX_OTP_ATTEMPTS - newAttempts} attempts remaining.`,
            `رمز غير صحيح. ${MAX_OTP_ATTEMPTS - newAttempts} محاولات متبقية.`
          )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const canResend = otpResends < MAX_RESENDS && resendCooldown === 0 && !isSendingOtp;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center font-display text-xl">
            {step === 'phone'
              ? t('Verify Your Mobile Number', 'تحقق من رقم جوالك')
              : step === 'otp'
                ? t('Enter Verification Code', 'أدخل رمز التحقق')
                : t('Verification Locked', 'تم قفل التحقق')}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {step === 'phone' &&
              t(
                'Please enter your mobile number to verify your identity.',
                'الرجاء إدخال رقم جوالك للتحقق من هويتك.'
              )}
            {step === 'otp' &&
              t(
                `A 6-digit code was sent to your mobile number`,
                `تم إرسال رمز مكون من 6 أرقام إلى رقم جوالك`
              )}
            {step === 'locked' &&
              t(
                'Too many failed attempts. Please try again later.',
                'محاولات فاشلة كثيرة. الرجاء المحاولة لاحقاً.'
              )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('Mobile Number', 'رقم الجوال')}</Label>
                <div className="flex items-center gap-2">
                  {/* TEMPORARY: Country selector for testing - REMOVE AFTER TESTING */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setCountryOpen(!countryOpen)}
                      className="flex items-center gap-1.5 h-11 px-3 rounded-md border border-input bg-background text-sm font-body text-foreground hover:bg-muted transition-colors"
                    >
                      <span>{selectedCountry.flag}</span>
                      <span className="text-muted-foreground">{selectedCountry.dialCode}</span>
                      <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {countryOpen && (
                      <div className="absolute top-full start-0 mt-1 z-50 bg-background border border-border rounded-md shadow-md min-w-[140px]">
                        {COUNTRY_OPTIONS.map((c) => (
                          <button
                            key={c.dialCode}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setPhoneNumber('');
                              setPhoneError('');
                              setCountryOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-body hover:bg-muted transition-colors text-start ${
                              selectedCountry.dialCode === c.dialCode ? 'bg-muted' : ''
                            }`}
                          >
                            <span>{c.flag}</span>
                            <span className="text-muted-foreground">{c.dialCode}</span>
                            <span className="text-foreground">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder={selectedCountry.placeholder}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={selectedCountry.maxDigits}
                    className="h-11"
                    dir="ltr"
                    disabled={isSendingOtp}
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-destructive font-body">{phoneError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t(
                    'Enter your mobile number (Saudi: 5XXXXXXXX or India: 9XXXXXXXXX)',
                    'أدخل رقم جوالك (السعودية: 5XXXXXXXX أو الهند: 9XXXXXXXXX)'
                  )}
                </p>
              </div>

              <Button
                type="button"
                className="w-full h-11 bg-primary text-primary-foreground"
                onClick={handleSendOtp}
                disabled={phoneNumber.length !== selectedCountry.maxDigits || isSendingOtp || !!phoneError}
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('Sending...', 'جاري الإرسال...')}
                  </>
                ) : (
                  t('Send Verification Code', 'إرسال رمز التحقق')
                )}
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('Verification Code', 'رمز التحقق')}</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                  className="h-12 text-center text-xl tracking-[0.5em] font-display"
                  dir="ltr"
                  maxLength={OTP_LENGTH}
                  autoFocus
                  disabled={isLoading}
                />
                {otpError && (
                  <p className="text-xs text-destructive font-body">{otpError}</p>
                )}
                {timeRemaining !== null && timeRemaining > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {t(
                      `Code expires in ${formatTime(timeRemaining)}`,
                      `ينتهي الرمز خلال ${formatTime(timeRemaining)}`
                    )}
                  </p>
                )}
                {timeRemaining === 0 && (
                  <p className="text-xs text-destructive text-center">
                    {t('Code expired. Please request a new one.', 'انتهت صلاحية الرمز. الرجاء طلب رمز جديد.')}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground"
                disabled={otp.length !== OTP_LENGTH || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('Verifying...', 'جاري التحقق...')}
                  </>
                ) : (
                  t('Verify & Continue', 'تحقق واستمر')
                )}
              </Button>

              <div className="text-center space-y-2">
                {canResend && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-primary hover:underline font-body"
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp
                      ? t('Resending...', 'جاري إعادة الإرسال...')
                      : t(
                          `Resend code (${MAX_RESENDS - otpResends} remaining)`,
                          `إعادة إرسال الرمز (${MAX_RESENDS - otpResends} متبقي)`
                        )}
                  </button>
                )}
                {resendCooldown > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      `Resend available in ${resendCooldown}s`,
                      `إعادة الإرسال متاحة بعد ${resendCooldown} ثانية`
                    )}
                  </p>
                )}
                {otpResends >= MAX_RESENDS && resendCooldown === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('Maximum resends reached', 'تم الوصول للحد الأقصى لإعادة الإرسال')}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setStep('phone'); setPhoneNumber(''); setOtp(''); setOtpError(''); }}
                className="w-full text-sm text-muted-foreground hover:underline font-body"
                disabled={isLoading || isSendingOtp}
              >
                {t('← Change number', '← تغيير الرقم')}
              </button>
            </form>
          )}

          {step === 'locked' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t(
                  'Your verification has been locked due to too many failed attempts. Please close this window and try again later.',
                  'تم قفل التحقق بسبب محاولات فاشلة كثيرة. الرجاء إغلاق هذه النافذة والمحاولة لاحقاً.'
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleClose}
              >
                {t('Close', 'إغلاق')}
              </Button>
            </div>
          )}

          {step !== 'locked' && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full text-sm text-muted-foreground hover:underline font-body pt-2"
              disabled={isLoading || isSendingOtp}
            >
              {t('Cancel', 'إلغاء')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileVerificationPopup;
