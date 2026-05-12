import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderRadius?: number;
  data?: {
    email?: string;
    fields?: ("name" | "email" | "message")[];
  };
}

const ContactFormBlock = ({ textColor, buttonColor, buttonTextColor, borderRadius = 12, data }: Props) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const recipientEmail = data?.email || "";
  const fields = data?.fields || ["name", "email", "message"];
  const showName = fields.includes("name");
  const showEmail = fields.includes("email");
  const showMessage = fields.includes("message");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientEmail) {
      const subject = encodeURIComponent(name ? `Message from ${name}` : "New Contact Message");
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${senderEmail}\n\n${message}`);
      window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, "_blank");
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="px-4 py-3 text-center">
        <p style={{ color: textColor }} className="text-sm font-medium">
          {t("Message sent!", "تم الإرسال!")}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-bold mb-3" style={{ color: textColor }}>
        {t("Send a Message", "أرسل رسالة")}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        {showName && (
          <Input
            placeholder={t("Your Name", "اسمك")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm h-10"
            style={{ borderRadius, borderColor: `${textColor}30` }}
          />
        )}
        {showEmail && (
          <Input
            placeholder={t("Your Email", "بريدك الإلكتروني")}
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            className="text-sm h-10"
            style={{ borderRadius, borderColor: `${textColor}30` }}
          />
        )}
        {showMessage && (
          <Textarea
            placeholder={t("Your Message", "رسالتك")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="text-sm min-h-[60px]"
            style={{ borderRadius, borderColor: `${textColor}30` }}
          />
        )}
        <button
          type="submit"
          className="w-full text-sm font-medium py-2.5 transition-all hover:opacity-90"
          style={{ borderRadius, backgroundColor: buttonColor, color: buttonTextColor }}
        >
          {t("Send", "إرسال")}
        </button>
      </form>
    </div>
  );
};

export default ContactFormBlock;
