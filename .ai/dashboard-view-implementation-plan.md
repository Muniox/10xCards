# Plan implementacji widoku Dashboard (Panel Główny)

## 1. Przegląd

Widok Dashboard jest głównym panelem użytkownika dostępnym bezpośrednio po zalogowaniu. Jego głównym celem jest prezentacja zagregowanych statystyk dotyczących efektywności generowania fiszek przez AI. Widok pozwala użytkownikowi szybko ocenić wartość płynącą z wykorzystania funkcji generowania AI oraz monitorować swoje postępy w tworzeniu fiszek.

Dashboard wyświetla kluczowe metryki takie jak:
- Łączna liczba przeprowadzonych generacji
- Łączna liczba wygenerowanych fiszek
- Współczynniki akceptacji (ogólny i bez edycji)
- Średni czas generowania
- Najczęściej używany model AI

Użytkownik może filtrować statystyki według okresu czasu (tydzień, miesiąc, wszystkie), co pozwala na analizę trendów i efektywności w różnych przedziałach czasowych.

## 2. Routing widoku

**Ścieżka:** `/app/dashboard`

**Wymagania routingu:**
- Strona wymaga autoryzacji - dostępna tylko dla zalogowanych użytkowników
- Jest to domyślny widok po zalogowaniu (można ustawić przekierowanie z `/app` do `/app/dashboard`)
- Middleware Astro powinien weryfikować sesję użytkownika przed renderowaniem strony
- W przypadku braku autoryzacji następuje przekierowanie do strony logowania

**Struktura plików:**
```
src/pages/app/dashboard.astro
```

## 3. Struktura komponentów

```
DashboardPage (Astro) - src/pages/app/dashboard.astro
└── MainLayout (Astro) - src/layouts/MainLayout.astro
    └── DashboardView (React, client:load) - src/components/DashboardView.tsx
        ├── PeriodSelector (React) - src/components/PeriodSelector.tsx
        │   └── Select (Shadcn/ui) - src/components/ui/select.tsx
        ├── LoadingState (React) - src/components/dashboard/LoadingState.tsx
        │   └── Skeleton (Shadcn/ui) - src/components/ui/skeleton.tsx
        ├── ErrorState (React) - src/components/dashboard/ErrorState.tsx
        │   ├── Alert (Shadcn/ui) - src/components/ui/alert.tsx
        │   └── Button (Shadcn/ui) - src/components/ui/button.tsx
        ├── EmptyState (React) - src/components/dashboard/EmptyState.tsx
        │   └── Button (Shadcn/ui) - src/components/ui/button.tsx
        └── StatisticsGrid (React) - src/components/dashboard/StatisticsGrid.tsx
            └── StatisticCard (React) - src/components/dashboard/StatisticCard.tsx
                └── Card (Shadcn/ui) - src/components/ui/card.tsx
```

## 4. Szczegóły komponentów

### DashboardPage (Astro)

**Opis komponentu:**
Strona Astro służąca jako punkt wejścia dla widoku Dashboard. Odpowiada za weryfikację autoryzacji użytkownika, pobranie sesji z Supabase oraz przekazanie niezbędnych danych do komponentu React.

**Główne elementy:**
- Import i użycie `MainLayout`
- Weryfikacja sesji użytkownika poprzez `Astro.locals.supabase`
- Przekierowanie do `/login` jeśli użytkownik nie jest zalogowany
- Osadzenie komponentu `DashboardView` z dyrektywą `client:load`

**Obsługiwane zdarzenia:**
Brak (komponent statyczny)

**Warunki walidacji:**
- Użytkownik musi być zalogowany (sprawdzenie `Astro.locals.session`)
- Jeśli brak sesji → przekierowanie do `/login`

**Typy:**
- Wykorzystuje `Session` z `@supabase/supabase-js`

**Propsy:**
Brak (strona główna)

---

### DashboardView (React)

**Opis komponentu:**
Główny interaktywny komponent React zarządzający logiką widoku Dashboard. Odpowiedzialny za pobieranie statystyk, zarządzanie stanem ładowania/błędów oraz orchestrację wyświetlania odpowiednich podkomponentów w zależności od stanu aplikacji.

**Główne elementy:**
- Kontener `<div>` z responsywnym layoutem
- Nagłówek sekcji z tytułem i opisem
- `PeriodSelector` - selektor okresu czasu
- Warunkowe renderowanie:
  - `LoadingState` podczas ładowania
  - `ErrorState` w przypadku błędu
  - `EmptyState` gdy brak danych
  - `StatisticsGrid` gdy dane dostępne

