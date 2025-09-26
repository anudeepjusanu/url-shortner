import React from 'react';
import { ArrowLeft, Shield, Eye, Lock, Globe, Mail, Phone, MapPin } from 'lucide-react';

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
        },
        {
          title: '6. Data Retention',
          content: `We retain your information for as long as necessary to provide our services and comply with legal obligations:

**Account Information:**
Retained while your account is active and for a reasonable period after account closure.

**Usage Data:**
Analytics and usage data may be retained for up to 3 years for business intelligence and service improvement.

**Legal Compliance:**
Some information may be retained longer to comply with legal, regulatory, or contractual obligations.

**Deletion Requests:**
We will delete your information upon request, subject to legal and operational requirements.`
        },
        {
          title: '7. International Transfers',
          content: `Your information is primarily processed and stored in Saudi Arabia. If we transfer information outside of Saudi Arabia, we ensure appropriate safeguards are in place:

• Adequacy decisions by relevant authorities
• Standard contractual clauses
• Binding corporate rules
• Certification schemes

We ensure that any international transfers comply with applicable data protection laws and provide adequate protection for your personal information.`
        },
        {
          title: '8. Cookies and Tracking Technologies',
          content: `We use cookies and similar technologies to enhance your experience:

**Essential Cookies:**
Required for the basic functionality of our service, including authentication and security.

**Analytics Cookies:**
Help us understand how users interact with our service to improve performance and user experience.

**Preference Cookies:**
Remember your settings and preferences, such as language selection.

You can control cookie settings through your browser, but disabling certain cookies may affect service functionality.`
        },
        {
          title: '9. Children\'s Privacy',
          content: `Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.

Parents and guardians who believe their child has provided personal information to us should contact us immediately.`
        },
        {
          title: '10. Changes to This Privacy Policy',
          content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws.

**Notification of Changes:**
• We will notify you of material changes via email or through our service
• The "Last Updated" date at the top of this policy indicates when changes were made
• Continued use of our service after changes constitutes acceptance of the updated policy

**Review Recommendations:**
We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.`
        },
        {
          title: '11. Contact Information',
          content: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

**LinkShorten Enterprise**
Email: privacy@linkshorten.sa
Phone: +966 11 123 4567
Address: King Fahd Road, Riyadh 12345, Saudi Arabia

**Data Protection Officer:**
Email: dpo@linkshorten.sa

**Response Time:**
We will respond to your inquiries within 30 days of receipt.`
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
• عناوين IP والموقع الجغرافي (للتحليلات)

**المعلومات المجمعة تلقائياً:**
• بيانات السجل بما في ذلك أوقات الوصول والصفحات المزارة
• معرفات الجهاز والمواصفات التقنية
• معلومات المرجع وسلاسل وكيل المستخدم`
        },
        {
          title: '2. كيف نستخدم معلوماتك',
          content: `نستخدم المعلومات التي نجمعها من أجل:

• توفير وصيانة وتحسين خدمات اختصار الروابط
• إنشاء التحليلات والرؤى لروابطك المختصرة
• اكتشاف ومنع الاحتيال وسوء الاستخدام والتهديدات الأمنية
• التواصل معك حول حسابك وخدماتنا
• الامتثال للالتزامات القانونية والمتطلبات التنظيمية

**للعملاء المؤسسيين:**
• توفير التحليلات والتقارير المتقدمة
• تمكين التعاون الجماعي والوصول القائم على الأدوار
• تقديم ميزات النطاق المخصص والعلامة التجارية
• توفير دعم العملاء ذو الأولوية`
        },
        {
          title: '3. مشاركة المعلومات والإفصاح عنها',
          content: `لا نبيع أو نتاجر أو ننقل معلوماتك الشخصية إلى أطراف ثالثة إلا كما هو موضح في هذه السياسة:

**مقدمو الخدمات:**
قد نشارك المعلومات مع مقدمي الخدمات الموثوقين الذين يساعدوننا في تشغيل منصتنا وإدارة الأعمال أو خدمة المستخدمين.

**المتطلبات القانونية:**
قد نكشف عن المعلومات عند الطلب بموجب القانون أو اللوائح أو الإجراءات القانونية، بما في ذلك الامتثال لقوانين حماية البيانات السعودية.

**التحويلات التجارية:**
في حالة الاندماج أو الاستحواذ أو بيع الأصول، قد يتم نقل معلومات المستخدم كجزء من المعاملة.

**الأمن والسلامة:**
قد نشارك المعلومات لحماية حقوق أو ممتلكات أو سلامة مستخدمينا أو الجمهور.`
        },
        {
          title: '4. أمان البيانات وحمايتها',
          content: `نطبق التدابير التقنية والتنظيمية المناسبة لحماية معلوماتك الشخصية:

**الضمانات التقنية:**
• تشفير البيانات أثناء النقل والتخزين
• تقييمات أمنية منتظمة واختبار الاختراق
• ضوابط الوصول وأنظمة المصادقة
• مراكز بيانات آمنة مع مراقبة على مدار الساعة

**التدابير التنظيمية:**
• تدريب الموظفين على حماية البيانات
• تقييمات تأثير الخصوصية المنتظمة
• إجراءات الاستجابة للحوادث
• سياسات الاحتفاظ بالبيانات وحذفها

**الامتثال السعودي:**
خدماتنا مستضافة في المملكة العربية السعودية وتمتثل للوائح حماية البيانات المحلية ومتطلبات هيئة الاتصالات.`
        },
        {
          title: '5. حقوقك واختياراتك',
          content: `لديك الحقوق التالية فيما يتعلق بمعلوماتك الشخصية:

**الوصول وقابلية النقل:**
• طلب الوصول إلى معلوماتك الشخصية
• الحصول على نسخة من بياناتك بتنسيق قابل للنقل

**التصحيح والتحديثات:**
• تحديث أو تصحيح معلوماتك الشخصية
• تعديل إعدادات حسابك وتفضيلاتك

**الحذف والتقييد:**
• طلب حذف معلوماتك الشخصية
• تقييد معالجة بياناتك

**الاعتراض والسحب:**
• الاعتراض على أنشطة معالجة معينة
• سحب الموافقة حيث تعتمد المعالجة على الموافقة

لممارسة هذه الحقوق، يرجى الاتصال بنا باستخدام المعلومات المقدمة أدناه.`
        },
        {
          title: '6. الاحتفاظ بالبيانات',
          content: `نحتفظ بمعلوماتك طالما كان ذلك ضرورياً لتقديم خدماتنا والامتثال للالتزامات القانونية:

**معلومات الحساب:**
يتم الاحتفاظ بها أثناء نشاط حسابك ولفترة معقولة بعد إغلاق الحساب.

**بيانات الاستخدام:**
قد يتم الاحتفاظ بالتحليلات وبيانات الاستخدام لمدة تصل إلى 3 سنوات لذكاء الأعمال وتحسين الخدمة.

**الامتثال القانوني:**
قد يتم الاحتفاظ ببعض المعلومات لفترة أطول للامتثال للالتزامات القانونية أو التنظيمية أو التعاقدية.

**طلبات الحذف:**
سنحذف معلوماتك عند الطلب، مع مراعاة المتطلبات القانونية والتشغيلية.`
        },
        {
          title: '7. النقل الدولي',
          content: `تتم معالجة معلوماتك وتخزينها بشكل أساسي في المملكة العربية السعودية. إذا قمنا بنقل المعلومات خارج المملكة، فإننا نضمن وجود ضمانات مناسبة:

• قرارات الكفاية من السلطات ذات الصلة
• البنود التعاقدية المعيارية
• القواعد المؤسسية الملزمة
• مخططات الشهادات

نضمن أن أي نقل دولي يمتثل لقوانين حماية البيانات المعمول بها ويوفر حماية كافية لمعلوماتك الشخصية.`
        },
        {
          title: '8. ملفات تعريف الارتباط وتقنيات التتبع',
          content: `نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتحسين تجربتك:

**ملفات تعريف الارتباط الأساسية:**
مطلوبة للوظائف الأساسية لخدمتنا، بما في ذلك المصادقة والأمان.

**ملفات تعريف الارتباط التحليلية:**
تساعدنا على فهم كيفية تفاعل المستخدمين مع خدمتنا لتحسين الأداء وتجربة المستخدم.

**ملفات تعريف الارتباط للتفضيلات:**
تتذكر إعداداتك وتفضيلاتك، مثل اختيار اللغة.

يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك، لكن تعطيل ملفات تعريف ارتباط معينة قد يؤثر على وظائف الخدمة.`
        },
        {
          title: '9. خصوصية الأطفال',
          content: `خدماتنا غير مخصصة للأطفال دون سن 13 عاماً. لا نجمع عن قصد معلومات شخصية من الأطفال دون سن 13.

إذا علمنا أننا جمعنا معلومات شخصية من طفل دون سن 13، فسنتخذ خطوات لحذف هذه المعلومات فوراً.

يجب على الآباء والأوصياء الذين يعتقدون أن طفلهم قدم معلومات شخصية لنا الاتصال بنا فوراً.`
        },
        {
          title: '10. التغييرات على سياسة الخصوصية هذه',
          content: `قد نحدث سياسة الخصوصية هذه من وقت لآخر لتعكس التغييرات في ممارساتنا أو القوانين المعمول بها.

**إشعار التغييرات:**
• سنخطرك بالتغييرات المهمة عبر البريد الإلكتروني أو من خلال خدمتنا
• يشير تاريخ "آخر تحديث" في أعلى هذه السياسة إلى وقت إجراء التغييرات
• الاستمرار في استخدام خدمتنا بعد التغييرات يشكل قبولاً للسياسة المحدثة

**توصيات المراجعة:**
نشجعك على مراجعة سياسة الخصوصية هذه بشكل دوري للبقاء على اطلاع على كيفية حماية معلوماتك.`
        },
        {
          title: '11. معلومات الاتصال',
          content: `إذا كان لديك أسئلة أو مخاوف أو طلبات بخصوص سياسة الخصوصية هذه أو ممارسات البيانات لدينا، يرجى الاتصال بنا:

**لينك شورتن إنتربرايز**
البريد الإلكتروني: privacy@linkshorten.sa
الهاتف: +966 11 123 4567
العنوان: طريق الملك فهد، الرياض 12345، المملكة العربية السعودية

**مسؤول حماية البيانات:**
البريد الإلكتروني: dpo@linkshorten.sa

**وقت الاستجابة:**
سنرد على استفساراتك في غضون 30 يوماً من الاستلام.`
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