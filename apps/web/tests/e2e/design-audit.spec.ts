import { test } from "@playwright/test";
import { registerAndLogin, quickAdd } from "./helpers";
import fs from "node:fs";

const OUT = "test-results/design";
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  mobile: { width: 390, height: 844 }, // iPhone 12/13
  desktop: { width: 1440, height: 900 },
};

// All re-enabled modules (Kasa stays disabled).
const PAGES: { key: string; path: string }[] = [
  { key: "dashboard", path: "/app" },
  { key: "tasks", path: "/app/tasks" },
  { key: "journal", path: "/app/journal" },
  { key: "calendar", path: "/app/calendar" },
  { key: "settings", path: "/app/settings" },
];

async function setThemeLocale(page: any, theme: string, locale: string) {
  await page.addInitScript(
    ([t, l]: [string, string]) => {
      localStorage.setItem("dayframe.theme", t);
      localStorage.setItem("dayframe.locale", l);
    },
    [theme, locale],
  );
}

/** Seed tasks + a nested group tree so screenshots show a populated UI. */
async function seed(page: any) {
  await page.goto("/app/tasks");
  await quickAdd(page, "Yarınki sunum hazırlığı");
  await quickAdd(page, "Faturaları öde");
  await quickAdd(page, "Spor salonu");

  // Root group "İş".
  await page.getByRole("button", { name: /new group|yeni grup/i }).click();
  const gi = page.getByPlaceholder(/group name|grup adı/i);
  await gi.fill("İş");
  await gi.press("Enter");
  await page.waitForTimeout(500);

  // Add a subgroup under "İş" via its hover "add subgroup" button.
  const row = page.getByText("İş", { exact: true }).first();
  await row.hover();
  await page
    .getByRole("button", { name: /add subgroup|alt grup ekle/i })
    .first()
    .click();
  const sub = page.getByPlaceholder(/subgroup name|alt grup adı/i);
  await sub.fill("Proje A");
  await sub.press("Enter");
  await page.waitForTimeout(500);

  // A second-level subgroup under "Proje A".
  const row2 = page.getByText("Proje A", { exact: true }).first();
  await row2.hover();
  await page
    .getByRole("button", { name: /add subgroup|alt grup ekle/i })
    .first()
    .click();
  const sub2 = page.getByPlaceholder(/subgroup name|alt grup adı/i);
  await sub2.fill("Sprint 1");
  await sub2.press("Enter");
  await page.waitForTimeout(600);
}

test.describe("Design audit screenshots", () => {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    for (const theme of ["light", "dark"] as const) {
      for (const locale of ["tr", "en"] as const) {
        test(`audit ${vpName} ${theme} ${locale}`, async ({ page }) => {
          await page.setViewportSize(vp);
          await setThemeLocale(page, theme, locale);
          await registerAndLogin(page);
          await seed(page);

          for (const { key, path } of PAGES) {
            await page.goto(path);
            await page.waitForTimeout(700);
            await page.screenshot({
              path: `${OUT}/${key}-${vpName}-${theme}-${locale}.png`,
              fullPage: true,
            });
          }

          // New-task modal (rich form) on the tasks page.
          await page.goto("/app/tasks");
          await page.waitForTimeout(500);
          await page
            .getByRole("button", { name: /new task|yeni görev/i })
            .first()
            .click()
            .catch(() => {});
          await page.waitForTimeout(400);
          await page.screenshot({
            path: `${OUT}/newtask-${vpName}-${theme}-${locale}.png`,
            fullPage: true,
          });
        });
      }
    }
  }

  test("login + register light/dark", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    for (const theme of ["light", "dark"] as const) {
      await setThemeLocale(page, theme, "tr");
      await page.goto("/login");
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/login-${theme}.png`, fullPage: true });
      await page.goto("/register");
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `${OUT}/register-${theme}.png`,
        fullPage: true,
      });
    }
  });
});