**Obsługiwane zdarzenia:**
- Zmiana okresu w `PeriodSelector` → `handlePeriodChange(period: Period)`
- Kliknięcie "Ponów" w `ErrorState` → `handleRetry()`
- Initial load → `useEffect` do pobrania danych

**Warunki walidacji:**
- Jeśli `loading === true` → pokaż `LoadingState`
- Jeśli `error !== null` → pokaż `ErrorState`
- Jeśli `statistics !== null && statistics.total_generations === 0` → pokaż `EmptyState`
- Jeśli `statistics !== null && statistics.total_generations > 0` → pokaż `StatisticsGrid`

**Typy:**
- `GenerationStatisticsDTO` (z `src/types.ts`)
- `Period` = `'week' | 'month' | 'all'`
- Stan wewnętrzny (zobacz sekcja Zarządzanie stanem)

**Propsy:**
Brak - komponent główny

---

### PeriodSelector (React)

**Opis komponentu:**
Komponent umożliwiający wybór okresu czasu dla wyświetlanych statystyk. Wykorzystuje komponent `Select` z Shadcn/ui do prezentacji opcji wyboru.

**Główne elementy:**
- `Select` (Shadcn/ui)
  - `SelectTrigger` z etykietą aktualnego okresu
  - `SelectContent` zawierający `SelectItem` dla każdej opcji:
    - "Ostatni tydzień" (week)
    - "Ostatni miesiąc" (month)
    - "Cały czas" (all)
- Label z opisem funkcji selektora

**Obsługiwane zdarzenia:**
- `onValueChange` - zmiana wybranego okresu
  - Parametr: `value: Period`
  - Akcja: wywołanie `onChange(value)`

**Warunki walidacji:**
- `value` musi być jedną z wartości: `'week' | 'month' | 'all'`

**Typy:**
- `PeriodSelectorProps` (szczegóły w sekcji Typy)
- `Period` = `'week' | 'month' | 'all'`

**Propsy:**
```typescript
{
  value: Period;
  onChange: (period: Period) => void;
}
```

---

### LoadingState (React)

**Opis komponentu:**
Komponent wyświetlający skeleton loaders podczas ładowania danych statystyk. Imituje układ kart statystyk dla lepszego UX.

**Główne elementy:**
- Grid layout (2 kolumny na desktop, 1 na mobile)
- 5-6 komponentów `Skeleton` z Shadcn/ui
- Każdy skeleton ma wysokość i szerokość odpowiadającą rzeczywistej karcie
- Opcjonalnie: animowany skeleton dla lepszego feedbacku wizualnego

**Obsługiwane zdarzenia:**
Brak

**Warunki walidacji:**
Brak

**Typy:**
Brak własnych propsów

**Propsy:**
Brak

---

### ErrorState (React)

**Opis komponentu:**
Komponent wyświetlający komunikat błędu w przyjazny sposób wraz z opcją ponowienia próby pobrania danych.

**Główne elementy:**
- `Alert` (Shadcn/ui) z wariantem "destructive"
  - `AlertTitle` - tytuł błędu
  - `AlertDescription` - opis błędu
- `Button` - przycisk "Spróbuj ponownie" (opcjonalny, jeśli przekazano `onRetry`)
- Ikona błędu (np. AlertCircle z lucide-react)

**Obsługiwane zdarzenia:**
- `onClick` na przycisku retry → wywołanie `onRetry()`

**Warunki walidacji:**
- Jeśli `onRetry` jest undefined → nie pokazuj przycisku retry

**Typy:**
- `ErrorStateProps` (szczegóły w sekcji Typy)

**Propsy:**
```typescript
{
  message: string;
  onRetry?: () => void;
}
```

---

### EmptyState (React)

**Opis komponentu:**
Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych wygenerowanych fiszek. Zawiera call-to-action zachęcający do pierwszego wygenerowania.

**Główne elementy:**
- Kontener z wycentrowaną treścią
- Ikona (np. BarChart z lucide-react)
- Nagłówek - "Brak statystyk"
- Opis - "Nie masz jeszcze żadnych wygenerowanych fiszek. Zacznij od wygenerowania pierwszego zestawu!"
- `Button` - link do widoku generowania (`/app/generate`)

**Obsługiwane zdarzenia:**
- `onClick` na przycisku → nawigacja do `/app/generate`

**Warunki walidacji:**
Brak

**Typy:**
Brak własnych propsów

**Propsy:**
Brak

---

### StatisticsGrid (React)

