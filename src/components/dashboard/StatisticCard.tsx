import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatDuration } from "@/lib/utils/format";
import type { StatisticCardProps } from "./types";

/**
 * StatisticCard Component
 *
 * Displays a single statistic metric in a card format.
 * Automatically formats values based on the specified format type.
 *
 * @param label - Metric label to display
 * @param value - Metric value (string or number)
 * @param description - Optional additional description
 * @param icon - Optional icon component
 * @param format - Value format type (default: 'number')
 *
 * @example
 * ```tsx
 * <StatisticCard
 *   label="Łączna liczba generacji"
 *   value={statistics.total_generations}
 *   format="number"
 *   icon={<Sparkles className="h-5 w-5" />}
 * />
 * ```
 */
export function StatisticCard({ label, value, description, icon, format = "number" }: StatisticCardProps) {
  /**
   * Format value based on type
   * Uses useMemo for performance optimization
   */
  const formattedValue = useMemo(() => {
    switch (format) {
      case "percentage":
        // Values from API are already percentages (0-100), not decimals (0-1)
        // So we format directly without multiplying by 100
        return `${Math.round(Number(value))}%`;

      case "duration":
        return formatDuration(Number(value));

      case "number":
        return formatNumber(Number(value), { decimals: 0 });

      case "text":
      default:
        return String(value);
    }
  }, [value, format]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" aria-label={`${label}: ${formattedValue}`}>
          {formattedValue}
        </div>
        {description && <CardDescription className="mt-1">{description}</CardDescription>}
      </CardContent>
    </Card>
  );
}
