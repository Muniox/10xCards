# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika aplikacji 10xCards została zaprojektowana w celu zapewnienia płynnego, intuicyjnego i wydajnego doświadczenia. Stos technologiczny opiera się na Astro, React, TypeScript i Tailwind CSS, z wykorzystaniem biblioteki komponentów shadcn/ui do budowy spójnego i dostępnego interfejsu.

Struktura jest zorientowana na widoki, z których każdy odpowiada za określoną funkcjonalność (np. generowanie fiszek, zarządzanie nimi, nauka). Centralnym punktem nawigacyjnym jest stały, poziomy pasek na górze strony, zapewniający łatwy dostęp do wszystkich kluczowych sekcji. Zarządzanie stanem opiera się na wbudowanych hookach React oraz niestandardowym hooku `useFetch` do komunikacji z API, co upraszcza logikę i zapewnia spójną obsługę stanów ładowania, danych i błędów. Architektura jest przygotowana na przyszłą implementację uwierzytelniania poprzez wydzielenie chronionych ścieżek (`/app/*`).

## 2. Lista widoków

### Widok: Strona Główna (Landing Page)
- **Ścieżka widoku:** `/`
- **Główny cel:** Przedstawienie aplikacji nowym, niezalogowanym użytkownikom, wyjaśnienie jej wartości i zachęcenie do rejestracji.
- **Kluczowe informacje do wyświetlenia:**
    - Chwytliwy nagłówek (np. "Twórz fiszki 10x szybciej z AI").
    - Krótki opis kluczowych funkcji (generowanie z tekstu, inteligentne powtórki).
    - Grafika lub krótki filmik pokazujący działanie aplikacji.
    - Wyraźne przyciski Call-to-Action (CTA) do logowania i rejestracji.
- **Kluczowe komponenty widoku:**
    - `Button`: Przyciski CTA ("Zacznij za darmo", "Zaloguj się").
    - Komponenty do budowy sekcji marketingowych (np. `Hero`, `FeatureSection`).
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Strona powinna być atrakcyjna wizualnie i jasno komunikować korzyści.
    - **Dostępność:** Strona publiczna musi być w pełni dostępna, z poprawną strukturą nagłówków i semantycznym HTML.

### Widok: Dashboard (Panel Główny)
- **Ścieżka widoku:** `/app/dashboard`
- **Główny cel:** Prezentacja zagregowanych statystyk dotyczących efektywności generowania fiszek przez AI. Jest to domyślny widok po zalogowaniu.
- **Kluczowe informacje do wyświetlenia:**
    - Łączna liczba generacji (`total_generations`).
    - Łączna liczba wygenerowanych fiszek (`total_generated_flashcards`).
    - Współczynnik akceptacji (`acceptance_rate`).
    - Procent zaakceptowanych fiszek bez edycji (`unedited_acceptance_rate`).
    - Średni czas generowania (`average_generation_duration`).
- **Kluczowe komponenty widoku:**
    - `Card`: Do wizualnej prezentacji każdej metryki.
    - `Skeleton`: Do wyświetlania stanu ładowania podczas pobierania danych.
    - Komponent stanu błędu/pustego.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Zapewnia użytkownikowi szybki wgląd w wartość, jaką daje korzystanie z AI.
    - **Dostępność:** Poprawne użycie nagłówków; wartości statystyczne są dostępne dla czytników ekranu.

### Widok: Generator Fiszek
- **Ścieżka widoku:** `/app/generate`
- **Główny cel:** Umożliwienie użytkownikowi wklejenia tekstu, wygenerowania sugestii fiszek, ich edycji i zapisania w systemie.
- **Kluczowe informacje do wyświetlenia:**
    - Pole tekstowe na tekst źródłowy.
    - Lista wygenerowanych propozycji (przód, tył), każda z opcją akceptacji.
