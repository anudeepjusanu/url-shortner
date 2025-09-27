import React from 'react';
import { ArrowLeft, Shield, Lock, Mail, Phone, MapPin } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
  language: 'en' | 'ar';
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack, language }) => {
  const isRTL = language === 'ar';

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 20, 2024',
      sections: [
        {
          title: '1. Information We Collect',
          content: `We collect information you provide directly to us, such as when you create an account, use our URL shortening service, or contact us for support.

**Personal Information:**
• Email address and name (for registered accounts)
• Organization details (for enterprise accounts)
• Contact information when you reach out to us

**Usage Information:**
• URLs you shorten and their destinations
• Click data and analytics (anonymized)
• Device and browser information
• IP addresses and geographic location (for analytics)

**Automatically Collected Information:**
• Log data including access times and pages visited
• Device identifiers and technical specifications
• Referrer information and user agent strings`
        },
        {
          title: '2. How We Use Your Information',
          content: `We use the information we collect to:

• Provide, maintain, and improve our URL shortening services
• Generate analytics and insights for your shortened links
• Detect and prevent fraud, abuse, and security threats
• Communicate with you about your account and our services
• Comply with legal obligations and regulatory requirements

**For Enterprise Customers:**
• Provide advanced analytics and reporting
• Enable team collaboration and role-based access
• Offer custom domain and branding features
• Provide priority customer support`
        },
        {
          title: '3. Information Sharing and Disclosure',
          content: `We do not sell, trade, or otherwise transfer your personal information to third parties except as described in this policy:

**Service Providers:**
We may share information with trusted service providers who assist us in operating our platform, conducting business, or serving users.

**Legal Requirements:**
We may disclose information when required by law, regulation, or legal process, including compliance with Saudi Arabian data protection laws.

**Business Transfers:**
In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction.

**Security and Safety:**
We may share information to protect the rights, property, or safety of our users or the public.`
        },
        {
          title: '4. Data Security and Protection',
          content: `We implement appropriate technical and organizational measures to protect your personal information:

**Technical Safeguards:**
• Encryption of data in transit and at rest
• Regular security assessments and penetration testing
• Access controls and authentication systems
• Secure data centers with 24/7 monitoring

**Organizational Measures:**
• Employee training on data protection
• Regular privacy impact assessments
• Incident response procedures
• Data retention and deletion policies

**Saudi Arabia Compliance:**
Our services are hosted in Saudi Arabia and comply with local data protection regulations and CITC requirements.`
        },
        {
          title: '5. Your Rights and Choices',
          content: `You have the following rights regarding your personal information:

**Access and Portability:**
• Request access to your personal information
• Receive a copy of your data in a portable format

**Correction and Updates:**
• Update or correct your personal information
• Modify your account settings and preferences

**Deletion and Restriction:**
• Request deletion of your personal information
• Restrict processing of your data

**Objection and Withdrawal:**
• Object to certain processing activities
• Withdraw consent where processing is based on consent

To exercise these rights, please contact us using the information provided below.`
        }
      ]
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 20 يناير 2024',
      sections: [
        {
          title: '1. المعلومات التي نجمعها',
          content: `نجمع المعلومات التي تقدمها لنا مباشرة، مثل عند إنشاء حساب أو استخدام خدمة اختصار الروابط أو التواصل معنا للحصول على الدعم.

**المعلومات الشخصية:**
• عنوان البريد الإلكتروني والاسم (للحسابات المسجلة)
• تفاصيل المؤسسة (للحسابات المؤسسية)
• معلومات الاتصال عند التواصل معنا

**معلومات الاستخدام:**
• الروابط التي تختصرها ووجهاتها
• بيانات النقرات والتحليلات (مجهولة الهوية)
• معلومات الجهاز والمتصفح
• عناوين IP والموقع الجغرافي (للتحليلات)`
        }
      ]
    }
  };

  const currentContent = content[language];

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {language === 'en' ? 'Back' : 'رجوع'}
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentContent.title}</h1>
            <p className="text-sm text-gray-600 mt-1">{currentContent.lastUpdated}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-8">
            <div className="prose prose-gray max-w-none">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      {language === 'en' ? 'Your Privacy Matters' : 'خصوصيتك مهمة'}
                    </h3>
                    <p className="text-blue-800">
                      {language === 'en'
                        ? 'This privacy policy explains how LinkShorten Enterprise collects, uses, and protects your personal information in compliance with Saudi Arabian data protection laws and CITC regulations.'
                        : 'تشرح سياسة الخصوصية هذه كيف تجمع لينك شورتن إنتربرايز معلوماتك الشخصية وتستخدمها وتحميها وفقاً لقوانين حماية البيانات السعودية ولوائح هيئة الاتصالات.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {currentContent.sections.map((section, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    {section.title}
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                <div className="flex items-start gap-3">
                  <Lock className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      {language === 'en' ? 'CITC Compliant' : 'متوافق مع هيئة الاتصالات'}
                    </h3>
                    <p className="text-green-800">
                      {language === 'en'
                        ? 'Our services are fully compliant with Saudi Arabian telecommunications and data protection regulations as mandated by the Communications and Information Technology Commission (CITC).'
                        : 'خدماتنا متوافقة بالكامل مع لوائح الاتصالات وحماية البيانات السعودية كما تقتضيها هيئة الاتصالات وتقنية المعلومات.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {language === 'en' ? 'Contact Our Privacy Team' : 'اتصل بفريق الخصوصية'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-blue-600">privacy@linkshorten.sa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-700">+966 11 123 4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-700">Riyadh, Saudi Arabia</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};