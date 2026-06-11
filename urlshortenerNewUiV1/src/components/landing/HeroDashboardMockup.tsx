import { Smartphone, Monitor, Tablet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroDashboardMockup = () => {
  const { t, isAr } = useLanguage();
  const clickData = [28, 45, 32, 58, 72, 64, 89, 76, 95, 82, 68, 91];
  const maxVal = Math.max(...clickData);

  const fmtNum = (n: number) =>
    isAr ? n.toLocaleString("ar-EG") : n.toLocaleString("en-US");
  const fmtPct = (n: number) => `${fmtNum(n)}%`;

  return (
    <div className="relative rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <div className="flex-1 mx-8">
          <div className="bg-background border border-border rounded-md px-3 py-1 text-xs text-muted-foreground font-body max-w-xs" dir="ltr">
            dashboard.snip.sa
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: t("Total clicks", "إجمالي النقرات"), value: fmtNum(12847) },
              { label: t("Unique visitors", "زوار فريدون"), value: fmtNum(8293) },
              { label: t("QR scans", "مسح QR"), value: fmtNum(1842) },
            ].map((stat) => (
              <div key={stat.label} className="bg-background border border-border rounded-lg p-2.5 sm:p-4">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-body leading-tight">{stat.label}</p>
                <p className="text-base sm:text-xl font-display font-bold text-foreground mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-background border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-display font-semibold text-foreground">{t("Clicks over time", "النقرات عبر الزمن")}</p>
              <span className="text-xs text-muted-foreground font-body">{t("Last 12 days", "آخر 12 يوماً")}</span>
            </div>
            <div className="relative h-24 w-full">
              {(() => {
                const w = 300;
                const h = 96;
                const pad = 4;
                const n = clickData.length;
                const points = clickData.map((v, i) => {
                  const x = pad + (i * (w - pad * 2)) / (n - 1);
                  const y = h - pad - ((v / maxVal) * (h - pad * 2));
                  return [x, y] as const;
                });
                const linePath = points
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
                  .join(" ");
                const areaPath = `${linePath} L ${points[n - 1][0].toFixed(1)} ${h - pad} L ${points[0][0].toFixed(1)} ${h - pad} Z`;
                return (
                  <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="clicksAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#clicksAreaGrad)" />
                    <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="2.5" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                    ))}
                  </svg>
                );
              })()}
            </div>
          </div>

          {/* Countries, Devices, Top times */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Countries */}
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-xs font-display font-semibold text-foreground mb-3">{t("Top countries", "أعلى الدول")}</p>
              <div className="space-y-2">
                {[
                  { name: t("KSA", "السعودية"), pct: 68 },
                  { name: t("Qatar", "قطر"), pct: 14 },
                  { name: t("UAE", "الإمارات"), pct: 11 },
                  { name: t("Kuwait", "الكويت"), pct: 7 },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="text-[11px] font-body text-muted-foreground flex-1 whitespace-nowrap">{c.name}</span>
                    <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="text-[11px] font-display font-bold text-foreground w-7 text-end">{fmtPct(c.pct)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Devices */}
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-xs font-display font-semibold text-foreground mb-3">{t("Devices", "الأجهزة")}</p>
              <div className="space-y-2">
                {[
                  { name: t("Mobile", "جوال"), pct: 72, Icon: Smartphone },
                  { name: t("Desktop", "حاسوب"), pct: 22, Icon: Monitor },
                  { name: t("Tablet", "لوحي"), pct: 6, Icon: Tablet },
                ].map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <d.Icon size={12} className="text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-body text-muted-foreground flex-1 whitespace-nowrap">{d.name}</span>
                    <div className="w-7 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-[11px] font-display font-bold text-foreground w-7 text-end">{fmtPct(d.pct)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top times */}
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-xs font-display font-semibold text-foreground mb-3">{t("Peak hours", "ساعات الذروة")}</p>
              <div className="space-y-2">
                {[
                  { name: "12:00", pct: 42 },
                  { name: "15:00", pct: 31 },
                  { name: "09:00", pct: 18 },
                  { name: "11:00", pct: 9 },
                ].map((h) => (
                  <div key={h.name} className="flex items-center gap-2">
                    <span className="text-[11px] font-body text-muted-foreground flex-1 whitespace-nowrap" dir="ltr">{h.name}</span>
                    <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${h.pct}%` }} />
                    </div>
                    <span className="text-[11px] font-display font-bold text-foreground w-7 text-end">{fmtPct(h.pct)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroDashboardMockup;
