import type { Page } from "@playwright/test";

/**
 * Helper function to wait for navigation and ensure page is loaded
 */
export async function waitForPageLoad(page: Page, url?: string) {
  if (url) {
    await page.goto(url);
  }
  await page.waitForLoadState("networkidle");
}

/**
 * Helper function to fill form fields
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
}

/**
 * Helper function to login (to be implemented based on your auth flow)
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard with increased timeout
  try {
    await page.waitForURL("/app/dashboard", { timeout: 10000 });
    await page.waitForLoadState("networkidle");
  } catch {
    const currentUrl = page.url();
    // eslint-disable-next-line no-console
    console.error(`❌ Login failed - expected /app/dashboard but got: ${currentUrl}`);
    throw new Error(`Login failed - redirected to ${currentUrl} instead of /app/dashboard`);
  }
}

/**
 * Helper function to logout
 */
export async function logout(page: Page) {
  // Implement logout logic based on your application
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL("/");
}
