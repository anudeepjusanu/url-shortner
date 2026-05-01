import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Zap, BarChart3, QrCode, Loader2, Eye, EyeOff, Globe } from "lucide-react";
import logoIcon from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import amplitudeService from "@/services/amplitude";

// const COUNTRY_OPTIONS = [
//   { dialCode: "+966", flag: "🇸🇦", label: "SA", maxDigits: 9, placeholder: "5XXXXXXXX" },
// ];

const Login = () => {
  const { t, isAr, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpData, setOtpData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP tab state (commented out) ──────────────────────────────────────────
  // const [authMethod, setAuthMethod] = useState<"email" | "otp">("email");
  // const [phone, setPhone] = useState("");
  // const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);
  // const [countryOpen, setCountryOpen] = useState(false);

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      const response = await login({ email, password });

      if (response.otpRequired) {
        setOtpSent(true);
        setOtpData(response.otpData);
        toast({
          title: t("OTP Sent", "تم إرسال رمز التحقق"),
          description: t(
            "Please check your email for the verification code",
            "يرجى التحقق من بريدك الإلكتروني للحصول على رمز التحقق"
          ),
        });
      } else {
        amplitudeService.track("login");
        toast({
          title: t("Login Successful", "تم تسجيل الدخول بنجاح"),
          description: t("Welcome back!", "مرحباً بعودتك!"),
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: t("Login Failed", "فشل تسجيل الدخول"),
        description:
          error.message || t("Invalid email or password", "البريد الإلكتروني أو كلمة المرور غير صحيحة"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phone OTP handlers (commented out) ─────────────────────────────────────
  // const handleSendOtp = async (e: React.FormEvent) => { ... };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;

    setIsLoading(true);
    try {
      const response = await login({ email, password, otp });

      if (response.success) {
        amplitudeService.track("login");
        toast({
          title: t("Login Successful", "تم تسجيل الدخول بنجاح"),
          description: t("Welcome back!", "مرحباً بعودتك!"),
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: t("Verification Failed", "فشل التحقق"),
        description:
          error.message || t("Invalid verification code", "رمز التحقق غير صحيح"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
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

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="absolute top-4 end-4 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-body text-sm px-3 py-1.5 rounded-md hover:bg-muted"
        >
          <Globe size={14} />
          {lang === "en" ? "العربية" : "English"}
        </button>

        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center mb-4">
            <img src={logoIcon} alt="snip.sa" className="h-14" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {t("Welcome back", "مرحباً بعودتك")}
            </h2>
            <p className="text-muted-foreground font-body mt-2">
              {t("Sign in to your account", "سجل دخولك للمتابعة")}
            </p>
          </div>

          {/* Auth method tabs — OTP tab commented out */}
          {/* <div className="flex bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setAuthMethod("email"); setOtpSent(false); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-body font-medium transition-colors",
                authMethod === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Mail size={16} />
              {t("Email", "البريد")}
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("otp")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-body font-medium transition-colors",
                authMethod === "otp"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Smartphone size={16} />
              {t("OTP", "رمز التحقق")}
            </button>
          </div> */}

          {/* Email login form */}
          {!otpSent ? (
            <form onSubmit={handleSendEmailOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  {t("Email", "البريد الإلكتروني")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-11", isAr && "text-right")}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">
                    {t("Password", "كلمة المرور")}
                  </Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline font-body">
                    {t("Forgot password?", "نسيت كلمة المرور؟")}
                  </Link>
                </div>
                <div className="relative" dir="ltr">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn("h-11 pe-10", isAr && "text-right")}
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
                <p className="text-xs text-muted-foreground font-body">
                  {t(
                    "We'll send a verification code after confirming your email and password",
                    "راح نرسل رمز تحقق بعد تأكيد البريد وكلمة المرور"
                  )}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base bg-primary text-primary-foreground"
                disabled={!email.trim() || !password.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("Sending...", "جاري الإرسال...")}
                  </>
                ) : (
                  t("Send OTP", "أرسل رمز التحقق")
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email-otp" className="text-foreground">
                  {t("Verification Code", "رمز التحقق")}
                </Label>
                <Input
                  id="email-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="h-11 text-center text-lg tracking-[0.5em] font-display"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground font-body">
                  {t(
                    `Code sent to ${otpData?.sentTo || email}`,
                    `تم إرسال الرمز إلى ${otpData?.sentTo || email}`
                  )}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base bg-primary text-primary-foreground"
                disabled={otp.length < 4 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("Verifying...", "جاري التحقق...")}
                  </>
                ) : (
                  t("Verify & Sign In", "تحقق وسجل دخول")
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(""); }}
                className="w-full text-sm text-primary hover:underline font-body"
                disabled={isLoading}
              >
                {t("Change email", "غيّر البريد")}
              </button>
            </form>
          )}

          {/* Phone OTP login form — commented out */}
          {/* {authMethod === "otp" && (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  ... phone OTP form ...
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  ... phone OTP verify form ...
                </form>
              )}
            </>
          )} */}

          <p className="text-center text-sm text-muted-foreground font-body">
            {t("Don't have an account?", "ما عندك حساب؟")}{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              {t("Sign up", "سجل الآن")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
