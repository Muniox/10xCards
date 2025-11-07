# TODO: Włączenie RLS i Authentication

## ⚠️ Obecnie: Development Mode (RLS WYŁĄCZONY)

Podczas testowania manualnego **wyłączyliśmy RLS** (Row Level Security) na wszystkich tabelach, aby umożliwić testowanie bez autentykacji. Przed wdrożeniem na produkcję **MUSISZ** przywrócić RLS!

---

## 🔐 Kroki do włączenia RLS i autentykacji

### 1. Włącz RLS na tabelach

Utwórz i wykonaj migrację:

```sql
-- Migration: enable_rls_and_create_policies.sql

-- Re-enable RLS on all tables
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Remove test comments
COMMENT ON TABLE flashcards IS NULL;
COMMENT ON TABLE generations IS NULL;
COMMENT ON TABLE generation_error_logs IS NULL;
```

### 2. Utwórz RLS Policies

```sql
-- ============================================================================
-- FLASHCARDS POLICIES
-- ============================================================================

-- Users can view only their own flashcards
CREATE POLICY "Users can view their own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own flashcards
CREATE POLICY "Users can insert their own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own flashcards
CREATE POLICY "Users can update their own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own flashcards
CREATE POLICY "Users can delete their own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- GENERATIONS POLICIES
-- ============================================================================

-- Users can view only their own generations
CREATE POLICY "Users can view their own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own generations
CREATE POLICY "Users can insert their own generations"
ON generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own generations
CREATE POLICY "Users can update their own generations"
ON generations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own generations (jeśli potrzebne)
CREATE POLICY "Users can delete their own generations"
ON generations FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- GENERATION_ERROR_LOGS POLICIES
-- ============================================================================

-- Users can view only their own error logs
CREATE POLICY "Users can view their own error logs"
ON generation_error_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own error logs
CREATE POLICY "Users can insert their own error logs"
ON generation_error_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Note: Usually no UPDATE/DELETE policies for logs
```

### 3. Usuń lub zachowaj test usera

**Opcja A: Usuń test usera (zalecane dla production)**
```sql
DELETE FROM flashcards WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM generations WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM generation_error_logs WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
```

**Opcja B: Zachowaj dla dalszych testów** (dla development)
```sql
-- Nic nie rób, test user może pozostać dla lokalnych testów
```

### 4. Zaimplementuj autentykację w middleware

Zaktualizuj `src/middleware/index.ts`:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => context.cookies.set(key, value, options),
        remove: (key, options) => context.cookies.delete(key, options),
      },
    }
  );

  // Attach Supabase client to context.locals
  context.locals.supabase = supabase;

  // Get authenticated user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Attach session to context.locals for easy access in API routes
  context.locals.session = session;

  // Optional: Protect API routes
  if (context.url.pathname.startsWith("/api/")) {
    if (!session) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return next();
});
```

### 5. Zamień TEST_USER_ID na auth.uid() we wszystkich endpointach

**Pliki do zmiany:**
- `src/pages/api/flashcards.ts`
- `src/pages/api/flashcards/[id].ts`
- `src/pages/api/flashcards/bulk.ts`
- `src/pages/api/generations.ts`
- `src/pages/api/generations/statistics.ts`

**Przed (obecnie):**
```typescript
const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(context: APIContext) {
  const supabase = context.locals.supabase as SupabaseClient;
  // Use TEST_USER_ID
  const result = await listFlashcards(supabase, TEST_USER_ID, filters, pagination);
  // ...
}
```

**Po:**
```typescript
export async function GET(context: APIContext) {
  const supabase = context.locals.supabase as SupabaseClient;

  // Get authenticated user ID from session
  const session = context.locals.session;
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const userId = session.user.id;
  const result = await listFlashcards(supabase, userId, filters, pagination);
  // ...
}
```

**Lub jeśli wolisz, możesz pobrać user_id bezpośrednio z Supabase:**
```typescript
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return errorResponse("UNAUTHORIZED", "Authentication required", 401);
}

const userId = user.id;
```

### 6. Zaktualizuj type definitions

Dodaj do `src/env.d.ts`:

```typescript
/// <reference types="astro/client" />

