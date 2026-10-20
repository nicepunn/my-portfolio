import { expect, type Locator, type Page } from "@playwright/test";

export async function clearEditStorage(page: Page) {
  await page.goto("/edit");
  await page.evaluate(() => {
    sessionStorage.removeItem("resume-edit-draft");
    sessionStorage.removeItem("resume-edit-originals");
    sessionStorage.removeItem("resume-edit-baselines");
  });
  await page.reload();
}

export function arraySection(page: Page, sectionPath: string) {
  return page.locator(`[data-array-path="${sectionPath}"]`);
}

export function arrayRow(section: Locator, dataIndex: number) {
  return section.locator(`[data-array-index="${dataIndex}"]`);
}

export function fieldInput(rowOrSection: Locator, fieldPath: string) {
  return rowOrSection
    .locator(
      `[data-field-path="${fieldPath}"] input, [data-field-path="${fieldPath}"] textarea`,
    )
    .first();
}

export function sectionById(page: Page, sectionId: string) {
  return page.locator(`#${sectionId}`);
}

/** Open the other-languages modal and continue into /edit/review (does not publish). */
export async function goToReview(page: Page) {
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(
    page.getByRole("heading", {
      name: /Do you want to change in other language/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/edit/review");
  await expect(
    page.getByRole("heading", {
      name: "Translate / update other language",
    }),
  ).toBeVisible();
}

export async function abandonReview(page: Page) {
  await page.getByRole("button", { name: "Discard all changes" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/edit/review"));
}

export function reviewExperience(page: Page, pane: "source" | "target") {
  const index = pane === "source" ? 0 : 1;
  return page.locator('[data-array-path="experience"]').nth(index);
}

export async function inputValues(root: Locator, fieldPath: string) {
  return root
    .locator(`[data-field-path="${fieldPath}"] input, [data-field-path="${fieldPath}"] textarea`)
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLInputElement | HTMLTextAreaElement).value),
    );
}
