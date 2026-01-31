import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import OTPDialog from "./OTPDialog";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import LanguageSelector from "./LanguageSelector";
import logo from '../assets/logo.png';
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { CheckCircle2, ShieldCheck, Zap, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (error) clearError();
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error) clearError();

    try {
      const result = await login(formData.email.trim().toLowerCase(), formData.password);
      if (result.otpRequired && result.otpData) {
        setOtpData(result.otpData);
        setShowOTPDialog(true);
        return;
      }
      if (result.success) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleVerifyOTP = async (otp) => {
    try {
      const result = await login(formData.email.trim().toLowerCase(), formData.password, otp);
      if (result.success) {
        setShowOTPDialog(false);
        navigate("/dashboard");
      } else {
        throw new Error(result.error || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const handleResendOTP = async () => {
    try {
      const result = await login(formData.email.trim().toLowerCase(), formData.password);
      if (result.otpRequired && result.otpData) {
        setOtpData(result.otpData);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  const handleForgotPasswordClose = (success) => {
    setShowForgotPasswordDialog(false);
    if (success) {
      setSuccessMessage(t('auth.forgotPassword.successMessage'));
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel - Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 pointer-events-none" />
        <div className="relative z-10 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
             <img src={logo} alt="Logo" className="h-10 w-auto brightness-0 invert" />
             <h1 className="text-2xl font-bold">{t('common.brandName')}</h1>
          </div>
          <div className="space-y-6 text-center">
             <h2 className="text-4xl font-bold leading-tight">{t('auth.login.brandSubtitle') || "Shorten, Share, and Track with confidence."}</h2>
             <div className="space-y-4">
               {[
                 { icon: Zap, title: t('auth.login.feature1Title'), desc: t('auth.login.feature1Description') },
                 { icon: ShieldCheck, title: t('auth.login.feature3Title'), desc: t('auth.login.feature3Description') },
                 { icon: CheckCircle2, title: t('auth.login.feature2Title'), desc: t('auth.login.feature2Description') },
               ].map((feat, i) => (
                 <div key={i} className="flex gap-4 text-left">
                    <div className="mt-1 bg-white/10 p-2 rounded-lg h-fit">
                      <feat.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{feat.title}</h3>
                      <p className="text-slate-400 text-sm">{feat.desc}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
          <div className="mt-12 text-sm text-slate-500 text-center">
            &copy; {new Date().getFullYear()} {t('common.brandName')}. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
           
           {/* Mobile Logo */}
           <div className="lg:hidden flex justify-center mb-4">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
           </div>

           <div className="flex justify-end">
              <LanguageSelector />
           </div>

           <div className="text-center">
             <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('auth.login.title')}</h2>
             <p className="mt-2 text-sm text-slate-600">{t('auth.login.subtitle')}</p>
           </div>

           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center text-sm border border-red-100">
               <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
               {error}
             </div>
           )}

           {successMessage && (
             <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center text-sm border border-green-100">
               <CheckCircle2 className="h-5 w-5 mr-3 shrink-0" />
               {successMessage}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
               <Label htmlFor="email">{t('auth.login.email')}</Label>
               <Input 
                 id="email" 
                 name="email" 
                 type="email" 
                 required 
                 placeholder="name@example.com"
                 value={formData.email}
                 onChange={handleInputChange}
               />
             </div>

             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <Label htmlFor="password">{t('auth.login.password')}</Label>
               </div>
               <div className="relative">
                 <Input 
                   id="password" 
                   name="password" 
                   type={showPassword ? "text" : "password"} 
                   required 
                   placeholder="••••••••"
                   value={formData.password}
                   onChange={handleInputChange}
                   className="pr-10"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 transition-colors duration-200"
                   style={{ transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                   onMouseDown={(e) => e.preventDefault()}
                   tabIndex={-1}
                 >
                   {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                 </button>
               </div>
             </div>

             <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-600">{t('auth.login.rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordDialog(true)}
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  {t('auth.login.forgotPassword')}
                </button>
             </div>

             <Button className="w-full" size="lg" disabled={loading}>
               {loading ? 'Please wait...' : t('auth.login.button')}
             </Button>
           </form>

           <div className="text-center text-sm">
             <span className="text-slate-600">{t('auth.login.noAccount')} </span>
             <button onClick={() => navigate("/register")} className="font-semibold text-primary hover:underline">
               {t('auth.login.signUp')}
             </button>
           </div>
        </div>
      </div>

      <OTPDialog
        isOpen={showOTPDialog}
        onClose={() => setShowOTPDialog(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        email={otpData?.email || formData.email}
        loading={loading}
      />

      <ForgotPasswordDialog
        isOpen={showForgotPasswordDialog}
        onClose={handleForgotPasswordClose}
        email={formData.email}
      />
    </div>
  );
};

export default Login;