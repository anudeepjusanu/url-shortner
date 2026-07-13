import { useLanguage } from "@/contexts/LanguageContext";
import { useBrand } from "@/contexts/BrandContext";
import {
  Link2,
  ExternalLink,
  Copy,
  BarChart3,
  Trash2,
  QrCode,
  Download,
  Globe,
  CheckCircle,
  Clock,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import qrRestaurantImg from "@/assets/qr-restaurant-table.jpg";

/**
 * Cropped, self-contained dashboard previews with fresh sample data.
 * Used as visuals inside FeaturesSection / AnalyticsSection.
 */

/* ───────── Links preview long URL morphing into a clean short link ───────── */
export const LinksPreview = () => {
  const { t } = useLanguage();
  const brand = useBrand();

  return (
    <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-elevated overflow-hidden">
      {/* Mini header */}
      <div className="px-5 py-3.5 border-b border-[hsl(var(--navy))]/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--sky))]" />
          <span className="text-sm font-display font-bold text-[hsl(var(--navy))]">
            {t("Live shortener", "اختصار مباشر")}
          </span>
        </div>
        <span className="text-[10px] font-body text-[hsl(var(--navy))]/40">
          {t("in 0.3s", "في 0.3 ثانية")}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Long URL pill dim, struck-through */}
        <div>
          <p className="text-[10px] font-body font-bold uppercase tracking-wider text-[hsl(var(--navy))]/40 mb-1.5">
            {t("From long URL", "من الرابط الطويل")}
          </p>
          <div className="bg-[hsl(0,75%,98%)] border border-[hsl(0,75%,55%)]/15 rounded-xl px-3 py-2.5 overflow-hidden">
            <p className="text-xs font-mono text-[hsl(var(--navy))]/45 truncate line-through">
              https://www.myshop.sa/collections/ramadan-2026/products?utm=fb&ref=story
            </p>
          </div>
        </div>

        {/* Morph arrow */}
        <div className="flex justify-center">
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-8 rounded-full bg-[hsl(var(--sky))]/10 flex items-center justify-center"
          >
            <ArrowRight
              size={14}
              className="text-[hsl(var(--sky))] rotate-90"
            />
          </motion.div>
        </div>

        {/* Short URL pill bright, animated */}
        <div>
          <p className="text-[10px] font-body font-bold uppercase tracking-wider text-[hsl(var(--sky))] mb-1.5">
            {t("To clean short link", "الى رابط قصير نظيف")}
          </p>
          <motion.div
            initial={{ scale: 0.98, opacity: 0.8 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: false }}
            className="bg-gradient-to-r from-[hsl(var(--sky))]/8 to-[hsl(var(--navy))]/5 border border-[hsl(var(--sky))]/25 rounded-xl px-3 py-3 flex items-center justify-between"
          >
            <span className="font-display font-bold text-base text-[hsl(var(--navy))]">
              {brand.domain}/ramadan
            </span>
            <button className="flex items-center gap-1 text-[10px] font-body font-bold text-white bg-[hsl(var(--sky))] px-2.5 py-1 rounded-full">
              <Copy size={10} /> {t("Copy", "نسخ")}
            </button>
          </motion.div>
        </div>

        {/* Live click counter */}
        <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--navy))]/5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(150,60%,45%)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(150,60%,45%)]"></span>
            </span>
            <span className="text-[10px] font-body text-[hsl(var(--navy))]/55">
              {t("Live clicks", "ضغطات مباشرة")}
            </span>
          </div>
          <span className="font-display font-bold text-sm text-[hsl(var(--navy))]">
            1,420
          </span>
        </div>
      </div>
    </div>
  );
};

