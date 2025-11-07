import { useGenerationStatistics } from "./hooks/useGenerationStatistics";
import { PeriodSelector } from "./dashboard/PeriodSelector";
import { LoadingState } from "./dashboard/LoadingState";
import { ErrorState } from "./dashboard/ErrorState";
import { EmptyState } from "./dashboard/EmptyState";
import { StatisticsGrid } from "./dashboard/StatisticsGrid";

/**
 * DashboardView Component
 *
 * Main interactive component for the Dashboard view.
 * Manages statistics fetching, loading/error states, and orchestrates
 * the display of appropriate subcomponents based on application state.
 *
 * States:
 * - Loading: Shows LoadingState with skeleton loaders
 * - Error: Shows ErrorState with error message and retry button
 * - Empty: Shows EmptyState when user has no generations yet
 * - Data: Shows StatisticsGrid with actual statistics
 *
 * @example
 * ```astro
 * ---
 * // In dashboard.astro
 * import DashboardView from '@/components/DashboardView';
 * ---
 * <DashboardView client:load />
 * ```
 */
export default function DashboardView() {
  // Use custom hook for statistics management
  const { statistics, loading, error, period, setPeriod, refetch } = useGenerationStatistics();

  /**
   * Handle period change from PeriodSelector
   * Automatically triggers data refetch via useEffect in the hook
   */
  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod);
  };

  /**
   * Handle retry after error
   * Calls the refetch function from the hook
   */
  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Przegląd statystyk efektywności generowania fiszek przez AI
          </p>
        </div>

        {/* Period Selector - only show when not loading and not in error/empty state */}
        {!loading && statistics && statistics.total_generations > 0 && (
          <PeriodSelector value={period} onChange={handlePeriodChange} />
        )}
      </div>

      {/* Content Section - Conditional Rendering */}
      <div>
        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Error State */}
        {!loading && error && <ErrorState message={error} onRetry={handleRetry} />}

        {/* Empty State */}
        {!loading && !error && statistics && statistics.total_generations === 0 && <EmptyState />}

        {/* Statistics Grid */}
        {!loading && !error && statistics && statistics.total_generations > 0 && (
          <StatisticsGrid statistics={statistics} />
        )}
      </div>
    </div>
  );
}
