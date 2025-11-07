import { BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * EmptyState Component
 *
 * Displayed when user has no generation statistics yet (new user).
 * Includes a call-to-action button to navigate to the generation view.
 *
 * @example
 * ```tsx
 * if (statistics?.total_generations === 0) {
 *   return <EmptyState />;
 * }
 * ```
 */
export function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <BarChart className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight">
            Brak statystyk
          </h3>
          <p className="text-muted-foreground">
            Nie masz jeszcze żadnych wygenerowanych fiszek. Zacznij od wygenerowania pierwszego zestawu, aby zobaczyć swoje statystyki tutaj.
          </p>
        </div>

        {/* CTA Button */}
        <div>
          <Button asChild size="lg">
            <a href="/app/generate">
              Wygeneruj pierwsze fiszki
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