**Opis komponentu:**
Kontener grid layout dla kart statystyk. Odpowiada za responsywne rozmieszczenie kart w zależności od rozmiaru ekranu.

**Główne elementy:**
- Grid layout z Tailwind:
  - 1 kolumna na mobile (< 640px)
  - 2 kolumny na tablet (≥ 640px)
  - 3 kolumny na desktop (≥ 1024px)
- Gap między kartami
- Lista komponentów `StatisticCard` dla każdej metryki

**Obsługiwane zdarzenia:**
Brak

**Warunki walidacji:**
Brak

**Typy:**
- `StatisticsGridProps` (szczegóły w sekcji Typy)
- `GenerationStatisticsDTO`

**Propsy:**
```typescript
{
  statistics: GenerationStatisticsDTO;
}
```

---

### StatisticCard (React)

**Opis komponentu:**
Pojedyncza karta wyświetlająca konkretną metrykę statystyczną. Wykorzystuje komponent `Card` z Shadcn/ui i formatuje wartość zgodnie z typem danych.

**Główne elementy:**
- `Card` (Shadcn/ui)
  - `CardHeader`
    - Ikona (opcjonalna)
    - `CardTitle` - etykieta metryki
    - `CardDescription` - dodatkowy opis (opcjonalny)
  - `CardContent`
    - Sformatowana wartość metryki (duża czcionka, wyróżniona)
    - ARIA label dla dostępności

**Obsługiwane zdarzenia:**
Brak

**Warunki walidacji:**
- Format wartości zależny od typu:
  - `'number'` → formatowanie z separatorami tysięcy (np. "1 234")
  - `'percentage'` → konwersja z decimal na procenty (np. 0.75 → "75%")
  - `'duration'` → konwersja ms na sekundy (np. 2500 → "2.5s")
  - `'text'` → wyświetlenie jako string

**Typy:**
- `StatisticCardProps` (szczegóły w sekcji Typy)

**Propsy:**
```typescript
{
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'duration' | 'text';
}
```

## 5. Typy

### Istniejące typy (z `src/types.ts`):

```typescript
/**
 * DTO zwracane przez endpoint statystyk generacji
 */
export interface GenerationStatisticsDTO {
  total_generations: number;              // Łączna liczba generacji
  total_generated_flashcards: number;     // Łączna liczba wygenerowanych fiszek
  total_accepted_flashcards: number;      // Łączna liczba zaakceptowanych fiszek
  total_accepted_unedited: number;        // Liczba zaakceptowanych bez edycji
  total_accepted_edited: number;          // Liczba zaakceptowanych z edycją
  acceptance_rate: number;                // Współczynnik akceptacji (0-1)
  unedited_acceptance_rate: number;       // Współczynnik akceptacji bez edycji (0-1)
  average_generation_duration: number;    // Średni czas generowania w ms
  most_used_model: string;                // Najczęściej używany model
  period: "week" | "month" | "all";       // Okres dla którego obliczono statystyki
}
```

### Nowe typy do utworzenia:

**Lokalizacja:** `src/components/dashboard/types.ts`

```typescript
/**
 * Typ reprezentujący okres czasu dla statystyk
 */
export type Period = 'week' | 'month' | 'all';

/**
 * Mapowanie wartości Period na przyjazne etykiety w języku polskim
 */
export const PERIOD_LABELS: Record<Period, string> = {
  week: 'Ostatni tydzień',
  month: 'Ostatni miesiąc',
  all: 'Cały czas'
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
export type StatisticFormat = 'number' | 'percentage' | 'duration' | 'text';

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
  icon?: React.ReactNode;
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
  icon?: React.ReactNode;
}
```

### Typy pomocnicze (utilities):

**Lokalizacja:** `src/lib/utils/format.ts`

```typescript
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
```

## 6. Zarządzanie stanem

### Custom Hook: `useGenerationStatistics`

**Lokalizacja:** `src/components/hooks/useGenerationStatistics.ts`

**Cel:** Enkapsulacja logiki pobierania i zarządzania stanem statystyk generacji.

**Sygnatura:**
```typescript
function useGenerationStatistics(initialPeriod: Period = 'all'): {
  statistics: GenerationStatisticsDTO | null;
  loading: boolean;
  error: string | null;
  period: Period;
  setPeriod: (period: Period) => void;
  refetch: () => Promise<void>;
}
```

**Zarządzanie stanem wewnętrznym:**
```typescript
const [period, setPeriod] = useState<Period>(initialPeriod);
const [statistics, setStatistics] = useState<GenerationStatisticsDTO | null>(null);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
```

**Logika:**

