/**
 * Opcje formatowania wartości
 */
export interface FormatOptions {
  /** Liczba miejsc po przecinku */
  decimals?: number;
  /** Separator tysięcy */
  thousandsSeparator?: string;
  /** Separator dziesiętny */
  decimalSeparator?: string;
}

/**
 * Formatuje liczbę z separatorami tysięcy
 * @param value - Wartość do sformatowania
 * @param options - Opcje formatowania
 * @returns Sformatowana wartość jako string
 *
 * @example
 * formatNumber(1234.56) // "1 234,56"
 * formatNumber(1234.56, { decimals: 0 }) // "1 235"
 */
export function formatNumber(value: number, options?: FormatOptions): string {
  const decimals = options?.decimals ?? 2;

  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Konwertuje wartość dziesiętną (0-1) na procenty
 * @param decimal - Wartość dziesiętna (np. 0.75)
 * @param decimals - Liczba miejsc po przecinku (domyślnie: 0)
 * @returns Sformatowana wartość procentowa (np. "75%")
 *
 * @example
 * formatPercentage(0.75) // "75%"
 * formatPercentage(0.7532, 1) // "75,3%"
 */
export function formatPercentage(decimal: number, decimals = 0): string {
  const percentage = decimal * 100;

  if (decimals === 0) {
    return `${Math.round(percentage)}%`;
  }

  return `${percentage.toFixed(decimals).replace(".", ",")}%`;
}

/**
 * Konwertuje milisekundy na sekundy z odpowiednim formatowaniem
 * @param milliseconds - Czas w milisekundach
 * @returns Sformatowany czas w sekundach (np. "2,5s")
 *
 * @example
 * formatDuration(2500) // "2,5s"
 * formatDuration(1234) // "1,2s"
 */
export function formatDuration(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  return `${seconds.toFixed(1).replace(".", ",")}s`;
}
