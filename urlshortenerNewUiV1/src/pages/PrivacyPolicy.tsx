import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => {
  const { t } = useLanguage();

  const clauses = [
    {
      title: t("Clause 1: Introduction", "البند 1: المقدمة"),
      content: t(
        "Forsa respects your privacy and is committed to providing excellent service to all our customers. This Privacy Notice has been drafted in accordance with the Personal Data Protection Law and its regulations in the Kingdom of Saudi Arabia to help you understand the nature of the data we collect from you and how this data will be handled by Forsa. Out of Forsa's commitment to the privacy and confidentiality of user data, we are dedicated to maintaining the security and confidentiality of this information and using it to deliver the expected level of service in compliance with the applicable terms and conditions in the Kingdom of Saudi Arabia. By using the Forsa website, the user consents to this Privacy Policy.",
        "تحترم فرصة خصوصيتك وتلتزم بتقديم خدمة ممتازة لجميع عملائنا. تم إعداد إشعار الخصوصية هذا وفقاً لنظام حماية البيانات الشخصية ولوائحه في المملكة العربية السعودية لمساعدتك على فهم طبيعة البيانات التي نجمعها منك وكيفية معالجة هذه البيانات من قِبل فرصة. وانطلاقاً من التزام فرصة بخصوصية وسرية بيانات المستخدمين، نحرص على الحفاظ على أمن وسرية هذه المعلومات واستخدامها لتقديم مستوى الخدمة المتوقع وفقاً للشروط والأحكام المعمول بها في المملكة العربية السعودية. باستخدام موقع فرصة، يوافق المستخدم على سياسة الخصوصية هذه."
      ),
    },
    {
      title: t("Clause 2: Data to Be Collected and Purpose of Collection", "البند 2: البيانات التي سيتم جمعها والغرض من جمعها"),
      items: [
        t(
          "Data required upon registration for our services (such as name, email address, physical address, phone number, date of birth, nationality, and gender).",
          "البيانات المطلوبة عند التسجيل للاستفادة من خدماتنا (مثل الاسم وعنوان البريد الإلكتروني والعنوان الفعلي ورقم الهاتف وتاريخ الميلاد والجنسية والجنس)."
        ),
        t(
          "Data required for using our services, websites, or mobile applications (such as cookies and usage data).",
          "البيانات المطلوبة لاستخدام خدماتنا ومواقعنا الإلكترونية أو تطبيقات الجوال (مثل ملفات تعريف الارتباط وبيانات الاستخدام)."
        ),
        t(
          "Data exchanged during communication with you (such as customer support requests and feedback).",
          "البيانات المتبادلة أثناء التواصل معك (مثل طلبات دعم العملاء والملاحظات)."
        ),
      ],
    },
    {
      title: t("Clause 3: Purpose of Collecting Personal Data", "البند 3: الغرض من جمع البيانات الشخصية"),
      intro: t(
        "To provide the highest level of service and products, we collect and use your personal data for the following purposes:",
        "لتقديم أعلى مستوى من الخدمة والمنتجات، نجمع بياناتك الشخصية ونستخدمها للأغراض التالية:"
      ),
      items: [
        t("Enabling us to develop, improve, and/or market products and services.", "تمكيننا من تطوير المنتجات والخدمات وتحسينها و/أو تسويقها."),
        t("Facilitating and supporting our operations and systems to ensure continuity and quality of our services.", "تيسير عملياتنا وأنظمتنا ودعمها لضمان استمرارية جودة خدماتنا."),
        t("Understanding customer needs, assessing your eligibility for products and services, and recommending relevant products and services.", "فهم احتياجات العملاء وتقييم أهليتك للمنتجات والخدمات وتوصية المنتجات والخدمات ذات الصلة."),
        t("Notifying you about new products and services.", "إخطارك بالمنتجات والخدمات الجديدة."),
        t("Responding to and following up on inquiries, suggestions, or complaints submitted by the user.", "الرد على الاستفسارات والاقتراحات أو الشكاوى المقدمة من المستخدم ومتابعتها."),
      ],
    },
    {
      title: t("Clause 4: Methods of Data Collection", "البند 4: طرق جمع البيانات"),
      items: [
        t("Data provided directly by the user through registration on the website.", "البيانات التي يقدمها المستخدم مباشرةً من خلال التسجيل في الموقع الإلكتروني."),
        t("Data collected through cookies during website visits.", "البيانات التي يتم جمعها من خلال ملفات تعريف الارتباط أثناء زيارات الموقع الإلكتروني."),
      ],
    },
    {
      title: t("Clause 5: Storage and Destruction of Personal Data", "البند 5: تخزين البيانات الشخصية وإتلافها"),
      content: t(
        "Personal data is stored within the Kingdom of Saudi Arabia on servers protected by advanced technologies in compliance with the policies and controls of the National Cybersecurity Authority and international standards to prevent unauthorized access and mitigate cybersecurity risks. When the data is no longer needed and as per the regulations, it will be destroyed securely to ensure it cannot be accessed or recovered, in accordance with Forsa's policies.",
        "يتم تخزين البيانات الشخصية داخل المملكة العربية السعودية على خوادم محمية بتقنيات متقدمة وفقاً لسياسات وضوابط الهيئة الوطنية للأمن السيبراني والمعايير الدولية لمنع الوصول غير المصرح به والحد من مخاطر الأمن السيبراني. عند انتفاء الحاجة إلى البيانات ووفقاً للوائح، سيتم إتلافها بشكل آمن لضمان عدم الوصول إليها أو استردادها، وفقاً لسياسات فرصة."
      ),
    },
    {
      title: t("Clause 6: Legal Basis for Collecting and Processing Personal Data", "البند 6: الأساس القانوني لجمع البيانات الشخصية ومعالجتها"),
      content: t(
        "Personal data is collected and processed based on the consent of the data subject. The data subject may withdraw their consent to collect and process their data at any time, unless there is another legal basis. To do so, please contact Forsa's support team via:",
        "يتم جمع البيانات الشخصية ومعالجتها بناءً على موافقة صاحب البيانات. يجوز لصاحب البيانات سحب موافقته على جمع بياناته ومعالجتها في أي وقت، ما لم يكن هناك أساس قانوني آخر. للقيام بذلك، يرجى التواصل مع فريق دعم فرصة عبر:"
      ),
      contact: true,
    },
    {
      title: t("Clause 7: Rights of the Data Subject", "البند 7: حقوق صاحب البيانات"),
      rights: [
        {
          heading: t("Right to Information:", "حق الإعلام:"),
          body: t(
            "The data subject has the right to know the methods of data collection, the legal basis for collecting and processing it, how it is processed, stored, and destroyed, and with whom it will be shared. Details are provided in this Privacy Policy or can be obtained by contacting us via the information in Clause 9.",
            "يحق لصاحب البيانات معرفة طرق جمع البيانات والأساس القانوني لجمعها ومعالجتها وكيفية معالجتها وتخزينها وإتلافها ومن سيتم مشاركتها معه. التفاصيل واردة في سياسة الخصوصية هذه أو يمكن الحصول عليها بالتواصل معنا عبر المعلومات الواردة في البند 9."
          ),
        },
        {
          heading: t("Right to Access Personal Data:", "حق الوصول إلى البيانات الشخصية:"),
          body: t(
            "The data subject may request a copy of their personal data via the email provided in Clause 9. The data will be provided free of charge within 30 working days via email.",
            "يجوز لصاحب البيانات طلب نسخة من بياناته الشخصية عبر البريد الإلكتروني المُشار إليه في البند 9. سيتم تقديم البيانات مجاناً خلال 30 يوم عمل عبر البريد الإلكتروني."
          ),
        },
        {
          heading: t("Right to Correct Personal Data:", "حق تصحيح البيانات الشخصية:"),
          body: t(
            "The data subject has the right to request correction of inaccurate, incorrect, or incomplete personal data via the email provided in Clause 9. Requests will be reviewed and decided upon within 30 working days, and the data subject will be notified via email.",
            "يحق لصاحب البيانات طلب تصحيح البيانات الشخصية غير الدقيقة أو الخاطئة أو غير المكتملة عبر البريد الإلكتروني المُشار إليه في البند 9. سيتم مراجعة الطلبات والبت فيها خلال 30 يوم عمل، وسيتم إخطار صاحب البيانات عبر البريد الإلكتروني."
          ),
        },
        {
          heading: t("Right to Destroy Personal Data:", "حق إتلاف البيانات الشخصية:"),
          body: t(
            "The data subject may request the destruction of their personal data unless there are legal, regulatory, or contractual requirements for retention.",
            "يجوز لصاحب البيانات طلب إتلاف بياناته الشخصية ما لم تكن هناك متطلبات قانونية أو تنظيمية أو تعاقدية للاحتفاظ بها."
          ),
        },
        {
          heading: t("Right to Withdraw Consent for Processing Personal Data:", "حق سحب الموافقة على معالجة البيانات الشخصية:"),
          body: t(
            "The data subject may withdraw their consent for processing personal data at any time, unless there are legitimate purposes requiring otherwise.",
            "يجوز لصاحب البيانات سحب موافقته على معالجة البيانات الشخصية في أي وقت، ما لم تكن هناك أغراض مشروعة تستوجب خلاف ذلك."
          ),
        },
      ],
      note: t(
        "Some requests (such as destruction or withdrawal of consent) may be restricted if legal or regulatory obligations require data retention.",
        "قد تكون بعض الطلبات (مثل الإتلاف أو سحب الموافقة) مقيدة إذا كانت الالتزامات القانونية أو التنظيمية تستوجب الاحتفاظ بالبيانات."
      ),
    },
    {
      title: t("Clause 8: Sharing/Exchanging Personal Data", "البند 8: مشاركة/تبادل البيانات الشخصية"),
      content: t(
        "Personal data will not be disclosed to third parties without your consent or a legal basis, as applicable under the law.",
        "لن يتم الإفصاح عن البيانات الشخصية لأطراف ثالثة دون موافقتك أو وجود أساس قانوني، وفقاً لما ينص عليه القانون."
      ),
    },
    {
      title: t("Clause 9: Exercising the Rights of the Data Subject", "البند 9: ممارسة حقوق صاحب البيانات"),
      content: t(
        "The data subject may request access, correction, or destruction of their data by contacting us via:",
        "يجوز لصاحب البيانات طلب الوصول إلى بياناته أو تصحيحها أو إتلافها بالتواصل معنا عبر:"
      ),
      contact: true,
    },
    {
      title: t("Clause 10: Complaints and Inquiries", "البند 10: الشكاوى والاستفسارات"),
      content: t(
        "For any complaints or inquiries related to the Privacy Policy or the handling of personal data, please contact the website management via:",
        "لأي شكاوى أو استفسارات تتعلق بسياسة الخصوصية أو معالجة البيانات الشخصية، يرجى التواصل مع إدارة الموقع عبر:"
      ),
      contact: true,
    },
    {
      title: t("Clause 11: Updates to the Privacy Policy", "البند 11: تحديثات سياسة الخصوصية"),
      content: t(
        "The Privacy Policy was last updated on January 13, 2025. Forsa reserves the right to add or modify any terms of the Privacy Policy. The website management will notify the data subject of any changes, and the data subject's account may be terminated if they do not accept the updated Privacy Policy after being notified.",
        "آخر تحديث لسياسة الخصوصية كان في 13 يناير 2025. تحتفظ فرصة بالحق في إضافة أي شروط في سياسة الخصوصية أو تعديلها. ستُخطر إدارة الموقع صاحب البيانات بأي تغييرات، وقد يتم إنهاء حساب صاحب البيانات إذا لم يقبل سياسة الخصوصية المُحدَّثة بعد إخطاره."
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Header */}
          <div className="mb-10">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
              {t("Privacy Policy", "سياسة الخصوصية")}
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              {t("Last Updated: January 13, 2025", "آخر تحديث: 13 يناير 2025")}
            </p>
          </div>

          {/* Clauses */}
          <div className="space-y-10">
            {clauses.map((clause, i) => (
              <section key={i} className="space-y-3">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {clause.title}
                </h2>

                {clause.intro && (
                  <p className="font-body text-muted-foreground leading-relaxed">
                    {clause.intro}
                  </p>
                )}

                {clause.content && (
                  <p className="font-body text-muted-foreground leading-relaxed">
                    {clause.content}
                  </p>
                )}

                {clause.items && (
                  <ul className="list-disc list-inside space-y-2 ps-2">
                    {clause.items.map((item, j) => (
                      <li key={j} className="font-body text-muted-foreground leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {clause.rights && (
                  <div className="space-y-4">
                    {clause.rights.map((right, j) => (
                      <div key={j}>
                        <p className="font-body font-semibold text-foreground">
                          {right.heading}
                        </p>
                        <p className="font-body text-muted-foreground leading-relaxed mt-1">
                          {right.body}
                        </p>
                      </div>
                    ))}
                    {clause.note && (
                      <p className="font-body text-muted-foreground leading-relaxed italic border-s-2 border-primary/30 ps-3">
                        {clause.note}
                      </p>
                    )}
                  </div>
                )}

                {clause.contact && (
                  <ul className="space-y-1 ps-2">
                    <li className="font-body text-muted-foreground">
                      {t("Email:", "البريد الإلكتروني:")}{" "}
                      <a
                        href="mailto:support@nawah.sa"
                        className="text-primary hover:underline"
                      >
                        support@nawah.sa
                      </a>
                    </li>
                    <li className="font-body text-muted-foreground">
                      {t("Phone:", "الهاتف:")}{" "}
                      <a
                        href="tel:+966539100295"
                        className="text-primary hover:underline"
                      >
                        +966539100295
                      </a>
                    </li>
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
