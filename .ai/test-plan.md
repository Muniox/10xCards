### Plan Testów dla Aplikacji "10x-cards"

**Wersja dokumentu:** 1.0
**Data:** 11.11.2025
**Autor:** Gemini QA Engineer

---

### 1. Wprowadzenie i cele testowania

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji internetowej "10x-cards" w fazie rozwoju MVP (Minimum Viable Product). Aplikacja ta, wykorzystująca modele LLM, ma na celu zrewolucjonizowanie procesu tworzenia i nauki z fiszek edukacyjnych poprzez ich automatyczne generowanie z tekstu.

**Główne cele procesu testowania to:**
*   **Weryfikacja funkcjonalna:** Zapewnienie, że wszystkie funkcje zdefiniowane w zakresie MVP działają zgodnie ze specyfikacją.
*   **Zapewnienie jakości i niezawodności:** Identyfikacja i eliminacja błędów, które mogłyby negatywnie wpłynąć na doświadczenie użytkownika.
*   **Walidacja bezpieczeństwa:** Sprawdzenie, czy dane użytkowników są odpowiednio chronione, a dostęp do zasobów jest właściwie autoryzowany.
*   **Ocena użyteczności:** Upewnienie się, że interfejs użytkownika jest intuicyjny, a kluczowe przepływy (user journeys) są płynne i zrozumiałe.
*   **Weryfikacja integracji:** Potwierdzenie poprawnej komunikacji pomiędzy frontendem, backendem (Supabase) i zewnętrznymi serwisami (Openrouter.ai).

### 2. Zakres testów

Zakres testowania jest ściśle powiązany z funkcjonalnościami zdefiniowanymi dla wersji MVP projektu.

#### 2.1. Funkcjonalności w zakresie testów (In Scope)

*   **Zarządzanie Użytkownikiem:**
    *   Rejestracja nowego użytkownika.
    *   Logowanie i wylogowywanie.
    *   Zarządzanie sesją użytkownika (utrzymywanie zalogowania).
    *   Usuwanie konta wraz z powiązanymi danymi.
*   **Generowanie Fiszek przez AI:**
    *   Wklejanie tekstu źródłowego (walidacja limitu znaków 1,000-10,000).
    *   Inicjowanie procesu generowania.
    *   Odbieranie i wyświetlanie sugestii fiszek.
    *   Obsługa stanów (ładowanie, błąd, sukces).
*   **Zarządzanie Sugestiami Fiszek:**
    *   Przeglądanie wygenerowanych sugestii.
    *   Edycja treści frontu i tyłu sugestii.
    *   Zaznaczanie/odznaczanie fiszek do zapisu.
    *   Usuwanie niechcianych sugestii z listy.
    *   Masowe zapisywanie wybranych sugestii (z poprawnym oznaczeniem źródła: `ai-full` vs `ai-edited`).
*   **Manualne Zarządzanie Fiszkami (CRUD):**
    *   Ręczne tworzenie nowej fiszki.
    *   Przeglądanie listy wszystkich zapisanych fiszek z paginacją.
    *   Edycja istniejącej fiszki.
    *   Usuwanie fiszki.
*   **Dashboard i Statystyki:**
    *   Wyświetlanie zagregowanych statystyk generowania.
    *   Filtrowanie statystyk według okresu (tydzień, miesiąc, cały czas).
    *   Obsługa stanu pustego (dla nowych użytkowników) i stanu błędu.
*   **Sesja Nauki:**
    *   Integracja z algorytmem Spaced Repetition.
    *   Interaktywna sesja nauki (wyświetlanie fiszki, odkrywanie odpowiedzi).
    *   Śledzenie postępów dla każdej fiszki.

#### 2.2. Funkcjonalności poza zakresem testów (Out of Scope)

