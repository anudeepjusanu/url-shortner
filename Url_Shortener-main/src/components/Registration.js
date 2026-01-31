import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import OTPDialog from "./OTPDialog";
import LanguageSelector from "./LanguageSelector";
import logo from '../assets/logo.png';
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { CheckCircle2, ShieldCheck, Zap, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";

const Registration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpData, setOtpData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (error) clearError();
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) return false;
    if (!formData.agreeToTerms || !formData.agreeToData) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
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

      const result = await register(registrationData);

      if (result.success) {
        navigate("/dashboard");
      } else if (result.otpRequired && result.otpData) {
        setOtpData(result.otpData);
        setShowOTPDialog(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleVerifyOTP = async (otp) => {
    try {
      const nameParts = formData.fullName.trim().split(' ');
      const registrationData = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() ? `+966${formData.phone.replace(/\s/g, '')}` : undefined,
        otp: otp
      };

      const result = await register(registrationData);
      if (result.success) {
        setShowOTPDialog(false);
        navigate("/dashboard");
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const handleResendOTP = async () => {
    try {
        const nameParts = formData.fullName.trim().split(' ');
        const registrationData = {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            phone: formData.phone.trim() ? `+966${formData.phone.replace(/\s/g, '')}` : undefined,
        };
        const result = await register(registrationData);
        if (result.otpRequired && result.otpData) {
            setOtpData(result.otpData);
        }
    } catch (error) {
        console.error('Resend error', error);
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
             <h2 className="text-4xl font-bold leading-tight">{t('auth.register.brandSubtitle')}</h2>
             <div className="space-y-4">
               {[
                 { icon: Zap, title: t('auth.register.feature1Title'), desc: t('auth.register.feature1Description') },
                 { icon: ShieldCheck, title: t('auth.register.feature3Title'), desc: t('auth.register.feature3Description') },
                 { icon: CheckCircle2, title: t('auth.register.feature2Title'), desc: t('auth.register.feature2Description') },
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
             <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('auth.register.title')}</h2>
             <p className="mt-2 text-sm text-slate-600">{t('auth.register.subtitle')}</p>
           </div>

           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center text-sm border border-red-100">
               <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
               {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="fullName">{t('auth.register.fullName')}</Label>
               <Input 
                 id="fullName" 
                 name="fullName" 
                 required 
                 placeholder={t('auth.register.fullNamePlaceholder')}
                 value={formData.fullName}
                 onChange={handleInputChange}
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="email">{t('auth.register.email')}</Label>
               <Input 
                 id="email" 
                 name="email" 
                 type="email" 
                 required 
                 placeholder={t('auth.register.emailPlaceholder')}
                 value={formData.email}
                 onChange={handleInputChange}
               />
             </div>

             {/* Phone input could be added here similar to email */}

             <div className="grid gap-4 sm:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="password">{t('auth.register.password')}</Label>
                 <div className="relative">
                   <Input 
                     id="password" 
                     name="password" 
                     type={showPassword ? "text" : "password"} 
                     required 
                     placeholder="At least 8 chars"
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
               <div className="space-y-2">
                 <Label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</Label>
                 <div className="relative">
                   <Input 
                     id="confirmPassword" 
                     name="confirmPassword" 
                     type={showConfirmPassword ? "text" : "password"} 
                     required 
                     placeholder="Confirm Password"
                     value={formData.confirmPassword}
                     onChange={handleInputChange}
                     className="pr-10"
                   />
                   <button
                     type="button"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 transition-colors duration-200"
                     style={{ transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                     onMouseDown={(e) => e.preventDefault()}
                     tabIndex={-1}
                   >
                     {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </button>
                 </div>
               </div>
             </div>

             <div className="space-y-3 pt-2">
               <label className="flex items-start gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-slate-300 text-primary focus:ring-primary"
                    required
                  />
                  <span className="text-sm text-slate-600">
                    {t('auth.register.termsAgree')}{" "}
                    <button type="button" className="text-primary hover:underline">{t('auth.register.terms')}</button>
                    {" "}{t('auth.register.and')}{" "}
                    <button type="button" className="text-primary hover:underline">{t('auth.register.privacy')}</button>
                  </span>
               </label>
               <label className="flex items-start gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="agreeToData"
                    checked={formData.agreeToData}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-slate-300 text-primary focus:ring-primary"
                    required
                  />
                  <span className="text-sm text-slate-600">{t('auth.register.pdplConsent')}</span>
               </label>
             </div>

             <Button className="w-full mt-4" size="lg" disabled={loading}>
               {loading ? t('auth.register.creating') : t('auth.register.button')}
             </Button>
           </form>

           <div className="text-center text-sm">
             <span className="text-slate-600">{t('auth.register.haveAccount')} </span>
             <button onClick={() => navigate("/login")} className="font-semibold text-primary hover:underline">
               {t('auth.register.signIn')}
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
    </div>
  );
};

export default Registration;
