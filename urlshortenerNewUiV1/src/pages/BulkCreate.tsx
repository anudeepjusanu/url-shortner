import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { myLinksService, BulkCreateEntry } from "@/services/jwtService";
import {
  Upload, Download, FileText, CheckCircle2, XCircle,
  AlertCircle, Loader2, X, Eye, EyeOff, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow extends BulkCreateEntry {
  _rowNum: number;
  _validationError?: string;
}

interface SuccessResult {
  row: number;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  customCode: string | null;
  title: string;
}

interface FailResult {
  row: number;
  originalUrl: string;
  customCode: string;
  title: string;
  error: string;
}

type ProcessState = "idle" | "parsed" | "processing" | "done";

const CHUNK_SIZE = 50;
const MAX_ROWS = 1000;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3015/api";

// ─── CSV / XLSX parser ────────────────────────────────────────────────────────

const EXPECTED_HEADERS = [
  "destination url",
  "custom alias",
  "title",
  "tags",
  "utm source",
  "utm medium",
  "utm campaign",
  "utm term",
  "utm content",
];

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function parseSheetRows(rows: string[][]): ParsedRow[] {
  if (rows.length < 2) return [];
  const rawHeaders = rows[0].map((h) => normalizeHeader(String(h || "")));
  const idx = (name: string) => rawHeaders.indexOf(name);

  const col = {
    url: idx("destination url"),
    alias: idx("custom alias"),
    title: idx("title"),
    tags: idx("tags"),
    utmSource: idx("utm source"),
    utmMedium: idx("utm medium"),
    utmCampaign: idx("utm campaign"),
    utmTerm: idx("utm term"),
    utmContent: idx("utm content"),
  };

  const parsed: ParsedRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const originalUrl = col.url >= 0 ? String(row[col.url] || "").trim() : "";
    if (!originalUrl) continue; // skip blank rows

    const tagsRaw = col.tags >= 0 ? String(row[col.tags] || "").trim() : "";
    const tags = tagsRaw ? tagsRaw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [];

    const utm = {
      source: col.utmSource >= 0 ? String(row[col.utmSource] || "").trim() : "",
      medium: col.utmMedium >= 0 ? String(row[col.utmMedium] || "").trim() : "",
      campaign: col.utmCampaign >= 0 ? String(row[col.utmCampaign] || "").trim() : "",
      term: col.utmTerm >= 0 ? String(row[col.utmTerm] || "").trim() : "",
      content: col.utmContent >= 0 ? String(row[col.utmContent] || "").trim() : "",
    };
    const hasUtm = Object.values(utm).some(Boolean);

    let _validationError: string | undefined;
    if (!originalUrl) {
      _validationError = "Destination URL is required";
    } else if (!/^https?:\/\//i.test(originalUrl)) {
      _validationError = "URL must start with http:// or https://";
    }

    parsed.push({
      _rowNum: r + 1,
      originalUrl,
      customCode: col.alias >= 0 ? String(row[col.alias] || "").trim() || undefined : undefined,
      title: col.title >= 0 ? String(row[col.title] || "").trim() || undefined : undefined,
      tags: tags.length > 0 ? tags : undefined,
      utm: hasUtm ? utm : undefined,
      _validationError,
    });
  }

  return parsed;
}

