import { Sparkles, FileText, CheckCircle2, Percent, Clock, Cpu } from "lucide-react";
import { StatisticCard } from "./StatisticCard";
import type { StatisticsGridProps, StatisticDefinition } from "./types";

/**
 * Definitions of statistics to display
 * Maps GenerationStatisticsDTO fields to display configuration
 */
const STATISTICS_DEFINITIONS: StatisticDefinition[] = [
  {
    key: "total_generations",
    label: "Łączna liczba generacji",
    description: "Ile razy użyłeś AI do generowania fiszek",
    format: "number",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    key: "total_generated_flashcards",
    label: "Wygenerowane fiszki",
    description: "Łączna liczba fiszek stworzonych przez AI",
    format: "number",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    key: "total_accepted_flashcards",
    label: "Zaakceptowane fiszki",
    description: "Fiszki, które zaakceptowałeś do nauki",
    format: "number",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    key: "acceptance_rate",
    label: "Współczynnik akceptacji",
    description: "Procent fiszek, które zaakceptowałeś",
    format: "percentage",
    icon: <Percent className="h-4 w-4" />,
  },
  {
    key: "unedited_acceptance_rate",
    label: "Akceptacja bez edycji",
    description: "Procent fiszek zaakceptowanych bez zmian",
    format: "percentage",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    key: "average_generation_duration",
    label: "Średni czas generowania",
    description: "Ile czasu zajmuje wygenerowanie fiszek",
    format: "duration",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    key: "most_used_model",
    label: "Najczęściej używany model",
    description: "Model AI, z którego korzystasz najczęściej",
    format: "text",
    icon: <Cpu className="h-4 w-4" />,
  },
];

/**
 * StatisticsGrid Component
 *
 * Displays a grid of statistic cards with responsive layout.
 * Automatically configures cards based on STATISTICS_DEFINITIONS.
 *
 * Layout:
 * - Mobile (< 640px): 1 column
 * - Tablet (≥ 640px): 2 columns
 * - Desktop (≥ 1024px): 3 columns
 *
 * @param statistics - Statistics data to display
 *
 * @example
 * ```tsx
 * if (statistics && statistics.total_generations > 0) {
 *   return <StatisticsGrid statistics={statistics} />;
 * }
 * ```
 */
export function StatisticsGrid({ statistics }: StatisticsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STATISTICS_DEFINITIONS.map((definition) => {
        const value = statistics[definition.key];

        return (
          <StatisticCard
            key={definition.key}
            label={definition.label}
            value={value}
            description={definition.description}
            icon={definition.icon}
            format={definition.format}
          />
        );
      })}
    </div>
  );
}
