import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Example E2E test file
 * This demonstrates how to write end-to-end tests with Playwright
 */

test.describe("Example E2E Tests", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Check if page title contains expected text
    await expect(page).toHaveTitle(/10xCards/i);
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Click on login link (adjust selector based on your actual UI)
    const loginLink = page.getByRole("link", { name: /login|sign in/i });
    if ((await loginLink.count()) > 0) {
      await loginLink.first().click();

      // Wait for navigation
      await page.waitForURL(/login/);

      // Verify we're on the login page
      expect(page.url()).toContain("login");
    }
  });

  test("should have no accessibility violations", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should be responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page).toHaveTitle(/10xCards/i);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page).toHaveTitle(/10xCards/i);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await expect(page).toHaveTitle(/10xCards/i);
  });
});
