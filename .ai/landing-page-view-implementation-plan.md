# Plan implementacji widoku Landing Page (Strona Główna)

## 1. Przegląd

Landing Page jest publiczną stroną główną aplikacji 10xCards, dostępną pod ścieżką `/`. Jej głównym celem jest przedstawienie aplikacji potencjalnym użytkownikom, którzy nie są jeszcze zalogowani. Strona ma przekonać odwiedzających do wartości aplikacji poprzez jasne przedstawienie kluczowych funkcji (generowanie fiszek przez AI, spaced repetition) i zachęcić do rejestracji za pomocą wyraźnych przycisków Call-to-Action (CTA).

Widok jest w pełni statyczny (zbudowany w Astro), co zapewnia doskonałą wydajność, SEO i dostępność. Nie wymaga uwierzytelniania ani pobierania danych z API - jest to czysto prezentacyjna strona marketingowa.

## 2. Routing widoku

- **Ścieżka:** `/`
- **Plik:** `src/pages/index.astro`
- **Dostępność:** Publiczna (bez wymagania autentykacji)
- **Przekierowania:**
  - Przyciski "Zarejestruj się" → `/register`
  - Przyciski "Zaloguj się" → `/login`

## 3. Struktura komponentów

```
pages/index.astro (Landing Page)
├── layouts/Layout.astro (istniejący layout HTML)
├── components/landing/
│   ├── LandingNavigation.astro (nowa nawigacja dla niezalogowanych)
│   │   ├── Logo
│   │   └── Button (Login, Register) - z ui/button.tsx
│   ├── Hero.astro (sekcja główna)
│   │   ├── Heading (h1)
│   │   ├── Description (p)
│   │   ├── CTA Buttons Container
│   │   │   ├── Button (Register - primary) - z ui/button.tsx
│   │   │   └── Button (Login - secondary) - z ui/button.tsx
│   │   └── Hero Image/Illustration (opcjonalnie)
│   ├── Features.astro (sekcja z funkcjami)
│   │   ├── Section Heading (h2)
│   │   └── Features Grid
│   │       ├── FeatureCard.astro (AI Generation)
│   │       ├── FeatureCard.astro (Spaced Repetition)
│   │       └── FeatureCard.astro (Personal Learning)
│   └── Footer.astro (stopka)
│       ├── Logo & Description
│       ├── Links (Privacy, Terms)
│       └── Copyright Notice
```

## 4. Szczegóły komponentów

### 4.1. LandingNavigation.astro

**Opis komponentu:**
Nawigacja dla niezalogowanych użytkowników, wyświetlana na górze Landing Page. Zawiera logo aplikacji po lewej stronie oraz przyciski "Zaloguj się" i "Zarejestruj się" po prawej stronie. Jest responsywna i dostosowuje się do różnych rozmiarów ekranów.

**Główne elementy HTML:**
```astro
<nav>
  <div class="container">
    <a href="/" aria-label="10xCards - Strona główna">
      <span>🎴</span>
      <span>10xCards</span>
    </a>
    <div class="actions">
      <Button variant="ghost">Zaloguj się</Button>
      <Button variant="default">Zarejestruj się</Button>
    </div>
  </div>
</nav>
```

**Obsługiwane interakcje:**
- Kliknięcie na logo → przekierowanie do `/` (reload strony głównej)
- Kliknięcie "Zaloguj się" → przekierowanie do `/login`
- Kliknięcie "Zarejestruj się" → przekierowanie do `/register`

**Obsługiwana walidacja:**
Brak walidacji (tylko nawigacja)

**Typy:**
Brak specjalnych typów (komponent statyczny Astro)

**Propsy:**
Brak propsów (stała zawartość)

---

### 4.2. Hero.astro

**Opis komponentu:**
Główna sekcja Landing Page (tzw. "above the fold"), która jest pierwszą rzeczą widzianą przez użytkownika. Zawiera chwytliwy nagłówek, krótki opis wartości aplikacji oraz dwa duże przyciski CTA zachęcające do rejestracji. Opcjonalnie może zawierać ilustrację lub zrzut ekranu aplikacji.

