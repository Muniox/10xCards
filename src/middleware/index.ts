import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Landing page
  "/",
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase instance with SSR cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make supabase available in all routes
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user in locals if authenticated
  if (user) {
    // User email should always exist for authenticated users
    if (!user.email) {
      console.error("[Middleware] Authenticated user without email:", user.id);
      return redirect("/login");
    }

    locals.user = {
      email: user.email,
      id: user.id,
    };
  }

  // Check if path requires authentication
  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

  // Redirect to login if trying to access protected route without auth
  if (!isPublicPath && !user) {
    return redirect("/login");
  }

  return next();
});
