import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Zap, BarChart3, QrCode, Loader2 } from "lucide-react";
import logoIcon from "@/assets/logo.png";

const Signup = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpData, setOtpData] = useState<any>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({
        title: t("Validation Error", "خطأ في التحقق"),
        description: t("Please fill in all required fields", "يرجى ملء جميع الحقول المطلوبة"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        password: password,
      };

      // Add phone number if provided
      if (phone.trim()) {
        userData.phoneNumber = `+966${phone}`;
      }

      const response = await register(userData);
      
      if (response.otpRequired) {
        // OTP is required for verification
        setOtpSent(true);
        setOtpData(response.otpData);
        toast({
          title: t("OTP Sent", "تم إرسال رمز التحقق"),
          description: t("Please check your email for the verification code", "يرجى التحقق من بريدك الإلكتروني للحصول على رمز التحقق"),
        });
      } else {
        // Registration successful without OTP
        toast({
          title: t("Registration Successful", "تم التسجيل بنجاح"),
          description: t("Welcome to 4r.sa!", "مرحباً بك في 4r.sa!"),
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;

    setIsLoading(true);
    try {
      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        password: password,
        otp: otp,
      };

      if (phone.trim()) {
        userData.phoneNumber = `+966${phone}`;
      }

      const response = await register(userData);
      
      if (response.success) {
        toast({
          title: t("Registration Successful", "تم التسجيل بنجاح"),
          description: t("Welcome to 4r.sa!", "مرحباً بك في 4r.sa!"),
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
            {t("Start for free today", "ابدأ مجاناً اليوم")}
          </h1>
          <p className="text-muted-foreground font-body text-lg mb-10">
            {t(
              "Create your account and start shortening links, generating QR codes, and tracking analytics.",
              "أنشئ حسابك وابدأ باختصار الروابط وإنشاء أكواد QR وتتبع التحليلات."
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
              {t("Create your account", "أنشئ حسابك")}
            </h2>
            <p className="text-muted-foreground font-body mt-2">
              {t("Get started with 4r.sa for free", "ابدأ مع 4r.sa مجاناً")}
            </p>
          </div>

          <form onSubmit={otpSent ? handleVerifyOtp : handleSignup} className="space-y-5">
            {!otpSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">{t("Full Name", "الاسم الكامل")}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("Your name", "اسمك")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">{t("Email", "البريد الإلكتروني")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    {t("Phone Number", "رقم الجوال")} {t("(Optional)", "(اختياري)")}
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 h-11 px-3 rounded-md border border-input bg-muted/50 text-sm font-body text-foreground shrink-0">
                      <span>🇸🇦</span>
                      <span className="text-muted-foreground">+966</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="5XXXXXXXX"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                        setPhone(val);
                      }}
                      className="h-11"
                      maxLength={9}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">{t("Password", "كلمة المرور")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    {t("Password must be at least 6 characters", "يجب أن تكون كلمة المرور 6 أحرف على الأقل")}
                  </p>
                </div>

                <Button type="submit" className="w-full h-11 text-base bg-primary text-primary-foreground" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("Creating Account...", "جاري إنشاء الحساب...")}
                    </>
                  ) : (
                    t("Create Account", "إنشاء حساب")
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-foreground">{t("Verification Code", "رمز التحقق")}</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-11 text-center text-lg tracking-[0.5em] font-display"
                    dir="ltr"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground font-body">
                    {t(`Code sent to ${email}`, `تم إرسال الرمز إلى ${email}`)}
                  </p>
                </div>

                <Button type="submit" className="w-full h-11 text-base bg-primary text-primary-foreground" disabled={otp.length < 6 || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("Verifying...", "جاري التحقق...")}
                    </>
                  ) : (
                    t("Verify & Create Account", "تحقق وأنشئ الحساب")
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
              </>
            )}
          </form>

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
