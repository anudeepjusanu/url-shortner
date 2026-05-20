import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type DatePreset = "all" | "today" | "last7" | "last30" | "last90" | "custom";

export interface DateRange {
  fromDate?: Date;
  toDate?: Date;
}

interface DateRangeFilterProps {
  value: DatePreset;
  range: DateRange;
  onChange: (preset: DatePreset, range: DateRange) => void;
  className?: string;
}

const getPresetRange = (preset: DatePreset): DateRange => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return { fromDate: new Date(start), toDate: new Date(end) };
    case "last7": {
      const s = new Date(start);
      s.setDate(s.getDate() - 6);
      return { fromDate: s, toDate: new Date(end) };
    }
    case "last30": {
      const s = new Date(start);
      s.setDate(s.getDate() - 29);
      return { fromDate: s, toDate: new Date(end) };
    }
    case "last90": {
      const s = new Date(start);
      s.setDate(s.getDate() - 89);
      return { fromDate: s, toDate: new Date(end) };
    }
    default:
      return { fromDate: undefined, toDate: undefined };
  }
};

export const formatDateRangeLabel = (
  t: (en: string, ar: string) => string,
  preset: DatePreset,
  range: DateRange
): string => {
  switch (preset) {
    case "today":
      return t("Today", "اليوم");
    case "last7":
      return t("Last 7 Days", "آخر 7 أيام");
    case "last30":
      return t("Last 30 Days", "آخر 30 يوم");
    case "last90":
      return t("Last 90 Days", "آخر 90 يوم");
    case "custom":
      if (range.fromDate && range.toDate) {
        return `${format(range.fromDate, "MMM d")} – ${format(range.toDate, "MMM d, yyyy")}`;
      }
      if (range.fromDate) {
        return `${t("From", "من")} ${format(range.fromDate, "MMM d, yyyy")}`;
      }
      if (range.toDate) {
        return `${t("Until", "حتى")} ${format(range.toDate, "MMM d, yyyy")}`;
      }
      return t("Custom", "مخصص");
    default:
      return t("All time", "كل الأوقات");
  }
};

const DateRangeFilter = ({ value, range, onChange, className }: DateRangeFilterProps) => {
  const { t, isAr } = useLanguage();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickingFrom, setPickingFrom] = useState(true);
  const [dateError, setDateError] = useState("");

  const hasFilter = value !== "all";

  const handlePresetChange = (preset: DatePreset) => {
    setDateError("");
    if (preset === "custom") {
      setPickingFrom(true);
      setCalendarOpen(true);
      onChange(preset, { fromDate: range.fromDate, toDate: range.toDate });
      return;
    }
    const newRange = getPresetRange(preset);
    onChange(preset, newRange);
  };

  const handleFromSelect = (date: Date | undefined) => {
    setDateError("");
    if (!date) {
      setCalendarOpen(false);
      onChange("all", { fromDate: undefined, toDate: undefined });
      return;
    }
    if (range.toDate && date > range.toDate) {
      setDateError(t("Start date cannot be after end date.", "تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية."));
      return;
    }
    onChange("custom", { fromDate: date, toDate: range.toDate });
    setPickingFrom(false);
  };

  const handleToSelect = (date: Date | undefined) => {
    setDateError("");
    if (!date) {
      setCalendarOpen(false);
      return;
    }
    if (range.fromDate && range.fromDate > date) {
      setDateError(t("End date cannot be before start date.", "تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية."));
      return;
    }
    onChange("custom", { fromDate: range.fromDate, toDate: date });
    setCalendarOpen(false);
  };

  const clearFilter = () => {
    setDateError("");
    setCalendarOpen(false);
    setPickingFrom(true);
    onChange("all", { fromDate: undefined, toDate: undefined });
  };

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const triggerLabel = formatDateRangeLabel(t, value, range);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={value} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
        <SelectTrigger
          className={cn(
            "w-full sm:w-auto min-w-[180px] justify-start gap-2 font-body text-sm",
            hasFilter && "border-primary text-primary"
          )}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span className="truncate">{triggerLabel}</span>
        </SelectTrigger>
        <SelectContent align={isAr ? "end" : "start"}>
          <SelectItem value="all">{t("All time", "كل الأوقات")}</SelectItem>
          <SelectItem value="today">{t("Today", "اليوم")}</SelectItem>
          <SelectItem value="last7">{t("Last 7 Days", "آخر 7 أيام")}</SelectItem>
          <SelectItem value="last30">{t("Last 30 Days", "آخر 30 يوم")}</SelectItem>
          <SelectItem value="last90">{t("Last 90 Days", "آخر 90 يوم")}</SelectItem>
          <SelectItem value="custom">{t("Custom", "مخصص")}</SelectItem>
        </SelectContent>
      </Select>

      {value === "custom" && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              {triggerLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align={isAr ? "end" : "start"}>
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant={pickingFrom ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setPickingFrom(true)}
                >
                  {t("From", "من")}
                </Button>
                <Button
                  variant={!pickingFrom ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setPickingFrom(false)}
                >
                  {t("To", "إلى")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 ms-auto text-muted-foreground hover:text-foreground"
                  onClick={clearFilter}
                >
                  <X className="w-3 h-3 me-1" />
                  {t("Clear", "مسح")}
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={pickingFrom ? range.fromDate : range.toDate}
              onSelect={pickingFrom ? handleFromSelect : handleToSelect}
              disabled={(date: Date) => {
                if (date > today) return true;
                if (!pickingFrom && range.fromDate && date < range.fromDate) return true;
                return false;
              }}
              initialFocus
            />
            {dateError && <p className="text-xs text-destructive px-3 pb-3 font-body">{dateError}</p>}
          </PopoverContent>
        </Popover>
      )}

      {hasFilter && (
        <Button variant="ghost" size="sm" className="text-xs h-9 text-muted-foreground hover:text-foreground" onClick={clearFilter}>
          <X className="w-3 h-3 me-1" />
          {t("Clear", "مسح")}
        </Button>
      )}
    </div>
  );
};

export default DateRangeFilter;
