import { expect, test } from "@playwright/test";
import {
  abandonReview,
  arrayRow,
  arraySection,
  clearEditStorage,
  fieldInput,
  goToReview,
  reviewExperience,
  sectionById,
} from "./helpers";

test.describe("dynamic form — high-value flows", () => {
  test.beforeEach(async ({ page }) => {
    await clearEditStorage(page);
  });

  test("changing period breaks identity (removed + added) on review", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();

    const first = arrayRow(experience, 0);
    const company = await fieldInput(first, "company").inputValue();
    await fieldInput(first, "period").fill("E2E Period 2099");

    await goToReview(page);

    const source = reviewExperience(page, "source");
    await expect(source.getByText(/Removed/i).first()).toBeVisible();
    await expect(source.getByText(/New/i).first()).toBeVisible();

    const companies = await source
      .locator('[data-field-path="company"] input')
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      );
    // Live row with the new period still shows the same company name.
    expect(companies.filter((value) => value === company).length).toBeGreaterThanOrEqual(
      1,
    );

    await abandonReview(page);
  });

  test("target Remove syncs a source-deleted experience row", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();

    const count = await experience.locator("[data-array-index]").count();
    test.skip(count < 2, "need at least two jobs");

    const removedCompany = await fieldInput(
      arrayRow(experience, 1),
      "company",
    ).inputValue();
    await arrayRow(experience, 1).getByTestId("array-remove").click();
    await fieldInput(arrayRow(experience, 0), "role").fill("Keep draft dirty");

    await goToReview(page);

    const target = reviewExperience(page, "target");
    await expect(target.getByText(/Removed/i).first()).toBeVisible();

    const dataIndex = await target.locator("[data-array-index]").evaluateAll(
      (rows, company) => {
        for (const row of rows) {
          const input = row.querySelector(
            '[data-field-path="company"] input',
          ) as HTMLInputElement | null;
          if (input?.value === company) {
            return row.getAttribute("data-array-index");
          }
        }
        return null;
      },
      removedCompany,
    );
    expect(dataIndex).not.toBeNull();

    await target
      .locator(`[data-array-index="${dataIndex}"]`)
      .getByTestId("array-remove")
      .click();

    // Synced remove: placeholder remains, editable company field is gone.
    await expect(target.getByText(/Removed/i).first()).toBeVisible();
    await expect
      .poll(async () =>
        target
          .locator('[data-field-path="company"] input')
          .evaluateAll((inputs) =>
            inputs.map((input) => (input as HTMLInputElement).value),
          ),
      )
      .not.toContain(removedCompany);

    await abandonReview(page);
  });

  test("Jump to next red field scrolls a pending leaf into view", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();
    await fieldInput(arrayRow(experience, 0), "role").fill("Jump Target Role");

    // Also dirty a lower section so there is something to jump past the fold.
    const skills = arraySection(page, "skills");
    await skills.scrollIntoViewIfNeeded();
    await fieldInput(arrayRow(skills, 0), "items").fill(
      `${await fieldInput(arrayRow(skills, 0), "items").inputValue()}\nE2E Extra`,
    );

    await goToReview(page);

    await page.getByRole("button", { name: "Jump to next red field" }).click();

    const pendingLeaf = page
      .locator(
        '[data-review-pane="target"][data-review-leaf="true"][data-review-mark="pending"]',
      )
      .first();
    await expect(pendingLeaf).toBeVisible();

    // scrollIntoView is smooth and inside an overflow pane — allow settle + loose band.
    await expect
      .poll(async () =>
        pendingLeaf.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          return rect.top < vh * 0.95 && rect.bottom > vh * 0.05;
        }),
      )
      .toBe(true);

    await abandonReview(page);
  });

  test("can edit education and extras fields", async ({ page }) => {
    const education = sectionById(page, "edit-education");
    await education.scrollIntoViewIfNeeded();

    await fieldInput(education, "education.degree").fill("E2E Degree");
    await fieldInput(education, "education.school").fill("E2E School");
    await expect(fieldInput(education, "education.degree")).toHaveValue(
      "E2E Degree",
    );
    await expect(fieldInput(education, "education.school")).toHaveValue(
      "E2E School",
    );

    const extras = sectionById(page, "edit-extras");
    await extras.scrollIntoViewIfNeeded();
    await fieldInput(extras, "activities").fill("E2E Activity\nAnother");
    await fieldInput(extras, "interests").fill("E2E Interest");
    await expect(fieldInput(extras, "activities")).toHaveValue(
      "E2E Activity\nAnother",
    );
    await expect(fieldInput(extras, "interests")).toHaveValue("E2E Interest");
  });

  test("leaving a dirty edit shows discard confirm", async ({ page }) => {
    const profile = sectionById(page, "edit-profile");
    await profile.scrollIntoViewIfNeeded();
    const name = fieldInput(profile, "name");
    await name.fill(`${await name.inputValue()} dirty`);

    await page.getByRole("button", { name: "← Back to resume" }).click();
    await expect(
      page.getByRole("heading", { name: "Leave without saving?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Keep editing" }).click();
    await expect(page).toHaveURL(/\/edit\/?$/);
    await expect(name).toHaveValue(/dirty$/);

    await page.getByRole("button", { name: "← Back to resume" }).click();
    await page.getByRole("button", { name: "Discard and leave" }).click();
    await page.waitForURL((url) => url.pathname === "/");
  });

  test("projects add + rename + remove reaches review without publishing", async ({
    page,
  }) => {
    const projects = arraySection(page, "projects");
    await projects.scrollIntoViewIfNeeded();

    const before = await projects.locator("[data-array-index]").count();
    test.skip(before < 2, "need at least two projects");

    const keepName = await fieldInput(
      arrayRow(projects, 0),
      "name",
    ).inputValue();
    const dropName = await fieldInput(
      arrayRow(projects, 1),
      "name",
    ).inputValue();

    await projects.getByTestId("array-add").click();
    await fieldInput(arrayRow(projects, before), "name").fill("Combo Flow App");
    await fieldInput(arrayRow(projects, 0), "stack").fill("E2E Stack Only");
    await arrayRow(projects, 1).getByTestId("array-remove").click();

    await goToReview(page);

    const sourceProjects = page.locator('[data-array-path="projects"]').nth(0);
    const names = await sourceProjects
      .locator('[data-field-path="name"] input')
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      );
    expect(names).toContain("Combo Flow App");
    expect(names).toContain(keepName);
    expect(names).not.toContain(dropName);

    await abandonReview(page);
  });
});
