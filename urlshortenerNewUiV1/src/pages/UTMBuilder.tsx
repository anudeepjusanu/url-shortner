import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUTM, UTMLink } from "@/contexts/UTMContext";
import { useCreateUrl, useAvailableDomains } from "@/hooks/useApi";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Tag,
  Trash2,
  Link2,
  ArrowUpDown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const UTMBuilder = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { utmLinks, deleteUTMLink } = useUTM();
  const createUrl = useCreateUrl();
  const { data: domainsData } = useAvailableDomains();

  const availableDomains = useMemo(
    () =>
      Array.isArray(domainsData?.data?.domains)
        ? domainsData.data.domains.filter((d: any) => d && d.id && d.fullDomain)
        : [],
    [domainsData]
  );

  const defaultDomainId = useMemo(() => {
    if (availableDomains.length === 0) return "";
    const def = availableDomains.find((d: any) => d.isDefault);
    return def ? def.id : availableDomains[0].id;
  }, [availableDomains]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [shorteningId, setShorteningId] = useState<string | null>(null);

  const label = (link: UTMLink): string => {
    if (link.name) return link.name;
    if (link.utmCampaign) return link.utmCampaign;
    return link.destinationUrl;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = q
      ? utmLinks.filter(
          (l) =>
            label(l).toLowerCase().includes(q) ||
            l.destinationUrl.toLowerCase().includes(q)
        )
      : [...utmLinks];

    result.sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "latest" ? -diff : diff;
    });

    return result;
  }, [utmLinks, search, sort]);

  const handleDelete = (id: string) => {
    deleteUTMLink(id);
    toast.success(t("UTM link deleted", "تم حذف رابط UTM"));
  };

  const handleShorten = async (link: UTMLink) => {
    setShorteningId(link.id);
    try {
      const payload: any = { originalUrl: link.fullTaggedUrl };
      if (link.name) payload.title = link.name;
      if (defaultDomainId) payload.domainId = defaultDomainId;

      const response = await createUrl.mutateAsync(payload);
      if (response.success) {
        deleteUTMLink(link.id);
        navigate("/dashboard/links");
      }
    } catch (error: any) {
      toast.error(error.message || t("Failed to shorten link", "فشل اختصار الرابط"));
    } finally {
      setShorteningId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {t("UTM Builder", "منشئ UTM")}
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              {t("Create and manage tagged URLs for campaign tracking", "أنشئ وأدر روابط موسومة لتتبع الحملات")}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/dashboard/utm-builder/create")}
          className="bg-primary text-primary-foreground shrink-0"
        >
          <Plus className="w-4 h-4 me-2" />
          {t(" New UTM", " UTM جديد")}
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("Search by name or URL…", "ابحث بالاسم أو الرابط...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setSort("latest")}
              className={cn(
                "px-3 py-1.5 text-sm font-body transition-colors",
                sort === "latest"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t("Latest", "الأحدث")}
            </button>
            <button
              onClick={() => setSort("oldest")}
              className={cn(
                "px-3 py-1.5 text-sm font-body transition-colors",
                sort === "oldest"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t("Oldest", "الأقدم")}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-muted-foreground" />
          </div>
          {search.trim() ? (
            <>
              <p className="text-lg font-display font-semibold text-foreground mb-1">
                {t("No results found", "لا توجد نتائج")}
              </p>
              <p className="text-sm text-muted-foreground font-body">
                {t("Try a different search term", "جرّب كلمة بحث مختلفة")}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-display font-semibold text-foreground mb-1">
                {t("No UTM links yet", "لا توجد روابط UTM بعد")}
              </p>
              <p className="text-sm text-muted-foreground font-body mb-4">
                {t("Create your first tagged URL to start tracking campaigns", "أنشئ أول رابط موسوم لبدء تتبع الحملات")}
              </p>
              <Button
                onClick={() => navigate("/dashboard/utm-builder/create")}
                className="bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 me-2" />
                {t("Create UTM Link", "إنشاء رابط UTM")}
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((link) => {
            const isShortening = shorteningId === link.id;
            return (
              <div
                key={link.id}
                className="bg-background border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Left: icon + info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body font-medium text-foreground truncate">
                      {label(link)}
                    </p>
                    <p
                      className="text-xs text-muted-foreground font-mono truncate mt-0.5"
                      dir="ltr"
                      title={link.destinationUrl}
                    >
                      {link.destinationUrl}
                    </p>
                    {/* UTM chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {link.utmSource && (
                        <Badge variant="secondary" className="text-xs font-mono h-5 px-1.5">
                          src: {link.utmSource}
                        </Badge>
                      )}
                      {link.utmMedium && (
                        <Badge variant="secondary" className="text-xs font-mono h-5 px-1.5">
                          med: {link.utmMedium}
                        </Badge>
                      )}
                      {link.utmCampaign && (
                        <Badge variant="secondary" className="text-xs font-mono h-5 px-1.5">
                          cmp: {link.utmCampaign}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={link.fullTaggedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("Open link", "فتح الرابط")}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShorten(link)}
                    disabled={isShortening || !!shorteningId}
                    className="h-8 text-xs gap-1.5"
                  >
                    {isShortening ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Link2 className="w-3 h-3" />
                    )}
                    {t("Shorten", "اختصر")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                    disabled={isShortening}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title={t("Delete", "حذف")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default UTMBuilder;