1. **Inicjalizacja (`useEffect` przy montowaniu):**
   - Ustawienie `loading = true`
   - Wywołanie funkcji `fetchStatistics()`

2. **Pobieranie danych (`fetchStatistics`):**
   ```typescript
   const fetchStatistics = async () => {
     try {
       setLoading(true);
       setError(null);

       const response = await fetch(`/api/generations/statistics?period=${period}`);

       if (!response.ok) {
         throw new Error('Nie udało się pobrać statystyk');
       }

       const data: GenerationStatisticsDTO = await response.json();
       setStatistics(data);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd');
       setStatistics(null);
     } finally {
       setLoading(false);
     }
   };
   ```

3. **Reakcja na zmianę okresu (`useEffect` z zależnością `period`):**
   - Wywołanie `fetchStatistics()` gdy zmieni się `period`

4. **Eksport funkcji `refetch`:**
   - Możliwość ręcznego ponowienia pobrania danych (np. po błędzie)

**Użycie w komponencie DashboardView:**
```typescript
function DashboardView() {
  const { statistics, loading, error, period, setPeriod, refetch } = useGenerationStatistics();

  // ... reszta logiki komponentu
}
```

## 7. Integracja API

### Endpoint: GET `/api/generations/statistics`

**Lokalizacja backendu:** `src/pages/api/generations/statistics.ts`

**Typ żądania:**
```typescript
// Query parameters
interface StatisticsQuery {
  period?: 'week' | 'month' | 'all';  // Domyślnie: 'all'
}
```

**Typ odpowiedzi (sukces):**
```typescript
// Status: 200 OK
// Content-Type: application/json
GenerationStatisticsDTO
```

**Typ odpowiedzi (błąd):**
```typescript
// Status: 400, 401, 500
// Content-Type: application/json
{
  error: {
    code: string;
    message: string;
  }
}
```

**Implementacja w Astro:**

```typescript
// src/pages/api/generations/statistics.ts
import type { APIRoute } from 'astro';
import { getGenerationStatistics } from '../../../lib/services/generation.service';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Weryfikacja autoryzacji
    const session = await locals.session;
    if (!session?.user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Musisz być zalogowany'
          }
        }),
        { status: 401 }
      );
    }

    // Pobranie parametru period z query string
    const period = (url.searchParams.get('period') || 'all') as 'week' | 'month' | 'all';

    // Walidacja period
    if (!['week', 'month', 'all'].includes(period)) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Nieprawidłowy okres'
          }
        }),
        { status: 400 }
      );
    }

    // Pobranie statystyk
    const statistics = await getGenerationStatistics(
      locals.supabase,
      session.user.id,
      period
    );

    return new Response(JSON.stringify(statistics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Wystąpił błąd podczas pobierania statystyk'
        }
      }),
      { status: 500 }
    );
  }
};
```

**Wywołanie z frontendu:**

```typescript
// W custom hook useGenerationStatistics
const response = await fetch(`/api/generations/statistics?period=${period}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error?.message || 'Nie udało się pobrać statystyk');
}

