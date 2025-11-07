import { useState, useEffect, useCallback } from "react";
import type { GenerationStatisticsDTO } from "@/types";
import type { Period } from "@/components/dashboard/types";

/**
 * Return type for useGenerationStatistics hook
 */
interface UseGenerationStatisticsReturn {
  /** Current statistics data or null if not loaded */
  statistics: GenerationStatisticsDTO | null;
  /** Loading state */
  loading: boolean;
  /** Error message or null if no error */
  error: string | null;
  /** Current selected period */
  period: Period;
  /** Update the selected period */
  setPeriod: (period: Period) => void;
  /** Manually refetch statistics (e.g., after error) */
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing generation statistics
 *
 * Handles:
 * - Automatic data fetching on mount and period change
 * - Loading and error states
 * - 401 redirect to login
 * - Network error handling
 * - Manual refetch capability
 *
 * @param initialPeriod - Initial period to load (default: 'all')
 * @returns Statistics data, loading state, error, period controls, and refetch function
 *
 * @example
 * ```tsx
 * function DashboardView() {
 *   const { statistics, loading, error, period, setPeriod, refetch } = useGenerationStatistics();
 *
 *   if (loading) return <LoadingState />;
 *   if (error) return <ErrorState message={error} onRetry={refetch} />;
 *   return <StatisticsGrid statistics={statistics} />;
 * }
 * ```
 */
export function useGenerationStatistics(initialPeriod: Period = "all"): UseGenerationStatisticsReturn {
  // State management
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [statistics, setStatistics] = useState<GenerationStatisticsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch statistics from API
   * Handles all error scenarios including network errors, auth errors, and server errors
   */
  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/generations/statistics?period=${period}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        window.location.href = `/login?redirect=/app/dashboard`;
        return;
      }

      // Handle other error status codes
      if (!response.ok) {
        let errorMessage = "Nie udało się pobrać statystyk";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If error response is not JSON, use default message
          if (response.status === 400) {
            errorMessage = "Nieprawidłowe parametry żądania";
          } else if (response.status === 500) {
            errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie później.";
          }
        }

        throw new Error(errorMessage);
      }

      // Parse and validate response
      const data = await response.json();

      // Validate response structure
      if (!data || typeof data.total_generations !== "number") {
        throw new Error("Otrzymano nieprawidłowe dane z serwera");
      }

      setStatistics(data as GenerationStatisticsDTO);
    } catch (err) {
      // Handle network errors and other exceptions
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.");
      } else {
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      }
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  /**
   * Manual refetch function
   * Useful for retry after error or manual refresh
   */
  const refetch = useCallback(async () => {
    await fetchStatistics();
  }, [fetchStatistics]);

  // Initial load on mount
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    period,
    setPeriod,
    refetch,
  };
}
