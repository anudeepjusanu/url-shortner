import { useState, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRequireEditAccess } from "@/hooks/useRequireEditAccess";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Link2,
  QrCode,
  Tag,
  Globe,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { myLinksService } from "@/services/jwtService";
import amplitudeService from "@/services/amplitude";
import { fireConversion } from "@/lib/conversion";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

type BulkRow = {
  id: string;
  originalUrl: string;
  urlError: string;
  customAlias: string;
  domainId: string;
  generateQR: boolean;
  enableUTM: boolean;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  expanded: boolean;
};

type SubmitResult = {
  row: BulkRow;
  shortUrl?: string;
  error?: string;
};

type DomainOption = {
  id: string;
  domain: string;
  shortUrl: string;
};

const makeRow = (partial: Partial<BulkRow> = {}): BulkRow => ({
  id: crypto.randomUUID(),
  originalUrl: "",
  urlError: "",
  customAlias: "",
  domainId: "",
  generateQR: false,
  enableUTM: false,
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  expanded: false,
  ...partial,
});

// ─── File parsing ─────────────────────────────────────────────────────────────

function normalizeHeader(h: string) {
  return h
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function parseSheetToBulkRows(sheetRows: string[][]): BulkRow[] {
  if (sheetRows.length < 2) return [];
  const headers = sheetRows[0].map((h) => normalizeHeader(String(h || "")));
  const idx = (name: string) => headers.indexOf(name);

  const urlCol =
    idx("destination url") >= 0
      ? idx("destination url")
      : idx("original url") >= 0
        ? idx("original url")
        : 0;

  const col = {
    url: urlCol,
    alias: idx("custom alias"),
    domain: idx("domain"),
    utmSource: idx("utm source"),
    utmMedium: idx("utm medium"),
    utmCampaign: idx("utm campaign"),
    utmTerm: idx("utm term"),
    utmContent: idx("utm content"),
  };

  const result: BulkRow[] = [];
  for (let r = 1; r < Math.min(sheetRows.length, MAX_ROWS + 1); r++) {
    const row = sheetRows[r];
    const url = String(row[col.url] || "").trim();
    if (!url) continue;

    const utmSource =
      col.utmSource >= 0 ? String(row[col.utmSource] || "").trim() : "";
    const utmMedium =
      col.utmMedium >= 0 ? String(row[col.utmMedium] || "").trim() : "";
    const utmCampaign =
      col.utmCampaign >= 0 ? String(row[col.utmCampaign] || "").trim() : "";
    const utmTerm =
      col.utmTerm >= 0 ? String(row[col.utmTerm] || "").trim() : "";
    const utmContent =
      col.utmContent >= 0 ? String(row[col.utmContent] || "").trim() : "";

    result.push(
      makeRow({
        originalUrl: url,
        customAlias: col.alias >= 0 ? String(row[col.alias] || "").trim() : "",
        domainId: col.domain >= 0 ? String(row[col.domain] || "").trim() : "",
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        enableUTM: !!(utmSource || utmMedium || utmCampaign),
      }),
    );
  }
  return result;
}

async function parseFile(file: File): Promise<BulkRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, {
          type: "array",
          cellFormula: false,
          cellHTML: false,
          sheetRows: MAX_ROWS + 1,
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
        });
        resolve(parseSheetToBulkRows(rows));
      } catch (err: any) {
        reject(new Error("Failed to parse file: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Template download ────────────────────────────────────────────────────────

function downloadCsvTemplate() {
  const headers = [
    "Destination URL",
    "Custom Alias",
    "Domain",
    "UTM Source",
    "UTM Medium",
    "UTM Campaign",
    "UTM Term",
    "UTM Content",
  ];
  const sample = [
    [
      "https://example.com/your-long-url",
      "my-link",
      "snip.sa",
      "google",
      "cpc",
      "spring_sale",
      "",
      "",
    ],
    ["https://example.com/another-page", "", "", "", "", "", "", ""],
  ];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...sample].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk-shorten-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── URL validation ───────────────────────────────────────────────────────────

function isValidUrl(url: string) {
  try {
    const p = new URL(url.trim());
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const BulkShorten = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  useRequireEditAccess("/dashboard/links");

  const [rows, setRows] = useState<BulkRow[]>([
    makeRow(),
    makeRow(),
    makeRow(),
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [results, setResults] = useState<SubmitResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    myLinksService
      .getAvailableDomains()
      .then((res: any) => setDomains(res?.data?.domains ?? []))
      .catch(() => {});
  }, []);

  const defaultDomain =
    domains.find((d) => d.id === "base")?.domain || window.location.host;

  const update = (id: string, patch: Partial<BulkRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: string) =>
    setRows((prev) =>
      prev.length === 1 ? prev : prev.filter((r) => r.id !== id),
    );

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  // ─── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
        toast({
          variant: "destructive",
          title: t("Unsupported file format", "صيغة الملف غير مدعومة"),
          description: t(
            "Please upload a CSV, XLSX, or XLS file.",
            "يرجى رفع ملف بصيغة CSV أو XLSX أو XLS.",
          ),
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: t("File too large", "الملف كبير جداً"),
          description: t(
            "Maximum file size is 5 MB.",
            "الحد الأقصى لحجم الملف هو 5 ميغابايت.",
          ),
        });
        return;
      }
      try {
        const parsed = await parseFile(file);
        if (parsed.length === 0) {
          toast({
            variant: "destructive",
            title: t("Empty file", "الملف فارغ"),
            description: t(
              "No data rows found. Make sure your file matches the template format.",
              "لم يُعثر على صفوف بيانات. تأكد أن الملف يتطابق مع تنسيق القالب.",
            ),
          });
          return;
        }
        if (parsed.length > MAX_ROWS) {
          toast({
            variant: "destructive",
            title: t("Too many rows", "عدد صفوف كبير جداً"),
            description: t(
              `Maximum ${MAX_ROWS} URLs per batch.`,
              `الحد الأقصى ${MAX_ROWS} رابط لكل دفعة.`,
            ),
          });
          return;
        }
        const existing = rows.filter((r) => r.originalUrl.trim().length > 0);
        setRows([...existing, ...parsed]);
        toast({
          title: t(
            `Imported ${parsed.length} URL${parsed.length !== 1 ? "s" : ""}`,
            `تم استيراد ${parsed.length} رابط`,
          ),
          description: t(
            "Review and edit rows before shortening.",
            "راجع وعدّل الصفوف قبل الاختصار.",
          ),
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: t("Parse error", "خطأ في المعالجة"),
          description: err.message,
        });
      }
    },
    [rows, toast, t],
  );

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const validCount = rows.filter(
    (r) => r.originalUrl.trim() && isValidUrl(r.originalUrl.trim()),
  ).length;
  const filledCount = rows.filter((r) => r.originalUrl.trim()).length;

  const handleShortenAll = async () => {
    // Validate inline
    let anyError = false;
    const validated = rows.map((r) => {
      if (!r.originalUrl.trim()) return { ...r, urlError: "" };
      if (!isValidUrl(r.originalUrl.trim())) {
        anyError = true;
        return {
          ...r,
          urlError: t(
            "Enter a valid http/https URL",
            "أدخل رابطاً صحيحاً يبدأ بـ http أو https",
          ),
        };
      }
      return { ...r, urlError: "" };
    });
    setRows(validated);

    const toProcess = validated.filter(
      (r) => r.originalUrl.trim() && !r.urlError,
    );
    if (toProcess.length === 0) {
      if (!anyError) {
        toast({
          variant: "destructive",
          title: t("No URLs entered", "لا توجد روابط"),
          description: t(
            "Add at least one valid URL to continue.",
            "أضف رابطاً صحيحاً واحداً على الأقل للمتابعة.",
          ),
        });
      }
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    const allResults: SubmitResult[] = [];

    for (let i = 0; i < toProcess.length; i++) {
      const row = toProcess[i];
      try {
        const body: Parameters<typeof myLinksService.create>[0] = {
          originalUrl: row.originalUrl.trim(),
        };
        if (row.customAlias.trim()) body.customCode = row.customAlias.trim();
        if (row.domainId) body.domainId = row.domainId;
        if (
          row.enableUTM &&
          (row.utmSource || row.utmMedium || row.utmCampaign)
        ) {
          const utmParams: Record<string, string> = {};
          if (row.utmSource) utmParams.utm_source = row.utmSource;
          if (row.utmMedium) utmParams.utm_medium = row.utmMedium;
          if (row.utmCampaign) utmParams.utm_campaign = row.utmCampaign;
          if (row.utmTerm) utmParams.utm_term = row.utmTerm;
          if (row.utmContent) utmParams.utm_content = row.utmContent;
          body.utmParams = utmParams;
        }

        const res: any = await myLinksService.create(body);
        const created = res?.data?.url ?? res?.data;
        allResults.push({
          row,
          shortUrl: created?.shortUrl ?? created?.shortCode ?? "—",
        });
      } catch (err: any) {
        // Extract detailed error message from validation errors if available
        let errorMessage = err.message || t("Failed", "فشل");

        // Check if there are validation errors with more specific messages
        if (err.validationErrors && Array.isArray(err.validationErrors)) {
          errorMessage = err.validationErrors
            .map((e: any) => e.message)
            .join("; ");
        }

        allResults.push({ row, error: errorMessage });
      }
      setProcessedCount(i + 1);
    }

    setIsProcessing(false);
    setResults(allResults);

    const succeeded = allResults.filter((r) => !r.error).length;
    const failed = allResults.filter((r) => r.error).length;

    if (succeeded > 0) {
      try {
        amplitudeService.trackBulkLinksCreated(succeeded);
      } catch {}
      fireConversion("bulk_shorten", { count: succeeded });
    }

    toast({
      title: t("Batch complete", "اكتملت الدفعة"),
      description: t(
        `${succeeded} created, ${failed} failed.`,
        `${succeeded} تم إنشاؤه، ${failed} فشل.`,
      ),
    });
  };

  const handleReset = () => {
    setRows([makeRow(), makeRow(), makeRow()]);
    setResults(null);
    setProcessedCount(0);
  };

  // ─── Results view ────────────────────────────────────────────────────────────

  if (results) {
    const succeeded = results.filter((r) => !r.error);
    const failed = results.filter((r) => r.error);

    return (
      <DashboardLayout>
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate("/dashboard/links")}
        >
          <ArrowLeft className="w-4 h-4 me-2" />
          {t("Back My Links", "العودة لروابطي")}
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {t("Batch Complete", "اكتملت الدفعة")}
            </h1>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border p-4 bg-background">
              <p className="text-xs text-muted-foreground mb-1">
                {t("Total", "المجموع")}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {results.length}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 bg-emerald-50 dark:bg-emerald-950/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                {t("Created", "تم الإنشاء")}
              </p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {succeeded.length}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl border p-4",
                failed.length > 0
                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
                  : "border-border bg-background",
              )}
            >
              <p
                className={cn(
                  "text-xs mb-1",
                  failed.length > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground",
                )}
              >
                {t("Failed", "فشل")}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  failed.length > 0
                    ? "text-red-700 dark:text-red-300"
                    : "text-foreground",
                )}
              >
                {failed.length}
              </p>
            </div>
          </div>

          {/* Succeeded list */}
          {succeeded.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-medium text-foreground">
                  {t("Created Links", "الروابط المنشأة")}
                </p>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium w-8">
                        #
                      </th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                        {t("Short URL", "الرابط المختصر")}
                      </th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium min-w-[200px]">
                        {t("Original URL", "الرابط الأصلي")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {succeeded.map((r, i) => (
                      <tr
                        key={r.row.id}
                        className="border-t border-border hover:bg-muted/20"
                      >
                        <td className="px-3 py-2 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2">
                          <a
                            href={r.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {r.shortUrl}
                          </a>
                        </td>
                        <td className="px-3 py-2 max-w-[240px]">
                          <span className="block truncate text-muted-foreground">
                            {r.row.originalUrl}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed list */}
          {failed.length > 0 && (
            <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-red-50/60 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {t("Failed Rows", "الصفوف الفاشلة")}
                </p>
              </div>
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-red-50/80 dark:bg-red-950/30">
                    <tr>
                      <th className="px-3 py-2 text-left text-red-600 dark:text-red-400 font-medium min-w-[200px]">
                        {t("URL", "الرابط")}
                      </th>
                      <th className="px-3 py-2 text-left text-red-600 dark:text-red-400 font-medium">
                        {t("Error", "الخطأ")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {failed.map((r, i) => (
                      <tr
                        key={i}
                        className="border-t border-red-100 dark:border-red-900/40"
                      >
                        <td className="px-3 py-2 max-w-[240px]">
                          <span className="block truncate">
                            {r.row.originalUrl}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400">
                          {r.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              {t("New Batch", "دفعة جديدة")}
            </Button>
            <Button
              onClick={() => navigate("/dashboard/links")}
              className="gap-2"
            >
              {t("View My Links", "عرض روابطي")}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Main form view ──────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => navigate("/dashboard/links")}
      >
        <ArrowLeft className="w-4 h-4 me-2" />
        {t("Back My Links", "العودة لروابطي")}
      </Button>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("Bulk Shorten Links", "اختصار روابط بالجملة")}
          </h1>
        </div>
        <p className="text-muted-foreground font-body mb-8">
          {t(
            "Add multiple URLs and shorten them all at once. Expand any item to add advanced options.",
            "أضف عدة روابط واختصرها دفعة واحدة. وسّع أي عنصر لإضافة خيارات متقدمة.",
          )}
        </p>

        {/* File upload drop zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDragging) setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (e.currentTarget === e.target) setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "mb-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              isDragging
                ? "bg-primary text-primary-foreground"
                : "bg-background text-primary border border-border",
            )}
          >
            <Upload className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-foreground">
              {isDragging
                ? t("Drop file to import", "أفلت الملف للاستيراد")
                : t(
                    "Drag & drop a spreadsheet here, or click to browse",
                    "اسحب وأفلت ملف هنا، أو اضغط للاختيار",
                  )}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              {t(
                "Supports CSV, XLSX, XLS — optional shortcut for many URLs",
                "يدعم CSV و XLSX و XLS — اختصار اختياري للروابط الكثيرة",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadCsvTemplate();
              toast({ title: t("Template downloaded", "تم تنزيل القالب") });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-body font-medium text-muted-foreground hover:text-foreground hover:bg-background border border-border bg-background/50 shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t("Template", "القالب")}
          </button>
        </label>

        {/* URL rows */}
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="border border-border rounded-xl bg-background overflow-hidden"
            >
              {/* Row header */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-display font-bold text-primary">
                    {idx + 1}
                  </span>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder={t(
                        "https://example.com/your-long-url",
                        "https://example.com/الرابط-الطويل",
                      )}
                      value={row.originalUrl}
                      onChange={(e) =>
                        update(row.id, {
                          originalUrl: e.target.value,
                          urlError: "",
                        })
                      }
                      className={cn(
                        "h-10 border-0 shadow-none focus-visible:ring-0 px-2",
                        row.urlError && "placeholder:text-destructive/50",
                      )}
                      dir="ltr"
                    />
                  </div>
                  {row.urlError && (
                    <p className="text-xs text-destructive px-8 pb-0.5">
                      {row.urlError}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2.5 text-muted-foreground shrink-0"
                  onClick={() => update(row.id, { expanded: !row.expanded })}
                  disabled={isProcessing}
                >
                  {row.expanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 me-1" />
                      <span className="text-xs hidden sm:inline">
                        {t("Less", "أقل")}
                      </span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 me-1" />
                      <span className="text-xs hidden sm:inline">
                        {t("Options", "خيارات")}
                      </span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => remove(row.id)}
                  disabled={rows.length === 1 || isProcessing}
                  aria-label={t("Remove row", "إزالة الصف")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Expanded options — collapsed state preserves values */}
              {row.expanded && (
                <div className="border-t border-border p-5 space-y-5 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Domain */}
                    <div className="space-y-1.5">
                      <Label className="text-foreground text-sm">
                        {t("Domain", "الدومين")}
                      </Label>
                      <Select
                        value={row.domainId || "__default__"}
                        onValueChange={(v) =>
                          update(row.id, {
                            domainId: v === "__default__" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue
                            placeholder={`${defaultDomain} (${t("default", "افتراضي")})`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default__">
                            {defaultDomain} ({t("default", "افتراضي")})
                          </SelectItem>
                          {domains
                            .filter((d) => d.id !== "base")
                            .map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.domain}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom alias */}
                    <div className="space-y-1.5">
                      <Label className="text-foreground text-sm">
                        {t("Custom Alias (Optional)", "اسم مخصص (اختياري)")}
                      </Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted border border-e-0 border-border rounded-s-md text-xs text-muted-foreground font-body whitespace-nowrap">
                          {domains.find((d) => d.id === row.domainId)?.domain ||
                            defaultDomain}
                          /
                        </div>
                        <Input
                          placeholder={t("mycustomlink", "رابطي_المخصص")}
                          value={row.customAlias}
                          onChange={(e) =>
                            update(row.id, { customAlias: e.target.value })
                          }
                          className="h-10 rounded-s-none"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Generate QR Code toggle */}
                  <div className="border border-border rounded-lg p-4 bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-body font-medium text-foreground text-sm">
                          {t("Generate QR Code", "إنشاء كود QR")}
                        </p>
                      </div>
                      <Switch
                        checked={row.generateQR}
                        onCheckedChange={(v) =>
                          update(row.id, { generateQR: v })
                        }
                      />
                    </div>
                  </div>

                  {/* Add UTM Parameters toggle */}
                  <div className="border border-border rounded-lg p-4 bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Tag className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-body font-medium text-foreground text-sm">
                          {t("Add UTM Parameters", "إضافة مُعاملات UTM")}
                        </p>
                      </div>
                      <Switch
                        checked={row.enableUTM}
                        onCheckedChange={(v) =>
                          update(row.id, { enableUTM: v })
                        }
                      />
                    </div>

                    {row.enableUTM && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                        <div className="space-y-1">
                          <Label className="text-foreground text-xs">
                            {t("Source", "المصدر")}
                          </Label>
                          <Input
                            placeholder="google"
                            value={row.utmSource}
                            onChange={(e) =>
                              update(row.id, { utmSource: e.target.value })
                            }
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-foreground text-xs">
                            {t("Medium", "الوسيط")}
                          </Label>
                          <Input
                            placeholder="cpc"
                            value={row.utmMedium}
                            onChange={(e) =>
                              update(row.id, { utmMedium: e.target.value })
                            }
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-foreground text-xs">
                            {t("Campaign", "الحملة")}
                          </Label>
                          <Input
                            placeholder="spring_sale"
                            value={row.utmCampaign}
                            onChange={(e) =>
                              update(row.id, { utmCampaign: e.target.value })
                            }
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-foreground text-xs">
                            {t("Term", "الكلمة")}
                          </Label>
                          <Input
                            placeholder="keyword"
                            value={row.utmTerm}
                            onChange={(e) =>
                              update(row.id, { utmTerm: e.target.value })
                            }
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-foreground text-xs">
                            {t("Content", "المحتوى")}
                          </Label>
                          <Input
                            placeholder="banner_top"
                            value={row.utmContent}
                            onChange={(e) =>
                              update(row.id, { utmContent: e.target.value })
                            }
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Another Link */}
        <button
          type="button"
          onClick={addRow}
          disabled={isProcessing}
          className="mt-4 w-full border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-xl py-4 text-sm font-body font-medium text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {t("Add Another Link", "أضف رابط آخر")}
        </button>

        {/* Custom domain hint */}
        <div className="flex items-center gap-2 mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Globe className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs font-body text-foreground/70">
            {t(
              "Want to use your own brand domain?",
              "تبي تستخدم دومين علامتك التجارية؟",
            )}{" "}
            <Link
              to="/dashboard/domains"
              className="text-primary font-semibold hover:underline"
            >
              {t("Add a custom domain", "أضف دومين مخصص")}
            </Link>
          </p>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-4 p-4 rounded-xl border border-border bg-muted/20 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
            <p className="text-sm font-medium text-foreground">
              {t(
                `Processing ${processedCount} of ${rows.filter((r) => r.originalUrl.trim() && !r.urlError).length}…`,
                `جارٍ معالجة ${processedCount} من ${rows.filter((r) => r.originalUrl.trim() && !r.urlError).length}…`,
              )}
            </p>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3 mt-6 p-4 rounded-xl border border-border bg-background">
          <p className="text-sm font-body text-muted-foreground">
            {t(
              `${validCount} of ${rows.length} ready`,
              `${validCount} من ${rows.length} جاهز`,
            )}
          </p>
          <Button
            className="h-12 px-6 text-base bg-primary text-primary-foreground"
            onClick={handleShortenAll}
            disabled={isProcessing || filledCount === 0}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 me-2" />
            )}
            {t("Shorten All", "اختصر الكل")}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BulkShorten;