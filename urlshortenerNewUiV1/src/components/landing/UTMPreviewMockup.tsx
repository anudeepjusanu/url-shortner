import { useLanguage } from "@/contexts/LanguageContext";
import { Tag, Copy, Check, Link2 } from "lucide-react";
import { useState } from "react";

export const UTMPreview = () => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const params = [
    { label: "Source", labelAr: "المصدر", value: "instagram", color: "hsl(var(--sky))" },
    { label: "Medium", labelAr: "الوسيط", value: "story_link", color: "hsl(var(--navy))" },
    { label: "Campaign", labelAr: "الحملة", value: "ramadan_2026", color: "hsl(340 60% 50%)" },
  ];

  const finalUrl = "snip.sa/ramadan?utm_source=instagram&utm_medium=story_link&utm_campaign=ramadan_2026";

  return (
    <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-elevated overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[hsl(var(--navy))]/8 flex items-center gap-2">
        <Tag className="w-4 h-4 text-[hsl(var(--sky))]" />
        <span className="text-sm font-display font-bold text-[hsl(var(--navy))]">
          {t("UTM Builder", "مُنشئ UTM")}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* URL input */}
        <div>
          <label className="text-[10px] font-body font-bold text-[hsl(var(--navy))]/50 uppercase tracking-wider mb-1.5 block">
            {t("Destination URL", "رابط الوجهة")}
          </label>
          <div className="flex items-center gap-2 bg-[hsl(var(--navy))]/4 rounded-lg px-3 py-2.5">
            <Link2 className="w-3.5 h-3.5 text-[hsl(var(--navy))]/40 shrink-0" />
            <span className="text-xs font-body text-[hsl(var(--navy))]/70 truncate">myshop.sa/offers/ramadan-2026</span>
          </div>
        </div>

        {/* UTM params */}
        <div className="space-y-2.5">
          {params.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-1.5 h-8 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <div className="flex-1">
                <label className="text-[10px] font-body font-bold text-[hsl(var(--navy))]/40 block mb-0.5">
                  {t(p.label, p.labelAr)}
                </label>
                <div className="bg-[hsl(var(--navy))]/4 rounded-md px-2.5 py-1.5">
                  <span className="text-xs font-body text-[hsl(var(--navy))]">{p.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Generated URL */}
        <div className="bg-[hsl(var(--sky))]/5 border border-[hsl(var(--sky))]/15 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-body font-bold text-[hsl(var(--sky))]">
              {t("Generated Link", "الرابط المُنشأ")}
            </span>
            <button
              onClick={() => setCopied(true)}
              className="flex items-center gap-1 text-[10px] font-body font-bold text-[hsl(var(--sky))] hover:text-[hsl(var(--navy))] transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t("Copied!", "تم النسخ!") : t("Copy", "نسخ")}
            </button>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-[hsl(var(--sky))]/10">
            <code className="text-[10px] font-mono text-[hsl(var(--navy))] break-all leading-relaxed">
              {finalUrl}
            </code>
          </div>
        </div>

        {/* Stats hint */}
        <div className="flex items-center gap-4 pt-1">
          {[
            { label: t("Clicks", "ضغطات"), value: "1,420" },
            { label: t("Unique", "فريد"), value: "893" },
            { label: t("Conv.", "تحويل"), value: "12.4%" },
          ].map((stat, i) => (
            <div key={i} className="text-center flex-1">
              <p className="text-sm font-display font-bold text-[hsl(var(--navy))]">{stat.value}</p>
              <p className="text-[10px] font-body text-[hsl(var(--navy))]/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
