import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef, useState } from "react";

const TrustSection = () => {
  const { t } = useLanguage();

  const badges = [
    { emoji: "🇸🇦", text: t("Hosted in Saudi Arabia", "مستضاف في السعودية") },
    { emoji: "🔒", text: t("PDPL Compliant", "متوافق مع نظام حماية البيانات") },
    { emoji: "💳", text: t("mada & STC Pay", "مدى و STC Pay") },
    { emoji: "🌙", text: t("Ramadan Ready", "جاهز لرمضان") },
  ];

  const stats = [
    { value: 10000, suffix: "+", label: t("Saudi Users", "مستخدم سعودي") },
    { value: 1000000, suffix: "+", label: t("Links Created", "رابط تم إنشاؤه"), display: "1M" },
    { value: 99.9, suffix: "%", label: t("Uptime", "وقت التشغيل") },
  ];

  return (
    <section className="section-cream-rose py-20 md:py-28">
      <div className="container mx-auto px-6">
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border text-sm font-medium text-foreground"
            >
              <span>{badge.emoji}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <AnimatedStat value={stat.value} suffix={stat.suffix} display={stat.display} />
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AnimatedStat = ({ value, suffix, display }: { value: number; suffix: string; display?: string }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, value]);

  const formatted = display
    ? (started ? display : "0")
    : (value % 1 !== 0 ? count.toFixed(1) : count.toLocaleString());

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-bold text-foreground font-display">
      {formatted}{suffix}
    </div>
  );
};

export default TrustSection;
