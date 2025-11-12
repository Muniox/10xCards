# Specyfikacja Techniczna Systemu Autentykacji - 10xCards

## Spis treści
1. [Wprowadzenie](#wprowadzenie)
2. [Architektura Interfejsu Użytkownika](#architektura-interfejsu-użytkownika)
3. [Logika Backendowa](#logika-backendowa)
4. [System Autentykacji](#system-autentykacji)
5. [Przepływy Użytkownika](#przepływy-użytkownika)
6. [Bezpieczeństwo i Zgodność](#bezpieczeństwo-i-zgodność)

---

## Wprowadzenie

### Cel dokumentu
Niniejszy dokument definiuje architekturę systemu autentykacji dla aplikacji 10xCards, obejmującą rejestrację, logowanie, wylogowywanie oraz odzyskiwanie hasła użytkowników.

### Wymagania biznesowe
Realizacja historyjek użytkownika:
- **US-001**: Rejestracja konta (email + hasło)
- **US-002**: Logowanie do aplikacji
- **US-009**: Bezpieczny dostęp i autoryzacja

### Założenia techniczne
- Framework: Astro 5 w trybie SSR (server-side rendering)
- Biblioteka UI: React 19 dla komponentów interaktywnych
- Backend: Supabase (PostgreSQL + Auth)
- Styling: Tailwind 4 + Shadcn/ui
- Typowanie: TypeScript 5
- Walidacja: Zod schemas

### Ograniczenia MVP
- Brak integracji z zewnętrznymi dostawcami (Google, GitHub)
- Brak zaawansowanych funkcji (2FA, weryfikacja email przez link aktywacyjny)
- Brak funkcji „zapamiętaj mnie"
- **UWAGA:** Funkcja resetowania hasła jest OPCJONALNA w MVP - może być dodana później
- **UWAGA:** "Weryfikacja danych" w US-001 oznacza walidację formatu (Zod), NIE weryfikację przez email

---

## Architektura Interfejsu Użytkownika

### 1. Struktura stron i routingu

#### 1.1 Strony publiczne (niezalogowani użytkownicy)

**A. Strona główna landing page**
- **Ścieżka**: `/`
- **Plik**: `src/pages/index.astro`
- **Layout**: `Layout.astro` (bazowy)
- **Status**: Istniejący - bez zmian
- **Opis**:
  - Strona marketingowa z opisem funkcjonalności
  - Komponenty: `LandingNavigation`, `Hero`, `Features`, `Footer`
  - Linki CTA do `/login` i `/register`

**B. Strona logowania**
- **Ścieżka**: `/login`
- **Plik**: `src/pages/login.astro` (NOWY)
- **Layout**: `Layout.astro`
- **Komponenty**:
  - `LoginForm` (React, client:load)
  - Link do `/register` („Nie masz konta? Zarejestruj się")
  - Link do `/reset-password` („Zapomniałeś hasła?") - OPCJONALNY w MVP
- **Logika SSR**:
  - Sprawdzenie sesji przy ładowaniu strony
  - Jeśli użytkownik jest zalogowany → redirect do `/app/dashboard`
- **Responsywność**: Centrowany formularz z max-width 400px

**C. Strona rejestracji**
- **Ścieżka**: `/register`
- **Plik**: `src/pages/register.astro` (NOWY)
- **Layout**: `Layout.astro`
- **Komponenty**:
  - `RegisterForm` (React, client:load)
  - Link do `/login` („Masz już konto? Zaloguj się")
- **Logika SSR**:
  - Sprawdzenie sesji przy ładowaniu strony
  - Jeśli użytkownik jest zalogowany → redirect do `/app/dashboard`
- **Responsywność**: Centrowany formularz z max-width 400px

**D. Strona odzyskiwania hasła (OPCJONALNA - poza core MVP)**
- **Ścieżka**: `/reset-password`
- **Plik**: `src/pages/reset-password.astro` (OPCJONALNY)
- **Layout**: `Layout.astro`
- **Komponenty**:
  - `ResetPasswordForm` (React, client:load)
  - Link do `/login` („Powrót do logowania")
- **Logika SSR**:
  - Sprawdzenie sesji przy ładowaniu strony
  - Jeśli użytkownik jest zalogowany → redirect do `/app/dashboard`
- **Responsywność**: Centrowany formularz z max-width 400px
- **UWAGA**: Ta funkcjonalność może być pominięta w pierwszej wersji MVP

#### 1.2 Strony chronione (wymagają autentykacji)

**A. Dashboard**
- **Ścieżka**: `/app/dashboard`
- **Plik**: `src/pages/app/dashboard.astro`
- **Layout**: `AppLayout.astro`
- **Status**: Istniejący - wymaga aktywacji ochrony
- **Ochrona**: Middleware + layout guard

**B. Generator fiszek**
- **Ścieżka**: `/app/generate`
- **Plik**: `src/pages/app/generate.astro`
- **Layout**: `AppLayout.astro`
- **Status**: Istniejący - wymaga aktywacji ochrony
- **Ochrona**: Middleware + layout guard

**C. Moje fiszki**
- **Ścieżka**: `/app/flashcards`
- **Plik**: `src/pages/app/flashcards.astro` (PLANOWANY)
- **Layout**: `AppLayout.astro`
- **Ochrona**: Middleware + layout guard

**D. Sesja nauki**
- **Ścieżka**: `/app/study`
- **Plik**: `src/pages/app/study.astro` (PLANOWANY)
- **Layout**: `AppLayout.astro`
- **Ochrona**: Middleware + layout guard

**E. Ustawienia konta (OPCJONALNE - poza core MVP)**
- **Ścieżka**: `/app/settings`
- **Plik**: `src/pages/app/settings.astro` (OPCJONALNY)
- **Layout**: `AppLayout.astro`
- **Funkcje**: Zmiana hasła, usunięcie konta
- **Ochrona**: Middleware + layout guard
- **UWAGA**: Ta funkcjonalność może być pominięta w pierwszej wersji MVP lub dodana jako następny krok
- **UWAGA**: PRD wymienia "możliwość usunięcia konta" w wymaganiach funkcjonalnych, ale nie ma dedykowanego User Story

---

### 2. Komponenty React (interaktywne formularze)

#### 2.1 LoginForm Component

**Lokalizacja**: `src/components/auth/LoginForm.tsx` (NOWY)

**Odpowiedzialności**:
- Renderowanie formularza z polami email i hasło
- Walidacja po stronie klienta (Zod)
- Wysyłanie żądania POST do `/api/auth/login`
- Obsługa stanów ładowania i błędów
- Przekierowanie po sukcesie (`window.location.href = '/app/dashboard'`)

**Pola formularza**:
```typescript
{
  email: string;      // typ email, required
  password: string;   // typ password, required, min 6 znaków
}
```

**Walidacja kliencka** (Zod schema):
- Email: format email, wymagany
- Hasło: min. 6 znaków, wymagane
- Komunikaty błędów w języku polskim

**Stany komponentu**:
- `isLoading: boolean` - czy trwa wysyłanie
- `error: string | null` - globalny błąd z API
- `fieldErrors: Record<string, string>` - błędy walidacji pól

**Integracja z Shadcn/ui**:
- `<Form>` z react-hook-form
- `<Input>` dla email i password
- `<Button>` dla submit
- `<Label>` dla etykiet
- `<Alert>` dla komunikatów błędów globalnych

**Obsługa błędów API**:
- Status 400 (VALIDATION_ERROR) → wyświetlenie błędów przy polach
- Status 401 (UNAUTHORIZED) → „Nieprawidłowy email lub hasło"
- Status 500 → „Wystąpił błąd. Spróbuj ponownie."
- Błąd sieci → „Brak połączenia z serwerem"

**Przykładowy układ UI**:
```
┌─────────────────────────────┐
│ Zaloguj się                 │
│                             │
│ Email                       │
│ [________________]          │
│                             │
│ Hasło                       │
│ [________________]          │
│                             │
│ [Zapomniałeś hasła?]        │
│                             │
│ [  Zaloguj się  ]           │
│                             │
│ Nie masz konta?             │
│ [Zarejestruj się]           │
└─────────────────────────────┘
```

---

#### 2.2 RegisterForm Component

**Lokalizacja**: `src/components/auth/RegisterForm.tsx` (NOWY)

**Odpowiedzialności**:
- Renderowanie formularza rejestracji
- Walidacja po stronie klienta (Zod)
- Wysyłanie żądania POST do `/api/auth/register`
- Obsługa stanów ładowania i błędów
- Przekierowanie po sukcesie + auto-login

**Pola formularza**:
```typescript
{
  email: string;              // typ email, required
  password: string;           // typ password, required, min 8 znaków
  confirmPassword: string;    // typ password, required, musi być == password
}
```

**Walidacja kliencka** (Zod schema):
- Email: format email, wymagany
- Hasło: min. 8 znaków, wymagane
- Potwierdzenie hasła: musi być równe hasłu
- Komunikaty błędów w języku polskim

**Stany komponentu**:
- `isLoading: boolean`
- `error: string | null`
- `fieldErrors: Record<string, string>`
- `success: boolean` - czy rejestracja się powiodła

**Integracja z Shadcn/ui**:
- Identyczna jak LoginForm
- Dodatkowe pole Input dla confirmPassword

**Obsługa błędów API**:
- Status 400 (VALIDATION_ERROR) → błędy przy polach
- Status 409 → „Ten email jest już zarejestrowany"
- Status 500 → „Wystąpił błąd. Spróbuj ponownie."
- Błąd sieci → „Brak połączenia z serwerem"

**Przepływ po sukcesie**:
1. Wyświetlenie komunikatu sukcesu (toast)
2. Automatyczne zalogowanie użytkownika (zgodnie z US-001: "zostaje zalogowany")
3. Przekierowanie do `/app/dashboard`

**Ważne:** Zgodnie z US-001, po rejestracji użytkownik jest automatycznie logowany i nie wymaga oddzielnego kroku logowania.

**Przykładowy układ UI**:
```
┌─────────────────────────────┐
│ Utwórz konto                │
│                             │
│ Email                       │
│ [________________]          │
│                             │
│ Hasło                       │
│ [________________]          │
│                             │
│ Powtórz hasło               │
│ [________________]          │
│                             │
│ [  Zarejestruj się  ]       │
│                             │
│ Masz już konto?             │
│ [Zaloguj się]               │
└─────────────────────────────┘
```

---

#### 2.3 ResetPasswordForm Component (OPCJONALNY w MVP)

**Lokalizacja**: `src/components/auth/ResetPasswordForm.tsx` (OPCJONALNY)

**UWAGA**: Ten komponent NIE jest wymagany w core MVP zgodnie z PRD. Może być dodany w późniejszej fazie.

**Odpowiedzialności**:
- Renderowanie formularza odzyskiwania hasła
- Walidacja po stronie klienta
- Wysyłanie żądania POST do `/api/auth/reset-password`
- Obsługa stanów ładowania i błędów

**Pola formularza**:
```typescript
{
  email: string;  // typ email, required
}
```

**Walidacja kliencka**:
- Email: format email, wymagany

**Stany komponentu**:
- `isLoading: boolean`
- `error: string | null`
- `success: boolean`

**Obsługa błędów API**:
- Status 400 → błędy walidacji
- Status 404 → „Nie znaleziono użytkownika z tym adresem email"
- Status 500 → „Wystąpił błąd. Spróbuj ponownie."

**Przepływ po sukcesie**:
1. Wyświetlenie komunikatu: „Link do resetowania hasła został wysłany na adres {email}"
2. Ukrycie formularza
3. Przycisk „Powrót do logowania"

**Uwaga MVP**:
- W MVP link resetowania może być uproszczony
- Możliwe rozwiązanie: tymczasowe hasło wysyłane emailem przez Supabase
- Alternatywnie: formularz resetowania z tokenem w URL

---

#### 2.4 UserMenu Component

**Lokalizacja**: `src/components/auth/UserMenu.tsx` (NOWY)

**Odpowiedzialności**:
- Wyświetlanie menu użytkownika w nawigacji
- Pokazanie emaila użytkownika
- Opcje: Ustawienia, Wyloguj
- Obsługa wylogowania (POST do `/api/auth/logout`)

**Props**:
```typescript
interface UserMenuProps {
  userEmail: string;
}
```

**Integracja z Shadcn/ui**:
- `<DropdownMenu>` z Shadcn/ui
- Trigger: przycisk z ikoną użytkownika + email
- Menu items: Ustawienia konta, Wyloguj się

**Akcja wylogowania**:
1. Wywołanie POST `/api/auth/logout`
2. Po sukcesie: `window.location.href = '/'`
3. Przy błędzie: toast z komunikatem

**Przykładowy układ**:
```
Desktop:
┌────────────────────────┐
│ 👤 user@example.com ▼ │
└────────────────────────┘
         ↓ (po kliknięciu)
┌────────────────────────┐
│ ⚙️  Ustawienia konta   │
│ 🚪 Wyloguj się         │
└────────────────────────┘
```

---

### 3. Modyfikacje istniejących komponentów

#### 3.1 Navigation.astro

**Lokalizacja**: `src/components/Navigation.astro`

**Zmiany wymagane**:
1. **Usunięcie placeholder przycisku "Konto"** (linia 56-63)
2. **Dodanie komponentu UserMenu**:
   ```astro
   ---
   import UserMenu from "./auth/UserMenu";

   // Pobranie sesji użytkownika
   const { data: { session } } = await Astro.locals.supabase.auth.getSession();
   const userEmail = session?.user?.email || "";
   ---

   <div class="hidden md:flex items-center space-x-4">
     <UserMenu client:load userEmail={userEmail} />
   </div>
   ```

3. **Aktualizacja mobile menu** (linia 106-114):
   - Zamiana linku do `/app/settings` na UserMenu

**Zachowanie**:
- Komponent nadal dostępny tylko w AppLayout.astro
- Komponent wymaga sesji użytkownika (gwarantowanej przez layout guard)

---

#### 3.2 LandingNavigation.astro

**Lokalizacja**: `src/components/landing/LandingNavigation.astro`

**Zmiany wymagane**:
1. **Dodanie przycisków CTA**:
   - Przycisk „Zaloguj się" → link do `/login`
   - Przycisk „Rozpocznij za darmo" → link do `/register` (zgodnie z US-010)

**Przykładowa implementacja**:
```astro
<div class="flex items-center space-x-4">
  <a
    href="/login"
    class="text-sm font-medium text-gray-600 hover:text-gray-900"
  >
    Zaloguj się
  </a>
  <a
    href="/register"
    class="btn btn-primary"
  >
    Rozpocznij za darmo
  </a>
</div>
```

---

### 4. Modyfikacje layoutów

#### 4.1 AppLayout.astro

**Lokalizacja**: `src/layouts/AppLayout.astro`

**Zmiany wymagane**:

1. **Aktywacja auth guard** (usunięcie TEMPORARY comment, linie 11-16):
```astro
---
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect("/login");
}
---
```

2. **Przekazanie danych sesji do Navigation**:
```astro
<Navigation currentPath={currentPath} />
```
(Navigation sam pobierze sesję z Astro.locals.supabase)

**Odpowiedzialność**:
- Ochrona wszystkich stron w `/app/*`
- Wymuszenie przekierowania do `/login` dla niezalogowanych
- Dostarczenie kontekstu sesji dla komponentów child

---

#### 4.2 Layout.astro

**Lokalizacja**: `src/layouts/Layout.astro`

**Zmiany**: Brak zmian wymaganych

**Odpowiedzialność**:
- Bazowy layout dla stron publicznych
- Brak sprawdzania sesji
- Dostępny dla wszystkich użytkowników

---

### 5. Walidacja i komunikaty błędów

#### 5.1 Zod schemas dla formularzy

**Lokalizacja**: `src/lib/validation/auth.schemas.ts` (NOWY)

**Schemas**:

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email"),
  password: z
    .string()
    .min(6, "Hasło musi mieć minimum 6 znaków"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków"),
  confirmPassword: z
    .string()
    .min(1, "Potwierdzenie hasła jest wymagane"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email"),
});
```

**Wykorzystanie**:
- W komponentach React: walidacja przed wysłaniem
- W API endpoints: walidacja danych wejściowych

---

#### 5.2 Komunikaty błędów

**Kategorie błędów**:

1. **Błędy walidacji (400)**:
   - Wyświetlane przy konkretnych polach
   - Styl: czerwony tekst pod polem input
   - Przykład: "Hasło musi mieć minimum 8 znaków"

2. **Błędy autentykacji (401)**:
   - Wyświetlane jako alert nad formularzem
   - Przykład: "Nieprawidłowy email lub hasło"

3. **Błędy konfliktów (409)**:
   - Wyświetlane jako alert nad formularzem
   - Przykład: "Ten email jest już zarejestrowany"

4. **Błędy serwera (500)**:
   - Wyświetlane jako alert nad formularzem
   - Przykład: "Wystąpił błąd. Spróbuj ponownie."

5. **Błędy sieci**:
   - Wyświetlane jako alert nad formularzem
   - Przykład: "Brak połączenia z serwerem"

**Komponenty UI dla błędów**:
- Shadcn/ui `<Alert>` variant="destructive" dla błędów globalnych
- Tekst pod inputem z klasą `text-sm text-red-600` dla błędów pól

---

### 6. Scenariusze użytkownika

#### Scenariusz 1: Rejestracja nowego użytkownika

**Ścieżka happy path**:
1. Użytkownik wchodzi na `/` (landing page)
2. Klika „Rozpocznij za darmo" → przekierowanie do `/register`
3. Wypełnia formularz: email, hasło, powtórzenie hasła
4. Klika „Zarejestruj się"
5. Walidacja kliencka OK → POST do `/api/auth/register`
6. Backend tworzy użytkownika w Supabase Auth
7. Backend automatycznie loguje użytkownika
8. Response 201 + ustawienie cookie sesji
9. Frontend przekierowuje do `/app/dashboard`
10. Dashboard wyświetla się z aktywną sesją

**Ścieżka z błędem - email już istnieje**:
1-4. Jak wyżej
5. POST do `/api/auth/register`
6. Backend zwraca 409 Conflict
7. Frontend wyświetla alert: "Ten email jest już zarejestrowany"
8. Użytkownik klika link "Zaloguj się" → `/login`

**Ścieżka z błędem walidacji**:
1-3. Jak wyżej
4. Klika „Zarejestruj się"
5. Walidacja kliencka FAIL
6. Wyświetlenie błędów przy polach (np. "Hasła muszą być identyczne")
7. Użytkownik poprawia dane i próbuje ponownie

---

#### Scenariusz 2: Logowanie istniejącego użytkownika

**Ścieżka happy path**:
1. Użytkownik wchodzi na `/login`
2. Wypełnia email i hasło
3. Klika „Zaloguj się"
4. Walidacja kliencka OK → POST do `/api/auth/login`
5. Backend weryfikuje credentials w Supabase Auth
6. Response 200 + ustawienie cookie sesji
7. Frontend przekierowuje do `/app/dashboard`

**Ścieżka z błędem - złe hasło**:
1-4. Jak wyżej
5. Backend zwraca 401 Unauthorized
6. Frontend wyświetla alert: "Nieprawidłowy email lub hasło"
7. Użytkownik próbuje ponownie lub klika "Zapomniałeś hasła?"

**Ścieżka dla zalogowanego użytkownika**:
1. Zalogowany użytkownik próbuje wejść na `/login`
2. SSR sprawdza sesję w Astro
3. Wykryto aktywną sesję → redirect do `/app/dashboard`

---

#### Scenariusz 3: Wylogowanie

**Ścieżka happy path**:
1. Zalogowany użytkownik jest w `/app/*`
2. Klika menu użytkownika (UserMenu)
3. Wybiera „Wyloguj się"
4. Frontend wywołuje POST `/api/auth/logout`
5. Backend usuwa sesję w Supabase
6. Backend usuwa cookie sesji
7. Response 200
8. Frontend przekierowuje do `/` (landing page)

---

#### Scenariusz 4: Próba dostępu do chronionej strony

**Użytkownik niezalogowany**:
1. Użytkownik próbuje wejść bezpośrednio na `/app/dashboard`
2. AppLayout.astro sprawdza sesję
3. Brak sesji → redirect do `/login`
4. Użytkownik widzi formularz logowania

**Użytkownik zalogowany**:
1. Użytkownik próbuje wejść na `/app/dashboard`
2. AppLayout.astro sprawdza sesję
3. Sesja aktywna → strona się renderuje
4. Użytkownik widzi dashboard

---

#### Scenariusz 5: Odzyskiwanie hasła (OPCJONALNE w MVP)

**UWAGA**: Ta funkcjonalność NIE jest wymagana w PRD dla MVP. Może być pominięta w pierwszej wersji.

**Ścieżka happy path**:
1. Użytkownik na `/login` klika "Zapomniałeś hasła?"
2. Przekierowanie do `/reset-password`
3. Wpisuje email
4. Klika „Wyślij link resetujący"
5. POST do `/api/auth/reset-password`
6. Backend wysyła email resetujący przez Supabase
7. Response 200
8. Frontend wyświetla: "Link do resetowania hasła został wysłany na {email}"
9. Użytkownik klika link w emailu (obsługa przez Supabase)
10. Przekierowanie do formularza zmiany hasła (Supabase hosted UI lub custom)

**Uwaga MVP**:
- Można wykorzystać wbudowane UI Supabase dla resetowania hasła
- Lub stworzyć custom stronę `/reset-password/confirm` z tokenem

---

## Logika Backendowa

### 1. Endpointy API

Wszystkie endpointy autentykacji zlokalizowane w `src/pages/api/auth/`:

#### 1.1 POST /api/auth/register

**Plik**: `src/pages/api/auth/register.ts` (NOWY)

**Odpowiedzialność**:
- Rejestracja nowego użytkownika
- Walidacja danych wejściowych (Zod)
- Utworzenie użytkownika w Supabase Auth
- Automatyczne zalogowanie po rejestracji
- Ustawienie session cookie

**Request Body**:
```typescript
{
  email: string;
  password: string;
  confirmPassword: string;
}
```

**Walidacja**:
- Schema: `registerSchema` z `auth.schemas.ts`
- Sprawdzenie zgodności haseł
- Sprawdzenie formatu email

**Logika**:
```typescript
1. Walidacja danych wejściowych (Zod)
   - Jeśli błąd → return 400 VALIDATION_ERROR

2. Wywołanie supabase.auth.signUp({ email, password })
   - Jeśli email już istnieje → return 409 Conflict
   - Jeśli błąd Supabase → return 500 INTERNAL_ERROR

3. Po sukcesie:
   - Utworzenie sesji (Supabase robi to automatycznie)
   - Pobranie session cookie
   - Ustawienie cookie w response

4. Return 201 Created + { user, session }
```

**Response 201**:
```typescript
{
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

**Response 400** (VALIDATION_ERROR):
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Błąd walidacji danych",
    details: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    }
  }
}
```

**Response 409** (Conflict):
```typescript
{
  error: {
    code: "CONFLICT",
    message: "Ten email jest już zarejestrowany"
  }
}
```

**Response 500**:
```typescript
{
  error: {
    code: "INTERNAL_ERROR",
    message: "Wystąpił błąd podczas rejestracji"
  }
}
```

**Implementacja** (pseudokod):
```typescript
import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validation/auth.schemas";

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Parse body
  const body = await request.json();

  // 2. Validate
  const validation = registerSchema.safeParse(body);
  if (!validation.success) {
    return new Response(JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Błąd walidacji danych",
        details: validation.error.flatten().fieldErrors
      }
    }), { status: 400 });
  }

  // 3. Sign up with Supabase
  const { data, error } = await locals.supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return new Response(JSON.stringify({
        error: {
          code: "CONFLICT",
          message: "Ten email jest już zarejestrowany"
        }
      }), { status: 409 });
    }

    return new Response(JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "Wystąpił błąd podczas rejestracji"
      }
    }), { status: 500 });
  }

  // 4. Return success
  return new Response(JSON.stringify({
    user: data.user,
    session: data.session
  }), {
    status: 201,
    headers: {
      "Set-Cookie": `supabase-auth-token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`
    }
  });
};
```

---

#### 1.2 POST /api/auth/login

**Plik**: `src/pages/api/auth/login.ts` (NOWY)

**Odpowiedzialność**:
- Logowanie użytkownika
- Walidacja credentials
- Utworzenie sesji
- Ustawienie session cookie

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Walidacja**:
- Schema: `loginSchema` z `auth.schemas.ts`

**Logika**:
```typescript
1. Walidacja danych wejściowych (Zod)
   - Jeśli błąd → return 400 VALIDATION_ERROR

2. Wywołanie supabase.auth.signInWithPassword({ email, password })
   - Jeśli credentials nieprawidłowe → return 401 UNAUTHORIZED
   - Jeśli błąd Supabase → return 500 INTERNAL_ERROR

3. Po sukcesie:
   - Pobranie session
   - Ustawienie session cookie

4. Return 200 OK + { user, session }
```

**Response 200**:
```typescript
{
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

**Response 400** (VALIDATION_ERROR):
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Błąd walidacji danych",
    details: {
      email?: string;
      password?: string;
    }
  }
}
```

**Response 401** (UNAUTHORIZED):
```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Nieprawidłowy email lub hasło"
  }
}
```

---

#### 1.3 POST /api/auth/logout

**Plik**: `src/pages/api/auth/logout.ts` (NOWY)

**Odpowiedzialność**:
- Wylogowanie użytkownika
- Usunięcie sesji w Supabase
- Usunięcie session cookie

**Request Body**: Brak (endpoint wymaga tylko sesji)

**Logika**:
```typescript
1. Wywołanie supabase.auth.signOut()

2. Usunięcie cookie sesji (ustawienie Max-Age=0)

3. Return 200 OK
```

**Response 200**:
```typescript
{
  message: "Wylogowano pomyślnie"
}
```

**Response 401** (jeśli brak sesji):
```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Brak aktywnej sesji"
  }
}
```

---

#### 1.4 POST /api/auth/reset-password (OPCJONALNY w MVP)

**Plik**: `src/pages/api/auth/reset-password.ts` (OPCJONALNY)

**UWAGA**: Ten endpoint NIE jest wymagany w core MVP zgodnie z PRD.

**Odpowiedzialność**:
- Wysłanie emaila z linkiem do resetowania hasła
- Walidacja adresu email

**Request Body**:
```typescript
{
  email: string;
}
```

**Walidacja**:
- Schema: `resetPasswordSchema` z `auth.schemas.ts`

**Logika**:
```typescript
1. Walidacja danych wejściowych (Zod)
   - Jeśli błąd → return 400 VALIDATION_ERROR

2. Wywołanie supabase.auth.resetPasswordForEmail(email)
   - Supabase wyśle email z linkiem
   - Link kieruje do Supabase hosted UI lub custom URL

3. Return 200 OK (nawet jeśli email nie istnieje - security best practice)
```

**Response 200**:
```typescript
{
  message: "Jeśli konto z tym adresem email istnieje, otrzymasz link do resetowania hasła"
}
```

**Uwaga bezpieczeństwa**:
- Zawsze zwracamy 200 OK, nawet jeśli email nie istnieje
- Zapobiega to enumeration attacks
- Użytkownik nie wie, czy email jest w systemie

---

### 2. Middleware

#### 2.1 Aktualizacja middleware autentykacji

**Plik**: `src/middleware/index.ts`

**Obecna funkcjonalność**:
- Dodanie `supabaseClient` do `context.locals`

**Wymagane rozszerzenie**:
```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Dodaj Supabase client do context
  context.locals.supabase = supabaseClient;

  // 2. Sprawdź cookie sesji i odśwież token jeśli potrzeba
  const refreshToken = context.cookies.get("supabase-refresh-token")?.value;

  if (refreshToken) {
    const { data, error } = await supabaseClient.auth.setSession({
      refresh_token: refreshToken,
    });

    if (!error && data.session) {
      // Zaktualizuj cookie z nowym access tokenem
      context.cookies.set("supabase-auth-token", data.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    }
  }

  return next();
});
```

**Odpowiedzialności**:
- Inicjalizacja Supabase client dla każdego żądania
- Automatyczne odświeżanie sesji przy użyciu refresh token
- Aktualizacja cookies z nowymi tokenami

**Kolejność wykonania**:
- Middleware → Layout guards → Page render

---

### 3. Typy TypeScript

#### 3.1 Rozszerzenie App.Locals

**Plik**: `src/env.d.ts` (aktualizacja)

**Dodanie typów dla `locals`**:
```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import("./db/supabase.client").SupabaseClient;
  }
}
```

**Wykorzystanie**:
- Dostęp do `Astro.locals.supabase` w stronach i layoutach
- Dostęp do `context.locals.supabase` w API endpoints

---

#### 3.2 Typy dla auth DTOs

**Plik**: `src/types.ts` (aktualizacja)

**Dodanie nowych typów**:
```typescript
// ============================================================================
// Auth DTOs and Commands
// ============================================================================

/**
 * Login command
 * POST /api/auth/login
 */
export interface LoginCommand {
  email: string;
  password: string;
}

/**
 * Register command
 * POST /api/auth/register
 */
export interface RegisterCommand {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Reset password command
 * POST /api/auth/reset-password
 */
export interface ResetPasswordCommand {
  email: string;
}

/**
 * Auth response with user and session
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * Logout response
 */
export interface LogoutResponse {
  message: string;
}
```

---

### 4. Obsługa błędów

#### 4.1 Error Helper

**Plik**: `src/lib/helpers/error.helper.ts` (istniejący - potencjalne rozszerzenie)

**Nowe helper functions**:
```typescript
/**
 * Tworzy standardowy response błędu autentykacji
 */
export function createAuthErrorResponse(
  message: string = "Brak autoryzacji"
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message,
      },
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" }
    }
  );
}

/**
 * Tworzy response błędu konfliktu (np. email już istnieje)
 */
export function createConflictErrorResponse(
  message: string
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: "CONFLICT",
        message,
      },
    }),
    {
      status: 409,
      headers: { "Content-Type": "application/json" }
    }
  );
}
```

---

## System Autentykacji

### 1. Integracja Supabase Auth

#### 1.1 Konfiguracja Supabase Client

**Plik**: `src/db/supabase.client.ts` (istniejący - brak zmian)

**Obecna konfiguracja**:
```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

export type SupabaseClient = typeof supabaseClient;
```

**Uwagi**:
- Client jest singleton - jedna instancja dla całej aplikacji
- Używa anon key (bezpieczne dla klienta)
- Row Level Security (RLS) w Supabase chroni dane użytkowników

---

#### 1.2 Row Level Security (RLS) Policies

**Wymagane polityki w Supabase**:

**Tabela `flashcards`**:
```sql
-- Użytkownik może czytać tylko swoje fiszki
CREATE POLICY "Users can read own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- Użytkownik może tworzyć tylko swoje fiszki
CREATE POLICY "Users can insert own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Użytkownik może aktualizować tylko swoje fiszki
CREATE POLICY "Users can update own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id);

-- Użytkownik może usuwać tylko swoje fiszki
CREATE POLICY "Users can delete own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);
```

**Tabela `generations`**:
```sql
-- Użytkownik może czytać tylko swoje generacje
CREATE POLICY "Users can read own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);

-- Użytkownik może tworzyć tylko swoje generacje
CREATE POLICY "Users can insert own generations"
ON generations FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Włączenie RLS**:
```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
```

---

#### 1.3 Automatyczne ustawianie user_id

**Problem**:
- Klient nie powinien wysyłać `user_id` w request body
- Backend musi automatycznie ustawić `user_id` z sesji

**Rozwiązanie - funkcja pomocnicza**:

**Plik**: `src/lib/helpers/auth.helper.ts` (NOWY)

```typescript
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Pobiera ID zalogowanego użytkownika z sesji
 * Rzuca błędem jeśli użytkownik nie jest zalogowany
 */
export async function getAuthenticatedUserId(
  supabase: SupabaseClient
): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return session.user.id;
}

/**
 * Pobiera pełne dane sesji użytkownika
 */
export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    session,
  };
}
```

**Wykorzystanie w API endpoints**:
```typescript
// W POST /api/flashcards
const userId = await getAuthenticatedUserId(locals.supabase);

const { data, error } = await locals.supabase
  .from("flashcards")
  .insert({
    ...body,
    user_id: userId,  // Automatycznie ustawione
  });
```

---

### 2. Zarządzanie sesjami

#### 2.1 Session Cookies

**Strategia cookies**:
- Cookies ustawiane przez backend po loginie/rejestracji
- HttpOnly flag = zabezpieczenie przed XSS
- Secure flag = tylko HTTPS (produkcja)
- SameSite=Lax = ochrona przed CSRF

**Struktura cookies**:

1. **`supabase-auth-token`** (access token):
   - Krótkotrwały token (domyślnie 1h)
   - Używany do autoryzacji API requests
   - HttpOnly, Secure, SameSite=Lax

2. **`supabase-refresh-token`** (refresh token):
   - Długotrwały token (domyślnie 7 dni)
   - Używany do odświeżania access token
   - HttpOnly, Secure, SameSite=Lax

**Ustawienie cookies w API**:
```typescript
// Po sukcesie logowania/rejestracji
const headers = new Headers();

headers.append(
  "Set-Cookie",
  `supabase-auth-token=${session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
);

headers.append(
  "Set-Cookie",
  `supabase-refresh-token=${session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
);

return new Response(JSON.stringify(data), { headers });
```

**Usunięcie cookies przy logout**:
```typescript
const headers = new Headers();

headers.append(
  "Set-Cookie",
  `supabase-auth-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
);

headers.append(
  "Set-Cookie",
  `supabase-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
);

return new Response(JSON.stringify({ message: "Wylogowano" }), { headers });
```

---

#### 2.2 Odświeżanie sesji

**Mechanizm**:
- Middleware sprawdza cookie z refresh tokenem
- Jeśli access token wygasł, automatycznie odświeża
- Nowy access token zapisywany w cookie

**Implementacja w middleware** (już opisana w sekcji Middleware)

**Flow**:
```
1. Request → Middleware
2. Middleware sprawdza refresh_token cookie
3. Jeśli istnieje → supabase.auth.setSession({ refresh_token })
4. Supabase zwraca nową sesję z nowym access_token
5. Middleware aktualizuje cookie
6. Request kontynuowany z aktywną sesją
```

---

### 3. Ochrona tras (Route Guards)

#### 3.1 Layout-level Guard

**Lokalizacja**: `src/layouts/AppLayout.astro`

**Mechanizm**:
```astro
---
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect("/login");
}
---
```

**Odpowiedzialność**:
- Sprawdzenie sesji przy każdym renderowaniu strony
- Przekierowanie do `/login` jeśli brak sesji
- Ochrona wszystkich stron używających `AppLayout`

**Chronione strony**:
- `/app/dashboard`
- `/app/generate`
- `/app/flashcards` (planowane)
- `/app/study` (planowane)
- `/app/settings` (opcjonalne w MVP)

---

#### 3.2 API-level Guard

**Mechanizm**:
- Każdy endpoint API chroniony weryfikacją sesji
- Wykorzystanie helpera `getAuthenticatedUserId()`
- Return 401 UNAUTHORIZED jeśli brak sesji

**Przykład w API endpoint**:
```typescript
export const POST: APIRoute = async ({ locals }) => {
  try {
    const userId = await getAuthenticatedUserId(locals.supabase);
    // ... dalsze przetwarzanie
  } catch (error) {
    return createAuthErrorResponse();
  }
};
```

**Chronione endpointy**:
- `POST /api/flashcards`
- `POST /api/flashcards/bulk`
- `PATCH /api/flashcards/:id`
- `DELETE /api/flashcards/:id`
- `GET /api/flashcards`
- `POST /api/generations`
- `GET /api/generations`
- `GET /api/generations/statistics`

---

#### 3.3 Redirect Logic

**Reguły przekierowań**:

1. **Niezalogowany próbuje wejść na `/app/*`**:
   - Redirect → `/login`

2. **Zalogowany próbuje wejść na `/login` lub `/register`**:
   - Redirect → `/app/dashboard`

3. **Po pomyślnym logowaniu**:
   - Redirect → `/app/dashboard`

4. **Po pomyślnej rejestracji**:
   - Redirect → `/app/dashboard`

5. **Po wylogowaniu**:
   - Redirect → `/` (landing page)

---

### 4. Konfiguracja Supabase Dashboard

**Wymagane ustawienia w Supabase Dashboard**:

#### 4.1 Authentication Settings

**Site URL**:
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

**Redirect URLs** (dozwolone):
- `http://localhost:3000/app/dashboard`
- `https://yourdomain.com/app/dashboard`

**Email Auth**:
- Enable Email provider: ✓
- Confirm email: ✗ (wyłączone w MVP - automatyczna aktywacja konta)
- Secure email change: ✓

**WAŻNE**: Zgodnie z US-001, po rejestracji "konto jest aktywowane" automatycznie bez konieczności potwierdzania emaila. "Weryfikacja danych" oznacza tylko walidację formatu przez Zod, NIE weryfikację przez link w emailu.

**Password Requirements**:
- Minimum length: 8 characters
- Require letters: ✓
- Require numbers: opcjonalne
- Require special characters: opcjonalne

#### 4.2 Email Templates

**Konfiguracja szablonów email**:

1. **Confirmation Email**: ✗ Wyłączony w MVP (automatyczna aktywacja konta)
2. **Reset Password Email**: Opcjonalny w MVP
   - Subject: "Resetowanie hasła - 10xCards"
   - Template customization w Supabase Dashboard
   - Redirect URL: `/reset-password/confirm`
3. **Magic Link**: ✗ Wyłączony w MVP

---

## Przepływy Użytkownika

### Mapowanie User Stories na implementację

#### US-001: Rejestracja konta
**Realizacja:**
- ✅ Strona: `/register` z komponentem `RegisterForm`
- ✅ Endpoint: `POST /api/auth/register`
- ✅ Walidacja: Zod schema (email + password + confirmPassword)
- ✅ Automatyczna aktywacja: Brak weryfikacji email (confirm email wyłączone)
- ✅ Auto-login: Po rejestracji użytkownik jest automatycznie logowany
- ✅ Redirect: Przekierowanie do `/app/dashboard`
- **Zgodność**: Pełna zgodność z PRD

#### US-002: Logowanie do aplikacji
**Realizacja:**
- ✅ Strona: `/login` z komponentem `LoginForm`
- ✅ Endpoint: `POST /api/auth/login`
- ✅ Walidacja: Zod schema (email + password)
- ✅ Session management: Supabase Auth + cookies
- ✅ Redirect: Przekierowanie do `/app/dashboard`
- ✅ Bezpieczeństwo: HttpOnly cookies, secure storage
- **Zgodność**: Pełna zgodność z PRD

#### US-009: Bezpieczny dostęp i autoryzacja
**Realizacja:**
- ✅ Dedykowane strony: `/login` i `/register`
- ✅ Brak zewnętrznych dostawców: Tylko email + hasło
- ✅ Ochrona danych: Row Level Security (RLS) w Supabase
- ✅ Layout guard: `AppLayout.astro` sprawdza sesję
- ✅ API guard: Wszystkie chronione endpointy weryfikują sesję
- ✅ User isolation: RLS policies zapewniają dostęp tylko do własnych fiszek
- **Zgodność**: Pełna zgodność z PRD

#### US-010: Strona główna dla nowych użytkowników
**Realizacja:**
- ✅ Strona: `/` (landing page) - już istniejąca
- ✅ Aktualizacja: `LandingNavigation.astro` z przyciskami CTA
- ✅ Przyciski: "Zaloguj się" i "Rozpocznij za darmo"
- ✅ Dostępność: Publicznie dostępna bez logowania
- **Zgodność**: Pełna zgodność z PRD

### Funkcjonalności POZA core MVP (do rozważenia w kolejnych iteracjach):
- ⚠️ Reset hasła (`/reset-password`, `ResetPasswordForm`, endpoint)
- ⚠️ Ustawienia konta (`/app/settings`, zmiana hasła, usunięcie konta)
- ℹ️ **Uwaga**: PRD wymienia "możliwość usunięcia konta" w wymaganiach funkcjonalnych, ale nie ma dedykowanego User Story i może być dodane później

---

### 1. Diagram przepływu - Rejestracja

```
┌─────────────┐
│ Landing     │
│ Page (/)    │
└──────┬──────┘
       │ Klik "Rozpocznij za darmo"
       ▼
┌─────────────────┐
│ /register       │
│                 │
│ [Form]          │
│ - email         │
│ - password      │
│ - confirmPass   │
└────────┬────────┘
         │ Submit
         ▼
    ┌────────────┐
    │ Walidacja  │
    │ klienta    │
    └─────┬──────┘
          │ OK
          ▼
    ┌──────────────────┐
    │ POST /api/auth/  │
    │     register     │
    └────────┬─────────┘
             │
        ┌────┴────┐
        │         │
     ERROR      SUCCESS
        │         │
        ▼         ▼
   ┌────────┐  ┌──────────────┐
   │ Alert  │  │ Auto-login   │
   │ Błędu  │  │ Set cookies  │
   └────────┘  └──────┬───────┘
                      │
                      ▼
               ┌─────────────┐
               │ Redirect to │
               │ /app/       │
               │ dashboard   │
               └─────────────┘
```

---

### 2. Diagram przepływu - Logowanie

```
┌─────────────┐
│ /login      │
│             │
│ [Form]      │
│ - email     │
│ - password  │
└──────┬──────┘
       │ Submit
       ▼
  ┌────────────┐
  │ Walidacja  │
  │ klienta    │
  └─────┬──────┘
        │ OK
        ▼
  ┌──────────────────┐
  │ POST /api/auth/  │
  │     login        │
  └────────┬─────────┘
           │
      ┌────┴────┐
      │         │
   ERROR      SUCCESS
      │         │
      ▼         ▼
 ┌────────┐  ┌──────────────┐
 │ Alert  │  │ Set cookies  │
 │ 401    │  │ Session data │
 └────────┘  └──────┬───────┘
                    │
                    ▼
             ┌─────────────┐
             │ Redirect to │
             │ /app/       │
             │ dashboard   │
             └─────────────┘
```

---

### 3. Diagram przepływu - Ochrona tras

```
User enters /app/dashboard
         │
         ▼
    ┌─────────┐
    │ SSR     │
    │ Astro   │
    └────┬────┘
         │
         ▼
  ┌──────────────┐
  │ Middleware   │
  │ - init       │
  │   supabase   │
  │ - refresh    │
  │   session    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ AppLayout    │
  │ getSession() │
  └──────┬───────┘
         │
    ┌────┴────┐
    │         │
  NO         YES
 SESSION   SESSION
    │         │
    ▼         ▼
┌────────┐  ┌──────────┐
│Redirect│  │ Render   │
│to      │  │ Page     │
│/login  │  │ Content  │
└────────┘  └──────────┘
```

---

### 4. Diagram przepływu - Wylogowanie

```
┌──────────────┐
│ User clicks  │
│ "Wyloguj się"│
│ in UserMenu  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ POST /api/auth/  │
│     logout       │
└────────┬─────────┘
         │
         ▼
   ┌──────────┐
   │ Supabase │
   │ signOut()│
   └─────┬────┘
         │
         ▼
   ┌──────────┐
   │ Clear    │
   │ cookies  │
   └─────┬────┘
         │
         ▼
   ┌──────────┐
   │ Return   │
   │ 200 OK   │
   └─────┬────┘
         │
         ▼
   ┌──────────────┐
   │ Frontend     │
   │ redirect to /│
   └──────────────┘
```

---

## Bezpieczeństwo i Zgodność

### 1. Zabezpieczenia

#### 1.1 Ochrona przed atakami

**XSS (Cross-Site Scripting)**:
- HttpOnly cookies - JavaScript nie ma dostępu do tokenów
- React automatycznie escapuje output
- Brak `dangerouslySetInnerHTML` w komponentach auth

**CSRF (Cross-Site Request Forgery)**:
- SameSite=Lax cookies
- Weryfikacja origin w middleware (opcjonalnie)
- Supabase SDK ma wbudowaną ochronę

**SQL Injection**:
- Supabase SDK używa prepared statements
- Zod walidacja zapobiega nietypowym danych
- Row Level Security w bazie

**Brute Force**:
- MVP: Brak rate limiting (do dodania w przyszłości)
- Supabase ma wbudowany basic rate limiting

**Session Hijacking**:
- Secure cookies (tylko HTTPS w produkcji)
- HttpOnly cookies
- Krótki czas życia access token (1h)

---

#### 1.2 Bezpieczeństwo haseł

**Wymagania**:
- Minimum 8 znaków
- Hasła hashowane przez Supabase (bcrypt)
- Brak przechowywania plaintext passwords
- Bezpieczne porównywanie przez Supabase Auth

**Best practices**:
- Input type="password" dla pól hasła
- Autocomplete="new-password" dla rejestracji
- Autocomplete="current-password" dla logowania
- Brak walidacji siły hasła w MVP (można dodać w przyszłości)

---

#### 1.3 Bezpieczeństwo API

**Autoryzacja**:
- Każdy endpoint sprawdza sesję
- Row Level Security w bazie
- Brak możliwości dostępu do danych innych użytkowników

**Walidacja**:
- Zod schemas dla wszystkich input data
- Sanityzacja danych wejściowych
- Weryfikacja typów

**Rate Limiting** (do dodania w przyszłości):
- Limit requests per IP
- Limit failed login attempts
- Wykorzystanie Redis lub Upstash

---

### 2. Zgodność z RODO

#### 2.1 Przechowywanie danych

**Dane osobowe**:
- Email użytkownika (przechowywany w Supabase Auth)
- Hasło (zahashowane przez Supabase)
- Fiszki użytkownika (powiązane przez user_id)

**Lokalizacja danych**:
- Supabase: wybór regionu EU dla RODO compliance
- Rekomendacja: eu-central-1 (Frankfurt)

**Szyfrowanie**:
- At rest: Supabase szyfruje dane w bazie
- In transit: HTTPS dla wszystkich połączeń

---

#### 2.2 Prawa użytkownika

**Prawo do wglądu**:
- Endpoint GET `/api/user/data` (do implementacji)
- Zwraca wszystkie dane użytkownika
- Wymaga autentykacji

**Prawo do usunięcia** (US-009):
- Funkcja w `/app/settings` - „Usuń konto"
- Endpoint DELETE `/api/user/account`
- Kaskadowe usunięcie:
  1. Usunięcie wszystkich fiszek użytkownika
  2. Usunięcie wszystkich generacji użytkownika
  3. Usunięcie konta w Supabase Auth

**Implementacja usunięcia konta**:
```typescript
// Pseudokod dla DELETE /api/user/account
export const DELETE: APIRoute = async ({ locals }) => {
  const userId = await getAuthenticatedUserId(locals.supabase);

  // 1. Usuń fiszki
  await locals.supabase
    .from("flashcards")
    .delete()
    .eq("user_id", userId);

  // 2. Usuń generacje
  await locals.supabase
    .from("generations")
    .delete()
    .eq("user_id", userId);

  // 3. Usuń użytkownika (Supabase Admin API)
  await locals.supabase.auth.admin.deleteUser(userId);

  // 4. Clear cookies
  return new Response(JSON.stringify({ message: "Konto zostało usunięte" }), {
    headers: {
      "Set-Cookie": "supabase-auth-token=; Max-Age=0",
    }
  });
};
```

**Uwaga**: Wymaga service role key dla `auth.admin.deleteUser()` - tylko server-side.

---

#### 2.3 Polityka prywatności

**Wymagane informacje**:
- Jakie dane zbieramy (email, hasło, fiszki)
- Jak wykorzystujemy dane (autentykacja, świadczenie usługi)
- Gdzie przechowujemy dane (Supabase, region EU)
- Jak długo przechowujemy (do usunięcia konta)
- Prawa użytkownika (wgląd, usunięcie)

**Lokalizacja**:
- Strona `/privacy-policy`
- Link w footerze aplikacji
- Link przy rejestracji

---

### 3. Zmienne środowiskowe

**Plik**: `.env`

**Wymagane zmienne**:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Tylko dla admin operations

# App Configuration
PUBLIC_SITE_URL=http://localhost:3000  # Dla development
```

**Bezpieczeństwo**:
- `.env` w `.gitignore`
- Nigdy nie commitować kluczy do repo
- Używać secrets w CI/CD (GitHub Secrets, DigitalOcean App Platform)
- Service role key tylko server-side, nigdy na frontendzie

---

## Podsumowanie

### Nowe pliki do utworzenia

**Strony**:
1. `src/pages/login.astro`
2. `src/pages/register.astro`
3. `src/pages/reset-password.astro`
4. `src/pages/app/settings.astro`

**Komponenty React**:
5. `src/components/auth/LoginForm.tsx`
6. `src/components/auth/RegisterForm.tsx`
7. `src/components/auth/ResetPasswordForm.tsx`
8. `src/components/auth/UserMenu.tsx`

**API Endpoints**:
9. `src/pages/api/auth/register.ts`
10. `src/pages/api/auth/login.ts`
11. `src/pages/api/auth/logout.ts`
12. `src/pages/api/auth/reset-password.ts`

**Helpery i walidacja**:
13. `src/lib/validation/auth.schemas.ts`
14. `src/lib/helpers/auth.helper.ts`

**Opcjonalnie (RODO)**:
15. `src/pages/api/user/account.ts` (DELETE endpoint)
16. `src/pages/privacy-policy.astro`

---

### Pliki do modyfikacji

1. `src/middleware/index.ts` - dodanie logiki odświeżania sesji
2. `src/layouts/AppLayout.astro` - aktywacja auth guard
3. `src/components/Navigation.astro` - dodanie UserMenu
4. `src/components/landing/LandingNavigation.astro` - dodanie linków do login/register
5. `src/types.ts` - dodanie typów dla auth DTOs
6. `src/env.d.ts` - rozszerzenie App.Locals

---

### Supabase Dashboard - wymagane konfiguracje

1. **Authentication Settings**:
   - Enable Email provider
   - Ustawienie Site URL i Redirect URLs
   - Konfiguracja Password Requirements

2. **Row Level Security**:
   - Włączenie RLS dla tabel `flashcards` i `generations`
   - Utworzenie policies dla CRUD operations

3. **Email Templates**:
   - Customizacja szablonu "Reset Password"

---

### Kolejność implementacji (rekomendacja)

**Faza 1 - Infrastruktura**:
1. Utworzenie Zod schemas (`auth.schemas.ts`)
2. Utworzenie auth helpers (`auth.helper.ts`)
3. Aktualizacja typów (`types.ts`, `env.d.ts`)
4. Aktualizacja middleware (`middleware/index.ts`)

**Faza 2 - Backend API**:
5. Endpoint `/api/auth/register`
6. Endpoint `/api/auth/login`
7. Endpoint `/api/auth/logout`
8. Endpoint `/api/auth/reset-password`

**Faza 3 - Frontend Components**:
9. `LoginForm.tsx`
10. `RegisterForm.tsx`
11. `ResetPasswordForm.tsx`
12. `UserMenu.tsx`

**Faza 4 - Strony**:
13. `/login` page
14. `/register` page
15. `/reset-password` page
16. Aktualizacja `LandingNavigation.astro`

**Faza 5 - Ochrona**:
17. Aktywacja guard w `AppLayout.astro`
18. Aktualizacja `Navigation.astro` z UserMenu
19. Dodanie RLS policies w Supabase

**Faza 6 - RODO & Compliance**:
20. `/app/settings` page
21. Endpoint DELETE `/api/user/account`
22. Privacy policy page

---

### Testowanie

**Scenariusze do przetestowania**:

1. ✓ Rejestracja nowego użytkownika
2. ✓ Rejestracja z istniejącym emailem (błąd 409)
3. ✓ Logowanie z prawidłowymi credentials
4. ✓ Logowanie z nieprawidłowymi credentials (błąd 401)
5. ✓ Wylogowanie
6. ✓ Próba dostępu do `/app/*` bez sesji (redirect do login)
7. ✓ Próba dostępu do `/login` z aktywną sesją (redirect do dashboard)
8. ✓ Automatyczne odświeżanie sesji po wygaśnięciu access token
9. ✓ Odzyskiwanie hasła
10. ✓ Usunięcie konta wraz z danymi

**Narzędzia**:
- Playwright lub Cypress dla E2E tests
- Vitest dla unit tests komponentów
- Manual testing w przeglądarce

---

## Koniec specyfikacji

Dokument opracowany zgodnie z wymaganiami PRD (US-001, US-002, US-009) oraz tech stackiem projektu 10xCards.

Wersja: 1.0
Data: 2025-11-10
