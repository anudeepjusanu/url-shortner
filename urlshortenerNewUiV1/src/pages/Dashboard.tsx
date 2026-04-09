import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Link2, ArrowRight, Copy, Check, MousePointer,
  BarChart3, QrCode, ExternalLink, Clock, Loader2, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUrlStats, useAnalyticsDashboard, useUrls, useCreateUrl } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [longUrl, setLongUrl] = useState("");
  const [shortened, setShortened] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [geoTab, setGeoTab] = useState<"countries" | "cities">("countries");
  const [isShortening, setIsShortening] = useState(false);

  // ─── API calls ───────────────────────────────────────────────────────────
  const { data: urlStatsData, isLoading: statsLoading } = useUrlStats();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalyticsDashboard({ period: "30d" });
  const { data: urlsData, isLoading: urlsLoading } = useUrls({ limit: 100 });
  const createUrl = useCreateUrl();

  // ─── Normalize API data ───────────────────────────────────────────────────
  // GET /urls/stats → { success, totalLinks, totalClicks, customDomains, data.stats.* }
  const totalLinks   = urlStatsData?.totalLinks   ?? urlStatsData?.data?.stats?.totalUrls  ?? 0;
  const totalClicks  = urlStatsData?.totalClicks  ?? urlStatsData?.data?.stats?.totalClicks ?? 0;

  // GET /analytics/dashboard → { success, data: { overview, chartData, topStats } }
  const overview  = analyticsData?.data?.overview  || {};
  const topStats  = analyticsData?.data?.topStats  || {};
  const chartData = analyticsData?.data?.chartData || {};

  const totalQRScans = overview.totalQRScans ?? 0;

  const stats = [
    { label: t("Total Links", "إجمالي الروابط"),   value: totalLinks.toString(),   icon: Link2 },
    { label: t("Total Clicks", "إجمالي الضغطات"),  value: totalClicks.toString(),  icon: MousePointer },
    { label: t("QR Scans", "مسح QR"),              value: totalQRScans.toString(), icon: QrCode },
  ];

  // Recent links
  const urls = urlsData?.data?.urls || [];
  const recentLinks = urls.slice(0, 3).map((url: any) => {
    const shortCode = url.customCode || url.shortCode || "";
    const domain = url.domain || "snip.sa";
    const diffDays = Math.floor((Date.now() - new Date(url.createdAt).getTime()) / 86_400_000);
    const diffWeeks = Math.floor(diffDays / 7);
    let timeText =
      diffDays === 0 ? t("Today", "اليوم") :
      diffDays === 1 ? t("Yesterday", "أمس") :
      diffDays < 7   ? t(`${diffDays} days ago`, `قبل ${diffDays} أيام`) :
      diffWeeks === 1 ? t("1 week ago", "قبل أسبوع") :
                        t(`${diffWeeks} weeks ago`, `قبل ${diffWeeks} أسابيع`);
    return {
      id: url._id,
      name: url.title || shortCode,
      short: `${domain}/${shortCode}`,
      clicks: url.clickCount || 0,
      time: timeText,
    };
  });

  // Geography — API: topStats.countries = [{ country, countryName, clicks }]
  const totalGeoClicks = overview.totalClicks || 1;

  const topCountries = (topStats.countries || []).slice(0, 3).map((c: any) => ({
    name: c.countryName || c.country || t("Unknown", "غير معروف"),
    value: c.clicks || 0,
    pct: Math.round(((c.clicks || 0) / totalGeoClicks) * 100),
  }));

  const topCities = (topStats.cities || []).slice(0, 3).map((c: any) => ({
    name: c.city || t("Unknown", "غير معروف"),
    value: c.clicks || 0,
    pct: Math.round(((c.clicks || 0) / totalGeoClicks) * 100),
  }));

  // Peak days — dashboard analytics only has clicksByDay (no hourly breakdown)
  const clicksByDay: { date: string; clicks: number }[] = chartData.clicksByDay || [];
  const topDays = [...clicksByDay]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 4);
  const maxDayClicks = Math.max(...topDays.map((d) => d.clicks || 0), 1);
  const peakDays = topDays.map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    clicks: d.clicks || 0,
    pct: Math.round(((d.clicks || 0) / maxDayClicks) * 100),
  }));

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleCopyLink = (short: string) => {
    navigator.clipboard.writeText(`https://${short}`);
    setCopiedLink(short);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleShorten = async () => {
    if (!longUrl.trim()) {
      toast({
        title: t("Error", "خطأ"),
        description: t("Please enter a URL", "الرجاء إدخال رابط"),
        variant: "destructive",
      });
      return;
    }
    setIsShortening(true);
    try {
      const response = await createUrl.mutateAsync({ originalUrl: longUrl });
      if (response.success && response.data) {
        // API returns: { data: { url: { shortCode, customCode, ... }, domain: { fullDomain } } }
        const urlData = response.data.url || response.data;
        const shortCode = urlData.customCode || urlData.shortCode;
        const domain = response.data.domain?.fullDomain || urlData.domain || "snip.sa";
        setShortened(`${domain}/${shortCode}`);
        setLongUrl("");
      }
    } catch (error: any) {
      toast({
        title: t("Error", "خطأ"),
        description: error.message || t("Failed to shorten URL", "فشل اختصار الرابط"),
        variant: "destructive",
      });
    } finally {
      setIsShortening(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${shortened}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = statsLoading || analyticsLoading;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Shorten URL */}
      <div className="bg-background border border-border rounded-xl p-6 mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          {t("Shorten a link", "اختصر رابط")}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 bg-muted border border-border rounded-lg">
            <Link2 size={16} className="text-muted-foreground shrink-0" />
            <input
              type="url"
              placeholder={t("Paste your long URL here...", "الصق رابطك الطويل هنا...")}
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleShorten()}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-3 font-body text-sm"
            />
          </div>
          <Button
            onClick={handleShorten}
            disabled={isShortening}
            className="bg-primary text-primary-foreground font-body shrink-0 px-6"
          >
            {isShortening ? (
              <Loader2 size={14} className="animate-spin me-1.5" />
            ) : (
              <ArrowRight size={14} className="ms-1.5" />
            )}
            {t("Shorten", "اختصر")}
          </Button>
        </div>

        {shortened && (
          <div className="mt-3 p-3 bg-muted border border-border rounded-lg flex items-center justify-between">
            <span className="text-primary font-display font-semibold text-sm">{shortened}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs font-body"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-background border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {isLoading ? "—" : stat.value}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent links + Peak Days + Top Geo */}
      <div className="grid lg:grid-cols-[1fr_280px_280px] gap-6">
        {/* Recent links */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-foreground text-sm">
              {t("Recent Links", "آخر الروابط")}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary text-xs"
              onClick={() => navigate("/dashboard/links")}
            >
              {t("View All", "عرض الكل")} →
            </Button>
          </div>

          {urlsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentLinks.length === 0 ? (
            <div className="text-center py-10">
              <Link2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-body">
                {t("No links yet", "لا توجد روابط بعد")}
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => navigate("/dashboard/create-link")}
              >
                {t("Create your first link", "أنشئ رابطك الأول")}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-body font-medium text-foreground truncate">{link.name}</p>
                    <p className="text-xs text-primary font-body flex items-center gap-1 mt-0.5">
                      <ExternalLink size={10} />
                      <span className="truncate">{link.short}</span>
                      <button
                        onClick={() => handleCopyLink(link.short)}
                        className="ml-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        {copiedLink === link.short ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4 flex items-center gap-3">
                    <div>
                      <p className="text-sm font-display font-semibold text-foreground">{link.clicks}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{t("clicks", "ضغطات")}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground hover:text-primary"
                      onClick={() => navigate(`/dashboard/analytics/${link.id}`)}
                    >
                      <BarChart3 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peak Days (from clicksByDay — no hourly breakdown in dashboard API) */}
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display font-semibold text-foreground text-sm">
              {t("Peak Days", "أبرز الأيام")}
            </h2>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : peakDays.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body text-center py-8">
              {t("No click data yet", "لا توجد بيانات ضغطات بعد")}
            </p>
          ) : (
            <div className="space-y-3">
              {peakDays.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-body text-foreground">{d.label}</span>
                    <span className="text-xs font-body text-muted-foreground">
                      {d.clicks} {t("clicks", "ضغطات")}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top countries / cities */}
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1">
              {(["countries", "cities"] as const).map((tab) => (
                <button
                  key={tab}
                  className={cn(
                    "text-xs font-display font-semibold px-2.5 py-1 rounded-md transition-colors",
                    geoTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => setGeoTab(tab)}
                >
                  {tab === "countries" ? t("Countries", "الدول") : t("Cities", "المدن")}
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (geoTab === "countries" ? topCountries : topCities).length === 0 ? (
            <p className="text-xs text-muted-foreground font-body text-center py-8">
              {t("No geographic data yet", "لا توجد بيانات جغرافية بعد")}
            </p>
          ) : (
            <div className="space-y-4">
              {(geoTab === "countries" ? topCountries : topCities).map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-body text-foreground">{c.name}</span>
                    <span className="text-xs font-body text-muted-foreground">
                      {c.value} ({c.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
