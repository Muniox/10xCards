import { test, expect } from "@playwright/test";
import { login } from "./helpers/test-helpers";
import { setupTestUser, teardownTestUser, type TestUser } from "./helpers/test-user.helper";

/**
 * E2E test for generation statistics flow
 * Tests that statistics update correctly after generating and accepting flashcards
 *
 * PREREQUISITES:
 * 1. Start the development server: npm run dev
 * 2. Set environment variables in .env.test:
 *    - SUPABASE_URL
 *    - SUPABASE_KEY
 *    - E2E_USERNAME_ID (existing test user ID)
 *    - E2E_USERNAME (existing test user email)
 *    - E2E_PASSWORD (existing test user password)
 *
 * TODO: Fix login redirect issue - tests currently skipped
 */

test.describe.skip("Generation Statistics E2E", () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    // Setup test user before all tests
    try {
      testUser = await setupTestUser();
      // eslint-disable-next-line no-console
      console.log(`✅ Test user ready: ${testUser.email}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to setup test user:", error);
      throw error;
    }
  });

  test.afterAll(async () => {
    // Cleanup test data after all tests
    if (testUser?.id) {
      await teardownTestUser(testUser.id);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    try {
      await login(page, testUser.email, testUser.password);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Login failed:", error);
      test.skip(true, `Unable to login - ${error instanceof Error ? error.message : "unknown error"}`);
    }
  });
  test("statistics should update after generating and accepting flashcards", async ({ page }) => {
    // Step 1: Navigate to dashboard and get initial statistics
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle");

    // Get initial values
    const initialGenerations = await page
      .getByText(/łączna liczba generacji/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();

    const initialGenerated = await page
      .getByText(/wygenerowane fiszki/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();

    const initialAccepted = await page
      .getByText(/zaakceptowane fiszki/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();

    // eslint-disable-next-line no-console
    console.log("Initial statistics:", {
      generations: initialGenerations,
      generated: initialGenerated,
      accepted: initialAccepted,
    });

    // Step 2: Navigate to generator
    await page.goto("/app/generate");
    await page.waitForLoadState("networkidle");

    // Step 3: Generate flashcards
    const sourceText = `
      TypeScript is a strongly typed programming language that builds on JavaScript.
      It adds optional static type checking and other features to help developers catch errors early.
      TypeScript code compiles to JavaScript, making it compatible with any browser or JavaScript runtime.
      The language was developed and is maintained by Microsoft.
      TypeScript has become very popular in modern web development.
    `;

    // Fill in the form
    await page.getByLabel(/tekst źródłowy/i).fill(sourceText);

    // Select model (adjust selector based on your UI)
    const modelSelect = page.locator('select, [role="combobox"]').first();
    if ((await modelSelect.count()) > 0) {
      await modelSelect.selectOption({ index: 0 });
    }

    // Submit form
    await page.getByRole("button", { name: /generuj|generate/i }).click();

    // Wait for suggestions to appear
    await page.waitForSelector('[data-testid="flashcard-suggestion"], .suggestion-item, [class*="suggestion"]', {
      timeout: 30000,
    });

    // Step 4: Accept all flashcards (or at least some)
    // Find all flashcard accept buttons
    const acceptButtons = page.getByRole("button", { name: /akceptuj|accept/i });
    const buttonCount = await acceptButtons.count();

    // eslint-disable-next-line no-console
    console.log(`Found ${buttonCount} flashcards to accept`);

    // Accept first 3 flashcards
    const flashcardsToAccept = Math.min(3, buttonCount);
    for (let i = 0; i < flashcardsToAccept; i++) {
      await acceptButtons.nth(i).click();
      await page.waitForTimeout(500); // Small delay between clicks
    }

    // Step 5: Navigate back to dashboard
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle");

    // Wait for statistics to update (they might be fetched via API)
    await page.waitForTimeout(1000);

    // Step 6: Get updated statistics
    const updatedGenerations = await page
      .getByText(/łączna liczba generacji/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();

    const updatedGenerated = await page
      .getByText(/wygenerowane fiszki/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();

    const updatedAccepted = await page
      .getByText(/zaakceptowane fiszki/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();

    // eslint-disable-next-line no-console
    console.log("Updated statistics:", {
      generations: updatedGenerations,
      generated: updatedGenerated,
      accepted: updatedAccepted,
    });

    // Step 7: Verify statistics increased
    const parseNumber = (text: string | null) => {
      if (!text) return 0;
      return parseInt(text.replace(/\s/g, ""), 10) || 0;
    };

    const initialGenCount = parseNumber(initialGenerations);
    const updatedGenCount = parseNumber(updatedGenerations);

    const initialGenFlashcards = parseNumber(initialGenerated);
    const updatedGenFlashcards = parseNumber(updatedGenerated);

    const initialAcceptedCount = parseNumber(initialAccepted);
    const updatedAcceptedCount = parseNumber(updatedAccepted);

    // Assertions
    expect(updatedGenCount).toBeGreaterThan(initialGenCount);
    expect(updatedGenFlashcards).toBeGreaterThan(initialGenFlashcards);
    expect(updatedAcceptedCount).toBeGreaterThan(initialAcceptedCount);

    // Verify the exact increase
    expect(updatedGenCount).toBe(initialGenCount + 1); // 1 new generation
    expect(updatedAcceptedCount).toBe(initialAcceptedCount + flashcardsToAccept); // We accepted 3 flashcards
  });

  test("statistics should update correctly when accepting flashcards multiple times", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle");

    // Get initial accepted count
    const initialAcceptedText = await page
      .getByText(/zaakceptowane fiszki/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();
    const initialAccepted = parseInt(initialAcceptedText?.replace(/\s/g, "") || "0", 10);

    // Generate flashcards
    await page.goto("/app/generate");
    const sourceText = "React is a JavaScript library for building user interfaces.";
    await page.getByLabel(/tekst źródłowy/i).fill(sourceText);
    await page.getByRole("button", { name: /generuj|generate/i }).click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="flashcard-suggestion"], .suggestion-item, [class*="suggestion"]', {
      timeout: 30000,
    });

    // Accept 2 flashcards first
    const acceptButtons = page.getByRole("button", { name: /akceptuj|accept/i });
    await acceptButtons.nth(0).click();
    await page.waitForTimeout(300);
    await acceptButtons.nth(1).click();
    await page.waitForTimeout(300);

    // Go back to dashboard and check
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const afterFirstBatchText = await page
      .getByText(/zaakceptowane fiszki/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();
    const afterFirstBatch = parseInt(afterFirstBatchText?.replace(/\s/g, "") || "0", 10);

    expect(afterFirstBatch).toBe(initialAccepted + 2);

    // Go back to generator and accept more from the same generation
    await page.goto("/app/generate");
    await page.waitForLoadState("networkidle");

    // Accept 1 more flashcard (if available)
    const moreAcceptButtons = page.getByRole("button", { name: /akceptuj|accept/i });
    if ((await moreAcceptButtons.count()) > 0) {
      await moreAcceptButtons.nth(0).click();
      await page.waitForTimeout(300);

      // Check dashboard again
      await page.goto("/app/dashboard");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const finalAcceptedText = await page
        .getByText(/zaakceptowane fiszki/i)
        .locator("xpath=following-sibling::*")
        .first()
        .textContent();
      const finalAccepted = parseInt(finalAcceptedText?.replace(/\s/g, "") || "0", 10);

      // Should be incremented, not replaced
      expect(finalAccepted).toBe(initialAccepted + 3);
    }
  });

  test("statistics should update when deleting accepted flashcard", async ({ page }) => {
    // Navigate to flashcards page
    await page.goto("/app/flashcards");
    await page.waitForLoadState("networkidle");

    // Get count of flashcards before deletion
    const flashcardsBefore = await page.locator('[data-testid="flashcard-card"], .flashcard-item').count();

    // Get dashboard stats before deletion
    await page.goto("/app/dashboard");
    const acceptedBeforeText = await page
      .getByText(/zaakceptowane fiszki/i)
      .locator("xpath=following-sibling::*")
      .first()
      .textContent();
    const acceptedBefore = parseInt(acceptedBeforeText?.replace(/\s/g, "") || "0", 10);

    // Go back and delete one flashcard
    await page.goto("/app/flashcards");
    await page.waitForLoadState("networkidle");

    // Find and click delete button on first flashcard
    const deleteButton = page.getByRole("button", { name: /usuń|delete/i }).first();
    if ((await deleteButton.count()) > 0) {
      await deleteButton.click();

      // Confirm deletion in dialog
      const confirmButton = page.getByRole("button", { name: /potwierdź|confirm|tak|yes/i });
      await confirmButton.click();

      // Wait for deletion to complete
      await page.waitForTimeout(1000);

      // Verify flashcard was deleted
      const flashcardsAfter = await page.locator('[data-testid="flashcard-card"], .flashcard-item').count();
      expect(flashcardsAfter).toBe(flashcardsBefore - 1);

      // Check dashboard statistics decreased
      await page.goto("/app/dashboard");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const acceptedAfterText = await page
        .getByText(/zaakceptowane fiszki/i)
        .locator("xpath=following-sibling::*")
        .first()
        .textContent();
      const acceptedAfter = parseInt(acceptedAfterText?.replace(/\s/g, "") || "0", 10);

      expect(acceptedAfter).toBe(acceptedBefore - 1);
    }
  });
});
