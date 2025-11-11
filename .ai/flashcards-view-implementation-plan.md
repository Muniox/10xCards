# Plan implementacji widoku Moje Fiszki

## 1. Przegląd

Widok "Moje Fiszki" to główny panel zarządzania fiszkami użytkownika. Umożliwia przeglądanie wszystkich zapisanych fiszek w formie paginowanej listy oraz wykonywanie operacji CRUD (tworzenie, odczyt, aktualizacja, usuwanie). Widok kładzie nacisk na intuicyjny UX z optymistycznym UI przy usuwaniu oraz pełną dostępność z klawiatury. Zapewnia stan pusty, który zachęca użytkownika do stworzenia pierwszej fiszki.

## 2. Routing widoku

- **Ścieżka:** `/app/flashcards`
- **Typ strony:** Strona Astro z zagnieżdżonymi komponentami React dla interaktywności
- **Plik:** `src/pages/app/flashcards.astro`
- **Wymagana autentykacja:** Tak (middleware sprawdza sesję użytkownika)

## 3. Struktura komponentów

```
flashcards.astro (Astro page)
└── FlashcardsContainer.tsx (React - główny kontener)
    ├── FlashcardsHeader.tsx (React)
    │   └── Button (Shadcn - "Dodaj fiszkę")
    ├── FlashcardList.tsx (React)
    │   ├── EmptyState.tsx (React - gdy brak fiszek)
    │   └── FlashcardCard.tsx[] (React - dla każdej fiszki)
    │       ├── Card (Shadcn)
    │       ├── CardHeader (Shadcn)
    │       ├── CardContent (Shadcn)
    │       └── DropdownMenu (Shadcn - akcje Edytuj/Usuń)
    ├── PaginationControls.tsx (React)
    ├── CreateEditFlashcardDialog.tsx (React)
    │   └── Dialog (Shadcn)
    │       ├── DialogHeader (Shadcn)
    │       ├── DialogContent (Shadcn)
    │       └── Form
    │           ├── Label & Textarea (front)
    │           ├── Label & Textarea (back)
    │           └── DialogFooter z Button[] (Anuluj/Zapisz)
    └── DeleteFlashcardDialog.tsx (React)
        └── AlertDialog (Shadcn)
            ├── AlertDialogHeader (Shadcn)
            ├── AlertDialogDescription (Shadcn)
            └── AlertDialogFooter z Button[] (Anuluj/Usuń)
```

## 4. Szczegóły komponentów

### flashcards.astro

- **Opis komponentu:** Strona Astro służąca jako główny punkt wejścia dla widoku. Odpowiedzialna za pobranie początkowych danych z serwera (SSR), sprawdzenie autoryzacji użytkownika oraz przekazanie danych do komponentu React.
- **Główne elementy:**
  - Layout aplikacji (`BaseLayout`)
  - Komponent `FlashcardsContainer` z dyrektywą `client:load`
- **Obsługiwane zdarzenia:** Brak (strona statyczna)
- **Warunki walidacji:**
  - Sprawdzenie czy użytkownik jest zalogowany (z `Astro.locals.user`)
  - Przekierowanie na `/login` jeśli brak autoryzacji
- **Typy:**
  - `PaginatedFlashcardsResponse` (dane z API)
  - `User` (z session)
- **Propsy:** Brak (to strona, nie komponent)

### FlashcardsContainer.tsx

- **Opis komponentu:** Główny kontener React zarządzający całym stanem widoku, logiką biznesową i komunikacją z API. Koordynuje wszystkie operacje CRUD, obsługuje paginację oraz zarządza otwieraniem i zamykaniem dialogów.
- **Główne elementy:**
  - `FlashcardsHeader` - nagłówek z przyciskiem dodawania
  - `FlashcardList` - lista fiszek lub stan pusty
  - `PaginationControls` - kontrolki paginacji (warunkowo)
  - `CreateEditFlashcardDialog` - dialog tworzenia/edycji
  - `DeleteFlashcardDialog` - dialog potwierdzenia usunięcia
  - `Toast/Sonner` - komunikaty o błędach
- **Obsługiwane zdarzenia:**
  - Otwieranie dialogu tworzenia fiszki
  - Otwieranie dialogu edycji fiszki
  - Otwieranie dialogu usuwania fiszki
  - Zmiana strony paginacji
  - Submit formularzy (create/edit)
  - Potwierdzenie usunięcia
- **Warunki walidacji:**
  - Sprawdzenie czy `userId` istnieje przed wywołaniami API
  - Walidacja odpowiedzi API
- **Typy:**
  - Props: `FlashcardsContainerProps`
  - Stan wewnętrzny wykorzystuje: `FlashcardDTO[]`, `PaginationMeta`, `DialogMode`, `FlashcardFormData`
- **Propsy:**
  ```typescript
  interface FlashcardsContainerProps {
    initialData: PaginatedFlashcardsResponse;
    userId: string;
  }
  ```

### FlashcardsHeader.tsx

- **Opis komponentu:** Nagłówek widoku zawierający tytuł strony oraz przycisk akcji do dodawania nowej fiszki.
- **Główne elementy:**
  - `h1` - tytuł "Moje Fiszki"
  - `Button` (Shadcn) - "Dodaj fiszkę" z ikoną Plus
- **Obsługiwane zdarzenia:**
  - `onClick` na Button - wywołuje callback `onCreateClick`
- **Warunki walidacji:** Brak
- **Typy:**
  - Props: `FlashcardsHeaderProps`
- **Propsy:**
  ```typescript
  interface FlashcardsHeaderProps {
    onCreateClick: () => void;
  }
  ```

### FlashcardList.tsx

- **Opis komponentu:** Komponent odpowiedzialny za renderowanie listy fiszek lub stanu pustego. Obsługuje loading state poprzez wyświetlanie skeleton loaderów.
- **Główne elementy:**
  - `EmptyState` - gdy `flashcards.length === 0` i `!isLoading`
  - Grid/Flex container z `FlashcardCard[]` - dla każdej fiszki
  - Skeleton loaders - gdy `isLoading`
