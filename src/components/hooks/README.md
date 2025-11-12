# React Hooks

## `useFetch`

Custom hook do obsługi fetch requests z automatycznym zarządzaniem stanem ładowania, danych i błędów.

### Podstawowe użycie

```tsx
import { useFetch } from "@/components/hooks/useFetch";
import type { FlashcardDTO } from "@/types";

function MyComponent() {
  const { data, loading, error, execute } = useFetch<FlashcardDTO[]>();

  const loadFlashcards = async () => {
    const result = await execute('/api/flashcards');
    if (result) {
      // Obsługa wyniku
      console.log(result);
    }
  };

  return (
    <div>
      {loading && <p>Ładowanie...</p>}
      {error && <p>Błąd: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={loadFlashcards}>Załaduj</button>
    </div>
  );
}
```

### POST Request

```tsx
const { data, loading, error, execute } = useFetch<GenerationResultDTO>();

const handleGenerate = async () => {
  const result = await execute('/api/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_text: text,
    }),
  });

  if (result) {
    // Sukces
  }
};
```

### API

#### Zwracane wartości

- `data: T | null` - Dane zwrócone z API lub null
- `loading: boolean` - Czy zapytanie jest w trakcie wykonywania
- `error: string | null` - Komunikat błędu lub null
- `execute: (url: string, options?: RequestInit) => Promise<T | null>` - Funkcja wykonująca zapytanie
- `reset: () => void` - Funkcja resetująca stan do wartości początkowych

#### Parametry execute()

- `url: string` - URL endpointa API
- `options?: RequestInit` - Opcje fetch (method, headers, body, etc.)

### Obsługa błędów

Hook automatycznie:
- Parsuje błędy z API (jeśli są w formacie JSON)
- Wyświetla błędy HTTP statusów
- Zachowuje błędy w stanie `error`

```tsx
const result = await execute('/api/flashcards');

if (!result) {
  // Błąd - szczegóły w fetch.error
  console.error(error);
}
```

### Reset stanu

```tsx
const { reset } = useFetch();

// Resetuj stan do wartości początkowych
reset();
```

### Przykład z wieloma zapytaniami

```tsx
function Component() {
  const fetchGenerate = useFetch<GenerationResultDTO>();
  const fetchSave = useFetch<BulkCreateFlashcardsResponse>();

  const handleGenerate = async () => {
    const result = await fetchGenerate.execute('/api/generations', { /* ... */ });
    // ...
  };

  const handleSave = async () => {
    const result = await fetchSave.execute('/api/flashcards/bulk', { /* ... */ });
    // ...
  };

  return (
    <div>
      <button disabled={fetchGenerate.loading}>Generuj</button>
      <button disabled={fetchSave.loading}>Zapisz</button>
    </div>
  );
}
```
