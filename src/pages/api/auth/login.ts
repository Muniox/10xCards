import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { internalError, unauthorizedError, validationError } from "@/lib/helpers/error.helper";
import { loginSchema } from "@/lib/validation/auth.schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validation = loginSchema.safeParse(body);
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

    // Attempt to sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Login Error]", error);
      // Check for specific Supabase errors
      if (error.message.includes("Invalid login credentials")) {
        return unauthorizedError("Nieprawidłowy email lub hasło");
      }
      return unauthorizedError("Nieprawidłowy email lub hasło");
    }

    // Success - cookies are automatically set by Supabase SSR
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[Login API Error]", err);
    return internalError("Wystąpił błąd podczas logowania");
  }
};
