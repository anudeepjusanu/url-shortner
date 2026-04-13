import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Zap, BarChart3, QrCode, Smartphone, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import logoIcon from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const COUNTRY_OPTIONS = [
  { dialCode: "+966", flag: "🇸🇦", label: "SA", maxDigits: 9, placeholder: "5XXXXXXXX" },
  { dialCode: "+91",  flag: "🇮🇳", label: "IN", maxDigits: 10, placeholder: "XXXXXXXXXX" },
];

const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { login, loginWithPhone } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "otp">("email");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpData, setOtpData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      const response = await login({ email, password });
      
      if (response.otpRequired) {
        // OTP is required
        setOtpSent(true);
        setOtpData(response.otpData);
        toast({
          title: t("OTP Sent", "تم إرسال رمز التحقق"),
          description: t("Please check your email for the verification code", "يرجى التحقق من بريدك الإلكتروني للحصول على رمز التحقق"),
        });
      } else {
        // Login successful without OTP
        toast({
          title: t("Login Successful", "تم تسجيل الدخول بنجاح"),
          description: t("Welcome back!", "مرحباً بعودتك!"),
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: t("Login Failed", "فشل تسجيل الدخول"),
        description: error.message || t("Invalid email or password", "البريد الإلكتروني أو كلمة المرور غير صحيحة"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsLoading(true);
    try {
      const phoneNumber = `${selectedCountry.dialCode}${phone}`;
      const response = await loginWithPhone({ phoneNumber });

      if (response.otpRequired) {
        setOtpSent(true);
        setOtpData(response.otpData);
        toast({
          title: t("OTP Sent", "تم إرسال رمز التحقق"),
          description: t("Please check your phone for the verification code", "يرجى التحقق من هاتفك للحصول على رمز التحقق"),
        });
      }
    } catch (error: any) {
      toast({
        title: t("Error", "خطأ"),
        description: error.message || t("Failed to send OTP", "فشل إرسال رمز التحقق"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;

    setIsLoading(true);
    try {
      let response: any;
      if (authMethod === "email") {
        response = await login({ email, password, otp });
      } else {
        const phoneNumber = `${selectedCountry.dialCode}${phone}`;
        response = await loginWithPhone({ phoneNumber, otp });
      }

      if (response.success) {
        toast({
          title: t("Login Successful", "تم تسجيل الدخول بنجاح"),
          description: t("Welcome back!", "مرحباً بعودتك!"),
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: t("Verification Failed", "فشل التحقق"),
        description: error.message || t("Invalid verification code", "رمز التحقق غير صحيح"),
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
            <img src={logoIcon} alt="4r.sa" className="h-20" />
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

          {/* Feature highlights */}
          <div className="space-y-4 text-left">
            {[
              { icon: Zap, label: t("Real-time analytics", "تحليلات لحظية") },
              { icon: QrCode, label: t("QR code generation", "إنشاء أكواد QR") },
              { icon: BarChart3, label: t("Campaign tracking", "تتبع الحملات") },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg">
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
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center mb-4">
            <img src={logoIcon} alt="4r.sa" className="h-14" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {t("Welcome back", "مرحباً بعودتك")}
            </h2>
            <p className="text-muted-foreground font-body mt-2">
              {t("Sign in to your account", "سجل دخولك للمتابعة")}
            </p>
          </div>

          {/* Auth method tabs */}
          <div className="flex bg-muted rounded-lg p-1">
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
          </div>

          {authMethod === "email" ? (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendEmailOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">{t("Email", "البريد الإلكتروني")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-foreground">{t("Password", "كلمة المرور")}</Label>
                      <Link to="/login" className="text-sm text-primary hover:underline font-body">
                        {t("Forgot password?", "نسيت كلمة المرور؟")}
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 pe-10"
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
                      {t("We'll send a verification code after confirming your email and password", "راح نرسل رمز تحقق بعد تأكيد البريد وكلمة المرور")}
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base bg-primary text-primary-foreground" disabled={!email.trim() || !password.trim() || isLoading}>
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
                    <Label htmlFor="email-otp" className="text-foreground">{t("Verification Code", "رمز التحقق")}</Label>
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
                      {t(`Code sent to ${email}`, `تم إرسال الرمز إلى ${email}`)}
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base bg-primary text-primary-foreground" disabled={otp.length < 4 || isLoading}>
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
            </>
          ) : (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">{t("Phone Number", "رقم الجوال")}</Label>
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
                        dir="ltr"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      {t("We'll send a verification code to this number", "راح نرسل رمز تحقق على هالرقم")}
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base bg-primary text-primary-foreground" disabled={phone.length < selectedCountry.maxDigits || isLoading}>
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
                    <Label htmlFor="otp" className="text-foreground">{t("Verification Code", "رمز التحقق")}</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="0000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="h-11 text-center text-lg tracking-[0.5em] font-display"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      {t(`Code sent to ${selectedCountry.dialCode}${phone}`, `تم إرسال الرمز إلى ${selectedCountry.dialCode}${phone}`)}
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base bg-primary text-primary-foreground" disabled={otp.length < 4 || isLoading}>
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
                    {t("Change phone number", "غيّر رقم الجوال")}
                  </button>
                </form>
              )}
            </>
          )}

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
