import { useState, useCallback } from "react";

/**
 * Stan zwracany przez hook useFetch
 */
interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Opcje dla hooka useFetch
 */
interface UseFetchOptions extends RequestInit {
  // Dodatkowe opcje w przyszłości
}

/**
 * Wynik hooka useFetch
 */
interface UseFetchResult<T> extends UseFetchState<T> {
  execute: (url: string, options?: UseFetchOptions) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook do obsługi fetch requests z zarządzaniem stanem
 *
 * @template T - Typ oczekiwanych danych z odpowiedzi
 * @returns Obiekt zawierający stan (data, loading, error) oraz funkcje execute i reset
 *
 * @example
 * ```tsx
 * // Użycie dla POST request
 * const { data, loading, error, execute } = useFetch<GenerationResultDTO>();
 *
 * const handleGenerate = async () => {
 *   const result = await execute('/api/generations', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ source_text: text })
 *   });
 *   if (result) {
 *     // Obsługa wyniku
 *   }
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Użycie dla GET request
 * const { data, loading, error, execute } = useFetch<FlashcardDTO[]>();
 *
 * useEffect(() => {
 *   execute('/api/flashcards');
 * }, []);
 * ```
 */
export function useFetch<T = unknown>(): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Wykonuje fetch request
   * @param url - URL do zapytania
   * @param options - Opcje fetch (method, headers, body, etc.)
   * @returns Promise z danymi lub null w przypadku błędu
   */
  const execute = useCallback(async (url: string, options?: UseFetchOptions): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);

      // Sprawdź czy odpowiedź jest OK
      if (!response.ok) {
        // Spróbuj sparsować błąd z API
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Jeśli nie udało się sparsować, użyj domyślnego komunikatu
        }
        throw new Error(errorMessage);
      }

      // Sprawdź czy odpowiedź ma zawartość
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Odpowiedź nie jest w formacie JSON");
      }

      const result = await response.json();
      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      setError(errorMessage);
      setData(null);
      setLoading(false);
      return null;
    }
  }, []);

  /**
   * Resetuje stan hooka do wartości początkowych
   */
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
