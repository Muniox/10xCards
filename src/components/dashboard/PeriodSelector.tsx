import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIOD_LABELS, type Period, type PeriodSelectorProps } from "./types";

/**
 * PeriodSelector Component
 *
 * Allows user to select a time period for statistics filtering.
 * Uses Shadcn/ui Select component with Polish labels.
 *
 * @param value - Currently selected period
 * @param onChange - Callback when period changes
 *
 * @example
 * ```tsx
 * <PeriodSelector
 *   value={period}
 *   onChange={(newPeriod) => setPeriod(newPeriod)}
 * />
 * ```
 */
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  /**
   * Handle period change with validation
   * Only allows valid Period values
   */
  const handleChange = (newValue: string) => {
    if (["week", "month", "all"].includes(newValue)) {
      onChange(newValue as Period);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="period-selector" className="text-sm font-medium">
        Okres:
      </label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger id="period-selector" className="w-[180px]">
          <SelectValue placeholder="Wybierz okres" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((period) => (
            <SelectItem key={period} value={period}>
              {PERIOD_LABELS[period]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
