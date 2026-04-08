import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link2, MousePointer, CalendarDays, Users, Search, Eye, Trash2, ExternalLink, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MockUrl {
  id: string;
  shortCode: string;
  originalUrl: string;
  title: string;
  domain: string;
  creatorName: string;
  creatorEmail: string;
  totalClicks: number;
  uniqueClicks: number;
  status: "active" | "inactive";
  created: string;
  lastUpdated: string;
}

const mockUrls: MockUrl[] = [
  { id: "1", shortCode: "abc123", originalUrl: "https://example.com/very-long-marketing-campaign-page", title: "Marketing Campaign", domain: "4r.sa", creatorName: "Ahmed Al-Saud", creatorEmail: "ahmed@example.com", totalClicks: 142, uniqueClicks: 98, status: "active", created: "2025-02-15", lastUpdated: "2025-03-08" },
  { id: "2", shortCode: "xyz789", originalUrl: "https://store.example.com/products/special-offer", title: "Special Offer", domain: "4r.sa", creatorName: "Sara Mohammed", creatorEmail: "sara@example.com", totalClicks: 87, uniqueClicks: 65, status: "active", created: "2025-02-20", lastUpdated: "2025-03-07" },
  { id: "3", shortCode: "promo1", originalUrl: "https://landing.example.com/summer-sale-2025", title: "Summer Sale", domain: "snip.sa", creatorName: "Omar Hassan", creatorEmail: "omar@example.com", totalClicks: 56, uniqueClicks: 42, status: "active", created: "2025-03-01", lastUpdated: "2025-03-06" },
  { id: "4", shortCode: "survey", originalUrl: "https://forms.example.com/customer-feedback-q1", title: "Customer Survey", domain: "4r.sa", creatorName: "Fatima Ali", creatorEmail: "fatima@example.com", totalClicks: 23, uniqueClicks: 19, status: "inactive", created: "2025-01-10", lastUpdated: "2025-02-15" },
  { id: "5", shortCode: "docs01", originalUrl: "https://docs.example.com/api-reference-v2", title: "API Docs", domain: "4r.sa", creatorName: "Khalid Ibrahim", creatorEmail: "khalid@example.com", totalClicks: 312, uniqueClicks: 201, status: "active", created: "2024-12-01", lastUpdated: "2025-03-08" },
];

const creators = [...new Set(mockUrls.map((u) => u.creatorName))];

