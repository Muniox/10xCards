import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { internalError } from "@/lib/helpers/error.helper";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase instance with SSR cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out from Supabase Auth - this will clear the session cookies
    const { error } = await supabase.auth.signOut();

    if (error) {
      return internalError("Wystąpił błąd podczas wylogowywania");
    }

    // Success - cookies are automatically cleared by Supabase SSR
    return new Response(
      JSON.stringify({
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return internalError("Wystąpił błąd podczas wylogowywania");
  }
};
