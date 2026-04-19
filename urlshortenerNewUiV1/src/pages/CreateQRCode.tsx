import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, QrCode, Palette, Maximize, Download, ChevronDown, Link2, Search } from "lucide-react";
import amplitudeService from "@/services/amplitude";
import { myLinksService, qrCodeService } from "@/services/jwtService";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";

const CreateQRCode = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Link picker state
  const [allLinks, setAllLinks] = useState<any[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedLink, setSelectedLink] = useState<any>(null);

  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [label, setLabel] = useState("");
  const [size, setSize] = useState("512");
  const [format, setFormat] = useState("png");
  const [fgColor, setFgColor] = useState("#1a2744");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"shortening" | "generating" | null>(null);
  const [error, setError] = useState("");

  // Fetch all user links on mount
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await myLinksService.getAll({ limit: 100 });
        const links = res?.data?.urls ?? [];
        setAllLinks(links);

        // If urlId param is present, pre-select that link
        const urlId = searchParams.get("urlId");
        if (urlId) {
          const match = links.find((l: any) => l._id === urlId);
          if (match) {
            setSelectedLink(match);
            // Build the short URL to encode in the QR
            const code = match.customCode || match.shortCode || "";
            const domain = match.domain || window.location.origin;
            const shortUrl = match.shortUrl || `${domain.startsWith("http") ? domain : `https://${domain}`}/${code}`;
            setUrl(shortUrl);
            setLabel(match.title || "");
          }
        }
      } catch {
        // silently fail — user can still type manually
      } finally {
        setLinksLoading(false);
      }
    };
    fetchLinks();
  }, []);

  // Close picker on outside click or Escape
  useEffect(() => {
    if (!pickerOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPickerOpen(false); };
    const handleClick = (e: MouseEvent) => {
      const picker = document.getElementById("link-picker-root");
      if (picker && !picker.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [pickerOpen]);

  const filteredLinks = allLinks.filter((l) => {
    if (!pickerSearch) return true;
    const q = pickerSearch.toLowerCase();
    return (
      (l.title || "").toLowerCase().includes(q) ||
      (l.shortCode || "").toLowerCase().includes(q) ||
      (l.originalUrl || "").toLowerCase().includes(q)
    );
  });

  const handleSelectLink = (link: any) => {
    setSelectedLink(link);
    const code = link.customCode || link.shortCode || "";
    const domain = link.domain || window.location.origin;
    const shortUrl = link.shortUrl || `${domain.startsWith("http") ? domain : `https://${domain}`}/${code}`;
    setUrl(shortUrl);
    setLabel(link.title || "");
    setPickerOpen(false);
    setPickerSearch("");
  };

  // ── Resolve URL to a link ID ─────────────────────────────────────────────
  // Returns existing link ID if the URL is already a known short link,
  // otherwise creates a new short link and returns its ID.
  const resolveToLinkId = async (inputUrl: string): Promise<{ urlId: string; isNew: boolean; hasExistingQR: boolean }> => {
    const trimmed = inputUrl.trim();

    // 1. If a link was explicitly selected from the picker, use it directly
    if (selectedLink?._id) {
      return {
        urlId: selectedLink._id,
        isNew: false,
        hasExistingQR: !!selectedLink.qrCodeGenerated,
      };
    }

    // 2. Check if the typed URL matches any existing short link
    //    (user may have pasted a short URL like https://snip.sa/abc)
    const existingMatch = allLinks.find((l) => {
      const code = l.customCode || l.shortCode || "";
      const rawDomain = (l.domain || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
      const shortUrl = (l.shortUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
      const trimmedClean = trimmed.replace(/^https?:\/\//, "").replace(/\/$/, "");

      return (
        // Exact short URL match
        shortUrl === trimmedClean ||
        // Domain + code match
        (rawDomain && code && trimmedClean === `${rawDomain}/${code}`) ||
        // Just the code path match (e.g. user typed "snip.sa/abc")
        trimmedClean.endsWith(`/${code}`) ||
        // Original URL match — user pasted the long URL that's already shortened
        l.originalUrl === trimmed
      );
    });

    if (existingMatch) {
      return {
        urlId: existingMatch._id,
        isNew: false,
        hasExistingQR: !!existingMatch.qrCodeGenerated,
      };
    }

    // 3. URL is not yet shortened — create a new short link automatically
    setLoadingStep("shortening");
    const newLink = await myLinksService.create({
      originalUrl: trimmed,
      ...(label.trim() && { title: label.trim() }),
    });
    const urlId = newLink?.data?.url?._id;
    if (!urlId) throw new Error("Failed to create short link");
    return { urlId, isNew: true, hasExistingQR: false };
  };

  const handleCreate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setLoadingStep(null);
    setError("");
    try {
      const { urlId, isNew, hasExistingQR } = await resolveToLinkId(url.trim());

      setLoadingStep("generating");

      const qrPayload = {
        size: parseInt(size),
        format: (format === "jpg" ? "jpeg" : format) as any,
        foregroundColor: fgColor,
        backgroundColor: bgColor,
      };

      // If QR already exists for this link, update it instead of creating a duplicate
      if (hasExistingQR) {
        await qrCodeService.updateCustomization(urlId, qrPayload);
      } else {
        await qrCodeService.generate(urlId, qrPayload);
      }

      amplitudeService.track('QR Code', { autoShortened: isNew, updated: hasExistingQR });
      navigate("/dashboard/qr-codes");
    } catch (err: any) {
      setError(err.message || t("Failed to create QR code", "فشل إنشاء كود QR"));
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  return (
    <DashboardLayout>
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => navigate("/dashboard/qr-codes")}
      >
        <ArrowLeft className="w-4 h-4 me-2" />
        {t("Back to QR Codes", "العودة لأكواد QR")}
      </Button>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Form */}
        <div className="min-w-0">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {t("Create QR Code", "إنشاء كود QR")}
          </h1>
          <p className="text-muted-foreground font-body text-sm mb-8">
            {t(
              "Generate a QR code for any URL or short link",
              "أنشئ كود QR لأي رابط أو رابط مختصر"
            )}
          </p>

          <div className="space-y-6">
            {/* Link picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground">
                <Link2 className="w-3.5 h-3.5" />
                {t("Select from My Links", "اختر من روابطي")}
              </Label>
              <div className="relative" id="link-picker-root">
                <button
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                  className="w-full h-12 px-4 flex items-center justify-between gap-2 border border-input rounded-lg bg-background text-sm font-body hover:bg-muted/50 transition-colors"
                >
                  {selectedLink ? (
                    <div className="flex flex-col items-start min-w-0 text-start">
                      <span className="font-medium text-foreground truncate w-full">
                        {selectedLink.title || selectedLink.shortCode}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate w-full">
                        {selectedLink.originalUrl}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {linksLoading
                        ? t("Loading links...", "جاري تحميل الروابط...")
                        : t("Choose a link (optional)", "اختر رابطاً (اختياري)")}
                    </span>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", pickerOpen && "rotate-180")} />
                </button>

                {pickerOpen && (
                  <div className="absolute top-full start-0 end-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-border">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          placeholder={t("Search links...", "ابحث في الروابط...")}
                          value={pickerSearch}
                          onChange={(e) => setPickerSearch(e.target.value)}
                          className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    {/* Options */}
                    <div className="max-h-56 overflow-y-auto">
                      {filteredLinks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 font-body">
                          {t("No links found", "لا توجد روابط")}
                        </p>
                      ) : (
                        filteredLinks.map((link) => {
                          const code = link.customCode || link.shortCode || "";
                          const domain = link.domain || window.location.origin;
                          const shortUrl = link.shortUrl || `${domain.startsWith("http") ? domain : `https://${domain}`}/${code}`;
                          return (
                            <button
                              key={link._id}
                              type="button"
                              onClick={() => handleSelectLink(link)}
                              className={cn(
                                "w-full flex flex-col items-start px-4 py-3 text-start hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0",
                                selectedLink?._id === link._id && "bg-primary/5"
                              )}
                            >
                              <span className="text-sm font-medium text-foreground truncate w-full">
                                {link.title || code}
                              </span>
                              <span className="text-xs text-primary truncate w-full mt-0.5">
                                {shortUrl}
                              </span>
                              <span className="text-[11px] text-muted-foreground truncate w-full mt-0.5">
                                {link.originalUrl}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* URL — shown as read-only when a link is selected, editable otherwise */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground">
                <QrCode className="w-3.5 h-3.5" />
                {t("Destination URL", "رابط الوجهة")} *
              </Label>
              <Input
                placeholder="https://example.com/your-page"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setSelectedLink(null); }}
                className={cn("h-12", selectedLink && "bg-muted/40 text-muted-foreground")}
                readOnly={!!selectedLink}
                dir="ltr"
              />
              {selectedLink && (
                <p className="text-xs text-muted-foreground font-body truncate" title={selectedLink.originalUrl}>
                  {t("Original URL:", "الرابط الأصلي:")} {selectedLink.originalUrl}
                </p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label className="text-foreground">
                {t("Label (Optional)", "الاسم (اختياري)")}
              </Label>
              <Input
                placeholder={t("e.g. Store promotion", "مثال: عرض المتجر")}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Size & Format */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-foreground">
                  <Maximize className="w-3.5 h-3.5" />
                  {t("Size (px)", "الحجم (بكسل)")}
                </Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256 × 256</SelectItem>
                    <SelectItem value="512">512 × 512</SelectItem>
                    <SelectItem value="1024">1024 × 1024</SelectItem>
                    <SelectItem value="2048">2048 × 2048</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-foreground">
                  <Download className="w-3.5 h-3.5" />
                  {t("Format", "الصيغة")}
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Colors */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-foreground">
                  <Palette className="w-3.5 h-3.5" />
                  {t("Foreground Color", "لون الكود")}
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                  />
                  <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-12 font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-foreground">
                  <Palette className="w-3.5 h-3.5" />
                  {t("Background Color", "لون الخلفية")}
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                  />
                  <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-12 font-mono" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                className="flex-1 h-12 text-base bg-primary text-primary-foreground"
                disabled={!url.trim() || loading}
              >
                <QrCode className="w-4 h-4 me-2" />
                {loading
                  ? loadingStep === "shortening"
                    ? t("Shortening link...", "جاري اختصار الرابط...")
                    : t("Generating QR...", "جاري إنشاء QR...")
                  : t("Create QR Code", "إنشاء كود QR")}
              </Button>
            </div>
            {/* Transparent status hint */}
            {loading && loadingStep === "shortening" && (
              <p className="text-xs text-muted-foreground font-body flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t(
                  "Auto-shortening your URL before generating the QR code...",
                  "جاري اختصار الرابط تلقائياً قبل إنشاء كود QR..."
                )}
              </p>
            )}
            {error && <p className="text-sm text-destructive font-body">{error}</p>}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-background border border-border rounded-xl p-6 h-fit sticky top-24">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4">
            {t("Preview", "معاينة")}
          </h3>
          <div
            className="w-full aspect-square rounded-lg flex items-center justify-center border border-border mb-4"
            style={{ backgroundColor: bgColor }}
          >
            {url.trim() ? (
              <div className="text-center p-4">
                <QRCodeCanvas
                  value={url.trim()}
                  size={200}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="M"
                  className="rounded mx-auto"
                />
                <p className="text-xs text-muted-foreground font-body mt-3">
                  {size} × {size} • {format.toUpperCase()}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground font-body mt-3">
                  {t("Enter a URL to preview", "أدخل رابط للمعاينة")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateQRCode;