import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Copy, Check, Instagram, Music2, MessageCircle, QrCode, BarChart3, Globe, ImageDown, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface Props {
  username: string;
}

const PublishStep = ({ username }: Props) => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const link = `${window.location.host}/bio/${username}`;

  useEffect(() => {
    const end = Date.now() + 1500;
    const colors = ["#a83244", "#7a253a", "#FFFBF5", "#f4c4cd"];
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 }, colors });
    frame();
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/bio/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12 relative overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 14 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold text-foreground mb-2"
        >
          {t("Your page is LIVE!", "صفحتك صارت مباشرة!")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-8"
        >
          {t("Time to share it with the world", "حان وقت مشاركتها مع العالم")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 250, damping: 18 }}
          className="w-full bg-gradient-to-br from-primary to-secondary rounded-3xl p-6 mb-8 shadow-elevated"
        >
          <p className="text-2xl font-bold text-primary-foreground font-mono mb-4">{link}</p>
          <button
            onClick={copy}
            className="w-full bg-primary-foreground text-primary font-semibold py-3 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> {t("Copied!", "تم النسخ!")}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> {t("Copy Link", "نسخ الرابط")}
              </>
            )}
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm font-medium text-foreground mb-4"
        >
          {t("Share your new bio page everywhere", "شاركها في كل مكان")}
        </motion.p>
        <div className="grid grid-cols-4 gap-3 w-full mb-8">
          {[
            { icon: Instagram, label: "Insta", bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" },
            { icon: Music2, label: "TikTok", bg: "bg-foreground" },
            { icon: MessageCircle, label: "WhatsApp", bg: "bg-green-500" },
            { icon: QrCode, label: "QR Code", bg: "bg-secondary" },
          ].map((s, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card border border-border hover:shadow-card transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="w-full"
        >
          <p className="text-sm font-semibold text-foreground mb-3 text-start">{t("What's next?", "إيش الخطوة التالية؟")}</p>
          <div className="space-y-2">
            <NextCard
              icon={<BarChart3 className="w-5 h-5 text-primary" />}
              title={t("View Analytics", "عرض التحليلات")}
              subtitle={t("See who's visiting your page", "شوف مين يزور صفحتك")}
              onClick={() => navigate("/dashboard/analytics")}
            />
            <NextCard
              icon={<Globe className="w-5 h-5 text-primary" />}
              title={t("Edit your page", "تعديل الصفحة")}
              subtitle={t("Update links and design anytime", "عدّل الروابط والتصميم في أي وقت")}
              onClick={() => navigate("/dashboard/bio-pages")}
            />
            <NextCard
              icon={<ImageDown className="w-5 h-5 text-primary" />}
              title={t("Download QR Code", "تحميل رمز QR")}
              subtitle={t("Print it on cards or stickers", "اطبعه على البطاقات والملصقات")}
              onClick={() => navigate("/dashboard/qr-codes")}
            />
          </div>

          <button
            onClick={() => navigate("/dashboard/bio-pages")}
            className="w-full mt-6 text-sm font-semibold text-primary hover:underline py-3"
          >
            {t("Go to Dashboard", "اذهب للوحة التحكم")} →
          </button>
        </motion.div>
      </div>
    </div>
  );
};

const NextCard = ({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.01, y: -1 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className="w-full flex items-center gap-3 bg-card border border-border hover:border-primary/40 rounded-2xl p-4 shadow-soft hover:shadow-card transition-all text-start"
  >
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-foreground text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
  </motion.button>
);

export default PublishStep;
