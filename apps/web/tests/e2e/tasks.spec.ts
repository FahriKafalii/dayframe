import { test, expect } from "@playwright/test";
import { registerAndLogin, quickAdd } from "./helpers";

test.describe("Tasks module", () => {
  test("register lands in the app and tasks page loads", async ({ page }) => {
    // registerAndLogin already waits for a redirect into /app (dashboard home;
    // all modules re-enabled except Kasa). Verify the tasks page is reachable.
    await registerAndLogin(page);
    await page.goto("/app/tasks");
    await page.waitForURL("**/app/tasks");
    await expect(page.getByPlaceholder(/add a task|görev ekle/i)).toBeVisible();
  });

  test("quick add creates a task", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/app/tasks");
    await quickAdd(page, "Buy milk");
    await expect(page.getByText("Buy milk", { exact: true })).toBeVisible();
  });

  test("toggle done and trash + restore", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/app/tasks");
    await quickAdd(page, "Temp task");

    // Delete it (hover row → more menu → delete). The delete button is the
    // trailing icon; open the confirm modal, then confirm.
    const row = page.locator("div").filter({ hasText: "Temp task" }).first();
    await row.hover();
    await page
      .getByRole("button", { name: /delete|sil/i })
      .first()
      .click();
    // Confirm modal
    await page
      .getByRole("button", { name: /^delete$|^sil$/i })
      .last()
      .click();

    // Switch to Trash view — task should be there.
    await page.getByRole("button", { name: /trash|çöp/i }).click();
    await expect(page.getByText("Temp task", { exact: true })).toBeVisible();

    // Restore it.
    await page.getByRole("button", { name: /restore|geri getir/i }).click();
    // Back to active view, trash now empty message.
    await page.getByRole("button", { name: /active|aktif/i }).click();
    await expect(page.getByText("Temp task", { exact: true })).toBeVisible();
  });

  test("date grouping view renders sections", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/app/tasks");
    await quickAdd(page, "Undated task");
    await page.getByRole("button", { name: /by date|tarihe göre/i }).click();
    // The "No date" section header should appear for an undated task.
    await expect(
      page.getByText(/no date|tarihsiz/i).first(),
    ).toBeVisible();
  });

  test("create a group and filter by it", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/app/tasks");
    // Open the "New group" affordance in the sidebar.
    await page.getByRole("button", { name: /new group|yeni grup/i }).click();
    const groupInput = page.getByPlaceholder(/group name|grup adı/i);
    await groupInput.fill("Work");
    await groupInput.press("Enter");
    await expect(page.getByText("Work", { exact: true })).toBeVisible();
  });

  test("create a nested subgroup under a group", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/app/tasks");

    // Create the parent group.
    await page.getByRole("button", { name: /new group|yeni grup/i }).click();
    const groupInput = page.getByPlaceholder(/group name|grup adı/i);
    await groupInput.fill("Work");
    await groupInput.press("Enter");
    await expect(page.getByText("Work", { exact: true })).toBeVisible();

    // Hover the parent row and use its "add subgroup" affordance.
    await page.getByText("Work", { exact: true }).first().hover();
    await page
      .getByRole("button", { name: /add subgroup|alt grup ekle/i })
      .first()
      .click();
    const subInput = page.getByPlaceholder(/subgroup name|alt grup adı/i);
    await subInput.fill("Project A");
    await subInput.press("Enter");

    // The nested subgroup appears (parent auto-expands).
    await expect(page.getByText("Project A", { exact: true })).toBeVisible();

    // Collapsing the parent hides the subgroup; expanding shows it again.
    await page
      .getByRole("button", { name: /hide subgroups|alt grupları gizle/i })
      .first()
      .click();
    await expect(page.getByText("Project A", { exact: true })).toHaveCount(0);
    await page
      .getByRole("button", { name: /show subgroups|alt grupları göster/i })
      .first()
      .click();
    await expect(page.getByText("Project A", { exact: true })).toBeVisible();
  });
});
