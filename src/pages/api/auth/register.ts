import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { internalError, validationError } from "@/lib/helpers/error.helper";
import { registerSchema } from "@/lib/validation/auth.schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      return validationError("Nieprawidłowe dane formularza", fieldErrors);
    }

    const { email, password } = validation.data;

    // Create Supabase instance with SSR cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation can be configured in Supabase dashboard
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    if (error) {
      console.error("[Register Error]", error);

      // Check for specific Supabase errors
      if (error.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Ten email jest już zarejestrowany",
              code: "USER_ALREADY_EXISTS",
            },
          }),
          {
            status: 409, // Conflict
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("Password")) {
        return validationError("Hasło nie spełnia wymagań bezpieczeństwa", {
          password: error.message,
        });
      }

      return internalError("Wystąpił błąd podczas rejestracji");
    }

    // Check if user was created successfully
    if (!data.user) {
      return internalError("Nie udało się utworzyć konta");
    }

    // Sign out immediately after registration
    // User will need to log in separately
    await supabase.auth.signOut();

    // Success - user account created, but not logged in
    return new Response(
      JSON.stringify({
        message: "Konto zostało utworzone pomyślnie. Możesz się teraz zalogować.",
        requiresLogin: true,
      }),
      {
        status: 201, // Created
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[Register API Error]", err);
    return internalError("Wystąpił błąd podczas rejestracji");
  }
};
