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
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/app/dashboard");
}

/**
 * Helper function to logout
 */
export async function logout(page: Page) {
  // Implement logout logic based on your application
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL("/");
}
