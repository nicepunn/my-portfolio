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

test.describe("dynamic form — edit page", () => {
  test.beforeEach(async ({ page }) => {
    await clearEditStorage(page);
  });

  test("experience prepends a new job at the top and can remove it", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();

    const beforeCount = await experience.locator("[data-array-index]").count();
    const previousTopCompany = await fieldInput(
      arrayRow(experience, 0),
      "company",
    ).inputValue();

    await experience.getByTestId("array-add").click();
    const rows = experience.locator("[data-array-index]");
    await expect(rows).toHaveCount(beforeCount + 1);

    const top = arrayRow(experience, 0);
    await expect(fieldInput(top, "company")).toHaveValue("New company");
    await expect(fieldInput(arrayRow(experience, 1), "company")).toHaveValue(
      previousTopCompany,
    );

    await fieldInput(top, "company").fill("E2E Test Co");
    await fieldInput(top, "role").fill("E2E Role");
    await fieldInput(top, "period").fill("2026 – Present");
    await expect(fieldInput(top, "company")).toHaveValue("E2E Test Co");

    await top.getByTestId("array-remove").click();
    await expect(rows).toHaveCount(beforeCount);
    await expect(fieldInput(arrayRow(experience, 0), "company")).toHaveValue(
      previousTopCompany,
    );
  });

  test("projects append a new project at the end", async ({ page }) => {
    const projects = arraySection(page, "projects");
    await projects.scrollIntoViewIfNeeded();

    const beforeCount = await projects.locator("[data-array-index]").count();
    await projects.getByTestId("array-add").click();

    const rows = projects.locator("[data-array-index]");
    await expect(rows).toHaveCount(beforeCount + 1);

    const last = arrayRow(projects, beforeCount);
    await expect(fieldInput(last, "name")).toHaveValue("New project");
    await fieldInput(last, "name").fill("E2E Project");
    await fieldInput(last, "url").fill("https://example.com/e2e");
    await expect(fieldInput(last, "name")).toHaveValue("E2E Project");

    await last.getByTestId("array-remove").click();
    await expect(rows).toHaveCount(beforeCount);
  });

  test("skills append a new skill group at the end", async ({ page }) => {
    const skills = arraySection(page, "skills");
    await skills.scrollIntoViewIfNeeded();

    const beforeCount = await skills.locator("[data-array-index]").count();
    await skills.getByTestId("array-add").click();

    const rows = skills.locator("[data-array-index]");
    await expect(rows).toHaveCount(beforeCount + 1);

    const last = arrayRow(skills, beforeCount);
    await expect(fieldInput(last, "label")).toHaveValue("New skill group");
    await fieldInput(last, "label").fill("E2E Skills");
    await fieldInput(last, "items").fill("[***Vitest***]\nPlaywright");
    await expect(fieldInput(last, "label")).toHaveValue("E2E Skills");

    await last.getByTestId("array-remove").click();
    await expect(rows).toHaveCount(beforeCount);
  });

  test("can edit profile fields and experience bullets", async ({ page }) => {
    const profile = sectionById(page, "edit-profile");
    await profile.scrollIntoViewIfNeeded();

    const name = fieldInput(profile, "name");
    const originalName = await name.inputValue();
    await name.fill(`${originalName} E2E`);
    await expect(name).toHaveValue(`${originalName} E2E`);

    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();
    const bullets = fieldInput(arrayRow(experience, 0), "bullets");
    await bullets.fill("First e2e bullet\nSecond e2e bullet");
    await expect(bullets).toHaveValue("First e2e bullet\nSecond e2e bullet");
  });

  test("removing a middle experience job keeps neighbors", async ({ page }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();

    const count = await experience.locator("[data-array-index]").count();
    test.skip(count < 2, "need at least two experience rows");

    const firstCompany = await fieldInput(
      arrayRow(experience, 0),
      "company",
    ).inputValue();
    const secondCompany = await fieldInput(
      arrayRow(experience, 1),
      "company",
    ).inputValue();

    await arrayRow(experience, 0).getByTestId("array-remove").click();
    await expect(experience.locator("[data-array-index]")).toHaveCount(
      count - 1,
    );
    await expect(fieldInput(arrayRow(experience, 0), "company")).toHaveValue(
      secondCompany,
    );
    await expect(experience.getByText(firstCompany)).toHaveCount(0);
  });
});

test.describe("dynamic form — review compare", () => {
  test.beforeEach(async ({ page }) => {
    await clearEditStorage(page);
  });

  test("pairs the same company on source and target without publishing", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();

    const first = arrayRow(experience, 0);
    const firstCompany = await fieldInput(first, "company").inputValue();
    const role = fieldInput(first, "role");
    await role.fill(`${await role.inputValue()} (e2e)`);

    await goToReview(page);

    await expect(
      fieldInput(arrayRow(reviewExperience(page, "source"), 0), "company"),
    ).toHaveValue(firstCompany);
    await expect(
      fieldInput(arrayRow(reviewExperience(page, "target"), 0), "company"),
    ).toHaveValue(firstCompany);

    await abandonReview(page);
  });

  test("source field edit shows pending mark on review", async ({ page }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();
    await fieldInput(arrayRow(experience, 0), "role").fill("E2E Pending Role");

    await goToReview(page);

    const sourceRole = fieldInput(
      arrayRow(reviewExperience(page, "source"), 0),
      "role",
    );
    await expect(sourceRole).toHaveValue("E2E Pending Role");
    await expect(sourceRole).toHaveAttribute("data-mark", "pending");

    await abandonReview(page);
  });

  test("added experience on source appears as missing on target until Add", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();
    await experience.getByTestId("array-add").click();
    await fieldInput(arrayRow(experience, 0), "company").fill("Brand New Co");
    await fieldInput(arrayRow(experience, 0), "role").fill("New Role");
    await fieldInput(arrayRow(experience, 0), "period").fill("2026");

    await goToReview(page);

    const target = reviewExperience(page, "target");
    await expect(target.getByText(/Added on source/i)).toBeVisible();

    await target.getByTestId("array-add-from-source").click();
    await expect(fieldInput(arrayRow(target, 0), "company")).toHaveValue(
      "Brand New Co",
    );

    await abandonReview(page);
  });

  test("removed experience on source shows pending remove on target", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();

    const count = await experience.locator("[data-array-index]").count();
    test.skip(count < 2, "need at least two experience rows");

    const removedCompany = await fieldInput(
      arrayRow(experience, 1),
      "company",
    ).inputValue();
    await arrayRow(experience, 1).getByTestId("array-remove").click();

    // Keep the draft dirty with another edit so Save still opens.
    await fieldInput(arrayRow(experience, 0), "role").fill("Still editing");

    await goToReview(page);

    const target = reviewExperience(page, "target");
    await expect(target.getByText(/Removed/i).first()).toBeVisible();
    await expect
      .poll(async () =>
        target
          .locator('[data-field-path="company"] input')
          .evaluateAll((inputs) =>
            inputs.map((input) => (input as HTMLInputElement).value),
          ),
      )
      .toContain(removedCompany);

    await abandonReview(page);
  });

  test("target can resolve a pending role edit then abandon", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();
    await fieldInput(arrayRow(experience, 0), "role").fill("Synced Role EN");

    await goToReview(page);

    const targetRole = fieldInput(
      arrayRow(reviewExperience(page, "target"), 0),
      "role",
    );
    await targetRole.fill("Synced Role TH");
    await expect(targetRole).toHaveAttribute("data-mark", "resolved");

    await abandonReview(page);
  });
});
