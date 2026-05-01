import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Zap, BarChart3, QrCode, Mail, Loader2, Eye, EyeOff, ArrowLeft, Globe } from "lucide-react";
import logoIcon from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { passwordResetService } from "@/services/jwtService";
import amplitudeService from "@/services/amplitude";

type Step = "email" | "otp" | "password";

const OTP_LENGTH = 4;

const ForgotPassword = () => {
  const { t, isAr, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Stable ref so event handlers always read the latest normalised email
  // without depending on a possibly-stale closure over `email` state.
  const normalizedEmailRef = useRef("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Resend countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // ── OTP digit input handlers ────────────────────────────────────────────────
  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste — spread up to OTP_LENGTH digits starting at this box
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
      const next = [...digits];
      for (let i = 0; i < pasted.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = pasted[i];
      }
      setDigits(next);
      const focus = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focus]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const otpValue = digits.join("");

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = email.trim();
    if (!raw) return;

    // Normalise exactly as the backend's validateForgotPassword middleware does
    const normalized = raw.toLowerCase();
    normalizedEmailRef.current = normalized;

    setIsLoading(true);
    try {
      const res: any = await passwordResetService.sendOtp(normalized);

      if (!res?.success) {
        throw new Error(res?.message || t("Failed to send code.", "فشل الإرسال."));
      }

      // Dev mode: backend includes the OTP in the response body
      if (res?.otp) {
        const autoFilled = String(res.otp).slice(0, OTP_LENGTH);
        const filled = autoFilled.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);
        setDigits(filled);
        setDevOtp(autoFilled);
      } else {
        setDigits(Array(OTP_LENGTH).fill(""));
        setDevOtp(null);
      }

      amplitudeService.trackPasswordResetRequested(normalized);
      setEmail(normalized); // keep email state in sync
      setResendTimer(60);
      setStep("otp");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);

      toast({
        title: t("Code sent", "تم إرسال الرمز"),
        description: t(
          "A verification code has been sent to your email.",
          "تم إرسال رمز التحقق إلى بريدك الإلكتروني."
        ),
      });
    } catch (err: any) {
      toast({
        title: t("Error", "خطأ"),
        description: err.message || t("Failed to send code. Try again.", "فشل الإرسال. حاول مجدداً."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== OTP_LENGTH) return;

    setIsLoading(true);
    try {
      // Always use the ref so we never accidentally send a stale/un-normalized email
      const emailToSend = normalizedEmailRef.current || email;
      const res: any = await passwordResetService.verifyOtp(emailToSend, otpValue);

      if (!res?.success) {
        throw new Error(res?.message || t("Invalid verification code.", "رمز التحقق غير صحيح."));
      }

      setDevOtp(null);
      setStep("password");
      toast({
        title: t("Code verified", "تم التحقق"),
        description: t("Now set your new password.", "الآن قم بتعيين كلمة المرور الجديدة."),
      });
    } catch (err: any) {
      toast({
        title: t("Invalid code", "رمز غير صحيح"),
        description: err.message || t("The code is invalid or expired.", "الرمز غير صحيح أو منتهي الصلاحية."),
        variant: "destructive",
      });
      // Clear boxes on error so the user can try again
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (isLoading || resendTimer > 0) return;
    setIsLoading(true);
    try {
      const emailToSend = normalizedEmailRef.current || email;
      const res: any = await passwordResetService.sendOtp(emailToSend);

      if (!res?.success) {
        throw new Error(res?.message || t("Failed to resend.", "فشل إعادة الإرسال."));
      }

      if (res?.otp) {
        const autoFilled = String(res.otp).slice(0, OTP_LENGTH);
        const filled = autoFilled.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);
        setDigits(filled);
        setDevOtp(autoFilled);
      } else {
        setDigits(Array(OTP_LENGTH).fill(""));
        setDevOtp(null);
      }

      setResendTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);

      toast({
        title: t("Code resent", "تم إعادة الإرسال"),
        description: t("A new verification code has been sent.", "تم إرسال رمز تحقق جديد."),
      });
    } catch (err: any) {
      toast({
        title: t("Error", "خطأ"),
        description: err.message || t("Failed to resend. Try again.", "فشل إعادة الإرسال. حاول مجدداً."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({
        title: t("Password too short", "كلمة المرور قصيرة"),
        description: t("Password must be at least 8 characters.", "يجب أن تكون كلمة المرور 8 أحرف على الأقل."),
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: t("Passwords don't match", "كلمتا المرور غير متطابقتين"),
        description: t("Please make sure both passwords are the same.", "تأكد من أن كلمتي المرور متطابقتان."),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const emailToSend = normalizedEmailRef.current || email;
      const res: any = await passwordResetService.resetPassword(emailToSend, newPassword);

      if (!res?.success) {
        throw new Error(res?.message || t("Reset failed.", "فشل إعادة التعيين."));
      }

      amplitudeService.trackPasswordResetCompleted();
      toast({
        title: t("Password reset", "تم تغيير كلمة المرور"),
        description: t(
          "Your password has been reset. Please sign in.",
          "تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن."
        ),
      });
      navigate("/login");
    } catch (err: any) {
      toast({
        title: t("Reset failed", "فشل إعادة التعيين"),
        description: err.message || t("Something went wrong. Try again.", "حدث خطأ ما. حاول مجدداً."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step indicators ─────────────────────────────────────────────────────────
  const steps: { key: Step; label: string; labelAr: string }[] = [
    { key: "email",    label: "Email",    labelAr: "البريد" },
    { key: "otp",      label: "Verify",   labelAr: "التحقق" },
    { key: "password", label: "Password", labelAr: "كلمة السر" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 bg-muted/30">
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center mb-10">
            <img src={logoIcon} alt="snip.sa" className="h-20" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            {t("Shorten. Track. Grow.", "اختصر. تابع. انمو.")}
          </h1>
          <p className="text-muted-foreground font-body text-lg mb-10">
            {t(
              "The smartest URL shortener built for Saudi Arabia.",
              "أذكى مختصر روابط مصمم للسعودية."
            )}
          </p>
          <div className="space-y-4 text-start">
            {[
              { icon: Zap,       label: t("Real-time analytics", "تحليلات لحظية") },
              { icon: QrCode,    label: t("QR code generation", "إنشاء أكواد QR") },
              { icon: BarChart3, label: t("Campaign tracking", "تتبع الحملات") },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-body text-foreground">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="absolute top-4 end-4 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-body text-sm px-3 py-1.5 rounded-md hover:bg-muted"
        >
          <Globe size={14} />
          {lang === "en" ? "العربية" : "English"}
        </button>

        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-4">
            <img src={logoIcon} alt="snip.sa" className="h-14" />
          </div>

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              {t("Reset your password", "إعادة تعيين كلمة المرور")}
            </h2>
            <p className="text-muted-foreground font-body mt-2 text-sm">
              {step === "email" &&
                t(
                  "Enter your email and we'll send you a verification code.",
                  "أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق."
                )}
              {step === "otp" &&
                t(
                  `Enter the ${OTP_LENGTH}-digit code sent to ${email}`,
                  `أدخل الرمز المكون من ${OTP_LENGTH} أرقام المرسل إلى ${email}`
                )}
              {step === "password" &&
                t(
                  "Choose a strong new password for your account.",
                  "اختر كلمة مرور قوية جديدة لحسابك."
                )}
            </p>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-display font-bold shrink-0 transition-colors",
                    i < stepIndex
                      ? "bg-primary text-primary-foreground"
                      : i === stepIndex
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-body truncate",
                    i === stepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {isAr ? s.labelAr : s.label}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={cn("flex-1 h-px", i < stepIndex ? "bg-primary" : "bg-border")}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fp-email" className="text-foreground">
                  {t("Email address", "البريد الإلكتروني")}
                </Label>
                <Input
                  id="fp-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-11", isAr && "text-right")}
                  dir="ltr"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={!email.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t("Sending…", "جاري الإرسال…")}
                  </>
                ) : (
                  t("Send verification code", "أرسل رمز التحقق")
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground font-body">
                {t("Remember your password?", "تذكرت كلمة المرور؟")}{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  {t("Sign in", "تسجيل الدخول")}
                </Link>
              </p>
            </form>
          )}

          {/* ── Step 2: OTP (4-digit boxes) ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* Dev badge */}
              {devOtp && (
                <div className="text-xs font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
                  {t("Dev mode — code auto-filled:", "وضع التطوير — تم ملء الرمز تلقائياً:")}{" "}
                  <strong>{devOtp}</strong>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-foreground">
                  {t("Verification code", "رمز التحقق")}
                </Label>
                {/* 4 individual digit boxes */}
                <div className="flex gap-3 justify-center" dir="ltr">
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={OTP_LENGTH}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      disabled={isLoading}
                      className={cn(
                        "w-14 h-14 text-center text-2xl font-display font-bold rounded-lg border-2 bg-background transition-colors outline-none",
                        "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                        digit ? "border-primary/60" : "",
                        isLoading && "opacity-50 cursor-not-allowed"
                      )}
                      aria-label={t(`Digit ${i + 1}`, `الرقم ${i + 1}`)}
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground font-body">
                  {t(`Code sent to ${email}`, `تم الإرسال إلى ${email}`)}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={otpValue.length !== OTP_LENGTH || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t("Verifying…", "جاري التحقق…")}
                  </>
                ) : (
                  t("Verify code", "تحقق من الرمز")
                )}
              </Button>

              {/* Resend */}
              <div className="text-center text-sm font-body">
                {resendTimer > 0 ? (
                  <span className="text-muted-foreground">
                    {t(`Resend in ${resendTimer}s`, `إعادة الإرسال خلال ${resendTimer}ث`)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    {t("Resend code", "أعد إرسال الرمز")}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setDigits(Array(OTP_LENGTH).fill(""));
                  setDevOtp(null);
                  setResendTimer(0);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("Change email", "غيّر البريد الإلكتروني")}
              </button>
            </form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fp-new-password" className="text-foreground">
                  {t("New password", "كلمة المرور الجديدة")}
                </Label>
                <div className="relative" dir="ltr">
                  <Input
                    id="fp-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={cn("h-11 pe-10", isAr && "text-right")}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  {t("Minimum 8 characters.", "8 أحرف على الأقل.")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fp-confirm-password" className="text-foreground">
                  {t("Confirm new password", "تأكيد كلمة المرور")}
                </Label>
                <div className="relative" dir="ltr">
                  <Input
                    id="fp-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn("h-11 pe-10", isAr && "text-right")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive font-body">
                    {t("Passwords do not match.", "كلمتا المرور غير متطابقتين.")}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={!newPassword || !confirmPassword || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t("Saving…", "جاري الحفظ…")}
                  </>
                ) : (
                  t("Reset password", "إعادة تعيين كلمة المرور")
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground font-body">
                {t("Remember your password?", "تذكرت كلمة المرور؟")}{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  {t("Sign in", "تسجيل الدخول")}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
