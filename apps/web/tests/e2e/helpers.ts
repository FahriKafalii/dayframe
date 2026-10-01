import { type Page, expect } from "@playwright/test";

/** Create a fresh account and land authenticated inside /app. */
export async function registerAndLogin(page: Page): Promise<string> {
  const username = `e2e_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  await page.goto("/register");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill("password123");
  await page.locator("#confirm").fill("password123");
  await page
    .getByRole("button", { name: /sign up|kaydol|create|oluştur/i })
    .click();
  // Register redirects into the app (dashboard home) on success.
  await page.waitForURL("**/app**", { timeout: 15_000 });
  return username;
}

/** Add a task via the quick-add box and wait for it to appear. */
export async function quickAdd(page: Page, title: string): Promise<void> {
  const input = page.getByPlaceholder(/add a task|görev ekle/i);
  await input.fill(title);
  await input.press("Enter");
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
}
