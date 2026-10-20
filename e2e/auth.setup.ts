import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authFile = path.join(__dirname, ".auth/user.json");
const password =
  process.env.RESUME_EDIT_PASSWORD?.trim() ||
  process.env.PLAYWRIGHT_EDIT_PASSWORD?.trim() ||
  "punpun";

setup("authenticate edit session", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/edit");
  await expect(page.getByRole("heading", { name: "Enter password" })).toBeVisible();

  const passwordInput = page.getByTestId("edit-password");
  await passwordInput.click();
  await passwordInput.fill(password);
  // Controlled React input — ensure state updates if autofill interfered.
  await expect(passwordInput).toHaveValue(password);

  const unlock = page.getByTestId("edit-unlock");
  await expect(unlock).toBeEnabled();
  await unlock.click();

  await expect(page.getByRole("heading", { name: "Enter password" })).toHaveCount(
    0,
  );
  await expect(page.locator("#edit-experience")).toBeVisible();

  await page.context().storageState({ path: authFile });
});
