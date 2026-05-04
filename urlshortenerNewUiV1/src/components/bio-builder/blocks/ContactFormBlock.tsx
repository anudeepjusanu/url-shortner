import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderRadius?: number;
}

const ContactFormBlock = ({ textColor, buttonColor, buttonTextColor, borderRadius = 12 }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-bold mb-3" style={{ color: textColor }}>
        {t("Send a Message", "أرسل رسالة")}
      </h3>
      <div className="space-y-2">
        <Input
          placeholder={t("Your Name", "اسمك")}
          className="text-sm h-10"
          style={{ borderRadius, borderColor: `${textColor}30` }}
        />
        <Input
          placeholder={t("Your Email", "بريدك الإلكتروني")}
          type="email"
          className="text-sm h-10"
          style={{ borderRadius, borderColor: `${textColor}30` }}
        />
        <Textarea
          placeholder={t("Your Message", "رسالتك")}
          className="text-sm min-h-[60px]"
          style={{ borderRadius, borderColor: `${textColor}30` }}
        />
        <button
          className="w-full text-sm font-medium py-2.5 transition-all hover:opacity-90"
          style={{ borderRadius, backgroundColor: buttonColor, color: buttonTextColor }}
        >
          {t("Send", "إرسال")}
        </button>
      </div>
    </div>
  );
};

export default ContactFormBlock;
