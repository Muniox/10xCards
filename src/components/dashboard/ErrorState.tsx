import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ErrorStateProps } from "./types";

/**
 * ErrorState Component
 *
 * Displays an error message in a user-friendly way with an optional retry button.
 * Uses Shadcn/ui Alert component with destructive variant for error styling.
 *
 * @param message - Error message to display
 * @param onRetry - Optional callback for retry button
 *
 * @example
 * ```tsx
 * if (error) {
 *   return <ErrorState message={error} onRetry={refetch} />;
 * }
 * ```
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wystąpił błąd</AlertTitle>
          <AlertDescription className="mt-2">
            {message}
          </AlertDescription>
        </Alert>

        {onRetry && (
          <div className="mt-4 flex justify-center">
            <Button onClick={onRetry} variant="outline">
              Spróbuj ponownie
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
