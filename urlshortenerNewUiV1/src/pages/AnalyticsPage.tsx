import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, MousePointer, Users, QrCode, ZoomIn, ZoomOut, RotateCcw, CalendarIcon, ChevronDown, Clock, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUrlAnalytics, useAnalyticsDashboard } from "@/hooks/useApi";
import { analyticsService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";
import amplitudeService from "@/services/amplitude";

// ─── Constants ───
const HOUR = 3600_000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

type Granularity = "hourly" | "daily" | "weekly" | "monthly";

// ─── Saudi Arabia Standard Time offset (UTC+3) ───
const SAST_OFFSET_MS = 3 * 3600_000;


const HOUR_WEIGHTS = [1,1,1,1,1,2,3,5,7,8,9,8,7,8,9,8,6,5,4,3,2,2,1,1];
const TOTAL_WEIGHT = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);

// Distribute `total` across 24 hours using the largest-remainder method.
// Unlike Math.round(), this guarantees sum === total and places clicks at the
// correct peak hours even when total is very small (e.g. 1–5 clicks).
function distributeAcrossHours(total: number): number[] {
  if (total === 0) return new Array(24).fill(0);
  const exact = HOUR_WEIGHTS.map(w => (w / TOTAL_WEIGHT) * total);
  const floored = exact.map(Math.floor);
  const remainder = total - floored.reduce((a, b) => a + b, 0);
  exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
    .slice(0, remainder)
    .forEach(({ i }) => floored[i]++);
  return floored;
}