- **Kluczowe komponenty widoku:**
    - `Textarea`: Do wklejenia tekstu źródłowego.
    - `Button`: Do uruchomienia procesu generowania i zapisu.
    - `Card`: Do wyświetlania każdej propozycji fiszki.
    - `Checkbox`: Do zaznaczania fiszek do zapisu.
    - `Input` / `Textarea` wewnątrz karty: Do edycji treści propozycji przed zapisem.
    - `Toast`: Do informowania o pomyślnym zapisaniu fiszek.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Jasny wskaźnik ładowania po kliknięciu "Generuj". Walidacja po stronie klienta (długość tekstu) z komunikatami zwrotnymi.
    - **Dostępność:** Wszystkie elementy formularza mają powiązane etykiety.

### Widok: Moje Fiszki
- **Ścieżka widoku:** `/app/flashcards`
- **Główny cel:** Przeglądanie, tworzenie, edytowanie i usuwanie wszystkich zapisanych fiszek.
- **Kluczowe informacje do wyświetlenia:**
    - Lista fiszek (`front`, `back`) z paginacją.
- **Kluczowe komponenty widoku:**
    - `Card`: Do wyświetlania pojedynczej fiszki.
    - `Button`: Do inicjowania dodawania nowej fiszki.
    - `DropdownMenu`: Przy każdej fiszce, zawierające akcje "Edytuj" i "Usuń".
    - `Dialog`: Modal do edycji istniejącej lub tworzenia nowej fiszki.
    - `AlertDialog`: Modal do potwierdzenia operacji usunięcia.
    - Komponent paginacji.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Optymistyczne UI przy usuwaniu fiszki. Wyraźnie zdefiniowany stan pusty, zachęcający do stworzenia pierwszej fiszki.
    - **Dostępność:** Modale `Dialog` i `AlertDialog` prawidłowo zarządzają focusem i są w pełni dostępne z klawiatury.

### Widok: Sesja Nauki
- **Ścieżka widoku:** `/app/study`
- **Główny cel:** Przeprowadzenie sesji nauki z wykorzystaniem algorytmu spaced repetition (`fsrs.js`).
- **Kluczowe informacje do wyświetlenia:**
    - Przód aktualnej fiszki.
    - Tył aktualnej fiszki (po interakcji użytkownika).
    - Przyciski oceny.
- **Kluczowe komponenty widoku:**
    - `Card`: Do wyświetlania treści fiszki.
    - `Button`: Do pokazania odpowiedzi oraz do oceniania ("Trudne", "Dobre", "Łatwe").
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Prosty i skoncentrowany interfejs, minimalizujący rozproszenie. Postęp sesji jest zapisywany w `localStorage`, aby można było ją wznowić.
    - **Dostępność:** Interakcje są możliwe do wykonania za pomocą klawiatury.

### Widok: Panel Użytkownika
- **Ścieżka widoku:** `/app/settings`
- **Główny cel:** Zarządzanie ustawieniami konta użytkownika.
- **Kluczowe informacje do wyświetlenia:**
    - Opcje związane z kontem.
- **Kluczowe komponenty widoku:**
    - `Button`: Do wylogowania i usunięcia konta.
    - `AlertDialog`: Do potwierdzenia krytycznej akcji, jaką jest usunięcie konta.
- **UX, dostępność i względy bezpieczeństwa:**
    - **Bezpieczeństwo:** Usunięcie konta jest operacją nieodwracalną i wymaga jednoznacznego potwierdzenia przez użytkownika.

## 3. Mapa podróży użytkownika

Główny przepływ użytkownika (happy path) zaczyna się od zapoznania się z aplikacją, a następnie przechodzi do kluczowej funkcji, jaką jest generowanie fiszek.