const data: GenerationStatisticsDTO = await response.json();
```

## 8. Interakcje użytkownika

### 1. Załadowanie strony (Initial Load)

**Akcja użytkownika:**
Użytkownik nawiguje do `/app/dashboard`

**Sekwencja zdarzeń:**
1. Astro renderuje stronę, weryfikuje sesję
2. Komponent `DashboardView` montuje się z `client:load`
3. Hook `useGenerationStatistics` uruchamia się z domyślnym okresem `'all'`
4. Stan zmienia się na `loading = true`
5. Wyświetlany jest `LoadingState` (skeleton loaders)
6. Wykonywane jest żądanie API: `GET /api/generations/statistics?period=all`
7. Po otrzymaniu odpowiedzi:
   - **Sukces z danymi:** `statistics` jest ustawiony, `loading = false`, wyświetlany jest `StatisticsGrid`
   - **Sukces bez danych:** `statistics.total_generations === 0`, wyświetlany jest `EmptyState`
   - **Błąd:** `error` jest ustawiony, `loading = false`, wyświetlany jest `ErrorState`

**Oczekiwany wynik:**
Użytkownik widzi statystyki dla całego okresu lub odpowiedni komunikat (pusty stan/błąd)

---

### 2. Zmiana okresu czasu

**Akcja użytkownika:**
Użytkownik klika na `PeriodSelector` i wybiera inny okres (np. "Ostatni tydzień")

**Sekwencja zdarzeń:**
1. Komponent `Select` emituje event `onValueChange` z nową wartością `'week'`
2. `PeriodSelector` wywołuje `onChange('week')`
3. `DashboardView` aktualizuje stan: `setPeriod('week')`
4. Hook `useGenerationStatistics` reaguje na zmianę `period` (useEffect)
5. Stan zmienia się na `loading = true`, `error = null`
6. Wyświetlany jest `LoadingState`
7. Wykonywane jest nowe żądanie: `GET /api/generations/statistics?period=week`
8. Po otrzymaniu odpowiedzi:
   - Statystyki są aktualizowane
   - `loading = false`
   - Wyświetlany jest `StatisticsGrid` z nowymi danymi

**Oczekiwany wynik:**
Statystyki są przeładowane i pokazują dane dla wybranego okresu

---

### 3. Ponowienie próby po błędzie

**Akcja użytkownika:**
Użytkownik klika przycisk "Spróbuj ponownie" w `ErrorState`

**Sekwencja zdarzeń:**
1. `ErrorState` wywołuje `onRetry()`
2. `DashboardView` wywołuje `refetch()` z hooka
3. Stan zmienia się na `loading = true`, `error = null`
4. Wyświetlany jest `LoadingState`
5. Ponawiane jest żądanie API z aktualnym okresem
6. Po otrzymaniu odpowiedzi:
   - **Sukces:** statystyki są ustawione, wyświetlany jest `StatisticsGrid`
   - **Błąd:** ponownie wyświetlany jest `ErrorState`

**Oczekiwany wynik:**
Ponowna próba pobrania danych, z możliwością sukcesu lub ponownego błędu

---

### 4. Nawigacja do generowania fiszek (Empty State)

**Akcja użytkownika:**
Użytkownik klika przycisk "Wygeneruj pierwsze fiszki" w `EmptyState`

**Sekwencja zdarzeń:**
1. `EmptyState` używa linku/przycisku z `href="/app/generate"`
2. Astro View Transitions obsługuje nawigację
3. Użytkownik jest przekierowywany do widoku generowania

**Oczekiwany wynik:**
Użytkownik trafia do widoku generowania fiszek gdzie może stworzyć pierwsze fiszki

## 9. Warunki i walidacja

### Walidacja na poziomie routingu (Astro):

**Lokalizacja:** `src/pages/app/dashboard.astro`

**Warunki:**
1. **Weryfikacja sesji:**
   ```typescript
   const session = await Astro.locals.session;
   if (!session?.user) {
     return Astro.redirect('/login');
   }
   ```
   - **Efekt na UI:** Przekierowanie do strony logowania, użytkownik nie widzi dashboardu

### Walidacja na poziomie API:

**Lokalizacja:** `src/pages/api/generations/statistics.ts`

**Warunki:**
1. **Autoryzacja:**
   ```typescript
   if (!session?.user) {
     return Response(401, { error: 'UNAUTHORIZED' });
   }
   ```

2. **Walidacja parametru period:**
   ```typescript
   if (!['week', 'month', 'all'].includes(period)) {
     return Response(400, { error: 'VALIDATION_ERROR' });
   }
   ```

### Walidacja na poziomie komponentów:

**Lokalizacja:** `src/components/DashboardView.tsx`

#### Warunek 1: Stan ładowania
```typescript
if (loading) {
  return <LoadingState />;
}
```
- **Komponenty dotyczące:** `DashboardView`, `LoadingState`
- **Wpływ na UI:** Wyświetlane są skeleton loaders zamiast rzeczywistych danych

#### Warunek 2: Stan błędu
```typescript
if (error) {
  return <ErrorState message={error} onRetry={refetch} />;
}
```
- **Komponenty dotyczące:** `DashboardView`, `ErrorState`
- **Wpływ na UI:** Wyświetlany jest komunikat błędu z opcją ponowienia

#### Warunek 3: Brak danych (empty state)
```typescript
if (statistics && statistics.total_generations === 0) {
  return <EmptyState />;
}
```
- **Komponenty dotyczące:** `DashboardView`, `EmptyState`
- **Wpływ na UI:** Wyświetlany jest komunikat zachęcający do wygenerowania pierwszych fiszek

#### Warunek 4: Wyświetlenie danych
```typescript
if (statistics && statistics.total_generations > 0) {
  return <StatisticsGrid statistics={statistics} />;
}
```
- **Komponenty dotyczące:** `DashboardView`, `StatisticsGrid`, `StatisticCard`
- **Wpływ na UI:** Wyświetlane są karty ze statystykami

---

**Lokalizacja:** `src/components/PeriodSelector.tsx`

#### Warunek: Walidacja wartości Period
```typescript
// W handleChange
const handleChange = (value: string) => {
  if (['week', 'month', 'all'].includes(value)) {
    onChange(value as Period);
  }
};
```
- **Komponenty dotyczące:** `PeriodSelector`
- **Wpływ na UI:** Zapobiega ustawieniu nieprawidłowej wartości okresu

---

**Lokalizacja:** `src/components/dashboard/StatisticCard.tsx`

#### Warunek: Formatowanie wartości według typu
```typescript
const formattedValue = useMemo(() => {
  switch (format) {
    case 'percentage':
      return `${(Number(value) * 100).toFixed(0)}%`;
    case 'duration':
      return `${(Number(value) / 1000).toFixed(1)}s`;
    case 'number':
      return new Intl.NumberFormat('pl-PL').format(Number(value));
    case 'text':
    default:
      return String(value);
  }
}, [value, format]);
```
- **Komponenty dotyczące:** `StatisticCard`
- **Wpływ na UI:** Wartości są formatowane zgodnie z typem (procenty, czas, liczby)

## 10. Obsługa błędów

### 1. Błąd sieci (Network Error)

**Scenariusz:**
Brak połączenia z internetem lub serwer nie odpowiada

**Obsługa:**
```typescript
// W useGenerationStatistics hook
try {
  const response = await fetch(`/api/generations/statistics?period=${period}`);
  // ...
} catch (err) {
  setError('Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.');
}
```

**UI:**
- Wyświetlenie `ErrorState` z komunikatem: "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe."
- Przycisk "Spróbuj ponownie" umożliwiający retry

---

### 2. Błąd autoryzacji (401 Unauthorized)

**Scenariusz:**
Sesja użytkownika wygasła lub jest nieprawidłowa

**Obsługa:**
```typescript
// W useGenerationStatistics hook
const response = await fetch(`/api/generations/statistics?period=${period}`);

