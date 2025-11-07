import type { GenerationStatisticsDTO } from "@/types";
import type { ReactNode } from "react";

/**
 * Typ reprezentujący okres czasu dla statystyk
 */
export type Period = "week" | "month" | "all";

/**
 * Mapowanie wartości Period na przyjazne etykiety w języku polskim
 */
export const PERIOD_LABELS: Record<Period, string> = {
  week: "Ostatni tydzień",
  month: "Ostatni miesiąc",
  all: "Cały czas",
};

/**
 * Propsy dla komponentu PeriodSelector
 */
export interface PeriodSelectorProps {
  /** Aktualnie wybrany okres */
  value: Period;
  /** Callback wywoływany przy zmianie okresu */
  onChange: (period: Period) => void;
}

/**
 * Propsy dla komponentu ErrorState
 */
export interface ErrorStateProps {
  /** Komunikat błędu do wyświetlenia */
  message: string;
  /** Opcjonalny callback dla przycisku ponowienia próby */
  onRetry?: () => void;
}

/**
 * Propsy dla komponentu StatisticsGrid
 */
export interface StatisticsGridProps {
  /** Dane statystyk do wyświetlenia */
  statistics: GenerationStatisticsDTO;
}

/**
 * Format wartości w karcie statystyki
 */
export type StatisticFormat = "number" | "percentage" | "duration" | "text";

/**
 * Propsy dla komponentu StatisticCard
 */
export interface StatisticCardProps {
  /** Etykieta metryki */
  label: string;
  /** Wartość metryki */
  value: string | number;
  /** Opcjonalny dodatkowy opis */
  description?: string;
  /** Opcjonalna ikona */
  icon?: ReactNode;
  /** Format wartości (domyślnie: 'number') */
  format?: StatisticFormat;
}

/**
 * Definicja pojedynczej metryki do wyświetlenia
 */
export interface StatisticDefinition {
  /** Klucz w obiekcie GenerationStatisticsDTO */
  key: keyof GenerationStatisticsDTO;
  /** Etykieta wyświetlana na karcie */
  label: string;
  /** Opis wyświetlany pod etykietą */
  description?: string;
  /** Format wartości */
  format: StatisticFormat;
  /** Ikona (komponent React) */
  icon?: ReactNode;
}