1.  **Start (Niezalogowany użytkownik):** Użytkownik ląduje na **Stronie Głównej (Landing Page)** (`/`). Zapoznaje się z funkcjami aplikacji i klika przycisk "Zaloguj się" lub "Zarejestruj".
2.  **Logowanie i Przekierowanie:** Po pomyślnym zalogowaniu lub rejestracji, użytkownik jest przekierowywany do widoku **Generatora Fiszek** (`/app/generate`).
3.  **Generowanie:** Wkleja tekst w `Textarea` i klika "Generuj". Aplikacja wyświetla stan ładowania, a następnie listę propozycji fiszek pobranych z `POST /api/generations`.
4.  **Selekcja i Edycja:** Użytkownik przegląda sugestie. Zaznacza `Checkbox` przy fiszkach, które chce zachować, i opcjonalnie edytuje ich treść bezpośrednio na liście.
5.  **Zapis:** Klika "Zapisz wybrane", co wysyła żądanie `POST /api/flashcards/bulk`. Otrzymuje powiadomienie `Toast` o sukcesie.
6.  **Zarządzanie:** Przechodzi do widoku **Moje Fiszki**. Widzi nowo dodane pozycje na liście. Może je edytować (w `Dialog`), usuwać (z potwierdzeniem w `AlertDialog`) lub dodać nową ręcznie.
7.  **Nauka:** Przechodzi do widoku **Sesja Nauki**, aby rozpocząć powtórki materiału.
8.  **Analiza:** Wraca do **Dashboardu**, aby zobaczyć zaktualizowane statystyki swojej aktywności.

## 4. Układ i struktura nawigacji

Nawigacja w aplikacji jest podzielona na dwie części: dla użytkowników niezalogowanych (publiczna strona główna) i zalogowanych (panel aplikacji).

### Nawigacja publiczna (dla niezalogowanych)
- **Kontekst:** Widoczna na stronie głównej (`/`).
- **Elementy:**
    - **Logo/Nazwa:** Link do strony głównej.
    - **Linki (opcjonalnie):** `Funkcje`, `Cennik`.
    - **Akcje:** Przyciski `Zaloguj się` i `Zarejestruj się`.

### Nawigacja w aplikacji (dla zalogowanych)
- **Kontekst:** Widoczna na wszystkich stronach wewnątrz aplikacji (`/app/*`).
- **Główna Nawigacja:** Poziomy pasek nawigacyjny (`Top Bar`) umieszczony na górze strony.
- **Elementy Paska:**
    - **Logo/Nazwa:** Link do domyślnego widoku po zalogowaniu, czyli **Generatora Fiszek** (`/app/generate`).
    - **Linki nawigacyjne:** `Dashboard`, `Generator`, `Moje Fiszki`, `Sesja Nauki`.
- **Menu użytkownika:**
    - Po prawej stronie paska znajduje się ikona użytkownika.
    - Kliknięcie ikony rozwija `DropdownMenu` z opcjami:
        - `Ustawienia` (link do **Panelu Użytkownika**).
        - `Wyloguj`.

## 5. Kluczowe komponenty

Poniższe komponenty (głównie z `shadcn/ui`) będą współdzielone w całej aplikacji w celu zapewnienia spójności i ponownego wykorzystania kodu.

- **Card:** Podstawowy kontener do wyświetlania treści, takich jak fiszki, statystyki i sugestie.
- **Button:** Standardowy komponent do wywoływania akcji (generowanie, zapis, usuwanie).
- **Dialog:** Modal używany do zadań wymagających skupienia, takich jak edycja i tworzenie fiszek.
- **AlertDialog:** Modal używany do uzyskania od użytkownika potwierdzenia krytycznych i potencjalnie destrukcyjnych akcji (np. usunięcie fiszki, usunięcie konta).
- **Toast:** Dyskretne powiadomienia wyskakujące w rogu ekranu, informujące o wyniku operacji (np. "Fiszki zostały zapisane").
- **DropdownMenu:** Używane do kontekstowych menu akcji, np. przy każdej fiszce na liście lub dla menu użytkownika.
- **useFetch (custom hook):** Reużywalny hook do obsługi zapytań `fetch`, zarządzający stanami ładowania, błędu i danych, co standaryzuje komunikację z API w całej aplikacji.
