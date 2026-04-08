import { useLanguage } from "@/contexts/LanguageContext";
import { Link2, ExternalLink, Copy, BarChart3, Trash2, QrCode, Download, Globe, CheckCircle, Clock, Search } from "lucide-react";

/**
 * Cropped, self-contained dashboard previews with fresh sample data.
 * Used as visuals inside FeaturesSection / AnalyticsSection.
 */

/* ───────── Links preview ───────── */
export const LinksPreview = () => {
  const { t } = useLanguage();
  const links = [
    { name: "Ramadan Offer", short: "4r.sa/ramadan", dest: "myshop.sa/offers/ramadan-2026", clicks: 1420, time: t("3 days ago", "قبل 3 أيام") },
    { name: "New Collection", short: "4r.sa/newdrop", dest: "myshop.sa/collections/spring", clicks: 863, time: t("1 week ago", "قبل أسبوع") },
    { name: "Support Page", short: "4r.sa/help", dest: "myshop.sa/support", clicks: 241, time: t("2 weeks ago", "قبل أسبوعين") },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-elevated overflow-hidden">
      {/* Mini header */}
      <div className="px-5 py-3.5 border-b border-[hsl(var(--navy))]/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[hsl(var(--sky))]" />
          <span className="text-sm font-display font-bold text-[hsl(var(--navy))]">{links.length} {t("Links", "روابط")}</span>
        </div>
        <div className="flex items-center gap-2 bg-[hsl(var(--navy))]/5 rounded-lg px-3 py-1.5">
          <Search size={12} className="text-[hsl(var(--navy))]/40" />
          <span className="text-xs text-[hsl(var(--navy))]/30 font-body">{t("Search...", "ابحث...")}</span>
        </div>
      </div>

      {/* Link rows */}
      <div className="divide-y divide-[hsl(var(--navy))]/6">
        {links.map((link) => (
          <div key={link.short} className="px-5 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--sky))]/10 flex items-center justify-center shrink-0">
                <Link2 size={14} className="text-[hsl(var(--sky))]" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-sm text-[hsl(var(--navy))] truncate">{link.name}</p>
                <p className="text-xs text-[hsl(var(--sky))] font-body flex items-center gap-1">
                  <ExternalLink size={9} /> {link.short}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-end">
                <p className="font-display font-bold text-sm text-[hsl(var(--navy))]">{link.clicks.toLocaleString()}</p>
                <p className="text-[10px] text-[hsl(var(--navy))]/40 font-body">{t("clicks", "ضغطة")}</p>
              </div>
              <span className="text-[10px] text-[hsl(var(--navy))]/35 font-body hidden sm:block">{link.time}</span>
            </div>
          </div>
        ))}
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
    points.map((p, i) => {
      const x = (i / (points.length - 1)) * chartW;
      const y = chartH - (p[key] / max) * chartH;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");

  const dates = ["Jan 5", "Jan 12", "Jan 19", "Jan 26", "Feb 2", "Feb 9", "Feb 16", "Feb 23", "Mar 1"];

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
          { label: t("Total Clicks", "الضغطات"), value: "4,827", color: "hsl(217, 71%, 30%)" },
          { label: t("Unique Visitors", "الزوار"), value: "2,341", color: "hsl(var(--navy))" },
          { label: t("QR Scans", "مسح QR"), value: "892", color: "hsl(25, 95%, 53%)" },
        ].map((s, i) => (
          <div key={s.label} className={`px-5 py-4 ${i < 2 ? "border-e border-[hsl(var(--navy))]/6" : ""}`}>
            <p className="font-display text-xl font-bold text-[hsl(var(--navy))]">{s.value}</p>
            <p className="text-[10px] text-[hsl(var(--navy))]/45 font-body mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className="px-5 py-4 border-b border-[hsl(var(--navy))]/6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-display font-semibold" style={{ color: "hsl(var(--navy))" }}>{t("Clicks Over Time", "الضغطات عبر الوقت")}</p>
          <span className="text-[9px] font-body px-2 py-0.5 rounded-md" style={{ backgroundColor: "hsl(var(--navy) / 0.05)", color: "hsl(var(--navy) / 0.45)" }}>{t("Last 90 days", "آخر 90 يوم")}</span>
        </div>
        <svg viewBox={`-10 -5 ${chartW + 20} ${chartH + 25}`} className="w-full" style={{ height: 120 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <line key={r} x1={0} y1={chartH * r} x2={chartW} y2={chartH * r} stroke="hsl(var(--navy) / 0.06)" strokeWidth={0.5} />
          ))}
          {/* Lines */}
          <path d={toPath("clicks")} fill="none" stroke="hsl(217, 71%, 30%)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={toPath("visitors")} fill="none" stroke="hsl(var(--navy))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={toPath("qr")} fill="none" stroke="hsl(25, 95%, 53%)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* X-axis labels */}
          {dates.filter((_, i) => i % 2 === 0).map((d, i) => (
            <text key={d} x={(i * 2 / (dates.length - 1)) * chartW} y={chartH + 15} textAnchor="middle" fill="hsl(var(--navy) / 0.3)" fontSize={6} fontFamily="var(--font-body)">{d}</text>
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
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[9px] font-body" style={{ color: "hsl(var(--navy) / 0.45)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Countries breakdown */}
      <div className="px-5 py-4 space-y-2.5">
        {countries.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="text-xs font-body text-[hsl(var(--navy))]/70 w-20 shrink-0">{c.name}</span>
            <div className="flex-1 h-1.5 bg-[hsl(var(--navy))]/8 rounded-full overflow-hidden">
              <div className="h-full bg-[hsl(var(--sky))] rounded-full" style={{ width: `${c.pct}%` }} />
            </div>
            <span className="text-xs font-display font-bold text-[hsl(var(--navy))] w-8 text-end">{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────── QR Codes preview ───────── */
export const QRCodesPreview = () => {
  const { t } = useLanguage();
  const qrItems = [
    { name: t("Menu", "القائمة"), scans: 312 },
    { name: t("Booth", "الستاند"), scans: 189 },
    { name: t("Flyer", "الفلاير"), scans: 97 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-elevated overflow-hidden">
      <div className="grid grid-cols-3 gap-0 divide-x divide-[hsl(var(--navy))]/6">
        {qrItems.map((qr) => (
          <div key={qr.name} className="p-4 flex flex-col items-center text-center">
            {/* QR placeholder */}
            <div className="w-full aspect-square bg-[hsl(var(--navy))]/4 rounded-xl flex items-center justify-center mb-3">
              <QrCode className="w-12 h-12 text-[hsl(var(--navy))]/50" />
            </div>
            <p className="font-display font-semibold text-sm text-[hsl(var(--navy))]">{qr.name}</p>
            <p className="text-xs text-[hsl(var(--sky))] font-body mt-0.5">{qr.scans} {t("scans", "مسح")}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────── Custom Domains preview ───────── */
export const DomainsPreview = () => {
  const { t } = useLanguage();
  const domains = [
    { name: "go.mybrand.sa", status: "verified" as const },
    { name: "link.agency.sa", status: "verified" as const },
    { name: "r.newstore.sa", status: "pending" as const },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 shadow-elevated overflow-hidden divide-y divide-[hsl(var(--navy))]/6">
      {domains.map((d) => (
        <div key={d.name} className="px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.status === "verified" ? "bg-[hsl(var(--sky))]/10" : "bg-[hsl(var(--navy))]/5"}`}>
              <Globe size={14} className={d.status === "verified" ? "text-[hsl(var(--sky))]" : "text-[hsl(var(--navy))]/40"} />
            </div>
            <span className="font-display font-semibold text-sm text-[hsl(var(--navy))]">{d.name}</span>
          </div>
          {d.status === "verified" ? (
            <span className="flex items-center gap-1 text-[10px] font-body text-[hsl(var(--sky))] bg-[hsl(var(--sky))]/10 px-2.5 py-1 rounded-full">
              <CheckCircle size={10} /> {t("Verified", "مُثبت")}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-body text-[hsl(var(--navy))]/45 bg-[hsl(var(--navy))]/5 px-2.5 py-1 rounded-full">
              <Clock size={10} /> {t("Pending", "قيد الانتظار")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
