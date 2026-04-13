import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Zap, BarChart3, QrCode, Loader2, CheckCircle2, Circle } from "lucide-react";
import logoIcon from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const COUNTRY_OPTIONS = [
  { dialCode: "+966", flag: "🇸🇦", label: "SA", maxDigits: 9,  placeholder: "5XXXXXXXX"  },
  // { dialCode: "+91",  flag: "🇮🇳", label: "IN", maxDigits: 10, placeholder: "XXXXXXXXXX" },
];

// Password strength rules matching backend validateRegistration
const passwordRules = [
  { key: "length",    test: (p: string) => p.length >= 8 },
  { key: "lower",     test: (p: string) => /[a-z]/.test(p) },
  { key: "upper",     test: (p: string) => /[A-Z]/.test(p) },
  { key: "number",    test: (p: string) => /\d/.test(p) },
];

const Signup = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);
  const [countryOpen, setCountryOpen]         = useState(false);
  const [password, setPassword]   = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OTP verification step
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp]         = useState("");

  // ── Derived ──
  const pwRulesMet = passwordRules.map((r) => r.test(password));
  const allRulesMet = pwRulesMet.every(Boolean);
  const passwordsMatch = password === confirmPassword;

  const ruleLabels = [
    t("At least 8 characters", "8 أحرف على الأقل"),
    t("One lowercase letter", "حرف صغير واحد"),
    t("One uppercase letter", "حرف كبير واحد"),
    t("One number", "رقم واحد"),
  ];

  // ── Validate before first submit ──
  const validate = (): string | null => {
    if (!fullName.trim() || fullName.trim().length < 2)
      return t("Full name must be at least 2 characters", "الاسم الكامل يجب أن يكون حرفين على الأقل");
    if (!email.trim())
      return t("Email is required", "البريد الإلكتروني مطلوب");
    if (!phone.trim() || phone.trim().length < selectedCountry.maxDigits)
      return t("Phone number is required", "رقم الجوال مطلوب");
    if (!allRulesMet)
      return t("Password does not meet requirements", "كلمة المرور لا تستوفي المتطلبات");
    if (!passwordsMatch)
      return t("Passwords do not match", "كلمتا المرور غير متطابقتين");
    return null;
  };

  // ── First submit: register + trigger OTP ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: t("Validation Error", "خطأ في التحقق"), description: err, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const payload: Record<string, string> = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      };
      payload.phone = selectedCountry.dialCode + phone.trim();

      const response = await register(payload);

      if (response?.otpRequired || response?.data?.otpSent) {
        setOtpStep(true);
        toast({
          title: t("OTP Sent", "تم إرسال رمز التحقق"),
          description: t(
            "Please check your email or phone for the 6-digit code",
            "تحقق من بريدك الإلكتروني أو هاتفك للحصول على الرمز المكون من 6 أرقام"
          ),
        });
      } else {
        // Direct registration (no OTP required)
        toast({
          title: t("Registration Successful", "تم التسجيل بنجاح"),
          description: t("Welcome!", "مرحباً بك!"),
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: t("Registration Failed", "فشل التسجيل"),
        description: error.message || t("Failed to create account. Please try again.", "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Second submit: verify OTP ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;

    setIsLoading(true);
    try {
      const payload: Record<string, string> = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        otp,
      };
      payload.phone = selectedCountry.dialCode + phone.trim();

      const response = await register(payload);

      if (response?.success) {
        toast({
          title: t("Registration Successful", "تم التسجيل بنجاح"),
          description: t("Welcome!", "مرحباً بك!"),
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: t("Verification Failed", "فشل التحقق"),
        description: error.message || t("Invalid or expired verification code", "رمز التحقق غير صحيح أو منتهي الصلاحية"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 bg-muted/30">
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center mb-10">
            <img src={logoIcon} alt="snip.sa" className="h-20" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            {t("Start for free today", "ابدأ مجاناً اليوم")}
          </h1>
          <p className="text-muted-foreground font-body text-lg mb-10">
            {t(
              "Create your account and start shortening links, generating QR codes, and tracking analytics.",
              "أنشئ حسابك وابدأ باختصار الروابط وإنشاء أكواد QR وتتبع التحليلات."
            )}
          </p>
          <div className="space-y-4 text-left">
            {[
              { icon: Zap,      label: t("Real-time analytics", "تحليلات لحظية") },
              { icon: QrCode,   label: t("QR code generation", "إنشاء أكواد QR") },
              { icon: BarChart3, label: t("Campaign tracking", "تتبع الحملات") },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-body text-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center mb-2">
            <img src={logoIcon} alt="snip.sa" className="h-12" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {otpStep
                ? t("Verify your account", "تحقق من حسابك")
                : t("Create your account", "أنشئ حسابك")}
            </h2>
            <p className="text-muted-foreground font-body mt-1 text-sm">
              {otpStep
                ? t(`Code sent to ${email}`, `تم إرسال الرمز إلى ${email}`)
                : t("Get started for free — no credit card required", "ابدأ مجاناً — لا تحتاج إلى بطاقة ائتمان")}
            </p>
          </div>

          {/* ── OTP step ── */}
          {otpStep ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-foreground">
                  {t("Verification Code", "رمز التحقق")}
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="h-12 text-center text-xl tracking-[0.6em] font-display"
                  dir="ltr"
                  maxLength={4}
                  autoFocus
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base bg-primary text-primary-foreground"
                disabled={otp.length < 4 || isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 me-2 animate-spin" />{t("Verifying...", "جاري التحقق...")}</>
                ) : (
                  t("Verify & Create Account", "تحقق وأنشئ الحساب")
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setOtpStep(false); setOtp(""); }}
                className="w-full text-sm text-primary hover:underline font-body"
                disabled={isLoading}
              >
                {t("← Change information", "← تعديل البيانات")}
              </button>
            </form>
          ) : (
            /* ── Registration form ── */
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-foreground text-sm">
                  {t("Full Name", "الاسم الكامل")} *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t("Your full name", "اسمك الكامل")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11"
                  required
                  minLength={2}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground text-sm">
                  {t("Email", "البريد الإلكتروني")} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                  dir="ltr"
                />
              </div>

              {/* Phone (required) */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-foreground text-sm">
                  {t("Phone Number", "رقم الجوال")} *
                </Label>
                <div className="flex gap-2">
                  {/* Country code selector */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setCountryOpen(!countryOpen)}
                      className="flex items-center gap-1.5 h-11 px-3 rounded-md border border-input bg-muted/50 text-sm font-body text-foreground hover:bg-muted transition-colors"
                    >
                      <span>{selectedCountry.flag}</span>
                      <span className="text-muted-foreground">{selectedCountry.dialCode}</span>
                      <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {countryOpen && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-border rounded-md shadow-md min-w-[140px]">
                        {COUNTRY_OPTIONS.map((c) => (
                          <button
                            key={c.dialCode}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setPhone("");
                              setCountryOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-sm font-body hover:bg-muted transition-colors text-left",
                              selectedCountry.dialCode === c.dialCode && "bg-muted"
                            )}
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
                    id="phone"
                    type="tel"
                    placeholder={selectedCountry.placeholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, selectedCountry.maxDigits))}
                    className="h-11"
                    maxLength={selectedCountry.maxDigits}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground text-sm">
                  {t("Password", "كلمة المرور")} *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pe-10"
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password rules */}
                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {passwordRules.map((_, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {pwRulesMet[i]
                          ? <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />
                          : <Circle className="w-3 h-3 text-muted-foreground shrink-0" />}
                        <span className={`text-[10px] font-body ${pwRulesMet[i] ? "text-green-700" : "text-muted-foreground"}`}>
                          {ruleLabels[i]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-foreground text-sm">
                  {t("Confirm Password", "تأكيد كلمة المرور")} *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-11 pe-10 ${
                      confirmPassword.length > 0 && !passwordsMatch ? "border-destructive" : ""
                    }`}
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive font-body">
                    {t("Passwords do not match", "كلمتا المرور غير متطابقتين")}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base bg-primary text-primary-foreground mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 me-2 animate-spin" />{t("Creating Account...", "جاري إنشاء الحساب...")}</>
                ) : (
                  t("Create Account", "إنشاء حساب")
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground font-body">
            {t("Already have an account?", "عندك حساب؟")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("Sign in", "سجل دخول")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