**Główne elementy HTML:**
```astro
<section class="hero">
  <div class="container">
    <div class="hero-content">
      <h1>Twórz fiszki 10x szybciej z AI</h1>
      <p>
        Automatycznie generuj wysokiej jakości fiszki edukacyjne z dowolnego tekstu.
        Ucz się efektywniej dzięki inteligentnym powtórkom.
      </p>
      <div class="cta-buttons">
        <Button size="lg" variant="default">
          Zacznij za darmo
        </Button>
        <Button size="lg" variant="outline">
          Zaloguj się
        </Button>
      </div>
    </div>
    <div class="hero-image">
      <!-- Ilustracja lub zrzut ekranu aplikacji -->
    </div>
  </div>
</section>
```

**Obsługiwane interakcje:**
- Kliknięcie "Zacznij za darmo" → przekierowanie do `/register`
- Kliknięcie "Zaloguj się" → przekierowanie do `/login`

**Obsługiwana walidacja:**
Brak walidacji (tylko prezentacja i nawigacja)

**Typy:**
Brak specjalnych typów

**Propsy:**
Brak propsów (stała zawartość)

---

### 4.3. Features.astro

**Opis komponentu:**
Sekcja prezentująca trzy główne funkcje aplikacji: generowanie fiszek przez AI, algorytm spaced repetition i personalizowane uczenie się. Każda funkcja jest przedstawiona w osobnej karcie z ikoną, nagłówkiem i opisem.

**Główne elementy HTML:**
```astro
<section class="features">
  <div class="container">
    <h2>Dlaczego 10xCards?</h2>
    <p class="section-description">
      Nowoczesne narzędzie łączące moc sztucznej inteligencji z naukowo potwierdzonymi metodami nauki
    </p>
    <div class="features-grid">
      <FeatureCard
        icon="✨"
        title="Generowanie przez AI"
        description="Wklej tekst, a AI automatycznie stworzy dla Ciebie zestaw pytań i odpowiedzi. Oszczędź godziny pracy."
      />
      <FeatureCard
        icon="🧠"
        title="Inteligentne powtórki"
        description="Algorytm spaced repetition dopasowuje harmonogram nauki do Twoich postępów, maksymalizując efektywność."
      />
      <FeatureCard
        icon="📊"
        title="Twój własny zestaw"
        description="Wszystkie fiszki są prywatne. Edytuj, usuwaj i dodawaj własne fiszki według potrzeb."
      />
    </div>
  </div>
</section>
```

**Komponenty dzieci:**
- `FeatureCard.astro` (x3) - karty pojedynczych funkcji

**Obsługiwane interakcje:**
Brak bezpośrednich interakcji (sekcja informacyjna)

**Obsługiwana walidacja:**
Brak walidacji

**Typy:**
```typescript
// Props dla komponentu Features
interface FeaturesProps {
  // Brak - używa stałej zawartości
}
```

**Propsy:**
Brak propsów (stała zawartość)

---

### 4.4. FeatureCard.astro

**Opis komponentu:**
Reużywalny komponent karty funkcji, wyświetlający ikonę, tytuł i opis pojedynczej funkcji aplikacji. Używany trzykrotnie w sekcji Features.

**Główne elementy HTML:**
```astro
<div class="feature-card">
  <div class="feature-icon">{icon}</div>
  <h3 class="feature-title">{title}</h3>
  <p class="feature-description">{description}</p>
</div>
```

**Obsługiwane interakcje:**
Brak interakcji (komponent prezentacyjny)

**Obsługiwana walidacja:**
Brak walidacji

**Typy:**
```typescript
interface FeatureCardProps {
  icon: string;        // Emoji lub ikona (np. "✨")
  title: string;       // Tytuł funkcji (np. "Generowanie przez AI")
  description: string; // Opis funkcji
}
```

**Propsy:**
- `icon` (string, required) - emoji lub ikona reprezentująca funkcję
- `title` (string, required) - tytuł funkcji
- `description` (string, required) - opis funkcji

---

### 4.5. Footer.astro

**Opis komponentu:**
Stopka strony zawierająca logo, krótki opis aplikacji, linki do stron prawnych (Privacy Policy, Terms of Service) oraz informację o prawach autorskich.

**Główne elementy HTML:**
```astro
<footer class="footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-brand">
        <div class="footer-logo">
          <span>🎴</span>
          <span>10xCards</span>
        </div>
        <p>Ucz się szybciej z pomocą AI</p>
      </div>

      <div class="footer-links">
        <h4>Prawne</h4>
        <ul>
          <li><a href="/privacy">Polityka prywatności</a></li>
          <li><a href="/terms">Regulamin</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2025 10xCards. Wszelkie prawa zastrzeżone.</p>
    </div>
  </div>
</footer>
```

**Obsługiwane interakcje:**
- Kliknięcie linków do stron prawnych → przekierowanie do `/privacy` lub `/terms`

**Obsługiwana walidacja:**
Brak walidacji

**Typy:**
Brak specjalnych typów

**Propsy:**
Brak propsów (stała zawartość)

## 5. Typy

Landing Page nie wymaga złożonych typów DTO, ponieważ nie komunikuje się z API i nie przetwarza danych użytkownika. Jedyne typy to propsy komponentów:

```typescript
// src/components/landing/FeatureCard.astro
interface FeatureCardProps {
  icon: string;        // Emoji lub ikona (np. "✨", "🧠", "📊")
  title: string;       // Tytuł funkcji (1-50 znaków)
  description: string; // Opis funkcji (50-200 znaków)
}

// Inne komponenty (Hero, Features, Footer, LandingNavigation) nie przyjmują propsów
```

**Uwaga:** Komponent Button z `ui/button.tsx` używa typów z shadcn/ui:
```typescript
// Z istniejącego kodu button.tsx
type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }

// Warianty: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
// Rozmiary: "default" | "sm" | "lg" | "icon"
```

## 6. Zarządzanie stanem

Landing Page jest **całkowicie statyczna** i nie wymaga zarządzania stanem. Wszystkie komponenty są komponentami Astro (.astro), które renderują się po stronie serwera i nie zawierają logiki klienckiej.

**Brak:**
- Custom hooków React
- Zmiennych stanu (useState, useReducer)
- Efektów (useEffect)
- Kontekstów React

**Uzasadnienie:**
Strona jest czysto prezentacyjna i nie wymaga interaktywności poza prostą nawigacją (linki). Używanie komponentów Astro zamiast React zapewnia:
- Lepszą wydajność (zero JavaScript po stronie klienta)
- Lepsze SEO
- Szybsze ładowanie strony
- Prostszą implementację

## 7. Integracja API

Landing Page **nie integruje się z żadnymi endpointami API**.

**Uzasadnienie:**
- Strona jest publiczna i nie wymaga autentykacji
- Nie wyświetla żadnych danych z bazy danych
- Nie wysyła żadnych danych do serwera
- Wszystkie interakcje to zwykłe przekierowania (`<a>` lub `<Button asChild>` z linkami)

**Przekierowania:**
- `/register` - przekierowanie do strony rejestracji (będzie implementowana osobno)
- `/login` - przekierowanie do strony logowania (będzie implementowana osobno)

## 8. Interakcje użytkownika

### 8.1. Nawigacja do rejestracji
**Trigger:** Kliknięcie przycisku "Zarejestruj się" lub "Zacznij za darmo"
**Akcja:** Przekierowanie do `/register`
**Implementacja:**
```astro
<a href="/register">
  <Button size="lg" variant="default">Zacznij za darmo</Button>
</a>
```

### 8.2. Nawigacja do logowania
**Trigger:** Kliknięcie przycisku "Zaloguj się"
**Akcja:** Przekierowanie do `/login`
**Implementacja:**
```astro
<a href="/login">
  <Button size="lg" variant="outline">Zaloguj się</Button>
</a>
```

### 8.3. Nawigacja do strony głównej (logo)
**Trigger:** Kliknięcie na logo w nawigacji
**Akcja:** Przekierowanie do `/` (reload strony głównej)
**Implementacja:**
```astro
<a href="/" aria-label="10xCards - Strona główna">
  <span>🎴</span>
  <span>10xCards</span>
</a>
```

### 8.4. Przewijanie strony
**Trigger:** Użytkownik przewija stronę w dół
**Akcja:** Stopniowe odkrywanie kolejnych sekcji (Hero → Features → Footer)
**Implementacja:** Natywne zachowanie przeglądarki, opcjonalnie można dodać animacje scroll z Tailwind (`scroll-smooth`)

### 8.5. Hover nad przyciskami
**Trigger:** Najechanie myszą na przycisk
**Akcja:** Zmiana wyglądu przycisku (efekt hover z Tailwind/shadcn)
**Implementacja:** Automatycznie obsługiwane przez komponent Button z shadcn/ui

## 9. Warunki i walidacja

Landing Page **nie zawiera walidacji** ze względu na brak formularzy i danych wejściowych użytkownika.

**Brak:**
- Formularzy do wypełnienia
- Pól input wymagających walidacji
- Sprawdzania danych po stronie klienta lub serwera
- Komunikatów o błędach walidacji

**Wyjątki:**
- Linki do `/register` i `/login` muszą być poprawne (weryfikacja podczas budowania)
- Wszystkie przyciski muszą mieć odpowiednie atrybuty dostępności (aria-label, role)

## 10. Obsługa błędów

Ze względu na statyczny charakter Landing Page, obsługa błędów jest minimalna:

### 10.1. Błędy routingu
**Scenariusz:** Użytkownik próbuje przejść do nieistniejącej strony
**Obsługa:** Astro automatycznie wyświetli stronę 404 (można dostosować w `src/pages/404.astro`)

### 10.2. Błędy ładowania obrazów
**Scenariusz:** Obrazy w sekcji Hero nie mogą się załadować
**Obsługa:**
- Używać optymalizacji obrazów Astro (`<Image>` z `astro:assets`)
- Dodać fallback alt text dla dostępności
- Opcjonalnie: lazy loading dla obrazów poniżej "fold"

```astro
<Image
  src={heroImage}
  alt="Przykład interfejsu 10xCards z wygenerowanymi fiszkami"
  loading="eager"
  width={600}
  height={400}
/>
```

### 10.3. Błędy JavaScript (minimalne)
**Scenariusz:** Rzadko występujące błędy w przeglądarce
**Obsługa:** Ponieważ Landing Page nie używa JavaScript klienta (pure Astro), ryzyko jest minimalne

### 10.4. Brak dostępności internetu
**Scenariusz:** Użytkownik nie ma połączenia z internetem
**Obsługa:** Przeglądarka automatycznie wyświetli komunikat o braku połączenia

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury katalogów
- Utworzyć katalog `src/components/landing/` dla komponentów Landing Page
- Sprawdzić, czy istnieje `src/layouts/Layout.astro` (już istnieje)

### Krok 2: Implementacja LandingNavigation.astro
- Utworzyć plik `src/components/landing/LandingNavigation.astro`
- Dodać strukturę HTML z logo i przyciskami
- Stylować z Tailwind CSS (sticky nav, responsywna)
- Zaimportować komponent Button z `@/components/ui/button`
- Użyć wariantu `ghost` dla "Zaloguj się" i `default` dla "Zarejestruj się"
- Dodać aria-labels dla dostępności

### Krok 3: Implementacja FeatureCard.astro
- Utworzyć plik `src/components/landing/FeatureCard.astro`
- Zdefiniować interfejs props (icon, title, description)
- Dodać strukturę HTML karty z ikoną, tytułem i opisem
- Stylować z Tailwind (card design, padding, typography)
- Zadbać o semantyczny HTML (heading hierarchy)

### Krok 4: Implementacja Hero.astro
- Utworzyć plik `src/components/landing/Hero.astro`
- Dodać strukturę HTML z nagłówkiem h1, opisem i przyciskami CTA
- Zaimportować Button z `@/components/ui/button`
- Użyć size="lg" dla dużych przycisków CTA
- Stylować z Tailwind (centrowanie, responsive layout, gradient background opcjonalnie)
- Dodać placeholder dla hero image (można użyć `<Image>` z Astro)
- Zadbać o kontrast tekstu i czytelność

### Krok 5: Implementacja Features.astro
- Utworzyć plik `src/components/landing/Features.astro`
- Zaimportować FeatureCard.astro
- Dodać nagłówek sekcji h2 i krótki opis
- Utworzyć grid layout dla trzech kart funkcji
- Wywołać FeatureCard trzy razy z różnymi propsami:
  1. AI Generation: icon="✨", title="Generowanie przez AI", description="..."
  2. Spaced Repetition: icon="🧠", title="Inteligentne powtórki", description="..."
  3. Personal Learning: icon="📊", title="Twój własny zestaw", description="..."
- Stylować grid z Tailwind (responsive, gap spacing)

### Krok 6: Implementacja Footer.astro
- Utworzyć plik `src/components/landing/Footer.astro`
- Dodać strukturę HTML ze sekcjami: brand, links, copyright
- Stylować z Tailwind (dark background, light text, padding)
- Dodać linki do `/privacy` i `/terms` (strony będą implementowane później)
- Zadbać o semantyczny HTML (`<footer>` tag)

### Krok 7: Aktualizacja src/pages/index.astro
- Otworzyć `src/pages/index.astro`
- Usunąć import komponentu Welcome.astro
- Zaimportować nowe komponenty Landing Page:
  - LandingNavigation
  - Hero
  - Features
  - Footer
- Zbudować strukturę strony:
  ```astro
  ---
  import Layout from "../layouts/Layout.astro";
  import LandingNavigation from "../components/landing/LandingNavigation.astro";
  import Hero from "../components/landing/Hero.astro";
  import Features from "../components/landing/Features.astro";
  import Footer from "../components/landing/Footer.astro";
  ---

  <Layout title="10xCards - Twórz fiszki 10x szybciej z AI">
    <LandingNavigation />
    <main>
      <Hero />
      <Features />
    </main>
    <Footer />
  </Layout>
  ```

### Krok 8: Aktualizacja meta tagów w Layout.astro
- Otworzyć `src/layouts/Layout.astro`
- Dodać/zaktualizować meta tagi dla SEO:
  - `<meta name="description" content="...">` - opis aplikacji
  - `<meta name="keywords" content="fiszki, AI, nauka, spaced repetition">` - słowa kluczowe
  - Open Graph tags dla social media (opcjonalnie)
- Upewnić się, że title jest przekazywany jako prop

### Krok 9: Stylowanie i responsywność
- Przejrzeć wszystkie komponenty i upewnić się, że używają responsive utilities Tailwind
- Przetestować na różnych breakpointach: mobile (sm), tablet (md), desktop (lg, xl)
- Dodać smooth scroll behavior: `<html class="scroll-smooth">`
- Zapewnić odpowiednie spacing (margin, padding) między sekcjami
- Użyć spójnej palety kolorów (opcjonalnie zdefiniować w tailwind.config)

### Krok 10: Optymalizacja obrazów (opcjonalnie)
- Jeśli używane są obrazy w Hero, zaimportować je jako moduły
- Użyć komponentu `<Image>` z `astro:assets` dla optymalizacji
- Ustawić odpowiednie width/height dla uniknięcia layout shift
- Dodać lazy loading dla obrazów poniżej fold (`loading="lazy"`)

### Krok 11: Testy dostępności (a11y)
- Sprawdzić strukturę nagłówków (h1 → h2 → h3) z narzędziem devtools
- Upewnić się, że wszystkie interaktywne elementy mają odpowiednie aria-labels
- Przetestować nawigację klawiaturą (Tab, Enter)
- Sprawdzić kontrast kolorów z narzędziem (WCAG AA minimum)
- Użyć screen readera do weryfikacji (NVDA/JAWS/VoiceOver)
- Upewnić się, że wszystkie obrazy mają alt text

### Krok 12: Testy manualne
- Otworzyć `http://localhost:4321/` w przeglądarce
- Sprawdzić renderowanie wszystkich sekcji
- Przetestować wszystkie linki i przyciski:
  - Logo → `/`
  - "Zaloguj się" → `/login`
  - "Zarejestruj się" / "Zacznij za darmo" → `/register`
  - Linki w Footer → `/privacy`, `/terms`
- Przetestować responsywność na różnych rozdzielczościach
- Sprawdzić efekty hover na przyciskach

### Krok 13: Optymalizacja wydajności
- Uruchomić `npm run build` i sprawdzić rozmiar bundla
- Zweryfikować, że nie ma niepotrzebnego JavaScript klienta
- Przetestować z Lighthouse (Performance, Accessibility, Best Practices, SEO)
- Cel: Performance 90+, Accessibility 100, SEO 100

### Krok 14: Dokumentacja i cleanup
- Usunąć stary komponent `Welcome.astro` (jeśli nie jest używany nigdzie indziej)
- Dodać komentarze do komponentów (jeśli potrzebne)
- Zaktualizować dokumentację projektu o nową strukturę Landing Page

### Krok 15: Commit i deploy
- Utworzyć commit z opisem: "feat: implement landing page with hero, features and navigation"
- Push do repozytorium
- Zweryfikować deployment na środowisku produkcyjnym/staging