import type { Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "./db/supabase.client";

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    session: Session | null;
  }
}
```

### 7. Dodaj rate limiting (opcjonalne, ale zalecane)

Utwórz `src/lib/services/rate-limit.service.ts`:

```typescript
interface RateLimitConfig {
  max: number;
  window: number; // seconds
}

const rateLimitStore = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(
  ip: string,
  path: string
): {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
} {
  const config: RateLimitConfig = path.includes("/generations")
    ? { max: 10, window: 3600 } // 10 per hour for AI generation
    : { max: 100, window: 60 }; // 100 per minute for other endpoints

  const key = `${ip}:${path}`;
  const now = Math.floor(Date.now() / 1000);
  const stored = rateLimitStore.get(key);

  if (!stored || now > stored.reset) {
    rateLimitStore.set(key, {
      count: 1,
      reset: now + config.window,
    });
    return {
      allowed: true,
      remaining: config.max - 1,
      reset: now + config.window,
      limit: config.max,
    };
  }

  if (stored.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      reset: stored.reset,
      limit: config.max,
    };
  }

  stored.count++;
  return {
    allowed: true,
    remaining: config.max - stored.count,
    reset: stored.reset,
    limit: config.max,
  };
}
```

### 8. Testing po włączeniu RLS

**Test checklist:**
- [ ] Zaloguj się jako użytkownik A
- [ ] Utwórz flashcard jako użytkownik A
- [ ] Sprawdź czy użytkownik A widzi swoją flashcard
- [ ] Zaloguj się jako użytkownik B
- [ ] Sprawdź czy użytkownik B **NIE WIDZI** flashcards użytkownika A ✅
- [ ] Spróbuj zaktualizować flashcard użytkownika A jako użytkownik B (powinno zwrócić 404)
- [ ] Sprawdź czy generation działa z RLS
- [ ] Sprawdź bulk create z RLS

---

## 🚀 Kolejność wdrożenia (Production Checklist)

1. ✅ **Phase 1**: Foundation & Endpoints (DONE)
2. ✅ **Phase 2**: Manual Testing bez RLS (DONE)
3. ⏳ **Phase 3**: Enable RLS & Authentication (TO DO - ten dokument)
   - [ ] Włącz RLS na tabelach
   - [ ] Utwórz RLS policies
   - [ ] Zaimplementuj authentication middleware
   - [ ] Zamień TEST_USER_ID na auth.uid()
   - [ ] Dodaj rate limiting
   - [ ] Przetestuj z autentykacją
4. ⏳ **Phase 4**: Production Readiness
   - [ ] XSS sanitization (DOMPurify)
   - [ ] Request logging
   - [ ] Monitoring & alerts
   - [ ] Performance optimization
   - [ ] Security audit

---

## 📝 Ważne notatki

- **Test user ID**: `00000000-0000-0000-0000-000000000000` (obecnie używany)
- **Migration dla RLS**: `disable_rls_for_testing.sql` (do odwrócenia)
- **Wszystkie endpointy**: Używają `TEST_USER_ID` - wymaga zmiany na `auth.uid()`
- **Supabase policies**: Muszą być utworzone przed włączeniem RLS
- **Frontend auth**: Pamiętaj o implementacji logowania/rejestracji na frontendzie

---

## 🔗 Przydatne linki

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers for Astro](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [OpenRouter Rate Limiting](https://openrouter.ai/docs#limits)

---

## ❓ FAQ

**Q: Czy mogę testować z RLS włączonym?**
A: Tak! Musisz tylko zaimplementować autentykację i logować się przed testowaniem endpointów.

**Q: Co się stanie jeśli zapomnę włączyć RLS?**
A: ⚠️ **NIEBEZPIECZEŃSTWO!** Każdy użytkownik będzie mógł widzieć i modyfikować dane innych użytkowników!

**Q: Czy test user będzie działał po włączeniu RLS?**
A: Tak, jeśli zachowasz go w bazie. Ale musisz się zalogować jako ten user przez Supabase Auth.

**Q: Jak testować rate limiting?**
A: Wywołaj endpoint `/api/generations` 11 razy w ciągu godziny - 11-ty powinien zwrócić 429.

---

*Ostatnia aktualizacja: 2025-11-07*
*Status: RLS currently DISABLED for manual testing*