- **Obsługiwane zdarzenia:**
  - Przekazuje `onEdit` i `onDelete` do każdego `FlashcardCard`
  - Przekazuje `onCreateClick` do `EmptyState`
- **Warunki walidacji:** Brak
- **Typy:**
  - Props: `FlashcardListProps`
  - Wewnętrzne: `FlashcardDTO`
- **Propsy:**
  ```typescript
  interface FlashcardListProps {
    flashcards: FlashcardDTO[];
    onEdit: (flashcard: FlashcardDTO) => void;
    onDelete: (flashcard: FlashcardDTO) => void;
    onCreateClick: () => void;
    isLoading: boolean;
  }
  ```

### FlashcardCard.tsx

- **Opis komponentu:** Reprezentacja pojedynczej fiszki w formie karty. Wyświetla przód i tył fiszki oraz menu dropdown z akcjami (Edytuj, Usuń). Obsługuje długie teksty poprzez truncation.
- **Główne elementy:**
  - `Card` (Shadcn) - kontener karty
  - `CardHeader` - nagłówek z tytułem "Przód" i menu dropdown
  - `CardContent` - treść fiszki (front i back)
  - `DropdownMenu` (Shadcn) - menu akcji
    - `DropdownMenuTrigger` - przycisk z ikoną MoreVertical
    - `DropdownMenuContent`
      - `DropdownMenuItem` - "Edytuj" z ikoną Pencil
      - `DropdownMenuItem` - "Usuń" z ikoną Trash
  - Badge/Chip (opcjonalnie) - wyświetlenie źródła fiszki (`source`)
- **Obsługiwane zdarzenia:**
  - Kliknięcie "Edytuj" - wywołuje `onEdit()`
  - Kliknięcie "Usuń" - wywołuje `onDelete()`
- **Warunki walidacji:** Brak
- **Typy:**
  - Props: `FlashcardCardProps`
  - Wewnętrzne: `FlashcardDTO`
- **Propsy:**
  ```typescript
  interface FlashcardCardProps {
    flashcard: FlashcardDTO;
    onEdit: () => void;
    onDelete: () => void;
    isOptimisticallyDeleted?: boolean;
  }
  ```

### EmptyState.tsx

- **Opis komponentu:** Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych fiszek. Zachęca do stworzenia pierwszej fiszki poprzez przyjazny komunikat i wyraźny call-to-action.
- **Główne elementy:**
  - Container z ikoną (np. FileQuestion z Lucide)
  - Tekst nagłówka: "Nie masz jeszcze żadnych fiszek"
  - Tekst opisu: "Stwórz swoją pierwszą fiszkę, aby rozpocząć naukę"
  - `Button` (Shadcn) - "Stwórz pierwszą fiszkę"
- **Obsługiwane zdarzenia:**
  - `onClick` na Button - wywołuje `onCreateClick`
- **Warunki walidacji:** Brak
- **Typy:**
  - Props: `EmptyStateProps`
- **Propsy:**
  ```typescript
  interface EmptyStateProps {
    onCreateClick: () => void;
  }
  ```

### PaginationControls.tsx

- **Opis komponentu:** Kontrolki nawigacji między stronami listy fiszek. Wyświetla aktualną stronę, całkowitą liczbę stron oraz przyciski do przechodzenia między stronami.
- **Główne elementy:**
  - Container flex
  - `Button` - "Poprzednia strona" (disabled na pierwszej stronie)
  - Tekst - "Strona X z Y"
  - Tekst pomocniczy - "Wyświetlono Z elementów z W"
  - `Button` - "Następna strona" (disabled na ostatniej stronie)
- **Obsługiwane zdarzenia:**
  - Kliknięcie "Poprzednia" - wywołuje `onPageChange(currentPage - 1)`
  - Kliknięcie "Następna" - wywołuje `onPageChange(currentPage + 1)`
- **Warunki walidacji:**
  - Disabled "Poprzednia" gdy `pagination.page === 1`
  - Disabled "Następna" gdy `pagination.page === pagination.total_pages`
- **Typy:**
  - Props: `PaginationControlsProps`
  - Wewnętrzne: `PaginationMeta`
- **Propsy:**
  ```typescript
  interface PaginationControlsProps {
    pagination: PaginationMeta;
    onPageChange: (page: number) => void;
  }
  ```

### CreateEditFlashcardDialog.tsx

- **Opis komponentu:** Modal do tworzenia nowej fiszki lub edycji istniejącej. Zawiera formularz z dwoma polami (front i back) oraz walidacją. Działa w dwóch trybach: "create" i "edit".
- **Główne elementy:**
  - `Dialog` (Shadcn) - kontener modala
  - `DialogHeader` - tytuł dynamiczny: "Dodaj fiszkę" lub "Edytuj fiszkę"
  - `DialogContent`
    - Form
      - `Label` + `Textarea` - "Przód fiszki" (front)
        - Komunikat walidacji
        - Licznik znaków (np. "0 / 500")
      - `Label` + `Textarea` - "Tył fiszki" (back)
        - Komunikat walidacji
        - Licznik znaków (np. "0 / 1000")
    - `DialogFooter`
      - `Button` variant="outline" - "Anuluj"
      - `Button` - "Zapisz" (disabled gdy formularz nieprawidłowy lub trwa zapisywanie)
  - Toast/komunikat błędu (opcjonalnie)
- **Obsługiwane zdarzenia:**
  - Zmiana wartości w polach tekstowych
  - Kliknięcie "Anuluj" - wywołuje `onClose()`
  - Kliknięcie "Zapisz" - wywołuje `onSubmit(formData)`
  - Zamknięcie modala (X lub Escape)
- **Warunki walidacji:**
  - **front:**
    - Wymagane (nie może być puste)
    - Min 1 znak
    - Max 500 znaków
    - Komunikat: "Przód fiszki jest wymagany" / "Maksymalnie 500 znaków"
  - **back:**
    - Wymagane (nie może być puste)
    - Min 1 znak
    - Max 1000 znaków
    - Komunikat: "Tył fiszki jest wymagany" / "Maksymalnie 1000 znaków"
  - Submit button disabled gdy:
    - Którekolwiek pole jest nieprawidłowe
    - Oba pola są puste
    - Trwa zapisywanie (`isSubmitting`)
- **Typy:**
  - Props: `CreateEditFlashcardDialogProps`
  - Wewnętrzne: `FlashcardFormData`, `DialogMode`
- **Propsy:**
  ```typescript
  interface CreateEditFlashcardDialogProps {
    isOpen: boolean;
    mode: DialogMode;
    flashcard?: FlashcardDTO; // tylko dla edit mode
    onClose: () => void;
    onSubmit: (data: FlashcardFormData) => Promise<void>;
  }
  ```

### DeleteFlashcardDialog.tsx

- **Opis komponentu:** AlertDialog służący do potwierdzenia operacji usunięcia fiszki. Wyświetla komunikat ostrzegawczy oraz przyciski akcji.
- **Główne elementy:**
  - `AlertDialog` (Shadcn) - kontener modala
  - `AlertDialogHeader`
    - `AlertDialogTitle` - "Usuń fiszkę"
  - `AlertDialogDescription` - "Czy na pewno chcesz usunąć tę fiszkę? Ta operacja jest nieodwracalna."
  - Opcjonalnie: Preview fiszki (front)
  - `AlertDialogFooter`
    - `Button` variant="outline" - "Anuluj"
    - `Button` variant="destructive" - "Usuń" (disabled gdy trwa usuwanie)
- **Obsługiwane zdarzenia:**
  - Kliknięcie "Anuluj" - wywołuje `onClose()`
  - Kliknięcie "Usuń" - wywołuje `onConfirm()`
  - Zamknięcie modala (X lub Escape) - wywołuje `onClose()`
- **Warunki walidacji:**
  - Button "Usuń" disabled gdy `isDeleting === true`
- **Typy:**
  - Props: `DeleteFlashcardDialogProps`
  - Wewnętrzne: `FlashcardDTO`
- **Propsy:**
  ```typescript
  interface DeleteFlashcardDialogProps {
    isOpen: boolean;
    flashcard: FlashcardDTO | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
  }
  ```

## 5. Typy

### Istniejące typy (z src/types.ts)

```typescript
// Źródło fiszki
type FlashcardSource = "ai-full" | "ai-edited" | "manual";

// DTO fiszki (zwracane przez API)
type FlashcardDTO = Omit<Tables<"flashcards">, "user_id" | "source"> & {
  source: FlashcardSource;
};
// Zawiera: id, front, back, source, generation_id, created_at

// Komenda tworzenia fiszki
type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back">;
// Zawiera: { front: string; back: string; }

// Komenda aktualizacji fiszki
type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>;
// Zawiera: { front?: string; back?: string; }

// Odpowiedź z paginowaną listą fiszek
interface PaginatedFlashcardsResponse {
  data: FlashcardDTO[];
  pagination: PaginationMeta;
}

// Metadane paginacji
interface PaginationMeta {
  page: number;        // Aktualna strona (1-based)
  limit: number;       // Liczba elementów na stronie
  total: number;       // Całkowita liczba elementów
  total_pages: number; // Całkowita liczba stron
}

// Standardowa odpowiedź błędu
interface ErrorResponse {
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "RATE_LIMIT_ERROR" | "AI_SERVICE_ERROR" | "INTERNAL_ERROR";
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Nowe typy ViewModel (do stworzenia)

```typescript
// Tryb działania dialogu tworzenia/edycji
type DialogMode = "create" | "edit";

// Dane formularza fiszki
interface FlashcardFormData {
  front: string;
  back: string;
}

// Stan błędu formularza
interface FlashcardFormErrors {
  front?: string;
  back?: string;
}

// Props głównego kontenera React
interface FlashcardsContainerProps {
  initialData: PaginatedFlashcardsResponse;
  userId: string;
}

// Props nagłówka
interface FlashcardsHeaderProps {
  onCreateClick: () => void;
}

// Props listy fiszek
interface FlashcardListProps {
  flashcards: FlashcardDTO[];
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
  onCreateClick: () => void;
  isLoading: boolean;
}

// Props karty fiszki
interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEdit: () => void;
  onDelete: () => void;
  isOptimisticallyDeleted?: boolean;
}

// Props stanu pustego
interface EmptyStateProps {
  onCreateClick: () => void;
}

// Props kontrolek paginacji
interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

// Props dialogu tworzenia/edycji
interface CreateEditFlashcardDialogProps {
  isOpen: boolean;
  mode: DialogMode;
  flashcard?: FlashcardDTO; // tylko dla edit mode
  onClose: () => void;
  onSubmit: (data: FlashcardFormData) => Promise<void>;
}

// Props dialogu usuwania
interface DeleteFlashcardDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDTO | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}
```

## 6. Zarządzanie stanem

### Stan głównego kontenera (FlashcardsContainer)

Stan będzie zarządzany w komponencie `FlashcardsContainer` przy użyciu hooków React. Będzie wykorzystywał custom hook `useFlashcards` do enkapsulacji logiki zarządzania fiszkami.

```typescript
// Stan w FlashcardsContainer
const {
  flashcards,
  pagination,
  isLoading,
  error,
  loadFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  optimisticallyDeletedIds,
} = useFlashcards(userId, initialData);

// Stany dialogów
const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
const [dialogMode, setDialogMode] = useState<DialogMode>("create");
const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDTO | null>(null);

const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardDTO | null>(null);
```

### Custom Hook: useFlashcards

Hook `useFlashcards` będzie odpowiedzialny za:
- Zarządzanie listą fiszek
- Obsługę paginacji
- Wywołania API
- Optymistyczne UI przy usuwaniu
- Obsługę błędów

```typescript
function useFlashcards(userId: string, initialData: PaginatedFlashcardsResponse) {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>(initialData.data);
  const [pagination, setPagination] = useState<PaginationMeta>(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticallyDeletedIds, setOptimisticallyDeletedIds] = useState<Set<number>>(new Set());

  // Funkcja ładująca fiszki dla danej strony
  const loadFlashcards = async (page: number) => { /* ... */ };

  // Funkcja tworząca nową fiszkę
  const createFlashcard = async (data: FlashcardFormData) => { /* ... */ };

  // Funkcja aktualizująca fiszkę
  const updateFlashcard = async (id: number, data: FlashcardFormData) => { /* ... */ };

  // Funkcja usuwająca fiszkę (z optymistycznym UI)
  const deleteFlashcard = async (id: number) => { /* ... */ };

  return {
    flashcards,
    pagination,
    isLoading,
    error,
    loadFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    optimisticallyDeletedIds,
  };
}
```

### Stan formularza (CreateEditFlashcardDialog)

Formularz będzie zarządzany przy użyciu `useState` lub biblioteki formularzy jak `react-hook-form` (opcjonalnie).

```typescript
const [formData, setFormData] = useState<FlashcardFormData>({
  front: flashcard?.front || "",
  back: flashcard?.back || "",
});
const [formErrors, setFormErrors] = useState<FlashcardFormErrors>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

## 7. Integracja API

Integracja z API będzie realizowana poprzez wywołania funkcji z `src/lib/services/flashcard.service.ts` wewnątrz custom hooka `useFlashcards`.

### Endpointy i ich wykorzystanie

#### 1. Pobieranie listy fiszek (GET /api/flashcards)

**Funkcja serwisowa:** `listFlashcards(supabase, userId, filters, pagination)`

**Wywołanie:**
```typescript
const response = await fetch(`/api/flashcards?page=${page}&limit=${limit}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

if (!response.ok) {
  throw new Error('Failed to fetch flashcards');
}

const data: PaginatedFlashcardsResponse = await response.json();
```

**Typ żądania:** Brak body (parametry w query string)

**Typ odpowiedzi:** `PaginatedFlashcardsResponse`
```typescript
{
  data: FlashcardDTO[];
  pagination: PaginationMeta;
}
```

**Użycie:**
- Inicjalne załadowanie danych (SSR w Astro)
- Zmiana strony paginacji
- Odświeżenie po utworzeniu nowej fiszki

#### 2. Tworzenie fiszki (POST /api/flashcards)

**Funkcja serwisowa:** `createManualFlashcard(supabase, userId, command)`

**Wywołanie:**
```typescript
const response = await fetch('/api/flashcards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    front: formData.front,
    back: formData.back,
  } as CreateFlashcardCommand),
});

if (!response.ok) {
  const error: ErrorResponse = await response.json();
  throw new Error(error.error.message);
}

const newFlashcard: FlashcardDTO = await response.json();
```

**Typ żądania:** `CreateFlashcardCommand`
```typescript
{
  front: string;
  back: string;
}
```

**Typ odpowiedzi:** `FlashcardDTO`

**Użycie:**
- Po wypełnieniu i zatwierdzeniu formularza w trybie "create"
- Nowa fiszka jest dodawana do listy lub inicjowane jest przeładowanie pierwszej strony

#### 3. Aktualizacja fiszki (PATCH /api/flashcards/:id)

**Funkcja serwisowa:** `updateFlashcard(supabase, userId, flashcardId, command)`

**Wywołanie:**
```typescript
const response = await fetch(`/api/flashcards/${flashcardId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    front: formData.front,
    back: formData.back,
  } as UpdateFlashcardCommand),
});

if (!response.ok) {
  const error: ErrorResponse = await response.json();
  throw new Error(error.error.message);
}

const updatedFlashcard: FlashcardDTO = await response.json();
```

**Typ żądania:** `UpdateFlashcardCommand`
```typescript
{
  front?: string;
  back?: string;
}
```

**Typ odpowiedzi:** `FlashcardDTO`

**Użycie:**
- Po wypełnieniu i zatwierdzeniu formularza w trybie "edit"
- Zaktualizowana fiszka zastępuje starą wersję w liście

#### 4. Usuwanie fiszki (DELETE /api/flashcards/:id)

**Funkcja serwisowa:** `deleteFlashcard(supabase, userId, flashcardId)`

**Wywołanie:**
```typescript
// Optymistyczne UI - ukryj fiszkę natychmiast
setOptimisticallyDeletedIds(prev => new Set(prev).add(flashcardId));

try {
  const response = await fetch(`/api/flashcards/${flashcardId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error.message);
  }

  // Sukces - usuń z listy na stałe
  setFlashcards(prev => prev.filter(f => f.id !== flashcardId));
} catch (error) {
  // Błąd - cofnij optymistyczne UI
  setOptimisticallyDeletedIds(prev => {
    const newSet = new Set(prev);
    newSet.delete(flashcardId);
    return newSet;
  });
  throw error;
}
```

**Typ żądania:** Brak body

**Typ odpowiedzi:**
- Status 204 No Content (sukces)
- `ErrorResponse` (błąd)

**Użycie:**
- Po potwierdzeniu usunięcia w AlertDialog
- Implementacja optymistycznego UI

### Obsługa błędów API

Wszystkie wywołania API powinny być opakowane w try-catch i obsługiwać różne typy błędów:

```typescript
try {
  // Wywołanie API
} catch (error) {
  if (error instanceof Error) {
    // Sprawdź typ błędu i wyświetl odpowiedni komunikat
    if (error.message.includes('UNAUTHORIZED')) {
      // Przekieruj na login
      window.location.href = '/login';
    } else if (error.message.includes('NOT_FOUND')) {
      toast.error('Fiszka nie została znaleziona');
    } else {
      toast.error(error.message || 'Wystąpił nieoczekiwany błąd');
    }
  }
}
```

## 8. Interakcje użytkownika

### 1. Wyświetlanie listy fiszek

**Akcja:** Użytkownik wchodzi na stronę `/app/flashcards`

**Przebieg:**
1. Strona Astro pobiera dane z API (SSR)
2. Komponent `FlashcardsContainer` otrzymuje `initialData`
3. Wyświetlana jest lista fiszek lub stan pusty
4. Jeśli są fiszki, wyświetlane są kontrolki paginacji

**Wynik:**
- Lista fiszek jest widoczna
- Każda fiszka ma opcje Edytuj/Usuń w dropdown menu
- Widoczny przycisk "Dodaj fiszkę"

### 2. Tworzenie nowej fiszki

**Akcja:** Użytkownik klika przycisk "Dodaj fiszkę"

**Przebieg:**
1. Otwiera się `CreateEditFlashcardDialog` w trybie "create"
2. Pola formularza są puste
3. Focus ustawiony na pole "Przód"
4. Użytkownik wypełnia pola "Przód" i "Tył"
5. Walidacja na żywo sprawdza poprawność danych
6. Użytkownik klika "Zapisz"
7. Wywołanie API `POST /api/flashcards`
8. Dialog zamyka się
9. Nowa fiszka pojawia się na liście (refresh pierwszej strony)

**Wynik:**
- Nowa fiszka jest widoczna na liście
- Toast z komunikatem sukcesu: "Fiszka została utworzona"
- Dialog jest zamknięty

**Scenariusz alternatywny (błąd):**
- API zwraca błąd
- Dialog pozostaje otwarty
- Wyświetlany jest komunikat błędu w dialogu
- Dane w formularzu są zachowane

### 3. Edycja istniejącej fiszki

**Akcja:** Użytkownik klika "Edytuj" w dropdown menu przy fiszce

**Przebieg:**
1. Otwiera się `CreateEditFlashcardDialog` w trybie "edit"
2. Pola formularza są wypełnione aktualnymi wartościami
3. Focus ustawiony na pole "Przód"
4. Użytkownik modyfikuje pola
5. Walidacja na żywo sprawdza poprawność danych
6. Użytkownik klika "Zapisz"
7. Wywołanie API `PATCH /api/flashcards/:id`
8. Dialog zamyka się
9. Fiszka na liście jest zaktualizowana

**Wynik:**
- Fiszka na liście ma zaktualizowane wartości
- Toast z komunikatem sukcesu: "Fiszka została zaktualizowana"
- Dialog jest zamknięty
- Jeśli fiszka miała source="ai-full", teraz ma source="ai-edited"

**Scenariusz alternatywny (błąd):**
- Jak w tworzeniu fiszki

### 4. Usuwanie fiszki

**Akcja:** Użytkownik klika "Usuń" w dropdown menu przy fiszce

**Przebieg:**
1. Otwiera się `DeleteFlashcardDialog`
2. Wyświetlany jest komunikat potwierdzenia
3. Opcjonalnie: preview fiszki (przód)
4. Użytkownik klika "Usuń"
5. **Optymistyczne UI:** Fiszka natychmiast znika z listy (fade out)
6. Wywołanie API `DELETE /api/flashcards/:id`
7. Dialog zamyka się
8. Fiszka pozostaje usunięta

**Wynik:**
- Fiszka nie jest już widoczna na liście
- Toast z komunikatem sukcesu: "Fiszka została usunięta"
- Dialog jest zamknięty
- Jeśli była ostatnia na stronie i nie jest to strona 1, użytkownik wraca do poprzedniej strony

**Scenariusz alternatywny (błąd):**
- API zwraca błąd
- Fiszka pojawia się ponownie na liście (cofnięcie optymistycznego UI)
- Toast z komunikatem błędu: "Nie udało się usunąć fiszki"
- Dialog jest zamknięty

### 5. Anulowanie operacji w dialogach

**Akcja:** Użytkownik klika "Anuluj" lub zamyka dialog (X, Escape)

**Przebieg:**
1. Dialog zamyka się
2. Żadne zmiany nie są zapisywane
3. Stan formularza jest resetowany

**Wynik:**
- Dialog jest zamknięty
- Lista fiszek pozostaje bez zmian

### 6. Zmiana strony paginacji

**Akcja:** Użytkownik klika "Następna strona" lub "Poprzednia strona"

**Przebieg:**
1. Ustawienie `isLoading = true`
2. Wyświetlenie skeleton loaderów
3. Wywołanie API `GET /api/flashcards?page={newPage}&limit={limit}`
4. Zaktualizowanie listy fiszek
5. Zaktualizowanie metadanych paginacji
6. Ustawienie `isLoading = false`

**Wynik:**
- Wyświetlane są fiszki z nowej strony
- Kontrolki paginacji pokazują aktualną stronę
- Przyciski są odpowiednio enabled/disabled

### 7. Brak fiszek (Empty State)

**Akcja:** Użytkownik nie ma jeszcze fiszek lub usunął wszystkie

**Przebieg:**
1. Wyświetlany jest komponent `EmptyState`
2. Komunikat zachęcający do stworzenia pierwszej fiszki
3. Przycisk "Stwórz pierwszą fiszkę"

**Wynik:**
- Widoczny przyjazny komunikat
- Kliknięcie przycisku otwiera dialog tworzenia

## 9. Warunki i walidacja

### Walidacja formularza (CreateEditFlashcardDialog)

#### Pole "Przód" (front)

**Warunki:**
- Wymagane
- Min 1 znak (po trim)
- Max 500 znaków

**Walidacja w komponencie:**
```typescript
const validateFront = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Przód fiszki jest wymagany";
  }
  if (trimmed.length > 500) {
    return "Maksymalnie 500 znaków";
  }
  return undefined;
};
```

**Wpływ na UI:**
- Komunikat błędu pod polem
- Czerwona ramka wokół pola
- Submit button disabled
- Licznik znaków (np. "485 / 500")

#### Pole "Tył" (back)

**Warunki:**
- Wymagane
- Min 1 znak (po trim)
- Max 1000 znaków

**Walidacja w komponencie:**
```typescript
const validateBack = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Tył fiszki jest wymagany";
  }
  if (trimmed.length > 1000) {
    return "Maksymalnie 1000 znaków";
  }
  return undefined;
};
```

**Wpływ na UI:**
- Jak wyżej

#### Submit button

**Warunki disabled:**
- Którekolwiek pole ma błąd walidacji
- Oba pola są puste
- `isSubmitting === true`

**Implementacja:**
```typescript
const isFormValid =
  !formErrors.front &&
  !formErrors.back &&
  formData.front.trim().length > 0 &&
  formData.back.trim().length > 0;

const isSubmitDisabled = !isFormValid || isSubmitting;
```

### Walidacja paginacji (PaginationControls)

#### Przycisk "Poprzednia strona"

**Warunki disabled:**
- `pagination.page === 1`

#### Przycisk "Następna strona"

**Warunki disabled:**
- `pagination.page >= pagination.total_pages`
- `pagination.total === 0`

### Walidacja autoryzacji (flashcards.astro)

**Warunki:**
- `Astro.locals.user` musi istnieć
- `Astro.locals.user.id` musi być prawidłowym UUID

**Wpływ na UI:**
- Jeśli brak autoryzacji: przekierowanie na `/login`
- Jeśli autoryzacja OK: renderowanie strony

### Warunki wyświetlania komponentów

#### EmptyState

**Warunek wyświetlenia:**
```typescript
flashcards.length === 0 && !isLoading && !error
```

#### FlashcardList

**Warunek wyświetlenia:**
```typescript
flashcards.length > 0 || isLoading
```

#### PaginationControls

**Warunek wyświetlenia:**
```typescript
pagination.total_pages > 1
```

#### Skeleton loaders

**Warunek wyświetlenia:**
```typescript
isLoading === true
```

### Optymistyczne UI przy usuwaniu

**Warunek ukrycia fiszki:**
```typescript
optimisticallyDeletedIds.has(flashcard.id)
```

**Implementacja w FlashcardCard:**
```typescript
if (isOptimisticallyDeleted) {
  return null; // lub fade out animation
}
```

## 10. Obsługa błędów

### Błędy ładowania listy fiszek

**Scenariusz:** Błąd podczas `loadFlashcards()`

**Obsługa:**
1. Wychwycenie błędu w try-catch
2. Ustawienie `error` w state
3. Wyświetlenie komunikatu błędu w UI
4. Przycisk "Spróbuj ponownie" wywołuje `loadFlashcards()` ponownie

**UI:**
```typescript
if (error && flashcards.length === 0) {
  return (
    <div className="text-center">
      <p className="text-destructive">{error}</p>
      <Button onClick={() => loadFlashcards(pagination.page)}>
        Spróbuj ponownie
      </Button>
    </div>
  );
}
```

### Błędy tworzenia fiszki

**Scenariusz:** Błąd podczas `createFlashcard()`

**Obsługa:**
1. Wychwycenie błędu w try-catch w `handleSubmit`
2. Wyświetlenie komunikatu błędu w dialogu (nad formularzem)
3. Dialog pozostaje otwarty
4. Dane w formularzu zachowane
5. Użytkownik może poprawić dane lub anulować

**UI:**
```typescript
{submitError && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{submitError}</AlertDescription>
  </Alert>
)}
```

### Błędy edycji fiszki

**Scenariusz:** Błąd podczas `updateFlashcard()`

**Obsługa:**
- Analogicznie do błędów tworzenia

**Dodatkowy scenariusz - fiszka nie istnieje (404):**
1. API zwraca `NOT_FOUND`
2. Dialog zamyka się
3. Toast: "Fiszka nie została znaleziona"
4. Opcjonalnie: refresh listy

### Błędy usuwania fiszki

**Scenariusz:** Błąd podczas `deleteFlashcard()`

**Obsługa:**
1. Wychwycenie błędu w try-catch
2. **Cofnięcie optymistycznego UI:** fiszka pojawia się ponownie na liście
3. Dialog zamyka się
4. Toast z komunikatem błędu: "Nie udało się usunąć fiszki. Spróbuj ponownie."

**Implementacja:**
```typescript
const handleDelete = async (flashcardId: number) => {
  // Optymistyczne UI
  setOptimisticallyDeletedIds(prev => new Set(prev).add(flashcardId));

  try {
    await deleteFlashcard(flashcardId);
    // Sukces - fiszka pozostaje ukryta
    setFlashcards(prev => prev.filter(f => f.id !== flashcardId));
    toast.success("Fiszka została usunięta");
  } catch (error) {
    // Błąd - cofnij optymistyczne UI
    setOptimisticallyDeletedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(flashcardId);
      return newSet;
    });
    toast.error("Nie udało się usunąć fiszki");
  } finally {
    setIsDeleteDialogOpen(false);
    setDeletingFlashcard(null);
  }
};
```

### Błędy walidacji

**Scenariusz:** Użytkownik wpisuje nieprawidłowe dane w formularzu

**Obsługa:**
1. Walidacja na żywo (onChange)
2. Komunikaty błędów pod polami
3. Submit button disabled
4. Użytkownik może poprawić dane

### Błędy autoryzacji (401/403)

**Scenariusz:** Sesja wygasła lub użytkownik nie ma uprawnień

**Obsługa:**
1. Wychwycenie błędu UNAUTHORIZED
2. Przekierowanie na `/login`
3. Opcjonalnie: zapisanie aktualnej ścieżki do powrotu po zalogowaniu

**Implementacja:**
```typescript
if (error.message.includes('UNAUTHORIZED')) {
  window.location.href = `/login?redirect=/app/flashcards`;
}
```

### Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem lub timeout

**Obsługa:**
1. Wychwycenie błędu fetch
2. Toast: "Brak połączenia z internetem. Sprawdź swoje połączenie."
3. Opcja ponownego wywołania

### Scenariusz: Usuwanie ostatniej fiszki na stronie

**Scenariusz:** Użytkownik usuwa ostatnią fiszkę na stronie 3 (i nie jest to strona 1)

**Obsługa:**
1. Po udanym usunięciu sprawdź `flashcards.length`
2. Jeśli `flashcards.length === 0` i `pagination.page > 1`
3. Wywołaj `loadFlashcards(pagination.page - 1)`
4. Użytkownik widzi poprzednią stronę

**Implementacja:**
```typescript
const handleDeleteSuccess = async (flashcardId: number) => {
  const newFlashcards = flashcards.filter(f => f.id !== flashcardId);
  setFlashcards(newFlashcards);

  // Jeśli usunęliśmy ostatnią fiszkę na stronie (i nie jesteśmy na stronie 1)
  if (newFlashcards.length === 0 && pagination.page > 1) {
    await loadFlashcards(pagination.page - 1);
  } else if (newFlashcards.length === 0 && pagination.page === 1) {
    // Jesteśmy na stronie 1 i nie ma więcej fiszek - pokaż EmptyState
    setPagination(prev => ({ ...prev, total: 0, total_pages: 0 }));
  }
};
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1.1. Utwórz strukturę katalogów:
```
src/pages/app/flashcards.astro
src/components/flashcards/
  FlashcardsContainer.tsx
  FlashcardsHeader.tsx
  FlashcardList.tsx
  FlashcardCard.tsx
  EmptyState.tsx
  PaginationControls.tsx
  CreateEditFlashcardDialog.tsx
  DeleteFlashcardDialog.tsx
src/components/hooks/
  useFlashcards.ts
```

