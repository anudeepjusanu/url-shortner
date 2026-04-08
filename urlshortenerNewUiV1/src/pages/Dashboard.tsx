import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link2, ArrowRight, Copy, Check, MousePointer, BarChart3, QrCode, ExternalLink, Clock, Loader2 } from "lucide-react";
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

  // Fetch real data from API
  const { data: urlStatsData, isLoading: statsLoading } = useUrlStats();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalyticsDashboard();
  const { data: urlsData, isLoading: urlsLoading } = useUrls();
  const createUrl = useCreateUrl();

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
      const response = await createUrl.mutateAsync({
        originalUrl: longUrl,
      });

      if (response.success && response.data) {
        const shortCode = response.data.shortCode || response.data.customCode;
        const domain = response.data.domain || "snip.sa";
        setShortened(`${domain}/${shortCode}`);
        toast({
          title: t("Success", "نجح"),
          description: t("Link shortened successfully", "تم اختصار الرابط بنجاح"),
        });
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

  // Extract real stats from API
  const urlStats = urlStatsData?.data || {};
  const analyticsStats = analyticsData?.data || {};
  const urls = urlsData?.data?.urls || [];

  const stats = [
    { 
      label: t("Total Links", "إجمالي الروابط"), 
      value: urlStats.totalUrls?.toString() || "0", 
      icon: Link2 
    },
    { 
      label: t("Total Clicks", "إجمالي الضغطات"), 
      value: urlStats.totalClicks?.toString() || "0", 
      icon: MousePointer 
    },
    { 
      label: t("QR Scans", "مسح QR"), 
      value: urlStats.totalQRScans?.toString() || "0", 
      icon: QrCode 
    },
  ];

  // Get recent links from API
  const recentLinks = urls
    .slice(0, 3)
    .map((url: any) => {
      const shortCode = url.customCode || url.shortCode || "";
      const domain = url.domain || "snip.sa";
      const createdAt = new Date(url.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      
      let timeText = "";
      if (diffDays === 0) timeText = t("Today", "اليوم");
      else if (diffDays === 1) timeText = t("Yesterday", "أمس");
      else if (diffDays < 7) timeText = t(`${diffDays} days ago`, `قبل ${diffDays} أيام`);
      else if (diffWeeks === 1) timeText = t("1 week ago", "قبل أسبوع");
      else timeText = t(`${diffWeeks} weeks ago`, `قبل ${diffWeeks} أسابيع`);

      return {
        id: url._id,
        name: url.title || shortCode,
        short: `${domain}/${shortCode}`,
        clicks: url.clickCount || 0,
        time: timeText,
      };
    });

  // Extract geographic data from analytics
  const topCountries = (analyticsStats.topCountries || [])
    .slice(0, 3)
    .map((country: any) => {
      const total = analyticsStats.totalClicks || 1;
      return {
        name: country.country || t("Unknown", "غير معروف"),
        value: country.clicks || 0,
        pct: Math.round((country.clicks / total) * 100),
      };
    });

  const topCities = (analyticsStats.topCities || [])
    .slice(0, 3)
    .map((city: any) => {
      const total = analyticsStats.totalClicks || 1;
      return {
        name: city.city || t("Unknown", "غير معروف"),
        value: city.clicks || 0,
        pct: Math.round((city.clicks / total) * 100),
      };
    });

  // Extract peak hours from analytics
  const peakHours = (analyticsStats.hourlyData || [])
    .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 4)
    .map((hour: any) => {
      const maxClicks = Math.max(...(analyticsStats.hourlyData || []).map((h: any) => h.clicks || 0), 1);
      return {
        label: `${hour.hour}:00`,
        clicks: hour.clicks || 0,
        pct: Math.round((hour.clicks / maxClicks) * 100),
      };
    });

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
          <Button onClick={handleShorten} className="bg-primary text-primary-foreground font-body shrink-0 px-6">
            {t("Shorten", "اختصر")}
            <ArrowRight size={14} className="ms-1.5" />
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
          <div key={stat.label} className="bg-background border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent links + Top countries/cities */}
      <div className="grid lg:grid-cols-[1fr_280px_280px] gap-6">
        {/* Recent links */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-foreground text-sm">
              {t("Recent Links", "آخر الروابط")}
            </h2>
            <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => navigate("/dashboard/links")}>
              {t("View All", "عرض الكل")} →
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentLinks.map((link) => (
              <div key={link.short} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-body font-medium text-foreground">{link.name}</p>
                  <p className="text-xs text-primary font-body flex items-center gap-1 mt-0.5">
                    <ExternalLink size={10} /> {link.short}
                    <button onClick={() => handleCopyLink(link.short)} className="ml-1 text-muted-foreground hover:text-primary transition-colors">
                      {copiedLink === link.short ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-display font-semibold text-foreground">{link.clicks}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{t("clicks", "ضغطات")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display font-semibold text-foreground text-sm">
              {t("Peak Hours", "ساعات الذروة")}
            </h2>
          </div>
          <div className="space-y-3">
            {peakHours.map((h) => (
              <div key={h.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-body text-foreground">{h.label}</span>
                  <span className="text-xs font-body text-muted-foreground">
                    {h.clicks} {t("clicks", "ضغطات")}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${h.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top countries / cities */}
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <button
              className={cn(
                "text-xs font-display font-semibold px-2.5 py-1 rounded-md transition-colors",
                geoTab === "countries" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => setGeoTab("countries")}
            >
              {t("Countries", "الدول")}
            </button>
            <button
              className={cn(
                "text-xs font-display font-semibold px-2.5 py-1 rounded-md transition-colors",
                geoTab === "cities" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => setGeoTab("cities")}
            >
              {t("Cities", "المدن")}
            </button>
          </div>
          <div className="space-y-4">
            {(geoTab === "countries" ? topCountries : topCities).map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-body text-foreground">{c.name}</span>
                  <span className="text-xs font-body text-muted-foreground">{c.pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
