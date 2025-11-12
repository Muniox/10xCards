import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/**
 * Get Supabase client for test user cleanup
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing environment variables: SUPABASE_URL and SUPABASE_KEY are required for test user management"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Setup a test user for E2E tests
 * Uses existing test user from environment variables
 */
export async function setupTestUser(): Promise<TestUser> {
  const id = process.env.E2E_USERNAME_ID;
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!id || !email || !password) {
    throw new Error(
      "Missing E2E test user credentials. Please set E2E_USERNAME_ID, E2E_USERNAME, and E2E_PASSWORD in .env.test file."
    );
  }

  return {
    id,
    email,
    password,
  };
}

/**
 * Teardown test user data
 * @param userId - User ID to clean up
 */
export async function teardownTestUser(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // Delete user's flashcards
    const { error: flashcardsError } = await supabase.from("flashcards").delete().eq("user_id", userId);

    if (flashcardsError) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to delete flashcards: ${flashcardsError.message}`);
    }

    // Delete user's generations
    const { error: generationsError } = await supabase.from("generations").delete().eq("user_id", userId);

    if (generationsError) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to delete generations: ${generationsError.message}`);
    }

    // Delete user's generation error logs
    const { error: errorLogsError } = await supabase.from("generation_error_logs").delete().eq("user_id", userId);

    if (errorLogsError) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to delete generation error logs: ${errorLogsError.message}`);
    }

    // Note: We don't delete the user as it's a shared test account
    // The deleteUser parameter is ignored
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error during teardown:", error);
    throw error;
  }
}