// ─── Build raw hourly timeline from daily seed data ───
// rangeStartMs/rangeEndMs extend the timeline to cover the full selected period,
// ensuring sparse API data (e.g. only days-with-clicks) doesn't shrink the window.
const buildHourlyTimeline = (
  dailyData: { date: string; clicks: number; visitors: number; qrScans: number }[],
  rangeStartMs?: number,
  rangeEndMs?: number,
) => {
  if (!dailyData.length && rangeStartMs === undefined) return [];
  // Normalize keys to local "YYYY-MM-DD" so full ISO timestamps (e.g. "2026-04-20T00:00:00.000Z")
  // from the API match the local-date key generated in the while-loop below.
  const toLocalKey = (raw: string) => {
    const d = new Date(raw);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const dataMap = new Map(dailyData.map(d => [toLocalKey(d.date), d]));

  let start: Date;
  let end: Date;
  if (rangeStartMs !== undefined && rangeEndMs !== undefined) {
    // Use the full filter range so the initial window always covers the whole period
    start = new Date(rangeStartMs);
    end = new Date(rangeEndMs);
  } else if (dailyData.length) {
    start = new Date(dailyData[0].date);
    end = new Date(dailyData[dailyData.length - 1].date);
  } else {
    return [];
  }

  // Normalize to day boundaries using local time (avoids UTC-midnight vs local-midnight mismatch)
  start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
  end   = new Date(end.getFullYear(),   end.getMonth(),   end.getDate(),   23, 0, 0, 0);

  const timeline: { ts: number; clicks: number; visitors: number; qrScans: number }[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    const dd = dataMap.get(key) || { clicks: 0, visitors: 0, qrScans: 0 };
    const clickDist   = distributeAcrossHours(dd.clicks);
    const visitorDist = distributeAcrossHours(dd.visitors);
    const qrDist      = distributeAcrossHours(dd.qrScans);
    for (let h = 0; h < 24; h++) {
      const d = new Date(cur);
      d.setHours(h, 0, 0, 0);
      if (d.getTime() > end.getTime()) break;
      timeline.push({ ts: d.getTime(), clicks: clickDist[h], visitors: visitorDist[h], qrScans: qrDist[h] });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return timeline;
};

// ─── Determine granularity from visible duration ───
function pickGranularity(durationMs: number): Granularity {
  if (durationMs <= 48 * HOUR) return "hourly";
  if (durationMs <= 60 * DAY) return "daily";
  if (durationMs <= 24 * WEEK) return "weekly";
  return "monthly";
}

// ─── ISO week key ───
function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / DAY + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ─── Aggregate timeline into buckets with zero-padding ───
function aggregateTimeline(
  timeline: { ts: number; clicks: number; visitors: number; qrScans: number }[],
  startMs: number,
  endMs: number,
  gran: Granularity,
) {
  const visible = timeline.filter(e => e.ts >= startMs && e.ts <= endMs);

  const keyFn = (ts: number): string => {
    const d = new Date(ts);
    switch (gran) {
      case "hourly": return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}-${String(d.getHours()).padStart(2,"0")}`;
      case "daily": return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      case "weekly": return isoWeekKey(d);
      case "monthly": return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    }
  };

  const map = new Map<string, { clicks: number; visitors: number; qrScans: number }>();
  visible.forEach(e => {
    const k = keyFn(e.ts);
    const cur = map.get(k) || { clicks: 0, visitors: 0, qrScans: 0 };
    cur.clicks += e.clicks;
    cur.visitors += e.visitors;
    cur.qrScans += e.qrScans;
    map.set(k, cur);
  });

  // Generate continuous zero-padded slots
  const slots: { key: string; label: string; fullLabel: string }[] = [];
  const sDate = new Date(startMs);
  const eDate = new Date(endMs);

  if (gran === "hourly") {
    const c = new Date(sDate); c.setMinutes(0,0,0);
    while (c <= eDate) {
      const k = keyFn(c.getTime());
      const lbl = `${String(c.getHours()).padStart(2,"0")}:00`;
      const full = `${c.toLocaleDateString("en-US",{month:"short",day:"numeric"})} ${lbl}`;
      slots.push({ key: k, label: lbl, fullLabel: full });
      c.setTime(c.getTime() + HOUR);
    }
  } else if (gran === "daily") {
    const c = new Date(sDate); c.setHours(0,0,0,0);
    while (c <= eDate) {
      const k = keyFn(c.getTime());
      const lbl = c.toLocaleDateString("en-US",{month:"short",day:"numeric"});
      slots.push({ key: k, label: lbl, fullLabel: lbl });
      c.setDate(c.getDate() + 1);
    }
  } else if (gran === "weekly") {
    const c = new Date(sDate);
    const dow = c.getDay(); c.setDate(c.getDate() - ((dow + 6) % 7)); c.setHours(0,0,0,0);
    while (c <= eDate) {
      const k = isoWeekKey(c);
      const lbl = c.toLocaleDateString("en-US",{month:"short",day:"numeric"});
      slots.push({ key: k, label: lbl, fullLabel: `Week of ${lbl}` });
      c.setDate(c.getDate() + 7);
    }
  } else {
    const c = new Date(sDate.getFullYear(), sDate.getMonth(), 1);
    while (c <= eDate) {
      const k = keyFn(c.getTime());
      const lbl = c.toLocaleDateString("en-US",{month:"short",year:"numeric"});
      slots.push({ key: k, label: lbl, fullLabel: lbl });
      c.setMonth(c.getMonth() + 1);
    }
  }

  return slots.map(s => {
    const d = map.get(s.key) || { clicks: 0, visitors: 0, qrScans: 0 };
    return { label: s.label, fullLabel: s.fullLabel, ...d };
  });
}

type DateFilter = "today" | "7d" | "30d" | "60d" | "90d" | "180d" | "1y" | "custom";

// Nearest backend-supported period for the dashboard endpoint (only accepts fixed values)
const dashboardPeriodMap: Record<DateFilter, string> = {
  today: "24h",
  "7d": "7d",
  "30d": "30d",
  "60d": "90d",
  "90d": "90d",
  "180d": "1y",
  "1y": "1y",
  custom: "1y",
};

// Build stat entries from a list of { name, count } items with percentage
function buildStatList(items: { name: string; value: number }[]) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return items.map(i => ({ name: i.name, value: i.value, pct: Math.round((i.value / total) * 100) }));
}

const AnalyticsPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { linkId } = useParams<{ linkId?: string }>();
  // chartEl is stored in state so that the event-listener effects re-run the
  // first time the chart container actually appears in the DOM (it is inside a
  // {!isLoading && ...} block, so chartContainerRef.current is null on mount).
  const [chartEl, setChartEl] = useState<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWindow = useRef({ start: 0, end: 0 });
  const lastPinchDist = useRef(0);
  const pinchAnchor = useRef(0.5);
  // Always-fresh refs for event handlers — avoids stale closure bugs
  const windowStartRef = useRef(0);
  const windowEndRef = useRef(0);
  const clampWindowRef = useRef<(s: number, e: number) => { start: number; end: number }>(
    (s, e) => ({ start: s, end: e })
  );
  const totalDurationRef = useRef(DAY);

  useEffect(() => {
    amplitudeService.track('Analytics View');
  }, []);

  const [dateFilter, setDateFilter] = useState<DateFilter>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [pickingFrom, setPickingFrom] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dateFilterLabels: Record<DateFilter, string> = {
    today: t("Today", "اليوم"),
    "7d": t("Last 7 days", "آخر 7 أيام"),
    "30d": t("Last 30 days", "آخر 30 يوم"),
    "60d": t("Last 60 days", "آخر 60 يوم"),
    "90d": t("Last 90 days", "آخر 90 يوم"),
    "180d": t("Last 180 days", "آخر 180 يوم"),
    "1y": t("Last year", "آخر سنة"),
    custom: t("Custom", "مخصص"),
  };

  // Build API params.
  // Always include both period (for dashboard endpoint) AND startDate/endDate
  // (for URL-specific endpoint, which supports exact date ranges, and now the
  // dashboard endpoint does too).
  // Full ISO datetime strings are sent so the backend receives exact timestamps,
  // avoiding UTC midnight mismatches on date-only strings.
  // Unique startDate/endDate per filter guarantees a unique React Query cache key.
  const apiParams = useMemo(() => {
    const now = new Date();

    if (dateFilter === "custom" && customFrom && customTo) {
      // Start at 00:00:00.000 of the chosen start day, end at 23:59:59.999 of end day
      const start = new Date(customFrom.getFullYear(), customFrom.getMonth(), customFrom.getDate(), 0, 0, 0, 0);
      const end = new Date(customTo.getFullYear(), customTo.getMonth(), customTo.getDate(), 23, 59, 59, 999);
      return {
        period: "1y",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }

    const daysMap: Record<string, number> = {
      today: 0, "7d": 7, "30d": 30, "60d": 60, "90d": 90, "180d": 180, "1y": 365,
    };
    const days = daysMap[dateFilter] ?? 30;
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    // Always request through end of today so the API returns today's full
    // available data regardless of when the page was loaded.
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    return {
      period: dashboardPeriodMap[dateFilter] || "30d",
      startDate: start.toISOString(),
      endDate: endOfToday.toISOString(),
    };
  }, [dateFilter, customFrom, customTo]);

  // Fetch URL-specific or dashboard analytics
  const urlAnalyticsQuery = useUrlAnalytics(linkId || "", apiParams);
  const dashboardQuery = useAnalyticsDashboard(apiParams);

  const isLoading = linkId ? urlAnalyticsQuery.isLoading : dashboardQuery.isLoading;
  const isError = linkId ? urlAnalyticsQuery.isError : dashboardQuery.isError;
  const apiData = linkId ? urlAnalyticsQuery.data?.data : dashboardQuery.data?.data;

  // ─── Normalize timeSeries from API ───
  const allClicksDataFull = useMemo(() => {
    if (!apiData) return [];

    // Largest-remainder spread of `total` across n days proportional to each
    // day's click share — guarantees sum === total with no rounding loss.
    const spreadByClicks = (
      total: number,
      clickCounts: number[],
    ): number[] => {
      const sumClicks = clickCounts.reduce((a, b) => a + b, 0) || 1;
      const exact = clickCounts.map(c => (c / sumClicks) * total);
      const floored = exact.map(Math.floor);
      const remainder = total - floored.reduce((a, b) => a + b, 0);
      exact
        .map((v, i) => ({ i, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac || a.i - b.i)
        .slice(0, remainder)
        .forEach(({ i }) => floored[i]++);
      return floored;
    };

    if (linkId) {
      // URL-specific analytics: timeSeries = [{ date, clicks, uniqueClicks }]
      const ts: any[] = apiData.timeSeries || [];
      const mapped: { date: string; clicks: number; visitors: number; qrScans: number }[] =
        ts.map((d: any) => ({
          date: d.date,
          clicks: d.clicks || 0,
          visitors: d.uniqueClicks || 0,
          qrScans: 0,
        }));

      if (mapped.length === 0) return mapped;

      const overviewVisitors =
        apiData.overview?.uniqueClicks ||
        apiData.overview?.uniqueVisitors ||
        apiData.overview?.totalUniqueClicks ||
        apiData.overview?.unique_clicks ||
        0;
      const overviewQR =
        apiData.url?.qrScanCount ||
        apiData.overview?.qrScans ||
        apiData.overview?.totalQRScans ||
        apiData.overview?.qr_scans ||
        0;
      const clickCounts      = mapped.map(d => d.clicks);

      // timeSeries often omits uniqueClicks and never includes qrScans per day.
      // Distribute the overview totals proportionally across days so the chart
      // lines for "Unique Visitors" and "QR Scans" actually render.
      const missingVisitors = mapped.every(d => d.visitors === 0) && overviewVisitors > 0;
      const visitorDist = missingVisitors ? spreadByClicks(overviewVisitors, clickCounts) : null;
      const qrDist      = overviewQR > 0  ? spreadByClicks(overviewQR,       clickCounts) : null;

      if (!visitorDist && !qrDist) return mapped;

      return mapped.map((d, i) => ({
        ...d,
        visitors: visitorDist ? visitorDist[i] : d.visitors,
        qrScans:  qrDist      ? qrDist[i]      : d.qrScans,
      }));
    } else {
      // Dashboard analytics: chartData.clicksByDay = [{ date, clicks }]
      const ts: any[] = apiData.chartData?.clicksByDay || [];
      const mapped = ts.map((d: any) => ({
        date: d.date,
        clicks: d.clicks || 0,
        visitors: 0,
        qrScans: 0,
      }));

      if (mapped.length === 0) return mapped;

      const overviewUnique =
        apiData.overview?.periodUniqueClicks ||
        apiData.overview?.uniqueClicks ||
        apiData.overview?.totalUniqueClicks ||
        0;
      const overviewQR =
        apiData.overview?.periodQRScans ||
        apiData.overview?.qrScans ||
        apiData.overview?.totalQRScans ||
        0;
      const clickCounts = mapped.map((d: any) => d.clicks);

      const missingVisitors = mapped.every((d: any) => d.visitors === 0) && overviewUnique > 0;
      const visitorDist = missingVisitors ? spreadByClicks(overviewUnique, clickCounts) : null;
      const qrDist = overviewQR > 0 ? spreadByClicks(overviewQR, clickCounts) : null;

      if (!visitorDist && !qrDist) return mapped;

      return mapped.map((d: any, i: number) => ({
        ...d,
        visitors: visitorDist ? visitorDist[i] : d.visitors,
        qrScans: qrDist ? qrDist[i] : d.qrScans,
      }));
    }
  }, [apiData, linkId]);

  // ─── Normalize topStats ───
  const topStatsData = useMemo(() => {
    if (!apiData?.topStats) {
      return { countries: [], cities: [], devices: [], browsers: [], operatingSystems: [] };
    }
    const ts = apiData.topStats;

    if (linkId) {
      // URL analytics format: { _id: { country, countryName }, count }
      return {
        countries: (ts.countries || []).map((c: any) => ({
          name: c._id?.countryName || c._id?.country || c.countryName || "Unknown",
          value: c.count || c.clicks || 0,
        })),
        cities: (ts.cities || []).map((c: any) => ({
          name: c._id?.city || c.city || "Unknown",
          value: c.count || c.clicks || 0,
        })),
        devices: (ts.devices || []).map((d: any) => ({
          name: d._id || d.type || "Unknown",
          value: d.count || d.clicks || 0,
        })),
        browsers: (ts.browsers || []).map((b: any) => ({
          name: b._id || b.browser || "Unknown",
          value: b.count || b.clicks || 0,
        })),
        operatingSystems: (ts.operatingSystems || []).map((o: any) => ({
          name: o._id || o.os || "Unknown",
          value: o.count || o.clicks || 0,
        })),
      };
    } else {
      // Dashboard format: { countryName, clicks }, { type, clicks }, { browser, clicks }, { os, clicks }
      return {
        countries: (ts.countries || []).map((c: any) => ({
          name: c.countryName || c.country || "Unknown",
          value: c.clicks || 0,
        })),
        cities: (ts.cities || []).map((c: any) => ({
          name: c.city || "Unknown",
          value: c.clicks || 0,
        })),
        devices: (ts.devices || []).map((d: any) => ({
          name: d.type || "Unknown",
          value: d.clicks || 0,
        })),
        browsers: (ts.browsers || []).map((b: any) => ({
          name: b.browser || "Unknown",
          value: b.clicks || 0,
        })),
        operatingSystems: (ts.operatingSystems || []).map((o: any) => ({
          name: o.os || "Unknown",
          value: o.clicks || 0,
        })),
      };
    }
  }, [apiData, linkId]);

  // ─── Determine filtered date range based on filter selection ───
  const { filterStart, filterEnd } = useMemo(() => {
    const now = new Date();
    if (dateFilter === "custom" && customFrom && customTo) {
      return {
        filterStart: new Date(customFrom.getFullYear(), customFrom.getMonth(), customFrom.getDate(), 0, 0, 0).getTime(),
        filterEnd: new Date(customTo.getFullYear(), customTo.getMonth(), customTo.getDate(), 23, 59, 59).getTime(),
      };
    }
    const daysMap: Record<string, number> = { today: 0, "7d": 7, "30d": 30, "60d": 60, "90d": 90, "180d": 180, "1y": 365 };
    const days = daysMap[dateFilter] ?? 30;
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    // Use end-of-today so any timestamp format for today's entry passes the filter.
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    return { filterStart: start.getTime(), filterEnd: endOfToday.getTime() };
  }, [dateFilter, customFrom, customTo]);

  // Filter raw data by selected date range.
  // Compare local date strings ("YYYY-MM-DD") to avoid UTC-midnight vs local-midnight
  // mismatches that occur when the API returns date-only strings (parsed as UTC).
  const filteredClicksData = useMemo(() => {
    const toLocalKey = (ms: number) => {
      const d = new Date(ms);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const startKey = toLocalKey(filterStart);
    const endKey   = toLocalKey(filterEnd);
    return allClicksDataFull.filter(d => {
      const key = toLocalKey(new Date(d.date).getTime());
      return key >= startKey && key <= endKey;
    });
  }, [allClicksDataFull, filterStart, filterEnd]);

  // ─── Normalize overview totals ───
  // Must be declared after filteredClicksData (used in dashboard branch below)
  const overviewTotals = useMemo(() => {
    if (!apiData) return { clicks: 0, visitors: 0, qrScans: 0 };
    if (linkId) {
      // URL-specific analytics: API receives exact startDate/endDate so all
      // overview totals are accurate for the selected period.
      return {
        clicks: apiData.overview?.totalClicks || 0,
        visitors:
          apiData.overview?.uniqueClicks ||
          apiData.overview?.uniqueVisitors ||
          apiData.overview?.totalUniqueClicks ||
          apiData.overview?.unique_clicks ||
          0,
        qrScans:
          apiData.url?.qrScanCount ||
          apiData.overview?.qrScans ||
          apiData.overview?.totalQRScans ||
          apiData.overview?.qr_scans ||
          0,
      };
    } else {
      // Dashboard analytics: the backend now filters all metrics (clicks, unique
      // visitors, QR scans, countries, devices, etc.) by the exact startDate/endDate
      // we sent, so use the period-specific overview fields directly.
      return {
        clicks: apiData.overview?.periodClicks || 0,
        visitors: apiData.overview?.periodUniqueClicks || 0,
        qrScans: apiData.overview?.periodQRScans || 0,
      };
    }
  }, [apiData, linkId]);

  const hourlyTimeline = useMemo(
    () => buildHourlyTimeline(filteredClicksData, filterStart, filterEnd),
    [filteredClicksData, filterStart, filterEnd],
  );
  const timelineStart = hourlyTimeline[0]?.ts ?? filterStart;
  const timelineEnd = hourlyTimeline[hourlyTimeline.length - 1]?.ts ?? filterEnd;
  const totalDuration = Math.max(timelineEnd - timelineStart, DAY);

  const [windowStart, setWindowStart] = useState(timelineStart);
  const [windowEnd, setWindowEnd] = useState(timelineEnd);

  // Reset chart window when filter or data changes
  useEffect(() => {
    setWindowStart(timelineStart);
    setWindowEnd(timelineEnd);
  }, [timelineStart, timelineEnd]);

  const windowDuration = Math.max(windowEnd - windowStart, HOUR);
  const granularity = pickGranularity(windowDuration);

  const chartData = useMemo(
    () => aggregateTimeline(hourlyTimeline, windowStart, windowEnd, granularity),
    [hourlyTimeline, windowStart, windowEnd, granularity]
  );

  const zoomDescription = useMemo(() => {
    if (windowDuration >= totalDuration * 0.9) return t("All data", "كل البيانات");
    const days = Math.round(windowDuration / DAY);
    if (days > 1) return t(`~${days} days`, `~${days} أيام`);
    const hours = Math.round(windowDuration / HOUR);
    return t(`~${hours} hours`, `~${hours} ساعة`);
  }, [windowDuration, totalDuration, t]);

  const granularityLabel = useMemo(() => {
    const labels: Record<Granularity, string> = {
      hourly: t("Hourly", "بالساعة"),
      daily: t("Daily", "يومي"),
      weekly: t("Weekly", "أسبوعي"),
      monthly: t("Monthly", "شهري"),
    };
    return labels[granularity];
  }, [granularity, t]);

  const clampWindow = useCallback((s: number, e: number) => {
    let dur = e - s;
    dur = Math.max(DAY, Math.min(dur, totalDuration));
    const center = (s + e) / 2;
    s = center - dur / 2;
    e = center + dur / 2;
    if (s < timelineStart) { s = timelineStart; e = s + dur; }
    if (e > timelineEnd) { e = timelineEnd; s = e - dur; }
    s = Math.max(timelineStart, s);
    e = Math.min(timelineEnd, e);
    return { start: s, end: e };
  }, [timelineStart, timelineEnd, totalDuration]);

  const handleReset = useCallback(() => {
    setWindowStart(timelineStart);
    setWindowEnd(timelineEnd);
  }, [timelineStart, timelineEnd]);

  const handleZoomOut = useCallback(() => {
    const ws = windowStartRef.current;
    const we = windowEndRef.current;
    const curDur = we - ws;
    const newDur = Math.min(totalDurationRef.current, curDur * 1.5);
    const center = (ws + we) / 2;
    const newStart = center - newDur / 2;
    const newEnd = center + newDur / 2;
    const c = clampWindowRef.current(newStart, newEnd);
    setWindowStart(c.start);
    setWindowEnd(c.end);
  }, []);

  // Keep refs in sync so event handlers always have fresh values
  windowStartRef.current = windowStart;
  windowEndRef.current = windowEnd;
  clampWindowRef.current = clampWindow;
  totalDurationRef.current = totalDuration;

  // Scroll to zoom — re-registers whenever the chart container mounts/unmounts
  useEffect(() => {
    const el = chartEl;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Check if this is a trackpad pan gesture (horizontal scroll or two-finger pan)
      // Trackpad panning typically has smaller deltaY and may have deltaX
      const isTrackpadPan = e.ctrlKey === false && Math.abs(e.deltaX) > 0;
      
      if (isTrackpadPan) {
        // Two-finger trackpad panning
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const ws = windowStartRef.current;
        const we = windowEndRef.current;
        const dur = we - ws;
        // Use deltaX for horizontal panning, deltaY for vertical trackpad movement
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const dtMs = (delta / rect.width) * dur;
        const c = clampWindowRef.current(ws + dtMs, we + dtMs);
        setWindowStart(c.start);
        setWindowEnd(c.end);
      } else {
        // Scroll wheel zoom
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const mouseRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const ws = windowStartRef.current;
        const we = windowEndRef.current;
        const curDur = we - ws;
        const factor = e.deltaY < 0 ? 0.85 : 1.15;
        const newDur = Math.max(DAY, Math.min(totalDurationRef.current, curDur * factor));
        const anchor = ws + curDur * mouseRatio;
        const newStart = anchor - newDur * mouseRatio;
        const newEnd = newStart + newDur;
        const c = clampWindowRef.current(newStart, newEnd);
        setWindowStart(c.start);
        setWindowEnd(c.end);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [chartEl]); // chartEl in deps: runs when container first appears in DOM

  // Pinch to zoom on touch — re-registers whenever the chart container mounts/unmounts
  useEffect(() => {
    const el = chartEl;
    if (!el) return;
    let isTwoFingerTouch = false;
    const getTouchDist = (e: TouchEvent) => {
      const [a, b] = [e.touches[0], e.touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isTwoFingerTouch = true;
        // Cancel any single-finger drag that was in progress to prevent interference
        isDragging.current = false;
        lastPinchDist.current = getTouchDist(e);
        const rect = el.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        pinchAnchor.current = Math.max(0, Math.min(1, (midX - rect.left) / rect.width));
      } else if (e.touches.length === 1) {
        isTwoFingerTouch = false;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isTwoFingerTouch = true;
        const dist = getTouchDist(e);
        const ratio = lastPinchDist.current / dist;
        lastPinchDist.current = dist;
        const ws = windowStartRef.current;
        const we = windowEndRef.current;
        const curDur = we - ws;
        const newDur = Math.max(DAY, Math.min(totalDurationRef.current, curDur * ratio));
        const anchor = ws + curDur * pinchAnchor.current;
        const newStart = anchor - newDur * pinchAnchor.current;
        const newEnd = newStart + newDur;
        const c = clampWindowRef.current(newStart, newEnd);
        setWindowStart(c.start);
        setWindowEnd(c.end);
      } else if (e.touches.length === 1 && isDragging.current) {
        // Prevent page scroll while single-finger chart pan is active
        e.preventDefault();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isTwoFingerTouch = false;
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [chartEl]); // chartEl in deps: runs when container first appears in DOM

  // Drag to pan — re-registers whenever the chart container mounts/unmounts
  useEffect(() => {
    const el = chartEl;
    if (!el) return;
    const onDown = (e: PointerEvent) => {
      // Only handle left mouse button (0) and middle mouse button (1)
      if (e.button !== 0 && e.button !== 1) return;
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWindow.current = { start: windowStartRef.current, end: windowEndRef.current };
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStartX.current;
      const rect = el.getBoundingClientRect();
      const dur = dragStartWindow.current.end - dragStartWindow.current.start;
      const dtMs = (dx / rect.width) * dur;
      const c = clampWindowRef.current(
        dragStartWindow.current.start + dtMs,
        dragStartWindow.current.end + dtMs
      );
      setWindowStart(c.start);
      setWindowEnd(c.end);
    };
    const onUp = () => {
      isDragging.current = false;
      el.style.cursor = "grab";
    };
    // Add auxclick handler for middle mouse button
    const onAuxClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("auxclick", onAuxClick);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("auxclick", onAuxClick);
    };
  }, [chartEl]); // chartEl in deps: runs when container first appears in DOM

  // Compute tick interval to avoid label crowding
  const xTickInterval = useMemo(() => {
    const len = chartData.length;
    const maxTicks = typeof window !== "undefined" && window.innerWidth < 640 ? 5 : 12;
    if (len <= maxTicks) return 0;
    return Math.ceil(len / maxTicks) - 1;
  }, [chartData.length]);

  // Top stat cards
  const topStats = [
    { label: t("Total Clicks", "إجمالي الضغطات"), value: String(overviewTotals.clicks), icon: MousePointer, color: "hsl(217, 71%, 30%)", bg: "hsla(217, 71%, 30%, 0.08)" },
    { label: t("Unique Visitors", "الزوار الفريدين"), value: String(overviewTotals.visitors), icon: Users, color: "hsl(var(--navy))", bg: "hsla(220, 50%, 15%, 0.08)" },
    { label: t("QR Scans", "مسح QR"), value: String(overviewTotals.qrScans), icon: QrCode, color: "hsl(25, 95%, 53%)", bg: "hsla(25, 95%, 53%, 0.08)" },
  ];

  // Devices pie chart — map "mobile"/"desktop" → display names with colors
  const deviceColorMap: Record<string, string> = {
    mobile: "hsl(217, 71%, 30%)",
    desktop: "hsl(25, 95%, 53%)",
    tablet: "hsl(142, 71%, 30%)",
  };
  const devices = useMemo(() => {
    return buildStatList(topStatsData.devices).map(d => ({
      ...d,
      color: deviceColorMap[d.name.toLowerCase()] || "hsl(215, 16%, 47%)",
    }));
  }, [topStatsData.devices]);

  const countries = useMemo(() => buildStatList(topStatsData.countries), [topStatsData.countries]);
  const cities = useMemo(() => buildStatList(topStatsData.cities), [topStatsData.cities]);
  const browsers = useMemo(() => buildStatList(topStatsData.browsers), [topStatsData.browsers]);
  const operatingSystems = useMemo(() => buildStatList(topStatsData.operatingSystems), [topStatsData.operatingSystems]);
  const osTotal = operatingSystems.reduce((sum, os) => sum + os.value, 0) || 1;

  const [geoTab, setGeoTab] = useState<"countries" | "cities">("countries");

  // Peak hours data — top 4 busiest hours in Saudi Arabia Standard Time (UTC+3).
  // For dashboard analytics: use real clicksByHour from the API (same source as Dashboard page)
  // so both views always show identical, consistent data.
  // For URL-specific analytics: fall back to the hourly timeline (no per-hour API data available).
  const peakHoursData = useMemo(() => {
    if (!linkId) {
      // Real hourly data from the dashboard API — hours are in UTC, convert to SAST (+3)
      const clicksByHour: { hour: number; clicks: number }[] = apiData?.chartData?.clicksByHour || [];
      const topHours = [...clicksByHour]
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 4);
      const maxHourClicks = Math.max(...topHours.map((h) => h.clicks || 0), 1);
      return topHours.map((h) => {
        const sastHour = (h.hour + 3) % 24;
        return {
          label: `${String(sastHour).padStart(2, "0")}:00 – ${String((sastHour + 1) % 24).padStart(2, "0")}:00`,
          clicks: h.clicks || 0,
          pct: Math.round(((h.clicks || 0) / maxHourClicks) * 100),
        };
      });
    }

    // URL-specific fallback: aggregate synthesized hourly timeline into SAST buckets
    const hourBuckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, clicks: 0 }));
    hourlyTimeline.forEach(e => {
      // Convert UTC-based timestamp to SAST hour by adding 3 hours before reading UTC hours
      const sastHour = new Date(e.ts + SAST_OFFSET_MS).getUTCHours();
      hourBuckets[sastHour].clicks += e.clicks;
    });
    const sorted = [...hourBuckets].sort((a, b) => b.clicks - a.clicks).slice(0, 4);
    const maxClicks = Math.max(...sorted.map(b => b.clicks), 1);
    return sorted.map(b => ({
      label: `${String(b.hour).padStart(2, "0")}:00 – ${String((b.hour + 1) % 24).padStart(2, "0")}:00`,
      clicks: b.clicks,
      pct: Math.round((b.clicks / maxClicks) * 100),
    }));
  }, [hourlyTimeline, linkId, apiData]);

  // Export handler
  const handleExport = async () => {
    if (!linkId) return;
    setExporting(true);
    try {
      const exportParams: Record<string, string> = {};
      if ("period" in apiParams && apiParams.period) exportParams.period = apiParams.period;
      if ("startDate" in apiParams && apiParams.startDate) exportParams.startDate = apiParams.startDate;
      if ("endDate" in apiParams && apiParams.endDate) exportParams.endDate = apiParams.endDate;

      const blob = await analyticsService.exportCSV(linkId, exportParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${linkId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: t("Export Failed", "فشل التصدير"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Link name for page title
  const linkName = apiData?.url?.title || apiData?.url?.shortCode || null;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">
          {linkName
            ? `${t("Analytics", "التحليلات")} — ${linkName}`
            : t("Analytics", "التحليلات")}
        </h1>
        <div className="flex items-center gap-2">
          {/* Date Filter Dropdown */}
          <Popover open={filterOpen} onOpenChange={(open) => { setFilterOpen(open); if (open) setShowCalendar(false); }}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>
                  {dateFilter === "custom"
                    ? customFrom && customTo
                      ? `${format(customFrom, "MMM d")} – ${format(customTo, "MMM d")}`
                      : customFrom
                        ? `${format(customFrom, "MMM d")} – …`
                        : dateFilterLabels[dateFilter]
                    : dateFilterLabels[dateFilter]}
                </span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("p-0", showCalendar ? "w-auto" : "w-44")} align="end">
              {showCalendar ? (
                <div className="p-2">
                  <div className="flex gap-1 mb-2">
                    <button
                      className={cn(
                        "flex-1 text-xs py-1 rounded-md font-body transition-colors",
                        pickingFrom ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                      onClick={() => setPickingFrom(true)}
                    >
                      {customFrom ? format(customFrom, "MMM d") : t("From", "من")}
                    </button>
                    <button
                      className={cn(
                        "flex-1 text-xs py-1 rounded-md font-body transition-colors",
                        !pickingFrom ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                      onClick={() => setPickingFrom(false)}
                    >
                      {customTo ? format(customTo, "MMM d") : t("To", "إلى")}
                    </button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={pickingFrom ? customFrom : customTo}
                    onSelect={(date) => {
                      if (pickingFrom) {
                        setCustomFrom(date);
                        setPickingFrom(false);
                      } else {
                        setCustomTo(date);
                        if (customFrom && date) {
                          setDateFilter("custom");
                          setFilterOpen(false);
                        }
                      }
                    }}
                    disabled={(date) =>
                      !pickingFrom && customFrom ? date < customFrom : false
                    }
                    className="p-1 pointer-events-auto text-xs [&_table]:text-xs [&_button]:h-7 [&_button]:w-7 [&_th]:w-7 [&_.rdp-caption]:text-sm"
                  />
                  {customFrom && customTo && (
                    <p className="text-xs text-muted-foreground mt-1 font-body text-center">
                      {format(customFrom, "MMM d, yyyy")} – {format(customTo, "MMM d, yyyy")}
                    </p>
                  )}
                  <button
                    className="w-full text-xs text-muted-foreground hover:text-foreground mt-1 py-1 font-body"
                    onClick={() => setShowCalendar(false)}
                  >
                    ← {t("Back to presets", "العودة للخيارات")}
                  </button>
                </div>
              ) : (
                <div className="p-1.5 space-y-0">
                  {(Object.keys(dateFilterLabels) as DateFilter[]).map((key) => (
                    <button
                      key={key}
                      className={cn(
                        "w-full text-start px-2.5 py-1 text-xs rounded-md transition-colors font-body",
                        dateFilter === key ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                      )}
                      onClick={() => {
                        if (key !== "custom") {
                          setDateFilter(key);
                          setFilterOpen(false);
                        } else {
                          setShowCalendar(true);
                          setPickingFrom(true);
                        }
                      }}
                    >
                      {dateFilterLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          {linkId && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 sm:me-2 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 sm:me-2" />
              )}
              {t("Export", "تصدير")}
            </Button>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="text-center py-20">
          <p className="text-sm text-destructive font-body">
            {t("Failed to load analytics. Please try again.", "فشل تحميل التحليلات. حاول مرة أخرى.")}
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Chart + Stats */}
          <div className="bg-background border border-border rounded-xl p-3 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
              <div className="flex items-center gap-2 shrink-0">
                <h2 className="font-display font-semibold text-foreground text-xs sm:text-sm">
                  {t("Engagement Over Time", "التفاعل عبر الوقت")}
                </h2>
                <span className="text-[10px] sm:text-xs font-body text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  {granularityLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  className="text-[10px] sm:text-xs font-body bg-muted/50 text-muted-foreground px-2 py-1 rounded border-none outline-none cursor-pointer"
                  value={
                    windowDuration >= totalDuration * 0.9 ? "all"
                    : Math.abs(windowDuration - DAY) < HOUR * 2 ? "24h"
                    : Math.abs(windowDuration - 5 * DAY) < DAY ? "5d"
                    : Math.abs(windowDuration - 20 * DAY) < DAY ? "20d"
                    : "custom"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "all") { setWindowStart(timelineStart); setWindowEnd(timelineEnd); return; }
                    const durations: Record<string, number> = { "24h": DAY, "5d": 5 * DAY, "20d": 20 * DAY };
                    const newDur = durations[val];
                    if (!newDur) return;
                    const center = (windowStartRef.current + windowEndRef.current) / 2;
                    const newStart = center - newDur / 2;
                    const newEnd = center + newDur / 2;
                    const c = clampWindowRef.current(newStart, newEnd);
                    setWindowStart(c.start);
                    setWindowEnd(c.end);
                  }}
                >
                  <option value="all">{t("All data", "كل البيانات")}</option>
                  <option value="20d">{t("20 days", "20 يوم")}</option>
                  <option value="5d">{t("5 days", "5 أيام")}</option>
                  <option value="24h">{t("24 hours", "24 ساعة")}</option>
                  {windowDuration < totalDuration * 0.9 && Math.abs(windowDuration - DAY) >= HOUR * 2 && Math.abs(windowDuration - 5 * DAY) >= DAY && Math.abs(windowDuration - 20 * DAY) >= DAY && (
                    <option value="custom" disabled>{zoomDescription}</option>
                  )}
                </select>
                {windowDuration < totalDuration * 0.9 && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={handleZoomOut} title={t("Zoom out", "تصغير")}>
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                )}
                {(windowStart > timelineStart || windowEnd < timelineEnd) && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={handleReset} title={t("Reset zoom", "إعادة تعيين التكبير")}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {topStats.map((stat) => (
                <div key={stat.label} className="bg-muted/30 rounded-lg p-2.5 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                      <stat.icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" style={{ color: stat.color }} />
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-body leading-tight">{stat.label}</p>
                  </div>
                  <p className="text-lg sm:text-2xl font-display font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mb-3 font-body">
              <ZoomIn className="w-3 h-3 inline me-1" />
              <span className="hidden sm:inline">{t("Scroll to zoom · Drag to pan", "مرر للتكبير · اسحب للتنقل")}</span>
              <span className="sm:hidden">{t("Pinch to zoom · Drag to pan", "اقرص للتكبير · اسحب للتنقل")}</span>
            </p>

            <div
              ref={(el) => { chartContainerRef.current = el; setChartEl(el); }}
              style={{ cursor: "grab", touchAction: "none" }}
            >
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }}
                    stroke="hsl(214, 32%, 91%)"
                    interval={xTickInterval}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }}
                    stroke="hsl(214, 32%, 91%)"
                    allowDecimals={false}
                    width={30}
                    domain={[0, (max: number) => Math.max(10, Math.ceil(max * 1.1))]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel || ""}
                  />
                  <Line type="monotone" dataKey="clicks" name={t("Clicks", "الضغطات")} stroke="hsl(217, 71%, 30%)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "hsl(217, 71%, 30%)" }} animationDuration={200} />
                  <Line type="monotone" dataKey="visitors" name={t("Unique Visitors", "الزوار الفريدين")} stroke="hsl(var(--navy))" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "hsl(var(--navy))" }} animationDuration={200} />
                  <Line type="monotone" dataKey="qrScans" name={t("QR Scans", "مسح QR")} stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "hsl(25, 95%, 53%)" }} animationDuration={200} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* No data message */}
            {chartData.length === 0 && (
              <p className="text-center text-xs text-muted-foreground font-body py-4">
                {t("No data for this period", "لا توجد بيانات لهذه الفترة")}
              </p>
            )}
          </div>

          {/* Devices + Countries/Cities */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-background border border-border rounded-xl p-3 sm:p-5">
              <h2 className="font-display font-semibold text-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                {t("Devices", "الأجهزة")}
              </h2>
              {devices.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={devices} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value" strokeWidth={0}>
                          {devices.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 mt-2 sm:mt-3">
                    {devices.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[11px] sm:text-sm font-body text-foreground capitalize">{d.name}</span>
                        <span className="text-[11px] sm:text-sm font-display font-semibold text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-body text-center py-6">
                  {t("No data", "لا توجد بيانات")}
                </p>
              )}
            </div>

            <div className="bg-background border border-border rounded-xl p-3 sm:p-5">
              <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
                <button
                  className={cn(
                    "text-xs sm:text-sm font-display font-semibold px-2.5 py-1 rounded-md transition-colors",
                    geoTab === "countries" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => setGeoTab("countries")}
                >
                  {t("Countries", "الدول")}
                </button>
                <button
                  className={cn(
                    "text-xs sm:text-sm font-display font-semibold px-2.5 py-1 rounded-md transition-colors",
                    geoTab === "cities" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => setGeoTab("cities")}
                >
                  {t("Cities", "المدن")}
                </button>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {(geoTab === "countries" ? countries : cities).length > 0 ? (
                  (geoTab === "countries" ? countries : cities).map((c) => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                        <span className="text-xs sm:text-sm font-body text-foreground">{c.name}</span>
                        <span className="text-[10px] sm:text-xs font-body text-muted-foreground">{c.value}</span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground font-body text-center py-6">
                    {t("No data", "لا توجد بيانات")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Peak Hours + Browsers + OS */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div className="bg-background border border-border rounded-xl p-3 sm:p-5">
              <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <h2 className="font-display font-semibold text-foreground text-xs sm:text-sm">
                  {t("Peak Hours", "ساعات الذروة")}
                </h2>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {peakHoursData.map((h) => (
                  <div key={h.label}>
                    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                      <span className="text-xs sm:text-sm font-body text-foreground">{h.label}</span>
                      <span className="text-[10px] sm:text-xs font-body text-muted-foreground">
                        {h.clicks} {t("clicks", "ضغطة")}
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${h.pct}%` }} />
                    </div>
                  </div>
                ))}
                {peakHoursData.every(h => h.clicks === 0) && (
                  <p className="text-xs text-muted-foreground font-body text-center py-2">
                    {t("No data", "لا توجد بيانات")}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-background border border-border rounded-xl p-3 sm:p-5">
              <h2 className="font-display font-semibold text-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                {t("Browsers", "المتصفحات")}
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {browsers.length > 0 ? browsers.map((b) => (
                  <div key={b.name}>
                    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                      <span className="text-xs sm:text-sm font-body text-foreground">{b.name}</span>
                      <span className="text-[10px] sm:text-xs font-body text-muted-foreground">{b.value}</span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground font-body text-center py-6">
                    {t("No data", "لا توجد بيانات")}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-background border border-border rounded-xl p-3 sm:p-5">
              <h2 className="font-display font-semibold text-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                {t("Operating Systems", "أنظمة التشغيل")}
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {operatingSystems.length > 0 ? operatingSystems.map((os) => {
                  const pct = Math.round((os.value / osTotal) * 100);
                  return (
                    <div key={os.name}>
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                        <span className="text-xs sm:text-sm font-body text-foreground">{os.name}</span>
                        <span className="text-[10px] sm:text-xs font-body text-muted-foreground">{os.value}</span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-xs text-muted-foreground font-body text-center py-6">
                    {t("No data", "لا توجد بيانات")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AnalyticsPage;