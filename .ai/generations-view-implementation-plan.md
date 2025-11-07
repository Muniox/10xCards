# Plan implementacji widoku Generator Fiszek

## 1. Przegląd
Widok "Generator Fiszek" jest kluczowym elementem aplikacji, który umożliwia użytkownikom automatyczne tworzenie fiszek na podstawie dostarczonego tekstu. Użytkownik wkleja tekst, inicjuje proces generowania, a następnie otrzymuje listę propozycji fiszek. Może je przeglądać, edytować i wybierać, które z nich zapisać w swoim zbiorze. Celem jest maksymalne przyspieszenie procesu tworzenia materiałów do nauki.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/app/generate`. Dostęp do tej ścieżki powinien być chroniony i wymagać zalogowanego użytkownika.

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane w React i osadzone na stronie Astro. Hierarchia komponentów będzie wyglądać następująco:

```
/src/pages/app/generate.astro
└── FlashcardGeneratorView.tsx (client:load)
    ├── SourceTextInput (komponent potomny lub implementacja wewnątrz)
    │   └── Textarea (z shadcn/ui)
    ├── SuggestionList
    │   ├── Skeleton (z shadcn/ui, podczas ładowania)
    │   ├── ErrorDisplay (komponent do wyświetlania błędu)
    │   └── SuggestionItem[] (lista komponentów)
    │       ├── Card (z shadcn/ui)
    │       ├── Checkbox (z shadcn/ui)
    │       ├── Textarea (dla edycji frontu i tyłu)
    └── Akcje
        ├── Button "Generuj" (z shadcn/ui)
        └── Button "Zapisz wybrane" (z shadcn/ui)
```

## 4. Szczegóły komponentów

### `FlashcardGeneratorView` (Komponent główny)
- **Opis komponentu:** Główny kontener widoku, zarządzający całym stanem i logiką generowania oraz zapisywania fiszek.
- **Główne elementy:** Zawiera pole tekstowe na tekst źródłowy, przycisk do generowania, listę sugestii oraz przycisk do zapisywania wybranych fiszek.
- **Obsługiwane interakcje:**
    - Wprowadzanie tekstu źródłowego.
    - Inicjowanie generowania fiszek.
    - Inicjowanie zapisu wybranych fiszek.
- **Warunki walidacji:** Brak.
- **Typy:** `SuggestionViewModel`, `GenerateFlashcardsCommand`, `BulkCreateFlashcardsCommand`.
- **Propsy:** Brak.

### `SourceTextInput`
- **Opis komponentu:** Odpowiada za obsługę pola `Textarea` na tekst źródłowy.
- **Główne elementy:** `Textarea`, licznik znaków, komunikaty walidacyjne.
- **Obsługiwane interakcje:** Aktualizacja stanu tekstu źródłowego przy wpisywaniu.
- **Obsługiwana walidacja:** Sprawdza, czy długość tekstu mieści się w przedziale 1000-10000 znaków. Komunikat walidacyjny jest wyświetlany, jeśli warunek nie jest spełniony.
- **Typy:** `string` (dla tekstu).
- **Propsy:** `value: string`, `onChange: (value: string) => void`, `error: string | null`.

### `SuggestionList`
- **Opis komponentu:** Wyświetla listę wygenerowanych sugestii fiszek. Obsługuje stany ładowania, błędu i pustej listy.
- **Główne elementy:** Kontener listy, komponenty `SuggestionItem`, `Skeleton` (podczas ładowania) lub komunikat o błędzie/braku danych.
- **Obsługiwane interakcje:** Brak (delegowane do `SuggestionItem`).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `SuggestionViewModel[]`.
- **Propsy:** `suggestions: SuggestionViewModel[]`, `isLoading: boolean`, `error: string | null`, `onUpdate: (updatedSuggestion: SuggestionViewModel) => void`, `onToggleSelect: (id: string) => void`.

### `SuggestionItem`
- **Opis komponentu:** Reprezentuje pojedynczą sugestię fiszki na liście. Umożliwia jej zaznaczenie i edycję.
- **Główne elementy:** `Card`, `Checkbox`, dwa pola `Textarea` (dla przodu i tyłu fiszki).
- **Obsługiwane interakcje:**
    - Zaznaczenie/odznaczenie fiszki za pomocą `Checkbox`.
    - Edycja treści `front` i `back` w polach `Textarea`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `SuggestionViewModel`.
- **Propsy:** `suggestion: SuggestionViewModel`, `onUpdate: (updatedSuggestion: SuggestionViewModel) => void`, `onToggleSelect: (id: string) => void`.

## 5. Typy
Do implementacji widoku, oprócz typów DTO z `src/types.ts`, potrzebny będzie niestandardowy typ `ViewModel` do zarządzania stanem UI.

```typescript
/**
 * ViewModel dla pojedynczej sugestii fiszki w UI.
 * Rozszerza standardową sugestię o stan potrzebny do interakcji.
 */
interface SuggestionViewModel {
  id: string; // Unikalny identyfikator po stronie klienta (np. z crypto.randomUUID())
  front: string; // Aktualna treść przodu fiszki (może być edytowana)
  back: string; // Aktualna treść tyłu fiszki (może być edytowana)
  isSelected: boolean; // Czy fiszka jest zaznaczona do zapisu
  
  // Pola do śledzenia, czy fiszka została zmodyfikowana przez użytkownika
  originalFront: string; 
  originalBack: string;
}
```
- **`id`**: Kluczowy dla Reacta do renderowania listy.
- **`isSelected`**: Określa, czy dana fiszka zostanie wysłana do zapisu.
- **`originalFront` / `originalBack`**: Przechowują pierwotną wersję sugestii, aby na tej podstawie określić `FlashcardSource` (`ai-full` vs `ai-edited`) podczas zapisu.

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w komponencie `FlashcardGeneratorView` przy użyciu hooków `useState` z Reacta. Nie ma potrzeby stosowania zewnętrznej biblioteki do zarządzania stanem.

Główne zmienne stanu:
- `sourceText: string`: Przechowuje tekst z głównego pola `Textarea`.
- `suggestions: SuggestionViewModel[]`: Lista sugestii pobranych z API i dostosowanych do UI.
- `generationId: number | null`: ID sesji generowania, zwrócone przez API, niezbędne do zapisu fiszek.
- `status: 'idle' | 'generating' | 'saving' | 'success' | 'error'`: Faza cyklu życia widoku, kontrolująca wyświetlanie UI (np. ładowanie, błędy).
- `error: string | null`: Komunikat błędu do wyświetlenia.

Do obsługi zapytań API zostanie wykorzystany niestandardowy hook `useFetch`, zgodnie z założeniami z `ui-plan.md`, co ujednolici obsługę stanów ładowania i błędów.

## 7. Integracja API

1.  **Generowanie fiszek:**
    - **Endpoint:** `POST /api/generations`
    - **Akcja:** Po kliknięciu przycisku "Generuj".
    - **Typ żądania:** `GenerateFlashcardsCommand` (`{ source_text: string }`)
    - **Typ odpowiedzi (sukces):** `GenerationResultDTO` (`{ generation_id, suggestions: FlashcardSuggestion[] }`)
    - **Logika frontendu:**
        - Wywołanie API z `sourceText`.
        - Po otrzymaniu odpowiedzi, `generation_id` jest zapisywane w stanie.
        - `suggestions` z odpowiedzi są mapowane na `SuggestionViewModel[]` i zapisywane w stanie.

2.  **Zapisywanie fiszek:**
    - **Endpoint:** `POST /api/flashcards/bulk`
    - **Akcja:** Po kliknięciu przycisku "Zapisz wybrane".
    - **Typ żądania:** `BulkCreateFlashcardsCommand` (`{ generation_id: number, flashcards: FlashcardForBulkCreate[] }`)
    - **Typ odpowiedzi (sukces):** `BulkCreateFlashcardsResponse`
    - **Logika frontendu:**
        - Filtrowanie stanu `suggestions`, aby wybrać tylko te z `isSelected: true`.
        - Mapowanie wybranych `SuggestionViewModel` na tablicę `FlashcardForBulkCreate`. Dla każdej fiszki:
            - Porównaj `front` z `originalFront` i `back` z `originalBack`.
            - Jeśli nie ma zmian, `source` to `'ai-full'`.
            - Jeśli są zmiany, `source` to `'ai-edited'`.
        - Wywołanie API z `generationId` i przygotowaną tablicą fiszek.

## 8. Interakcje użytkownika
- **Użytkownik wpisuje tekst:** Licznik znaków się aktualizuje. Przycisk "Generuj" jest aktywny tylko, gdy tekst ma 1000-10000 znaków.
- **Użytkownik klika "Generuj":** Przycisk staje się nieaktywny, a w miejscu listy sugestii pojawiają się `Skeletony`.
- **Sugestie pojawiają się:** Lista jest renderowana. Każdy element ma `Checkbox` i edytowalne pola.
- **Użytkownik zaznacza `Checkbox`:** Fiszka zostaje oznaczona do zapisu. Przycisk "Zapisz wybrane" staje się aktywny.
- **Użytkownik edytuje fiszkę:** Zmiany są zapisywane w stanie `SuggestionViewModel` dla tej konkretnej fiszki.
- **Użytkownik klika "Zapisz wybrane":** Przycisk staje się nieaktywny. Po pomyślnym zapisie pojawia się `Toast` z potwierdzeniem, a stan widoku jest resetowany.

## 9. Warunki i walidacja
- **Długość tekstu źródłowego:** Musi zawierać od 1000 do 10 000 znaków. Walidacja odbywa się po stronie klienta. Przycisk "Generuj" jest nieaktywny, jeśli warunek nie jest spełniony, a pod polem `Textarea` wyświetlany jest odpowiedni komunikat.
- **Wybór fiszek do zapisu:** Przycisk "Zapisz wybrane" jest aktywny tylko wtedy, gdy co najmniej jedna fiszka z listy jest zaznaczona (`isSelected: true`).

## 10. Obsługa błędów
- **Błąd walidacji (długość tekstu):** Komunikat wyświetlany w czasie rzeczywistym pod polem `Textarea`.
- **Błąd API podczas generowania:** W miejscu listy sugestii wyświetlany jest komponent błędu z komunikatem, np. "Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie."
- **Błąd API podczas zapisu:** Wyświetlany jest `Toast` z informacją o błędzie, np. "Nie udało się zapisać fiszek." Stan widoku nie jest resetowany, aby użytkownik mógł spróbować ponownie.
- **Brak sugestii:** Jeśli API zwróci pustą listę, w miejscu listy wyświetlany jest komunikat, np. "Nie udało się wygenerować żadnych propozycji dla tego tekstu."

## 11. Kroki implementacji
1.  Stworzenie pliku strony `src/pages/app/generate.astro` i osadzenie w nim komponentu React `FlashcardGeneratorView.tsx` z opcją `client:load`.
2.  Zaimplementowanie szkieletu komponentu `FlashcardGeneratorView` z podstawowymi zmiennymi stanu (`sourceText`, `status`, `suggestions` etc.).
3.  Dodanie komponentu `Textarea` (z `shadcn/ui`) i implementacja logiki walidacji długości tekstu wraz z licznikiem znaków.
4.  Implementacja logiki przycisku "Generuj", który wywołuje `POST /api/generations`. Obsługa stanu ładowania (`generating`) poprzez wyświetlanie komponentów `Skeleton`.
5.  Po otrzymaniu odpowiedzi z API, zaimplementowanie mapowania `GenerationResultDTO` na `SuggestionViewModel[]` i zapisanie wyniku w stanie.
6.  Stworzenie komponentów `SuggestionList` i `SuggestionItem` do wyświetlania listy sugestii.
7.  Implementacja edycji `front` i `back` oraz zaznaczania (`isSelected`) w komponencie `SuggestionItem`. Zmiany powinny być propagowane do głównego komponentu.
8.  Implementacja logiki przycisku "Zapisz wybrane", który:
    - Przygotowuje `BulkCreateFlashcardsCommand` na podstawie stanu `suggestions`.
    - Poprawnie określa `source` (`ai-full` lub `ai-edited`).
    - Wywołuje `POST /api/flashcards/bulk`.
9.  Implementacja obsługi odpowiedzi po zapisie: wyświetlenie `Toast` (sukces/błąd) i zresetowanie stanu widoku w przypadku sukcesu.
10. Ostylowanie wszystkich komponentów przy użyciu Tailwind CSS i komponentów `shadcn/ui` w celu zapewnienia spójności z resztą aplikacji.