1.2. Dodaj nowe typy do odpowiedniego pliku:
```
src/types/flashcards-view.types.ts (nowe typy ViewModel)
```

### Krok 2: Implementacja typów

2.1. Stwórz plik `src/types/flashcards-view.types.ts`

2.2. Zdefiniuj wszystkie typy ViewModel zgodnie z sekcją 5

2.3. Wyeksportuj wszystkie typy

### Krok 3: Implementacja endpointów API

3.1. Stwórz endpoint `GET /api/flashcards`
- Plik: `src/pages/api/flashcards.ts`
- Handler dla GET
- Walidacja query params (page, limit) z Zod
- Wywołanie `listFlashcards()` z service
- Zwrócenie `PaginatedFlashcardsResponse`

3.2. Stwórz endpoint `POST /api/flashcards`
- Ten sam plik
- Handler dla POST
- Walidacja body z Zod (`CreateFlashcardCommand`)
- Wywołanie `createManualFlashcard()` z service
- Zwrócenie `FlashcardDTO`

3.3. Stwórz endpoint `PATCH /api/flashcards/[id].ts`
- Plik: `src/pages/api/flashcards/[id].ts`
- Handler dla PATCH
- Walidacja params i body z Zod
- Wywołanie `updateFlashcard()` z service
- Zwrócenie `FlashcardDTO`

3.4. Stwórz endpoint `DELETE /api/flashcards/[id].ts`
- Ten sam plik
- Handler dla DELETE
- Walidacja params z Zod
- Wywołanie `deleteFlashcard()` z service
- Zwrócenie status 204 lub błędu

### Krok 4: Implementacja custom hooka useFlashcards

4.1. Stwórz plik `src/components/hooks/useFlashcards.ts`

4.2. Zaimplementuj hook zgodnie z sekcją 6:
- Stan (flashcards, pagination, isLoading, error, optimisticallyDeletedIds)
- Funkcja `loadFlashcards(page)`
- Funkcja `createFlashcard(data)`
- Funkcja `updateFlashcard(id, data)`
- Funkcja `deleteFlashcard(id)` z optymistycznym UI
- Obsługa błędów dla każdej funkcji

4.3. Przetestuj hook izolując logikę

### Krok 5: Implementacja komponentów UI (bottom-up)

#### 5.1. EmptyState.tsx
- Prosty komponent prezentacyjny
- Ikona, tekst, przycisk
- Props: `onCreateClick`

#### 5.2. FlashcardCard.tsx
- Card z Shadcn
- Wyświetlanie front i back
- DropdownMenu z akcjami
- Props: `flashcard`, `onEdit`, `onDelete`, `isOptimisticallyDeleted`
- Obsługa długich tekstów (truncate)

#### 5.3. PaginationControls.tsx
- Przyciski nawigacji
- Wyświetlanie informacji o stronie
- Props: `pagination`, `onPageChange`
- Logika disabled dla przycisków

#### 5.4. FlashcardList.tsx
- Warunkowe renderowanie EmptyState lub listy
- Grid/Flex layout dla kart
- Skeleton loaders dla `isLoading`
- Props: `flashcards`, `onEdit`, `onDelete`, `onCreateClick`, `isLoading`

#### 5.5. FlashcardsHeader.tsx
- Nagłówek z tytułem
- Przycisk "Dodaj fiszkę"
- Props: `onCreateClick`

#### 5.6. CreateEditFlashcardDialog.tsx
- Dialog z Shadcn
- Formularz z dwoma Textarea
- Walidacja na żywo
- Liczniki znaków
- Komunikaty błędów
- Loading state dla submit
- Props zgodnie z sekcją 4