const UrlManagement = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [urls, setUrls] = useState(mockUrls);
  const [viewUrl, setViewUrl] = useState<MockUrl | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, u) => sum + u.totalClicks, 0);
  const newUrls30d = urls.filter((u) => {
    const d = new Date(u.created);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30;
  }).length;
  const totalUsers = creators.length;

  const filtered = urls.filter((u) => {
    const matchSearch =
      u.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      u.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
      u.title.toLowerCase().includes(search.toLowerCase());
    const matchCreator = creatorFilter === "all" || u.creatorName === creatorFilter;
    return matchSearch && matchCreator;
  });

  const handleDelete = (id: string) => {
    setUrls((prev) => prev.filter((u) => u.id !== id));
    setDeleteDialog(null);
  };

  const handleToggleStatus = (id: string) => {
    setUrls((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
  };

  const stats = [
    { label: t("Total URLs", "إجمالي الروابط"), value: totalUrls, icon: Link2 },
    { label: t("Total Clicks", "إجمالي الضغطات"), value: totalClicks, icon: MousePointer },
    { label: t("New URLs (30d)", "روابط جديدة (30 يوم)"), value: newUrls30d, icon: CalendarDays },
    { label: t("Total Users", "إجمالي المستخدمين"), value: totalUsers, icon: Users },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground mb-4 sm:mb-6">
        {t("URL Management", "إدارة الروابط")}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-background border border-border rounded-xl p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("Search by short code, URL, or title...", "ابحث بالرمز أو الرابط أو العنوان...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 text-sm"
          />
        </div>
        <Select value={creatorFilter} onValueChange={setCreatorFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder={t("Filter by user", "فلتر بالمستخدم")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Users", "جميع المستخدمين")}</SelectItem>
            {creators.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.map((url) => (
          <div key={url.id} className="bg-background border border-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-display font-semibold text-foreground">{url.title}</p>
                <p className="text-xs text-primary font-body flex items-center gap-1 mt-0.5">
                  <ExternalLink className="w-3 h-3 shrink-0" /> {url.shortCode}
                </p>
              </div>
              <Badge variant={url.status === "active" ? "default" : "secondary"} className="text-[10px] shrink-0">
                {url.status === "active" ? t("Active", "نشط") : t("Inactive", "غير نشط")}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-body truncate mb-2">{url.originalUrl}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-body">
                <span>{url.creatorName}</span>
                <span>{url.totalClicks} {t("clicks", "ضغطات")}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewUrl(url)}>
                  <Eye className="w-3.5 h-3.5 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleStatus(url.id)}>
                  <Power className={`w-3.5 h-3.5 ${url.status === "active" ? "text-orange-500" : "text-green-500"}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteDialog(url.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground font-body text-sm">
            {t("No URLs found.", "لا توجد روابط.")}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-background border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Short Code", "الرمز القصير")}</TableHead>
              <TableHead>{t("Original URL", "الرابط الأصلي")}</TableHead>
              <TableHead>{t("Creator", "المنشئ")}</TableHead>
              <TableHead className="text-center">{t("Clicks", "الضغطات")}</TableHead>
              <TableHead className="text-center">{t("Status", "الحالة")}</TableHead>
              <TableHead>{t("Created", "الإنشاء")}</TableHead>
              <TableHead className="text-center">{t("Actions", "الإجراءات")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((url) => (
              <TableRow key={url.id}>
                <TableCell>
                  <span className="font-display font-semibold text-primary text-sm flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {url.shortCode}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground font-body max-w-[200px] truncate block">
                    {url.originalUrl}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-body text-foreground">{url.creatorName}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-display font-semibold text-foreground">{url.totalClicks}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={url.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {url.status === "active" ? t("Active", "نشط") : t("Inactive", "غير نشط")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground font-body">{url.created}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewUrl(url)}>
                      <Eye className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(url.id)} title={url.status === "active" ? t("Deactivate", "تعطيل") : t("Activate", "تفعيل")}>
                      <Power className={`w-4 h-4 ${url.status === "active" ? "text-orange-500" : "text-green-500"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteDialog(url.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground font-body text-sm">
            {t("No URLs found.", "لا توجد روابط.")}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewUrl} onOpenChange={() => setViewUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Link Details", "تفاصيل الرابط")}</DialogTitle>
          </DialogHeader>
          {viewUrl && (
            <div className="space-y-5 text-sm font-body">
              <div>
                <h4 className="font-display font-semibold text-foreground mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {t("Link Information", "معلومات الرابط")}
                </h4>
                <div className="space-y-1.5 bg-muted/50 rounded-lg p-3">
                  <Row label={t("Short Code", "الرمز القصير")} value={viewUrl.shortCode} />
                  <Row label={t("Original URL", "الرابط الأصلي")} value={viewUrl.originalUrl} truncate />
                  <Row label={t("Title", "العنوان")} value={viewUrl.title} />
                  <Row label={t("Domain", "الدومين")} value={viewUrl.domain} />
                </div>
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {t("Creator Information", "معلومات المنشئ")}
                </h4>
                <div className="space-y-1.5 bg-muted/50 rounded-lg p-3">
                  <Row label={t("Name", "الاسم")} value={viewUrl.creatorName} />
                  <Row label={t("Email", "البريد")} value={viewUrl.creatorEmail} />
                </div>
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {t("Statistics", "الإحصائيات")}
                </h4>
                <div className="space-y-1.5 bg-muted/50 rounded-lg p-3">
                  <Row label={t("Total Clicks", "إجمالي الضغطات")} value={String(viewUrl.totalClicks)} />
                  <Row label={t("Unique Clicks", "ضغطات فريدة")} value={String(viewUrl.uniqueClicks)} />
                  <Row label={t("Status", "الحالة")} value={viewUrl.status === "active" ? t("Active", "نشط") : t("Inactive", "غير نشط")} />
                </div>
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {t("Dates", "التواريخ")}
                </h4>
                <div className="space-y-1.5 bg-muted/50 rounded-lg p-3">
                  <Row label={t("Created", "الإنشاء")} value={viewUrl.created} />
                  <Row label={t("Last Updated", "آخر تحديث")} value={viewUrl.lastUpdated} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete URL", "حذف الرابط")}</DialogTitle>
            <DialogDescription>
              {t("Are you sure you want to delete this URL? This action cannot be undone.", "هل أنت متأكد من حذف هذا الرابط؟ لا يمكن التراجع عن هذا الإجراء.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>{t("Cancel", "إلغاء")}</Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>{t("Delete", "حذف")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const Row = ({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className={`text-foreground font-medium text-right ${truncate ? "truncate max-w-[220px]" : ""}`}>{value}</span>
  </div>
);

export default UrlManagement;