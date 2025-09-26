import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Eye, 
  ArrowLeft,
  Globe,
  Zap,
  ExternalLink,
  BarChart3,
  List,
  RefreshCw,
  X
} from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  isDefault: boolean;
  status: 'active' | 'pending' | 'failed';
}

interface CreateLinkFlowProps {
  onBack: () => void;
  userRole: 'admin' | 'editor' | 'viewer';
  language: 'en' | 'ar';
  getTranslation: (key: string) => string;
}

export const CreateLinkFlow: React.FC<CreateLinkFlowProps> = ({
  onBack,
  userRole,
  language,
  getTranslation
}) => {
  const [step, setStep] = useState(1);
  const [longUrl, setLongUrl] = useState('');
  const [urlValidation, setUrlValidation] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [securityStatus, setSecurityStatus] = useState<'idle' | 'scanning' | 'safe' | 'unsafe'>('idle');
  const [selectedDomain, setSelectedDomain] = useState('short.sa');
  const [customSlug, setCustomSlug] = useState('');
  const [slugAvailability, setSlugAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const mockDomains: Domain[] = [
    { id: '1', name: 'short.sa', isDefault: true, status: 'active' },
    { id: '2', name: 'links.company.sa', isDefault: false, status: 'active' },
    { id: '3', name: 'ministry.gov.sa', isDefault: false, status: 'active' }
  ];

  const translations = {
    createNewLink: { en: 'Create a New Short Link', ar: 'إنشاء رابط مختصر جديد' },
    pasteUrl: { en: 'Paste your long URL here...', ar: 'الصق الرابط الطويل هنا...' },
    invalidUrl: { en: 'This is not a valid URL', ar: 'هذا ليس رابطاً صحيحاً' },
    linkSafe: { en: 'This link is safe', ar: 'هذا الرابط آمن' },
    linkUnsafe: { en: 'This URL is unreachable or flagged as unsafe', ar: 'هذا الرابط غير قابل للوصول أو مُعلم كغير آمن' },
    chooseDomain: { en: 'Choose Domain', ar: 'اختر النطاق' },
    customSlug: { en: 'Enter custom slug (e.g., /offers)', ar: 'أدخل الاختصار المخصص (مثل: /offers)' },
    slugTaken: { en: 'This slug is already in use', ar: 'هذا الاختصار مُستخدم بالفعل' },
    slugAvailable: { en: 'This slug is available', ar: 'هذا الاختصار متاح' },
    generateLink: { en: 'Generate Short Link', ar: 'إنشاء الرابط المختصر' },
    creating: { en: 'Creating...', ar: 'جاري الإنشاء...' },
    linkCreated: { en: 'Short Link Created Successfully!', ar: 'تم إنشاء الرابط المختصر بنجاح!' },
    copy: { en: 'Copy', ar: 'نسخ' },
    preview: { en: 'Preview', ar: 'معاينة' },
    createAnother: { en: 'Create Another Link', ar: 'إنشاء رابط آخر' },
    viewAnalytics: { en: 'View Link Analytics', ar: 'عرض تحليلات الرابط' },
    goToManagement: { en: 'Go to Link Management', ar: 'الذهاب إلى إدارة الروابط' },
    back: { en: 'Back', ar: 'رجوع' },
    scanning: { en: 'Scanning for security...', ar: 'جاري فحص الأمان...' },
    checkingSlug: { en: 'Checking availability...', ar: 'جاري التحقق من التوفر...' }
  };

  const t = (key: keyof typeof translations) => translations[key][language];

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setLongUrl(url);
    if (url.trim()) {
      if (validateUrl(url)) {
        setUrlValidation('valid');
        // Start security scan
        setSecurityStatus('scanning');
        setTimeout(() => {
          // Simulate security scan
          const isSafe = Math.random() > 0.1; // 90% chance of being safe
          setSecurityStatus(isSafe ? 'safe' : 'unsafe');
        }, 1500);
      } else {
        setUrlValidation('invalid');
        setSecurityStatus('idle');
      }
    } else {
      setUrlValidation('idle');
      setSecurityStatus('idle');
    }
  };

  const handleSlugChange = (slug: string) => {
    setCustomSlug(slug);
    if (slug.trim()) {
      setSlugAvailability('checking');
      setTimeout(() => {
        // Simulate availability check
        const isAvailable = Math.random() > 0.3; // 70% chance of being available
        setSlugAvailability(isAvailable ? 'available' : 'taken');
      }, 800);
    } else {
      setSlugAvailability('idle');
    }
  };

  const handleCreateLink = () => {
    setIsCreating(true);
    setTimeout(() => {
      const slug = customSlug || Math.random().toString(36).substring(2, 8);
      const newLink = `${selectedDomain}/${slug}`;
      setCreatedLink(newLink);
      setIsCreating(false);
      setShowSuccess(true);
    }, 2000);
  };

  const resetForm = () => {
    setStep(1);
    setLongUrl('');
    setUrlValidation('idle');
    setSecurityStatus('idle');
    setSelectedDomain('short.sa');
    setCustomSlug('');
    setSlugAvailability('idle');
    setIsCreating(false);
    setCreatedLink('');
    setShowSuccess(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(`https://${text}`);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const canProceed = () => {
    return urlValidation === 'valid' && securityStatus === 'safe';
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('linkCreated')}
          </h2>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-2">Your short link:</p>
                <p className="text-xl font-semibold text-blue-600 truncate">
                  https://{createdLink}
                </p>
              </div>
              <div className="flex gap-3 ml-4">
                <button
                  onClick={() => copyToClipboard(createdLink)}
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
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={resetForm}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              {t('createAnother')}
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 className="w-4 h-4" />
              {t('viewAnalytics')}
            </button>
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <List className="w-4 h-4" />
              {t('goToManagement')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('createNewLink')}</h1>
          <p className="text-gray-600">Create a new shortened link with custom options</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="space-y-8">
          {/* Step 1: URL Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Enter Long URL</h3>
            </div>
            
            <div className="ml-11">
              <input
                type="url"
                value={longUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={t('pasteUrl')}
                className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  urlValidation === 'invalid' ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              
              {urlValidation === 'invalid' && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t('invalidUrl')}
                </p>
              )}
              
              {securityStatus === 'scanning' && (
                <p className="text-blue-600 text-sm mt-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('scanning')}
                </p>
              )}
              
              {securityStatus === 'safe' && (
                <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {t('linkSafe')}
                </p>
              )}
              
              {securityStatus === 'unsafe' && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t('linkUnsafe')}
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Domain Selection */}
          {canProceed() && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('chooseDomain')}</h3>
              </div>
              
              <div className="ml-11">
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {mockDomains.filter(d => d.status === 'active').map((domain) => (
                    <option key={domain.id} value={domain.name}>
                      {domain.name} {domain.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Custom Slug */}
          {canProceed() && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Custom Slug (Optional)</h3>
              </div>
              
              <div className="ml-11">
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-600">
                    {selectedDomain}/
                  </span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="offers"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {slugAvailability === 'checking' && (
                  <p className="text-blue-600 text-sm mt-2 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('checkingSlug')}
                  </p>
                )}
                
                {slugAvailability === 'available' && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t('slugAvailable')}
                  </p>
                )}
                
                {slugAvailability === 'taken' && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t('slugTaken')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Create Button */}
          {canProceed() && slugAvailability !== 'taken' && (
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleCreateLink}
                disabled={isCreating}
                className="w-full py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {t('generateLink')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};