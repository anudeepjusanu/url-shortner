import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const TermsAndConditions = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">

          {/* Header */}
          <div className="mb-10">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
              {t("Terms and Conditions", "الشروط والأحكام")}
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              {t("Last Updated: January 13, 2025", "آخر تحديث: 13 يناير 2025")}
            </p>
          </div>

          <div className="space-y-10 font-body text-muted-foreground leading-relaxed">

            {/* Preamble */}
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("Preamble", "التمهيد")}
              </h2>
              <p>
                {t(
                  'This preamble and the clauses that follow are an integral part of the general terms and conditions of use for this document. The terms: "we," "the Company," "the Service," or "this Contract" refer to Forsa Company. "The Second Party" refers to the person who requested the service.',
                  'يُعدّ هذا التمهيد والبنود التالية جزءاً لا يتجزأ من الشروط والأحكام العامة للاستخدام لهذا المستند. تشير المصطلحات: "نحن" و"الشركة" و"الخدمة" أو "هذا العقد" إلى شركة فرصة. ويشير مصطلح "الطرف الثاني" إلى الشخص الذي طلب الخدمة.'
                )}
              </p>
            </section>

            {/* Introduction */}
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("Introduction", "المقدمة")}
              </h2>
              <p>
                {t(
                  "These terms and conditions apply to all our technical services and applications provided through our website. By accessing the website or using any of our services or applications, you agree to comply with these terms and conditions. If you do not agree to these terms, you must stop using the website and services.",
                  "تسري هذه الشروط والأحكام على جميع خدماتنا التقنية والتطبيقات المقدمة عبر موقعنا الإلكتروني. بالوصول إلى الموقع أو استخدام أي من خدماتنا أو تطبيقاتنا، فأنت توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، يجب عليك التوقف عن استخدام الموقع والخدمات."
                )}
              </p>
            </section>

            {/* 1. Definitions */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("1. Definitions and Terms", "1. التعريفات والمصطلحات")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "Services: Refers to all technical solutions and applications provided by the Company to government and private entities, including consulting or other technical services.",
                    ar: "الخدمات: تشير إلى جميع الحلول التقنية والتطبيقات التي تقدمها الشركة للجهات الحكومية والخاصة، بما في ذلك الاستشارات أو الخدمات التقنية الأخرى.",
                  },
                  {
                    en: "Client: Means any government or private entity or individual who uses the services provided by us.",
                    ar: "العميل: يعني أي جهة حكومية أو خاصة أو فرد يستخدم الخدمات التي نقدمها.",
                  },
                  {
                    en: "Applications: Means any software or technical systems provided by the Company, which can be used online or downloaded from the website.",
                    ar: "التطبيقات: تعني أي برامج أو أنظمة تقنية تقدمها الشركة، يمكن استخدامها عبر الإنترنت أو تنزيلها من الموقع الإلكتروني.",
                  },
                  {
                    en: "Website: The electronic platform through which the Company provides its services and products.",
                    ar: "الموقع الإلكتروني: المنصة الإلكترونية التي تقدم من خلالها الشركة خدماتها ومنتجاتها.",
                  },
                  {
                    en: "Document: Refers to the general terms and conditions of use.",
                    ar: "المستند: يشير إلى الشروط والأحكام العامة للاستخدام.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 2. Acceptance */}
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("2. Acceptance of Terms", "2. قبول الشروط")}
              </h2>
              <p>
                {t(
                  "By accessing the website and using our services, you agree to the terms and conditions stated in this document and to comply with all regulations and laws. If you do not agree to any of the terms, you must stop using the website and services.",
                  "بالوصول إلى الموقع الإلكتروني واستخدام خدماتنا، فأنت توافق على الشروط والأحكام المنصوص عليها في هذا المستند وعلى الامتثال لجميع الأنظمة والقوانين. إذا كنت لا توافق على أي من الشروط، يجب عليك التوقف عن استخدام الموقع والخدمات."
                )}
              </p>
            </section>

            {/* 3. Access */}
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("3. Access to Services", "3. الوصول إلى الخدمات")}
              </h2>
              <p>
                {t(
                  "To obtain our services, you may need to register through the website and provide accurate and complete information. The Client is responsible for the accuracy of this information and updating it periodically.",
                  "للحصول على خدماتنا، قد تحتاج إلى التسجيل عبر الموقع الإلكتروني وتقديم معلومات دقيقة وكاملة. يتحمل العميل مسؤولية دقة هذه المعلومات وتحديثها بشكل دوري."
                )}
              </p>
            </section>

            {/* 4. Use */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("4. Use of Services", "4. استخدام الخدمات")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "Our services are provided for personal or institutional use only.",
                    ar: "تُقدَّم خدماتنا للاستخدام الشخصي أو المؤسسي فقط.",
                  },
                  {
                    en: "The Client must use the services within a legal framework and in accordance with authorized uses.",
                    ar: "يجب على العميل استخدام الخدمات في إطار قانوني ووفقاً للاستخدامات المرخصة.",
                  },
                  {
                    en: "It is prohibited to use the services for any illegal purpose or any activity that may lead to violation of others' rights or harm to the website or the Company.",
                    ar: "يُحظر استخدام الخدمات لأي غرض غير قانوني أو أي نشاط قد يؤدي إلى انتهاك حقوق الآخرين أو الإضرار بالموقع الإلكتروني أو الشركة.",
                  },
                  {
                    en: "It is prohibited to resell, distribute, or exploit the services for any unauthorized purpose without prior written consent from the Company.",
                    ar: "يُحظر إعادة بيع الخدمات أو توزيعها أو استغلالها لأي غرض غير مصرح به دون الحصول على موافقة كتابية مسبقة من الشركة.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 5. Commencement */}
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("5. Commencement of Service Contract", "5. بدء عقد الخدمة")}
              </h2>
              <p>
                {t(
                  "The service contract begins from the date of service activation for the Client.",
                  "يبدأ عقد الخدمة من تاريخ تفعيل الخدمة للعميل."
                )}
              </p>
            </section>

            {/* 6. IP */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("6. Intellectual Property Rights", "6. حقوق الملكية الفكرية")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: 'The website contains materials protected by intellectual property rights, including texts, software, images, graphics, names, logos, colors, applications, software, and audio files ("Content"). They are protected under copyright, trademark rights, and applicable laws in the Kingdom of Saudi Arabia.',
                    ar: 'يحتوي الموقع الإلكتروني على مواد محمية بحقوق الملكية الفكرية، بما في ذلك النصوص والبرامج والصور والرسومات والأسماء والشعارات والألوان والتطبيقات والبرمجيات والملفات الصوتية ("المحتوى"). وهي محمية بموجب حقوق النشر وحقوق العلامات التجارية والقوانين المعمول بها في المملكة العربية السعودية.',
                  },
                  {
                    en: "All intellectual property rights related to applications, software, and designs are the exclusive property of Forsa Company or authorized service providers.",
                    ar: "جميع حقوق الملكية الفكرية المتعلقة بالتطبيقات والبرمجيات والتصاميم هي الملكية الحصرية لشركة فرصة أو مزودي الخدمة المرخصين.",
                  },
                  {
                    en: "The Client may not copy, distribute, or modify any of these materials without prior written permission from the Company.",
                    ar: "لا يجوز للعميل نسخ أي من هذه المواد أو توزيعها أو تعديلها دون الحصول على إذن كتابي مسبق من الشركة.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 7. Pricing */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("7. Pricing and Payment", "7. التسعير والدفع")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "Pricing: Prices are determined based on contracts and agreements concluded between us and the Client. Prices are not publicly displayed on the website.",
                    ar: "التسعير: تُحدَّد الأسعار بناءً على العقود والاتفاقيات المبرمة بيننا وبين العميل. لا تُعرض الأسعار علناً على الموقع الإلكتروني.",
                  },
                  {
                    en: "Payment: The Client must pay the agreed amounts in accordance with the contract or prior written agreement.",
                    ar: "الدفع: يجب على العميل دفع المبالغ المتفق عليها وفقاً للعقد أو الاتفاقية الكتابية المسبقة.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 8. Obligations */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("8. Obligations and Responsibilities", "8. الالتزامات والمسؤوليات")}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground mb-1">{t("Our Obligations:", "التزاماتنا:")}</p>
                  <p>
                    {t(
                      "We are committed to providing technical services in accordance with the standards and contracts agreed upon with the Client, implementing requirements accurately and professionally.",
                      "نلتزم بتقديم الخدمات التقنية وفقاً للمعايير والعقود المتفق عليها مع العميل، وتنفيذ المتطلبات بدقة واحترافية."
                    )}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{t("Client Responsibility:", "مسؤولية العميل:")}</p>
                  <ul className="space-y-2 list-disc list-inside ps-2">
                    {[
                      {
                        en: "Maintaining account and password confidentiality and not sharing them with third parties.",
                        ar: "الحفاظ على سرية الحساب وكلمة المرور وعدم مشاركتهما مع أطراف ثالثة.",
                      },
                      {
                        en: "Financial and legal obligations resulting from service use.",
                        ar: "الالتزامات المالية والقانونية الناجمة عن استخدام الخدمة.",
                      },
                      {
                        en: "Accuracy of provided data and commitment to updating it when necessary.",
                        ar: "دقة البيانات المقدمة والالتزام بتحديثها عند الضرورة.",
                      },
                      {
                        en: "Providing government licenses if the service requires it, and renewing them on time to ensure continued service delivery.",
                        ar: "تقديم التراخيص الحكومية إذا اقتضت الخدمة ذلك، وتجديدها في الوقت المناسب لضمان استمرار تقديم الخدمة.",
                      },
                      {
                        en: "The Client agrees that failure to renew licenses may lead to service interruption.",
                        ar: "يوافق العميل على أن عدم تجديد التراخيص قد يؤدي إلى انقطاع الخدمة.",
                      },
                    ].map((item, i) => (
                      <li key={i}>{t(item.en, item.ar)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 9. Privacy */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("9. Privacy and Data Protection", "9. الخصوصية وحماية البيانات")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "We are committed to protecting all personal data we collect from the Client in accordance with the Privacy Policy.",
                    ar: "نلتزم بحماية جميع البيانات الشخصية التي نجمعها من العميل وفقاً لسياسة الخصوصية.",
                  },
                  {
                    en: "Data is collected and used in accordance with local and international laws.",
                    ar: "يتم جمع البيانات واستخدامها وفقاً للقوانين المحلية والدولية.",
                  },
                  {
                    en: "Data is used to improve services, communicate with clients, and analyze usage.",
                    ar: "تُستخدم البيانات لتحسين الخدمات والتواصل مع العملاء وتحليل الاستخدام.",
                  },
                  {
                    en: "We apply appropriate security measures to protect data from unauthorized access.",
                    ar: "نُطبّق تدابير أمنية مناسبة لحماية البيانات من الوصول غير المصرح به.",
                  },
                  {
                    en: "We will not sell or rent Client data, nor will we share it except with their explicit consent or as required by law.",
                    ar: "لن نبيع بيانات العميل أو نؤجرها، ولن نشاركها إلا بموافقته الصريحة أو وفقاً لما يقتضيه القانون.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 10. Modifications */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("10. Modifications to Services and Terms", "10. التعديلات على الخدمات والشروط")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "We reserve the right to modify or update the terms or add or remove services at any time.",
                    ar: "نحتفظ بالحق في تعديل الشروط أو تحديثها أو إضافة أو إزالة الخدمات في أي وقت.",
                  },
                  {
                    en: "Clients will be notified of any material changes.",
                    ar: "سيتم إخطار العملاء بأي تغييرات جوهرية.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 11. Support */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("11. Support and Maintenance", "11. الدعم والصيانة")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "We provide technical support through official support channels.",
                    ar: "نقدم الدعم الفني عبر قنوات الدعم الرسمية.",
                  },
                  {
                    en: "Some services may require periodic maintenance, and the Company has the right to perform it at any time.",
                    ar: "قد تستلزم بعض الخدمات صيانة دورية، وللشركة الحق في إجرائها في أي وقت.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 12. Limitations */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("12. Limitations and Compensation", "12. القيود والتعويض")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "We are not responsible for any direct or indirect damages resulting from the use of the website or services.",
                    ar: "لا نتحمل المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناجمة عن استخدام الموقع الإلكتروني أو الخدمات.",
                  },
                  {
                    en: "The Client agrees to compensate the Company for any losses or claims arising from their illegal use of the services.",
                    ar: "يوافق العميل على تعويض الشركة عن أي خسائر أو مطالبات ناجمة عن استخدامه غير القانوني للخدمات.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 13. Termination */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("13. Termination and Cancellation", "13. الإنهاء والإلغاء")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "The Client may terminate the service in accordance with the terms specified in the contract.",
                    ar: "يجوز للعميل إنهاء الخدمة وفقاً للشروط المحددة في العقد.",
                  },
                  {
                    en: "The Company reserves the right to terminate the service upon violation of any terms.",
                    ar: "تحتفظ الشركة بالحق في إنهاء الخدمة عند انتهاك أي من الشروط.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 14. Force Majeure */}
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("14. Force Majeure", "14. القوة القاهرة")}
              </h2>
              <p>
                {t(
                  "We are not responsible for any delay or disruption resulting from circumstances beyond the Company's control such as natural disasters, government decisions, cyber attacks, and others.",
                  "لا نتحمل المسؤولية عن أي تأخير أو انقطاع ناجم عن ظروف خارجة عن سيطرة الشركة كالكوارث الطبيعية والقرارات الحكومية والهجمات الإلكترونية وغيرها."
                )}
              </p>
            </section>

            {/* 15. Applicable Laws */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("15. Applicable Laws and Dispute Resolution", "15. القوانين المطبقة وتسوية النزاعات")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "These terms are subject to the laws of the Kingdom of Saudi Arabia.",
                    ar: "تخضع هذه الشروط لأنظمة المملكة العربية السعودية.",
                  },
                  {
                    en: "Disputes are resolved through the competent court in Riyadh.",
                    ar: "تُحسم النزاعات عبر المحكمة المختصة في الرياض.",
                  },
                  {
                    en: "If any clause is found to be unenforceable, the other clauses remain in effect.",
                    ar: "إذا تبيّن أن أي بند غير قابل للتنفيذ، تظل البنود الأخرى سارية المفعول.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 16. Delivery */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("16. Delivery and Shipping", "16. التسليم والشحن")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "In case of physical products or licenses, they are delivered according to the agreement with the Client.",
                    ar: "في حال المنتجات المادية أو التراخيص، يتم تسليمها وفقاً للاتفاق مع العميل.",
                  },
                  {
                    en: "Licenses may be provided via email or through the Client's account.",
                    ar: "قد تُقدَّم التراخيص عبر البريد الإلكتروني أو من خلال حساب العميل.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 17. Contact */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("17. Client Communication", "17. التواصل مع العميل")}
              </h2>
              <p>{t("You can contact us via:", "يمكنك التواصل معنا عبر:")}</p>
              <ul className="space-y-1 ps-2">
                <li>
                  {t("Email:", "البريد الإلكتروني:")}{" "}
                  <a href="mailto:support@nawah.sa" className="text-primary hover:underline">
                    support@nawah.sa
                  </a>
                </li>
                <li>
                  {t("Phone:", "الهاتف:")}{" "}
                  <a href="tel:01151083470" className="text-primary hover:underline">
                    01151083470
                  </a>
                </li>
              </ul>
            </section>

            {/* 18. External Links */}
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("18. External Links", "18. الروابط الخارجية")}
              </h2>
              <p>
                {t(
                  "The website may contain links to external websites, which are beyond our control, and we are not responsible for their content.",
                  "قد يحتوي الموقع الإلكتروني على روابط لمواقع إلكترونية خارجية، تقع خارج نطاق سيطرتنا، ولا نتحمل المسؤولية عن محتواها."
                )}
              </p>
            </section>

            {/* 19. Refund */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("19. Cancellation and Refund Policy", "19. سياسة الإلغاء واسترداد المبالغ")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "The Client has the right to request a refund within (20 days) before using or activating the service.",
                    ar: "يحق للعميل طلب استرداد المبلغ خلال (20 يوماً) قبل استخدام الخدمة أو تفعيلها.",
                  },
                  {
                    en: "The refund request must be submitted in writing with supporting documents.",
                    ar: "يجب تقديم طلب الاسترداد كتابياً مع المستندات الداعمة.",
                  },
                  {
                    en: "Refunds are processed within (14 days) of approval.",
                    ar: "تتم معالجة المبالغ المستردة خلال (14 يوماً) من الموافقة.",
                  },
                  {
                    en: "The Company has the right to impose administrative fees.",
                    ar: "للشركة الحق في فرض رسوم إدارية.",
                  },
                  {
                    en: "No refunds are made after using or activating the service.",
                    ar: "لا تُردّ المبالغ بعد استخدام الخدمة أو تفعيلها.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* 20. Notices */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("20. Notices and Communications", "20. الإشعارات والاتصالات")}
              </h2>
              <ul className="space-y-2 list-disc list-inside ps-2">
                {[
                  {
                    en: "By registering and using the website, the Client agrees to receive notifications via email or website notifications.",
                    ar: "بالتسجيل واستخدام الموقع الإلكتروني، يوافق العميل على استلام الإشعارات عبر البريد الإلكتروني أو إشعارات الموقع.",
                  },
                  {
                    en: "The Client is responsible for updating their data to ensure receipt of notifications.",
                    ar: "يتحمل العميل مسؤولية تحديث بياناته لضمان استلام الإشعارات.",
                  },
                ].map((item, i) => (
                  <li key={i}>{t(item.en, item.ar)}</li>
                ))}
              </ul>
            </section>

            {/* Special Terms */}
            <section className="space-y-2 border-t border-border pt-8">
              <h2 className="font-display text-lg font-bold text-foreground">
                {t("Special Terms", "الشروط الخاصة")}
              </h2>
              <p>
                {t(
                  "The Client is obligated to provide accurate information for communication, technical support, and assistance in providing the service.",
                  "يلتزم العميل بتقديم معلومات دقيقة للتواصل والدعم الفني والمساعدة في تقديم الخدمة."
                )}
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