if (response.status === 401) {
  // Przekierowanie do logowania
  window.location.href = '/login?redirect=/app/dashboard';
  return;
}
```

**UI:**
- Automatyczne przekierowanie do strony logowania
- Po zalogowaniu powrót do dashboardu (parametr redirect)

---

### 3. Błąd walidacji (400 Bad Request)

**Scenariusz:**
Nieprawidłowy parametr period (nie powinno się zdarzyć przy poprawnej implementacji frontendu)

**Obsługa:**
```typescript
if (response.status === 400) {
  const errorData = await response.json();
  setError(errorData.error?.message || 'Nieprawidłowe parametry żądania');
}
```

**UI:**
- Wyświetlenie `ErrorState` z komunikatem błędu
- Przycisk retry

---

### 4. Błąd serwera (500 Internal Server Error)

**Scenariusz:**
Nieoczekiwany błąd po stronie serwera (np. problem z bazą danych)

**Obsługa:**
```typescript
if (response.status === 500) {
  setError('Wystąpił błąd serwera. Spróbuj ponownie później.');
}
```

**UI:**
- Wyświetlenie `ErrorState` z komunikatem: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Przycisk retry

---

### 5. Błąd parsowania odpowiedzi

**Scenariusz:**
Odpowiedź z API nie jest prawidłowym JSON lub ma nieoczekiwaną strukturę

**Obsługa:**
```typescript
try {
  const data = await response.json();

  // Walidacja struktury
  if (!data || typeof data.total_generations !== 'number') {
    throw new Error('Nieprawidłowy format danych');
  }

  setStatistics(data);
} catch (err) {
  setError('Otrzymano nieprawidłowe dane z serwera');
}
```

**UI:**
- Wyświetlenie `ErrorState` z komunikatem: "Otrzymano nieprawidłowe dane z serwera"
- Przycisk retry

---

### 6. Pusty stan (Empty State)

**Scenariusz:**
Użytkownik nie ma jeszcze żadnych generacji (nowy użytkownik)

**Obsługa:**
```typescript
// W DashboardView
if (statistics && statistics.total_generations === 0) {
  return <EmptyState />;
}
```

**UI:**
- Wyświetlenie `EmptyState` z:
  - Przyjaznym komunikatem: "Nie masz jeszcze żadnych statystyk"
  - Wyjaśnieniem: "Zacznij od wygenerowania pierwszego zestawu fiszek, aby zobaczyć swoje statystyki tutaj"
  - Przyciskiem CTA: "Wygeneruj pierwsze fiszki" → link do `/app/generate`

---

### Centralna obsługa błędów - Error Boundary

**Opcjonalnie:** Implementacja React Error Boundary dla catchowania błędów renderowania

**Lokalizacja:** `src/components/ErrorBoundary.tsx`

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  // Catch rendering errors
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState message="Coś poszło nie tak. Odśwież stronę." />;
    }
    return this.props.children;
  }
}
```