Zgodnie z dokumentacją projektu, następujące funkcje nie będą testowane w ramach MVP:
*   Niestandardowe algorytmy spaced repetition.
*   Elementy grywalizacji (punkty, odznaki).
*   Natywne aplikacje mobilne (iOS/Android).
*   Import dokumentów (PDF, DOCX).
*   Publiczne API.
*   Funkcje społecznościowe (udostępnianie, współpraca).
*   Zaawansowane powiadomienia i wyszukiwanie.

### 3. Typy testów do przeprowadzenia

W celu zapewnienia kompleksowej jakości aplikacji, przeprowadzony zostanie szereg różnych typów testów.

*   **Testy statyczne:**
    *   **Linting i formatowanie:** Weryfikacja jakości kodu za pomocą ESLint i Prettier, zintegrowanych w procesie CI/CD.
*   **Testy jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania pojedynczych funkcji i komponentów w izolacji.
    *   **Obszary:** Funkcje pomocnicze (`/lib/utils/`), logika customowych hooków React (`/components/hooks/`), schematy walidacji Zod (`/lib/validation/`), pojedyncze metody w serwisach (`/lib/services/`) z zamockowanymi zależnościami.
*   **Testy integracyjne (Integration Tests):**
    *   **Cel:** Sprawdzenie współpracy między różnymi modułami aplikacji.
    *   **Obszary:**
        *   **Backend:** Testowanie endpointów API (`/pages/api/`) w połączeniu z lokalną bazą danych Supabase w celu weryfikacji logiki biznesowej, operacji CRUD i polityk bezpieczeństwa RLS.
        *   **Frontend:** Testowanie komponentów React, które komunikują się z API (np. `FlashcardsContainer.tsx`, `DashboardView.tsx`), weryfikując, czy poprawnie obsługują cykl życia zapytania (ładowanie, sukces, błąd) i zarządzają stanem.
*   **Testy End-to-End (E2E):**
    *   **Cel:** Symulacja pełnych scenariuszy użytkownika w przeglądarce w celu weryfikacji kompletnych przepływów funkcjonalnych.
    *   **Obszary:** Pełne ścieżki użytkownika, np. "Rejestracja -> Logowanie -> Generowanie fiszek -> Zapisanie -> Wylogowanie".
*   **Testy bezpieczeństwa:**
    *   **Cel:** Identyfikacja podatności związanych z uwierzytelnianiem i autoryzacją.
    *   **Obszary:** Weryfikacja polityk Row Level Security (RLS) w Supabase w celu zapewnienia izolacji danych między użytkownikami. Testowanie ochrony endpointów API przed nieautoryzowanym dostępem.
*   **Testy wydajnościowe:**
    *   **Cel:** Podstawowa ocena responsywności i szybkości działania aplikacji pod obciążeniem.
    *   **Obszary:** Pomiar czasu odpowiedzi kluczowych endpointów API (zwłaszcza `/api/generations` i `/api/generations/statistics`), analiza czasu ładowania strony (LCP, FCP).
*   **Testy eksploracyjne i użyteczności:**
    *   **Cel:** Ocena jakościowa interakcji z aplikacją, intuicyjności interfejsu oraz ogólnego doświadczenia użytkownika. Szczególna uwaga zostanie zwrócona na jakość i trafność fiszek generowanych przez AI.

### 4. Scenariusze testowe dla kluczowych funkcjonalności

Poniżej przedstawiono przykładowe, wysoko priorytetowe scenariusze testowe. Pełna lista zostanie opracowana w dedykowanym narzędziu do zarządzania testami.