async function parseFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        resolve(parseSheetRows(rows));
      } catch (err: any) {
        reject(new Error("Failed to parse file: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// ─── CSV export helpers ───────────────────────────────────────────────────────

function escapeCSV(val: string) {
  return `"${String(val || "").replace(/"/g, '""')}"`;
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

const BulkCreate = () => {
  const { toast } = useToast();
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [state, setState] = useState<ProcessState>("idle");

  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const cancelRef = useRef(false);

  // Results
  const [successful, setSuccessful] = useState<SuccessResult[]>([]);
  const [failed, setFailed] = useState<FailResult[]>([]);

  // ─── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      toast({ variant: "destructive", title: "Unsupported file", description: "Please upload a .csv or .xlsx file." });
      return;
    }
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        toast({ variant: "destructive", title: "Empty file", description: "No data rows found in the file." });
        return;
      }
      if (parsed.length > MAX_ROWS) {
        toast({ variant: "destructive", title: "Too many rows", description: `Maximum ${MAX_ROWS} URLs per batch. File has ${parsed.length} rows.` });
        return;
      }
      setFileName(file.name);
      setRows(parsed);
      setState("parsed");
      setShowPreview(true);
      setSuccessful([]);
      setFailed([]);
      setProgress(0);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Parse error", description: err.message });
    }
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  const resetAll = () => {
    setFileName(null);
    setRows([]);
    setState("idle");
    setProgress(0);
    setProgressLabel("");
    setSuccessful([]);
    setFailed([]);
    cancelRef.current = false;
  };

  // ─── Template download ──────────────────────────────────────────────────────

  const downloadTemplate = () => {
    window.open(`${API_BASE}/urls/bulk-create/template`, "_blank");
  };

  // ─── Processing ─────────────────────────────────────────────────────────────

  const validRows = rows.filter((r) => !r._validationError);
  const invalidRows = rows.filter((r) => r._validationError);

  const startProcessing = async () => {
    if (validRows.length === 0) {
      toast({ variant: "destructive", title: "No valid rows", description: "Fix all errors before processing." });
      return;
    }

    cancelRef.current = false;
    setState("processing");
    setProgress(0);
    setSuccessful([]);
    setFailed([]);

    const allSuccessful: SuccessResult[] = [];
    const allFailed: FailResult[] = [
      ...invalidRows.map((r) => ({
        row: r._rowNum,
        originalUrl: r.originalUrl,
        customCode: r.customCode || "",
        title: r.title || "",
        error: r._validationError!,
      })),
    ];

    const chunks: BulkCreateEntry[][] = [];
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      chunks.push(
        validRows.slice(i, i + CHUNK_SIZE).map(({ _rowNum: _r, _validationError: _e, ...entry }) => entry)
      );
    }

    for (let c = 0; c < chunks.length; c++) {
      if (cancelRef.current) break;

      setProgressLabel(`Processing chunk ${c + 1} of ${chunks.length}…`);

      try {
        const res: any = await myLinksService.bulkCreate(chunks[c]);
        const data = res?.data;
        if (data?.successful) allSuccessful.push(...data.successful);
        if (data?.failed) allFailed.push(...data.failed);
      } catch (err: any) {
        // Mark entire chunk as failed
        chunks[c].forEach((entry, idx) => {
          allFailed.push({
            row: validRows[c * CHUNK_SIZE + idx]._rowNum,
            originalUrl: entry.originalUrl,
            customCode: entry.customCode || "",
            title: entry.title || "",
            error: err.message || "Request failed",
          });
        });
      }

      const pct = Math.round(((c + 1) / chunks.length) * 100);
      setProgress(pct);
    }

    setSuccessful(allSuccessful);
    setFailed(allFailed);
    setState("done");

    if (cancelRef.current) {
      toast({ title: "Cancelled", description: `${allSuccessful.length} links were saved before cancellation.` });
    } else {
      toast({
        title: "Batch complete",
        description: `${allSuccessful.length} created, ${allFailed.length} failed.`,
      });
    }
  };

  const cancelProcessing = () => {
    cancelRef.current = true;
    setProgressLabel("Cancelling after current chunk…");
  };

  // ─── Report downloads ───────────────────────────────────────────────────────

  const downloadErrorReport = () => {
    downloadCSV(
      "bulk-error-report.csv",
      ["Row", "Destination URL", "Custom Alias", "Title", "Error Reason"],
      failed.map((f) => [String(f.row), f.originalUrl, f.customCode, f.title, f.error])
    );
  };

  const downloadSuccessReport = () => {
    downloadCSV(
      "bulk-success-report.csv",
      ["Row", "Original URL", "Short URL", "Short Code", "Custom Alias", "Title"],
      successful.map((s) => [String(s.row), s.originalUrl, s.shortUrl, s.shortCode, s.customCode || "", s.title])
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Bulk Link Creation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Upload a CSV or XLSX file to generate multiple branded short links in one batch.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </div>

        {/* Step 1 — Upload */}
        {state === "idle" && (
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40"
            )}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Drag & drop your file here</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports <strong>.csv</strong> and <strong>.xlsx</strong> — up to {MAX_ROWS.toLocaleString()} rows
              </p>
            </div>
            <Button variant="secondary" size="sm" className="pointer-events-none">Browse files</Button>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileChange} />
          </div>
        )}

        {/* Parsed / Processing / Done — file info bar */}
        {state !== "idle" && (
          <div className="flex items-center gap-3 p-3 bg-muted/60 rounded-lg border border-border flex-wrap">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{fileName}</span>
            <span className="text-xs text-muted-foreground">{rows.length} rows parsed</span>
            {state === "parsed" && (
              <Button variant="ghost" size="sm" onClick={resetAll} className="gap-1 text-muted-foreground h-7">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            )}
          </div>
        )}

        {/* Validation summary */}
        {(state === "parsed" || state === "processing") && (
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span><strong>{validRows.length}</strong> valid</span>
            </div>
            {invalidRows.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                <XCircle className="w-4 h-4" />
                <span><strong>{invalidRows.length}</strong> invalid (will be skipped)</span>
              </div>
            )}
          </div>
        )}

        {/* Preview table */}
        {(state === "parsed" || state === "processing") && rows.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
              <p className="text-sm font-medium text-foreground">Preview</p>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)} className="gap-1.5 text-muted-foreground h-7">
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPreview ? "Hide" : "Show"}
              </Button>
            </div>
            {showPreview && (
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium w-10">#</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium min-w-[200px]">Destination URL</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Alias</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Title</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Tags</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row._rowNum}
                        className={cn(
                          "border-t border-border",
                          row._validationError ? "bg-red-50/60 dark:bg-red-950/20" : "hover:bg-muted/30"
                        )}
                      >
                        <td className="px-3 py-2 text-muted-foreground">{row._rowNum}</td>
                        <td className="px-3 py-2 max-w-[280px]">
                          <span className="block truncate text-foreground">{row.originalUrl}</span>
                        </td>
                        <td className="px-3 py-2 text-foreground">{row.customCode || "—"}</td>
                        <td className="px-3 py-2 max-w-[160px]">
                          <span className="block truncate text-foreground">{row.title || "—"}</span>
                        </td>
                        <td className="px-3 py-2 text-foreground">{row.tags?.join(", ") || "—"}</td>
                        <td className="px-3 py-2">
                          {row._validationError ? (
                            <span title={row._validationError}>
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            </span>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Action bar — parsed state */}
        {state === "parsed" && (
          <div className="flex gap-3 flex-wrap items-center">
            <Button onClick={startProcessing} disabled={validRows.length === 0} className="gap-2">
              <Upload className="w-4 h-4" />
              Create {validRows.length} Link{validRows.length !== 1 ? "s" : ""}
            </Button>
            <Button variant="outline" onClick={resetAll} className="gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
            {invalidRows.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {invalidRows.length} row(s) with errors will be skipped.
              </p>
            )}
          </div>
        )}

        {/* Processing state */}
        {state === "processing" && (
          <div className="space-y-3 p-5 border border-border rounded-xl bg-muted/20">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
              <p className="text-sm font-medium text-foreground">{progressLabel}</p>
            </div>
            <Progress value={progress} className="h-2.5" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress}% complete</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelProcessing}
                className="h-7 gap-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Done state */}
        {state === "done" && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border p-4 bg-background">
                <p className="text-xs text-muted-foreground mb-1">Total Processed</p>
                <p className="text-2xl font-bold text-foreground">{rows.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 bg-emerald-50 dark:bg-emerald-950/30">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Created</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{successful.length}</p>
              </div>
              <div className={cn(
                "rounded-xl border p-4",
                failed.length > 0
                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
                  : "border-border bg-background"
              )}>
                <p className={cn("text-xs mb-1", failed.length > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>Failed</p>
                <p className={cn("text-2xl font-bold", failed.length > 0 ? "text-red-700 dark:text-red-300" : "text-foreground")}>{failed.length}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              {successful.length > 0 && (
                <Button variant="outline" size="sm" onClick={downloadSuccessReport} className="gap-2">
                  <Download className="w-4 h-4" /> Download Success Report
                </Button>
              )}
              {failed.length > 0 && (
                <Button variant="outline" size="sm" onClick={downloadErrorReport} className="gap-2 text-red-600 border-red-300 hover:bg-red-50">
                  <Download className="w-4 h-4" /> Download Error Report
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={resetAll} className="gap-2 ms-auto">
                <RotateCcw className="w-4 h-4" /> New Batch
              </Button>
            </div>

            {/* Success list */}
            {successful.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-sm font-medium text-foreground">Created Links</p>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/80">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium w-10">#</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Short URL</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium min-w-[200px]">Destination</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {successful.map((s) => (
                        <tr key={s.row} className="border-t border-border hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground">{s.row}</td>
                          <td className="px-3 py-2">
                            <a href={s.shortUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                              {s.shortUrl}
                            </a>
                          </td>
                          <td className="px-3 py-2 max-w-[240px]">
                            <span className="block truncate text-muted-foreground">{s.originalUrl}</span>
                          </td>
                          <td className="px-3 py-2 text-foreground">{s.title || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error list */}
            {failed.length > 0 && (
              <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-red-50/60 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Failed Rows</p>
                </div>
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-red-50/80 dark:bg-red-950/30">
                      <tr>
                        <th className="px-3 py-2 text-left text-red-600 dark:text-red-400 font-medium w-10">#</th>
                        <th className="px-3 py-2 text-left text-red-600 dark:text-red-400 font-medium min-w-[200px]">Destination URL</th>
                        <th className="px-3 py-2 text-left text-red-600 dark:text-red-400 font-medium">Alias</th>
                        <th className="px-3 py-2 text-left text-red-600 dark:text-red-400 font-medium">Error Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failed.map((f, i) => (
                        <tr key={i} className="border-t border-red-100 dark:border-red-900/40">
                          <td className="px-3 py-2 text-muted-foreground">{f.row}</td>
                          <td className="px-3 py-2 max-w-[240px]">
                            <span className="block truncate text-foreground">{f.originalUrl || "—"}</span>
                          </td>
                          <td className="px-3 py-2 text-foreground">{f.customCode || "—"}</td>
                          <td className="px-3 py-2 text-red-600 dark:text-red-400">{f.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BulkCreate;