## 11. Kroki implementacji

### Faza 1: Przygotowanie struktury i typów (1-2h)

1. **Utworzenie struktury plików:**
   ```
   src/pages/app/dashboard.astro
   src/components/DashboardView.tsx
   src/components/PeriodSelector.tsx
   src/components/dashboard/
     ├── LoadingState.tsx
     ├── ErrorState.tsx
     ├── EmptyState.tsx
     ├── StatisticsGrid.tsx
     ├── StatisticCard.tsx
     └── types.ts
   src/components/hooks/useGenerationStatistics.ts
   src/lib/utils/format.ts
   ```

2. **Definicja typów:**
   - Utworzenie pliku `src/components/dashboard/types.ts`
   - Dodanie wszystkich interfejsów i typów wymienionych w sekcji 5
   - Eksport typów pomocniczych (`Period`, `PERIOD_LABELS`, etc.)

3. **Funkcje formatujące:**
   - Utworzenie `src/lib/utils/format.ts`
   - Implementacja funkcji:
     - `formatNumber(value: number, options?: FormatOptions): string`
     - `formatPercentage(decimal: number, decimals?: number): string`
     - `formatDuration(milliseconds: number): string`

### Faza 2: Implementacja endpointu API (1h)

4. **Utworzenie endpointu API:**
   - Utworzenie pliku `src/pages/api/generations/statistics.ts`
   - Implementacja handlera `GET` zgodnie z sekcją 7
   - Walidacja parametrów i autoryzacji
   - Obsługa błędów

5. **Testowanie endpointu:**
   - Test z różnymi parametrami period
   - Test bez autoryzacji (401)
   - Test z nieprawidłowym period (400)

### Faza 3: Implementacja custom hooka (1-2h)

6. **Implementacja `useGenerationStatistics`:**
   - Utworzenie `src/components/hooks/useGenerationStatistics.ts`
   - Implementacja zarządzania stanem (useState)
   - Implementacja logiki pobierania danych (fetchStatistics)
   - Dodanie useEffect dla inicjalizacji i reakcji na zmianę period
   - Obsługa błędów (wszystkie scenariusze z sekcji 10)
   - Eksport interfejsu hooka

7. **Testowanie hooka:**
   - Test pobierania danych
   - Test zmiany okresu
   - Test obsługi błędów
   - Test funkcji refetch

### Faza 4: Komponenty pomocnicze (2-3h)

8. **Implementacja `LoadingState`:**
   - Import `Skeleton` z Shadcn/ui
   - Utworzenie grid layout
   - Dodanie 5-6 skeleton cards o odpowiednich rozmiarach
   - Stylizacja z Tailwind (responsywność)

9. **Implementacja `ErrorState`:**
   - Import `Alert`, `AlertTitle`, `AlertDescription`, `Button` z Shadcn/ui
   - Utworzenie struktury komponentu
   - Obsługa propsa `message` i `onRetry`
   - Warunkowe renderowanie przycisku retry
   - Dodanie ikony błędu (AlertCircle z lucide-react)

10. **Implementacja `EmptyState`:**
    - Utworzenie struktury z ikoną, nagłówkiem, opisem
    - Dodanie przycisku CTA linkującego do `/app/generate`
    - Stylizacja z Tailwind (wycentrowanie, padding)
    - Dodanie ikony (BarChart z lucide-react)

11. **Implementacja `StatisticCard`:**
    - Import `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` z Shadcn/ui
    - Implementacja funkcji formatowania wartości (useMemo)
    - Obsługa różnych formatów (number, percentage, duration, text)
    - Dodanie ARIA labels dla dostępności
    - Stylizacja (duża czcionka dla wartości, ikonka obok tytułu)

### Faza 5: Komponenty główne (2-3h)

12. **Implementacja `PeriodSelector`:**
    - Import `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` z Shadcn/ui
    - Utworzenie struktury z mapowaniem `PERIOD_LABELS`
    - Obsługa eventu `onValueChange`
    - Walidacja wybranej wartości
    - Stylizacja

13. **Implementacja `StatisticsGrid`:**
    - Utworzenie grid layout z Tailwind
    - Konfiguracja responsywności (1 → 2 → 3 kolumny)
    - Definicja metryk do wyświetlenia (tablica `STATISTICS_DEFINITIONS`)
    - Mapowanie metryk na komponenty `StatisticCard`
    - Przekazanie odpowiednich propsów (label, value, format, icon)