| ID | Funkcjonalność | Scenariusz Testowy | Oczekiwany Rezultat | Priorytet |
| :-- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Uwierzytelnianie | Użytkownik loguje się przy użyciu poprawnych danych. | Użytkownik zostaje pomyślnie zalogowany i przekierowany do panelu (`/app/dashboard`). | **Krytyczny** |
| **AUTH-02** | Uwierzytelnianie | Użytkownik próbuje zalogować się z niepoprawnym hasłem. | Wyświetlony zostaje komunikat o błędzie "Nieprawidłowy email lub hasło". Użytkownik pozostaje na stronie logowania. | **Wysoki** |
| **AUTH-03** | Autoryzacja | Zalogowany użytkownik A próbuje uzyskać dostęp do danych użytkownika B poprzez bezpośrednie wywołanie API. | API zwraca błąd autoryzacji lub pustą listę wyników. Polityki RLS blokują dostęp. | **Krytyczny** |
| **GEN-01** | Generowanie AI | Użytkownik wkleja tekst o długości 2500 znaków i klika "Generuj". | Przycisk staje się nieaktywny, wyświetlany jest stan ładowania. Po pomyślnym przetworzeniu, na ekranie pojawia się lista sugestii fiszek. | **Krytyczny** |
| **GEN-02** | Generowanie AI | Użytkownik próbuje wygenerować fiszki z tekstu o długości 500 znaków. | Przycisk "Generuj" jest nieaktywny. Wyświetlany jest komunikat o minimalnej wymaganej długości tekstu. | **Wysoki** |
| **GEN-03** | Generowanie AI | Zewnętrzne API Openrouter.ai zwraca błąd 500. | Aplikacja wyświetla użytkownikowi czytelny komunikat o błędzie po stronie serwisu AI i umożliwia ponowienie próby. | **Wysoki** |
| **CARD-01** | Zarządzanie Fiszkami | Użytkownik edytuje 2 z 5 sugestii, zaznacza 4 i klika "Zapisz wybrane". | Aplikacja wysyła żądanie do `/api/flashcards/bulk`. Wyświetla komunikat o sukcesie, a następnie czyści widok generatora. Zapisane fiszki są widoczne w "Moje Fiszki". | **Krytyczny** |
| **CARD-02** | Zarządzanie Fiszkami | Użytkownik na liście "Moje Fiszki" klika "Usuń" i potwierdza operację. | Fiszka znika z listy (aktualizacja optymistyczna). Żądanie DELETE jest wysyłane do API. Fiszka zostaje trwale usunięta z bazy danych. | **Wysoki** |
| **DASH-01** | Dashboard | Nowo zarejestrowany użytkownik bez żadnej aktywności wchodzi na stronę Dashboard. | Wyświetlany jest "stan pusty" (EmptyState) z zachętą do wygenerowania pierwszych fiszek. | **Średni** |

### 5. Środowisko testowe

Testy będą przeprowadzane w trzech odizolowanych środowiskach:

*   **Środowisko lokalne (Local):** Wykorzystywane przez deweloperów i testerów do codziennej pracy. Obejmuje uruchomienie aplikacji za pomocą `npm run dev` oraz lokalnej instancji Supabase zarządzanej przez Supabase CLI.
*   **Środowisko przejściowe (Staging):** W pełni funkcjonalna kopia środowiska produkcyjnego hostowana na DigitalOcean. Połączona z oddzielnym projektem Supabase. Na tym środowisku będą uruchamiane automatyczne testy E2E w ramach CI/CD oraz przeprowadzane będą testy akceptacyjne (UAT).
*   **Środowisko produkcyjne (Production):** Aplikacja dostępna dla użytkowników końcowych. Na tym środowisku przeprowadzane będą jedynie testy typu "smoke test" po każdym wdrożeniu.

### 6. Narzędzia do testowania

Na podstawie stosu technologicznego projektu, rekomendowane są następujące narzędzia:

| Kategoria | Narzędzie | Zastosowanie |
| :--- | :--- | :--- |
| **Test Runner / Framework** | **Vitest** | Uruchamianie testów jednostkowych i integracyjnych. Jest kompatybilny z Vite, co zapewnia szybkie i spójne działanie z resztą projektu. |
| **Testowanie Komponentów**| **React Testing Library** | Testowanie komponentów React w sposób, w jaki używają ich użytkownicy, co zwiększa wiarygodność testów. |
| **Testy E2E** | **Playwright** | Nowoczesne narzędzie do automatyzacji testów w przeglądarkach (Chromium, Firefox, WebKit), umożliwiające tworzenie stabilnych i szybkich testów E2E. |
| **Testowanie API** | **Postman / Insomnia** (manualne) / **Fetch w Playwright/Vitest** (automatyczne) | Weryfikacja endpointów API, testowanie różnych scenariuszy zapytań i odpowiedzi. |
| **Testowanie Dostępności** | **Axe DevTools** | Integracja z testami E2E w celu automatycznego wykrywania problemów z dostępnością (WCAG). |
| **CI/CD** | **GitHub Actions** | Automatyzacja uruchamiania testów (linting, jednostkowe, integracyjne, E2E) przy każdym pushu do repozytorium lub tworzeniu Pull Request. |

### 7. Harmonogram testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania (CI/CD).
*   **Testy jednostkowe i integracyjne:** Będą pisane przez deweloperów równolegle z implementacją nowych funkcjonalności.
*   **Testy E2E:** Będą tworzone przez inżyniera QA po zakończeniu implementacji kluczowych przepływów użytkownika.
*   **Testy regresji:** Pełny zestaw zautomatyzowanych testów E2E będzie uruchamiany automatycznie przed każdym wdrożeniem na środowisko Staging i Production.
*   **Testy eksploracyjne i UAT:** Przeprowadzane na środowisku Staging na koniec każdego sprintu lub przed wydaniem większej funkcjonalności.

### 8. Kryteria akceptacji testów

#### Kryteria wejścia (rozpoczęcia testów)
*   Plan testów został zatwierdzony.
*   Funkcjonalność została wdrożona na środowisku testowym (Staging).
*   Testy jednostkowe dla implementowanego kodu zostały napisane i przechodzą pomyślnie.

#### Kryteria wyjścia (zakończenia testów i wdrożenia)
*   **100%** krytycznych i **95%** wysokopriorytetowych scenariuszy testowych kończy się sukcesem.
*   Brak znanych błędów o statusie krytycznym (blokującym).
*   Pokrycie kodu testami jednostkowymi dla kluczowej logiki biznesowej wynosi co najmniej **80%**.
*   Wszystkie zautomatyzowane testy w pipeline CI/CD przechodzą pomyślnie.

### 9. Role i odpowiedzialności

| Rola | Odpowiedzialność |
| :--- | :--- |
| **Inżynier QA** | Tworzenie i utrzymanie planu testów, projektowanie i implementacja testów automatycznych (integracyjnych, E2E), przeprowadzanie testów manualnych i eksploracyjnych, raportowanie i zarządzanie błędami. |
| **Deweloperzy** | Pisanie testów jednostkowych, przeprowadzanie code review (w tym przegląd testów), naprawa zgłoszonych błędów, wsparcie w diagnozowaniu problemów. |
| **Product Owner** | Definiowanie kryteriów akceptacji dla funkcjonalności, udział w testach akceptacyjnych użytkownika (UAT), priorytetyzacja naprawy błędów. |

### 10. Procedury raportowania błędów

*   **Narzędzie:** Do śledzenia błędów wykorzystywane będzie narzędzie **GitHub Issues**.
*   **Szablon zgłoszenia błędu:** Każde zgłoszenie musi zawierać:
    *   **Tytuł:** Krótki, zwięzły opis problemu.
    *   **Kroki do reprodukcji:** Szczegółowa, ponumerowana lista kroków potrzebnych do odtworzenia błędu.
    *   **Rezultat oczekiwany:** Co powinno się wydarzyć.
    *   **Rezultat rzeczywisty:** Co faktycznie się wydarzyło.
    *   **Środowisko:** (np. Lokalnie, Staging, Przeglądarka + wersja).
    *   **Priorytet:** (Krytyczny, Wysoki, Średni, Niski).
    *   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.
*   **Cykl życia błędu:** Błędy będą przechodzić przez następujące statusy: `New` -> `Acknowledged` -> `In Progress` -> `Ready for Retest` -> `Closed` / `Reopened`.