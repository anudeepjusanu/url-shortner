import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Shield, 
  BarChart3, 
  Users, 
  Copy, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Globe,
  Zap,
  Lock,
  TrendingUp,
  Star,
  Play,
  ChevronRight,
  Languages,
  Twitter,
  Linkedin,
  Mail
} from 'lucide-react';
import { LoginModal } from './components/Auth/LoginModal';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PrivacyPolicy } from './components/Legal/PrivacyPolicy';

type Language = 'en' | 'ar';
type UserRole = 'admin' | 'editor' | 'viewer';

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [urlStatus, setUrlStatus] = useState<'idle' | 'valid' | 'invalid' | 'success'>('idle');
  const [showResult, setShowResult] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  useEffect(() => {
    setIsRTL(language === 'ar');
  }, [language]);

  const translations = {
    // Hero Section
    heroHeadline: {
      en: 'Shorten and Share Secure Links Instantly',
      ar: 'اختصر وشارك الروابط الآمنة فوراً'
    },
    heroSubheadline: {
      en: 'Try our Saudi-based enterprise-grade URL shortener. No signup required.',
      ar: 'جرب مختصر الروابط المتقدم المستضاف في السعودية. لا حاجة للتسجيل.'
    },
    inputPlaceholder: {
      en: 'Paste your long URL here...',
      ar: 'الصق الرابط الطويل هنا...'
    },
    shortenButton: {
      en: 'Shorten Now',
      ar: 'اختصر الآن'
    },
    securityNote: {
      en: 'All links are scanned for safety.',
      ar: 'جميع الروابط يتم فحصها للأمان.'
    },
    
    // How It Works
    howItWorks: {
      en: 'How It Works',
      ar: 'كيف يعمل'
    },
    step1: {
      en: 'Paste your long link',
      ar: 'الصق الرابط الطويل'
    },
    step2: {
      en: 'Get a short, secure link instantly',
      ar: 'احصل على رابط مختصر وآمن فوراً'
    },
    step3: {
      en: 'Share with confidence',
      ar: 'شارك بثقة'
    },
    
    // Features
    keyFeatures: {
      en: 'Key Features Preview',
      ar: 'معاينة الميزات الرئيسية'
    },
    customBranded: {
      en: 'Custom branded links',
      ar: 'روابط مخصصة بعلامتك التجارية'
    },
    analyticsDashboard: {
      en: 'Analytics dashboard',
      ar: 'لوحة التحليلات'
    },
    linkManagement: {
      en: 'Link management & roles',
      ar: 'إدارة الروابط والأدوار'
    },
    securityScanning: {
      en: 'Security scanning',
      ar: 'فحص الأمان'
    },
    upgradeNote: {
      en: 'Upgrade to enterprise for full features.',
      ar: 'ترقى للنسخة المؤسسية للحصول على جميع الميزات.'
    },
    
    // Trust Section
    trustBadge: {
      en: 'Hosted in Saudi Arabia – CITC Compliant',
      ar: 'مستضاف في السعودية - متوافق مع هيئة الاتصالات'
    },
    trustedBy: {
      en: 'Trusted by enterprises, startups, and government organizations',
      ar: 'موثوق من قبل المؤسسات والشركات الناشئة والمنظمات الحكومية'
    },
    
    // CTA
    startFree: {
      en: 'Start Free – Shorten Your First Link',
      ar: 'ابدأ مجاناً - اختصر أول رابط لك'
    },
    bookDemo: {
      en: 'Book a Demo for Enterprise Features',
      ar: 'احجز عرضاً توضيحياً للميزات المؤسسية'
    },
    
    // Footer
    about: { en: 'About', ar: 'حول' },
    contact: { en: 'Contact', ar: 'اتصل' },
    privacy: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
    terms: { en: 'Terms', ar: 'الشروط' },
    
    // Actions
    copy: { en: 'Copy', ar: 'نسخ' },
    preview: { en: 'Preview', ar: 'معاينة' },
    copied: { en: 'Copied!', ar: 'تم النسخ!' },
    
    // Status messages
    invalidUrl: { en: 'Please enter a valid URL', ar: 'يرجى إدخال رابط صحيح' },
    urlScanned: { en: 'URL scanned and verified safe', ar: 'تم فحص الرابط والتأكد من أمانه' },
    
    // Auth
    signIn: { en: 'Sign In', ar: 'تسجيل الدخول' },
    getStarted: { en: 'Get Started', ar: 'ابدأ الآن' }
  };

  const t = (key: keyof typeof translations) => translations[key][language];

  const handleLogin = (email: string, role: UserRole) => {
    setUserEmail(email);
    setUserRole(role);
    setIsAuthenticated(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setUserRole('viewer');
  };

  // If showing privacy policy
  if (showPrivacyPolicy) {
    return (
      <PrivacyPolicy
        onBack={() => setShowPrivacyPolicy(false)}
        language={language}
      />
    );
  }

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleShortenUrl = async () => {
    if (!inputUrl.trim()) {
      setUrlStatus('invalid');
      return;
    }

    if (!validateUrl(inputUrl)) {
      setUrlStatus('invalid');
      return;
    }

    setIsLoading(true);
    setUrlStatus('valid');

    // Simulate API call
    setTimeout(() => {
      const shortCode = Math.random().toString(36).substring(2, 8);
      setShortUrl(`https://short.sa/${shortCode}`);
      setUrlStatus('success');
      setShowResult(true);
      setIsLoading(false);
    }, 1500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const resetForm = () => {
    setInputUrl('');
    setShortUrl('');
    setUrlStatus('idle');
    setShowResult(false);
  };

  // If user is authenticated, show dashboard
  if (isAuthenticated) {
    return (
      <Dashboard
        userEmail={userEmail}
        userRole={userRole}
        onLogout={handleLogout}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">LinkShorten</h1>
                <p className="text-sm text-gray-600">Enterprise</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Languages className="w-4 h-4" />
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              <button className="px-4 py-2 text-green-600 hover:text-green-700 font-medium">
                onClick={() => setShowLoginModal(true)}
                {t('signIn')}
                onClick={() => setShowLoginModal(true)}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                {t('getStarted')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('heroHeadline')}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('heroSubheadline')}
          </p>

          {/* URL Shortener Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {!showResult ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        setUrlStatus('idle');
                      }}
                      placeholder={t('inputPlaceholder')}
                      className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                        urlStatus === 'invalid' ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {urlStatus === 'invalid' && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {t('invalidUrl')}
                      </p>
                    )}
                    {urlStatus === 'valid' && (
                      <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {t('urlScanned')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleShortenUrl}
                    disabled={isLoading}
                    className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    {t('shortenButton')}
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t('securityNote')}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Your short link is ready!
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">Short URL:</p>
                    <p className="text-lg font-semibold text-blue-600 truncate">{shortUrl}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => copyToClipboard(shortUrl)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {t('copy')}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye className="w-4 h-4" />
                      {t('preview')}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={resetForm}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Shorten another link
                </button>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    Want more features? Create an account for analytics, custom domains, and team management.
                  </p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up for Enterprise
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('howItWorks')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Link2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('step1')}</h3>
              <p className="text-gray-600">Enter your long URL in the input field above</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('step2')}</h3>
              <p className="text-gray-600">Our system creates a short, secure link instantly</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('step3')}</h3>
              <p className="text-gray-600">Copy and share your link with confidence</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('keyFeatures')}</h2>
            <p className="text-xl text-gray-600">{t('upgradeNote')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('customBranded')}</h3>
              <p className="text-gray-600 text-sm">Use your own domain for branded short links</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('analyticsDashboard')}</h3>
              <p className="text-gray-600 text-sm">Track clicks, locations, and performance</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('linkManagement')}</h3>
              <p className="text-gray-600 text-sm">Manage teams with role-based access</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('securityScanning')}</h3>
              <p className="text-gray-600 text-sm">Automatic malware and phishing detection</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-green-800">{t('trustBadge')}</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('trustedBy')}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            {/* Placeholder for company logos */}
            <div className="h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-medium">ARAMCO</span>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-medium">STC</span>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-medium">SABIC</span>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 font-medium">NEOM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of organizations using our enterprise URL shortener
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              onClick={() => setShowLoginModal(true)}
              <Zap className="w-5 h-5" />
              {t('startFree')}
            </button>
            <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-green-600 transition-colors flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              {t('bookDemo')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">LinkShorten</h3>
                  <p className="text-gray-400">Enterprise</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                The most trusted URL shortener for Saudi enterprises and government organizations.
              </p>
              <div className="flex gap-4">
                <button className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Twitter className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Mail className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('contact')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button 
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {t('privacy')}
                  </button>
                </li>
                <li><a href="#" className="hover:text-white transition-colors">{t('terms')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 LinkShorten Enterprise. All rights reserved.
            </p>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mt-4 sm:mt-0"
            >
              <Languages className="w-4 h-4" />
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        language={language}
        getTranslation={t}
      />
    </div>
  );
}

export default App;