14. **Implementacja `DashboardView`:**
    - Użycie hooka `useGenerationStatistics()`
    - Implementacja logiki warunkowego renderowania:
      - `if (loading)` → `<LoadingState />`
      - `if (error)` → `<ErrorState message={error} onRetry={refetch} />`
      - `if (statistics?.total_generations === 0)` → `<EmptyState />`
      - `else` → `<StatisticsGrid statistics={statistics} />`
    - Dodanie nagłówka sekcji
    - Osadzenie `PeriodSelector` z obsługą zmiany
    - Stylizacja kontenera

### Faza 6: Strona Astro (1h)

15. **Implementacja `dashboard.astro`:**
    - Import `MainLayout`
    - Weryfikacja sesji użytkownika (`Astro.locals.session`)
    - Przekierowanie do `/login` jeśli brak sesji
    - Osadzenie `DashboardView` z dyrektywą `client:load`
    - Dodanie tytułu strony i meta tagów
    - Sprawdzenie czy middleware Astro prawidłowo ustawia `locals.supabase`

### Faza 7: Testowanie i dopracowanie (2-3h)

16. **Testowanie przepływów użytkownika:**
    - Załadowanie strony jako zalogowany użytkownik
    - Zmiana okresu czasu
    - Testowanie stanu pustego (nowy użytkownik)
    - Testowanie stanu błędu (symulacja błędu sieci)
    - Testowanie przycisku retry
    - Testowanie nawigacji do generowania

17. **Testowanie dostępności:**
    - Sprawdzenie z czytnikiem ekranu (NVDA/JAWS)
    - Nawigacja klawiaturą (Tab, Enter)
    - Sprawdzenie kontrastów kolorów
    - Walidacja ARIA labels

18. **Testowanie responsywności:**
    - Mobile (< 640px): 1 kolumna
    - Tablet (640px - 1024px): 2 kolumny
    - Desktop (> 1024px): 3 kolumny
    - Sprawdzenie czytelności na małych ekranach

19. **Optymalizacja:**
    - Sprawdzenie rozmiaru bundle (Astro dev tools)
    - Optymalizacja importów (tree-shaking)
    - Dodanie lazy loading jeśli potrzebne
    - Sprawdzenie wydajności (React DevTools Profiler)

20. **Dokumentacja:**
    - Dodanie komentarzy JSDoc do funkcji
    - Dokumentacja propsów komponentów
    - Przykłady użycia w storybook (opcjonalnie)

### Faza 8: Code review i deployment (1h)

21. **Code review:**
    - Sprawdzenie zgodności z wytycznymi projektu (.claude/CLAUDE.md)
    - Weryfikacja obsługi błędów
    - Sprawdzenie typowania TypeScript
    - Przegląd kodu przez drugiego developera

22. **Deployment:**
    - Commit zmian z opisem
    - Push do repozytorium
    - Sprawdzenie CI/CD pipeline
    - Testowanie na środowisku staging
    - Deployment do produkcji

---

## Podsumowanie szacunków czasowych:

- **Faza 1:** 1-2h (struktura i typy)
- **Faza 2:** 1h (endpoint API)
- **Faza 3:** 1-2h (custom hook)
- **Faza 4:** 2-3h (komponenty pomocnicze)
- **Faza 5:** 2-3h (komponenty główne)
- **Faza 6:** 1h (strona Astro)
- **Faza 7:** 2-3h (testowanie)
- **Faza 8:** 1h (review i deployment)

**Łączny czas:** 11-17h (w zależności od doświadczenia developera i ewentualnych problemów)

---

## Dodatkowe uwagi:

1. **Kolejność implementacji:** Zalecane jest implementowanie w kolejności faz, ponieważ każda faza buduje na poprzedniej.

2. **Testowanie iteracyjne:** Testuj każdy komponent po implementacji, nie czekaj do końca.

3. **Komponenty Shadcn/ui:** Upewnij się, że wszystkie potrzebne komponenty są zainstalowane (`npx shadcn-ui@latest add card skeleton alert button select`).

4. **TypeScript strict mode:** Włącz strict mode w tsconfig.json dla lepszego type checkingu.

5. **Accessibility:** Priorytet dla dostępności - każdy element interaktywny musi być dostępny z klawiatury i czytników ekranu.

6. **Performance:** Dashboard jest pierwszym widokiem po zalogowaniu, więc optymalizacja czasu ładowania jest krytyczna.