/* ───────── Analytics preview ───────── */
export const AnalyticsPreview = () => {
  const { t } = useLanguage();

  // SVG line chart data points (x positions evenly spaced, y inverted for SVG)
  const chartW = 280;
  const chartH = 70;
  const points = [
    { clicks: 12, visitors: 8, qr: 3 },
    { clicks: 28, visitors: 18, qr: 10 },
    { clicks: 18, visitors: 12, qr: 8 },
    { clicks: 42, visitors: 25, qr: 15 },
    { clicks: 35, visitors: 22, qr: 20 },
    { clicks: 65, visitors: 38, qr: 28 },
    { clicks: 48, visitors: 30, qr: 22 },
    { clicks: 55, visitors: 35, qr: 18 },
    { clicks: 38, visitors: 28, qr: 12 },
  ];
  const max = 70;
  const toPath = (key: "clicks" | "visitors" | "qr") =>
    points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * chartW;
        const y = chartH - (p[key] / max) * chartH;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");

  const dates = [
    "Jan 5",
    "Jan 12",
    "Jan 19",
    "Jan 26",
    "Feb 2",
    "Feb 9",
    "Feb 16",
    "Feb 23",
    "Mar 1",
  ];

  const countries = [
    { name: t("Saudi Arabia", "السعودية"), pct: 68 },
    { name: t("UAE", "الإمارات"), pct: 18 },
    { name: t("Kuwait", "الكويت"), pct: 9 },
    { name: t("Egypt", "مصر"), pct: 5 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-elevated overflow-hidden">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-b border-[hsl(var(--navy))]/6">
        {[
          {
            label: t("Total Clicks", "الضغطات"),
            value: "4,827",
            color: "hsl(217, 71%, 30%)",
          },
          {
            label: t("Unique Visitors", "الزوار"),
            value: "2,341",
            color: "hsl(var(--navy))",
          },
          {
            label: t("QR Scans", "مسح QR"),
            value: "892",
            color: "hsl(25, 95%, 53%)",
          },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-4 ${i < 2 ? "border-e border-[hsl(var(--navy))]/6" : ""}`}
          >
            <p className="font-display text-xl font-bold text-[hsl(var(--navy))]">
              {s.value}
            </p>
            <p className="text-[10px] text-[hsl(var(--navy))]/45 font-body mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className="px-5 py-4 border-b border-[hsl(var(--navy))]/6">
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-xs font-display font-semibold"
            style={{ color: "hsl(var(--navy))" }}
          >
            {t("Clicks Over Time", "الضغطات عبر الوقت")}
          </p>
          <span
            className="text-[9px] font-body px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: "hsl(var(--navy) / 0.05)",
              color: "hsl(var(--navy) / 0.45)",
            }}
          >
            {t("Last 90 days", "آخر 90 يوم")}
          </span>
        </div>
        <svg
          viewBox={`-10 -5 ${chartW + 20} ${chartH + 25}`}
          className="w-full"
          style={{ height: 120 }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <line
              key={r}
              x1={0}
              y1={chartH * r}
              x2={chartW}
              y2={chartH * r}
              stroke="hsl(var(--navy) / 0.06)"
              strokeWidth={0.5}
            />
          ))}
          {/* Lines */}
          <path
            d={toPath("clicks")}
            fill="none"
            stroke="hsl(217, 71%, 30%)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={toPath("visitors")}
            fill="none"
            stroke="hsl(var(--navy))"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={toPath("qr")}
            fill="none"
            stroke="hsl(25, 95%, 53%)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* X-axis labels */}
          {dates
            .filter((_, i) => i % 2 === 0)
            .map((d, i) => (
              <text
                key={d}
                x={((i * 2) / (dates.length - 1)) * chartW}
                y={chartH + 15}
                textAnchor="middle"
                fill="hsl(var(--navy) / 0.3)"
                fontSize={6}
                fontFamily="var(--font-body)"
              >
                {d}
              </text>
            ))}
        </svg>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-1">
          {[
            { label: t("Clicks", "ضغطات"), color: "hsl(217, 71%, 30%)" },
            { label: t("Visitors", "زوار"), color: "hsl(var(--navy))" },
            { label: t("QR Scans", "QR"), color: "hsl(25, 95%, 53%)" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span
                className="text-[9px] font-body"
                style={{ color: "hsl(var(--navy) / 0.45)" }}
              >
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Countries breakdown */}
      <div className="px-5 py-4 space-y-2.5">
        {countries.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="text-xs font-body text-[hsl(var(--navy))]/70 w-20 shrink-0">
              {c.name}
            </span>
            <div className="flex-1 h-1.5 bg-[hsl(var(--navy))]/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--sky))] rounded-full"
                style={{ width: `${c.pct}%` }}
              />
            </div>
            <span className="text-xs font-display font-bold text-[hsl(var(--navy))] w-8 text-end">
              {c.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────── QR Codes preview QR placed on a stylized business card ───────── */
export const QRCodesPreview = () => {
  const { t } = useLanguage();

  // Simple deterministic QR-looking grid (10x10)
  const cells = Array.from({ length: 100 }, (_, i) => {
    const pattern = [
      0, 3, 5, 7, 9, 12, 15, 18, 21, 24, 29, 32, 36, 40, 43, 47, 51, 55, 58, 62,
      66, 70, 73, 77, 81, 84, 88, 91, 94, 97,
    ];
    return pattern.includes(i % 100) || (i * 13) % 7 === 0;
  });

  return (
    <div className="space-y-3">
      {/* Restaurant table photo with QR stand */}
      <div className="relative rounded-2xl shadow-elevated overflow-hidden aspect-[1.7/1]">
        <img
          src={qrRestaurantImg}
          alt={t("QR code stand on restaurant table", "حامل QR على طاولة مطعم")}
          loading="lazy"
          width={1024}
          height={1024}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Scan stats */}
      <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-soft px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[hsl(25,95%,53%)]/12 flex items-center justify-center">
            <QrCode size={13} className="text-[hsl(25,95%,53%)]" />
          </div>
          <div>
            <p className="text-[10px] font-body text-[hsl(var(--navy))]/45">
              {t("Total scans this week", "إجمالي المسح هذا الأسبوع")}
            </p>
            <p className="font-display font-bold text-sm text-[hsl(var(--navy))]">
              892 {t("scans", "مسح")}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-body font-bold text-[hsl(150,60%,45%)] bg-[hsl(150,60%,45%)]/10 px-2 py-1 rounded-full">
          ↑ 24%
        </span>
      </div>
    </div>
  );
};

/* ───────── Custom Domains preview fake browser bar with .sa domain ───────── */
export const DomainsPreview = () => {
  const { t } = useLanguage();
  const domains = [
    { name: "go.yourshop.sa", status: "verified" as const },
    { name: "r.brand.sa", status: "verified" as const },
    { name: "link.agency.sa", status: "pending" as const },
  ];

  return (
    <div className="space-y-3">
      {/* Browser chrome mock */}
      <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-elevated overflow-hidden">
        <div className="px-4 py-2.5 bg-[hsl(var(--cream))] border-b border-[hsl(var(--navy))]/8 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(0,75%,65%)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(45,90%,60%)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(150,55%,55%)]" />
          </div>
          <div className="flex-1 min-w-0 mx-3 bg-white border border-[hsl(var(--navy))]/10 rounded-lg px-3 py-1.5 flex items-center gap-2 overflow-hidden">
            <CheckCircle
              size={11}
              className="text-[hsl(150,60%,45%)] shrink-0"
            />
            <span className="text-xs font-mono text-[hsl(var(--navy))] truncate">
              <span className="text-[hsl(var(--navy))]/40">https://</span>
              <span className="font-bold text-[hsl(var(--sky))]">
                go.yourshop.sa
              </span>
              <span className="text-[hsl(var(--navy))]/60">/ramadan</span>
            </span>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-body uppercase tracking-wider text-[hsl(var(--navy))]/40 mb-2">
            {t("Your branded short link", "رابطك المختصر بعلامتك")}
          </p>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="font-display font-bold text-base sm:text-lg text-[hsl(var(--navy))] truncate min-w-0">
              go.yourshop.sa/ramadan
            </span>
            <span className="text-[10px] font-body font-bold text-[hsl(150,60%,45%)] bg-[hsl(150,60%,45%)]/10 px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
              <CheckCircle size={10} /> SSL
            </span>
          </div>
        </div>
      </div>

      {/* Domain list */}
      <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-soft overflow-hidden divide-y divide-[hsl(var(--navy))]/6">
        {domains.map((d) => (
          <div
            key={d.name}
            className="px-5 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${d.status === "verified" ? "bg-[hsl(var(--sky))]/10" : "bg-[hsl(var(--navy))]/5"}`}
              >
                <Globe
                  size={12}
                  className={
                    d.status === "verified"
                      ? "text-[hsl(var(--sky))]"
                      : "text-[hsl(var(--navy))]/40"
                  }
                />
              </div>
              <span className="font-mono text-xs text-[hsl(var(--navy))]">
                {d.name}
              </span>
            </div>
            {d.status === "verified" ? (
              <span className="flex items-center gap-1 text-[10px] font-body text-[hsl(var(--sky))] bg-[hsl(var(--sky))]/10 px-2 py-0.5 rounded-full">
                <CheckCircle size={9} /> {t("Verified", "مُثبت")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-body text-[hsl(var(--navy))]/45 bg-[hsl(var(--navy))]/5 px-2 py-0.5 rounded-full">
                <Clock size={9} /> {t("Pending", "قيد الانتظار")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