#### 5.7. DeleteFlashcardDialog.tsx
- AlertDialog z Shadcn
- Komunikat potwierdzenia
- Preview fiszki (opcjonalnie)
- Loading state dla delete
- Props zgodnie z sekcją 4

### Krok 6: Implementacja głównego kontenera React

6.1. Stwórz `FlashcardsContainer.tsx`

6.2. Zaimplementuj zgodnie z sekcją 4:
- Użyj hooka `useFlashcards`
- Stan dialogów (create/edit, delete)
- Handlery dla wszystkich akcji:
  - `handleCreateClick`
  - `handleEditClick`
  - `handleDeleteClick`
  - `handleCreateEditSubmit`
  - `handleDeleteConfirm`
  - `handlePageChange`
- Renderowanie wszystkich komponentów dzieci
- Przekazywanie propsów

6.3. Dodaj toast notifications (np. Sonner z Shadcn)

### Krok 7: Implementacja strony Astro

7.1. Stwórz `src/pages/app/flashcards.astro`

7.2. Zaimplementuj:
- Import layoutu i komponentów
- Sprawdzenie autoryzacji (`Astro.locals.user`)
- Przekierowanie na `/login` jeśli brak autoryzacji
- Pobranie inicjalnych danych z `listFlashcards()` (SSR)
- Renderowanie layoutu z `FlashcardsContainer` (client:load)
- Przekazanie `initialData` i `userId` jako props

7.3. Przykładowa struktura:
```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import FlashcardsContainer from '@/components/flashcards/FlashcardsContainer';
import { listFlashcards } from '@/lib/services/flashcard.service';

const user = Astro.locals.user;

if (!user) {
  return Astro.redirect('/login?redirect=/app/flashcards');
}

const supabase = Astro.locals.supabase;
const initialData = await listFlashcards(supabase, user.id, {}, { page: 1, limit: 20 });
---

<BaseLayout title="Moje Fiszki">
  <FlashcardsContainer
    client:load
    initialData={initialData}
    userId={user.id}
  />
</BaseLayout>
```

### Krok 8: Stylowanie i responsywność

8.1. Dodaj style Tailwind do wszystkich komponentów

8.2. Upewnij się, że widok jest responsywny:
- Mobile: 1 kolumna w grid
- Tablet: 2 kolumny
- Desktop: 3-4 kolumny

8.3. Dodaj animacje:
- Fade out przy optymistycznym usuwaniu
- Fade in dla nowych fiszek
- Animacje dla dialogów (domyślne w Shadcn)

8.4. Dostosuj dark mode (jeśli implementowany)

### Krok 9: Testowanie dostępności

9.1. Sprawdź fokus w dialogach:
- Focus trap w modalach
- Focus na pierwszym polu po otwarciu
- Powrót focusa po zamknięciu

9.2. Sprawdź nawigację klawiaturą:
- Tab przez wszystkie elementy interaktywne
- Enter do submit
- Escape do zamykania dialogów
- Strzałki w dropdown menu

9.3. Sprawdź atrybuty ARIA:
- `aria-label` dla przycisków ikonowych
- `aria-describedby` dla komunikatów błędów
- `role` dla elementów niestandardowych

9.4. Przetestuj z screen readerem

### Krok 10: Testowanie funkcjonalne

10.1. Przetestuj wszystkie scenariusze z sekcji 8:
- Wyświetlanie listy
- Tworzenie fiszki
- Edycja fiszki
- Usuwanie fiszki
- Paginacja
- Empty state

10.2. Przetestuj wszystkie scenariusze błędów z sekcji 10:
- Błędy API
- Błędy walidacji
- Błędy sieciowe
- Autoryzacja

10.3. Przetestuj edge cases:
- Bardzo długie teksty
- Znaki specjalne w fiszkach
- Usuwanie ostatniej fiszki na stronie
- Wygaśnięcie sesji

### Krok 11: Optymalizacja i polish

11.1. Dodaj loading skeletons

11.2. Zoptymalizuj renderowanie:
- React.memo dla FlashcardCard (jeśli potrzebne)
- useCallback dla handlerów przekazywanych do dzieci

11.3. Dodaj debouncing dla walidacji formularza (opcjonalnie)

11.4. Sprawdź performance z React DevTools

11.5. Przetestuj na różnych przeglądarkach

### Krok 12: Dokumentacja i finalizacja

12.1. Dodaj komentarze JSDoc do kluczowych funkcji

12.2. Zaktualizuj dokumentację projektu (jeśli istnieje)

12.3. Stwórz pull request z opisem zmian

12.4. Code review

12.5. Merge do głównej gałęzi

---

## Notatki dodatkowe

### Konfiguracja limitów

Limity znaków dla pól formularza powinny być zdefiniowane jako stałe i współdzielone między frontendem a backendem:

```typescript
// src/lib/constants/flashcards.ts
export const FLASHCARD_LIMITS = {
  FRONT_MAX_LENGTH: 500,
  BACK_MAX_LENGTH: 1000,
  PAGE_SIZE_DEFAULT: 20,
  PAGE_SIZE_MAX: 100,
} as const;
```

### Biblioteki pomocnicze

Rozważ użycie następujących bibliotek:
- **react-hook-form** - zaawansowane zarządzanie formularzami (opcjonalnie)
- **zod** - walidacja schematów (wykorzystywana w API)
- **sonner** - toast notifications (część Shadcn)
- **lucide-react** - ikony (część Shadcn)

### Rozszerzenia przyszłe

Plan implementacji uwzględnia podstawową funkcjonalność. W przyszłości można rozszerzyć o:
- Filtrowanie fiszek po źródle (manual, ai-full, ai-edited)
- Sortowanie (po dacie, alfabetycznie)
- Wyszukiwanie fiszek
- Bulk operations (zaznaczanie wielu, masowe usuwanie)
- Eksport/import fiszek
- Kategoryzacja fiszek (tagi)
