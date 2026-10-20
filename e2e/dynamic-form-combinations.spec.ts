import { expect, test } from "@playwright/test";
import {
  abandonReview,
  arrayRow,
  arraySection,
  clearEditStorage,
  fieldInput,
  goToReview,
  inputValues,
  reviewExperience,
  reviewRow,
} from "./helpers";

test.describe("dynamic form — operation combinations", () => {
  test.beforeEach(async ({ page }) => {
    await clearEditStorage(page);
  });

  test("add + edit existing + remove another, then review pairing", async ({
    page,
  }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();

    const before = await experience.locator("[data-array-index]").count();
    test.skip(before < 2, "need at least two jobs");

    const keepCompany = await fieldInput(
      arrayRow(experience, 0),
      "company",
    ).inputValue();
    const dropCompany = await fieldInput(
      arrayRow(experience, 1),
      "company",
    ).inputValue();

    // 1) Prepend a new job
    await experience.getByTestId("array-add").click();
    await fieldInput(arrayRow(experience, 0), "company").fill("Combo New Co");
    await fieldInput(arrayRow(experience, 0), "role").fill("Combo Role");
    await fieldInput(arrayRow(experience, 0), "period").fill("2026");

    // 2) Edit only role on the previous top job (now index 1)
    await fieldInput(arrayRow(experience, 1), "role").fill("Combo Edited Role");

    // 3) Remove the old second job (now index 2)
    await arrayRow(experience, 2).getByTestId("array-remove").click();

    await expect(experience.locator("[data-array-index]")).toHaveCount(before);
    await expect(fieldInput(arrayRow(experience, 0), "company")).toHaveValue(
      "Combo New Co",
    );
    await expect(fieldInput(arrayRow(experience, 1), "company")).toHaveValue(
      keepCompany,
    );
    await expect(experience.getByText(dropCompany)).toHaveCount(0);

    await goToReview(page);

    const source = reviewExperience(page, "source");
    const target = reviewExperience(page, "target");

    await expect(source.getByText(/New/i).first()).toBeVisible();
    await expect(target.getByText(/Added on source/i)).toBeVisible();
    await expect(target.getByText(/Removed/i).first()).toBeVisible();

    const sourceCompanies = await inputValues(source, "company");
    expect(sourceCompanies).toContain("Combo New Co");
    expect(sourceCompanies).toContain(keepCompany);
    expect(sourceCompanies).not.toContain(dropCompany);

    const kept = reviewRow(target, "experience#0");
    const dropped = reviewRow(target, "experience#removed#1");
    expect((await inputValues(kept, "company"))[0]?.length).toBeGreaterThan(0);
    await expect(fieldInput(kept, "role")).toHaveAttribute("data-mark", "pending");
    await expect(dropped.getByText(/Removed/i)).toBeVisible();
    expect((await inputValues(dropped, "company"))[0]?.length).toBeGreaterThan(0);

    const editedRole = await source.locator("[data-array-index]").evaluateAll(
      (rows, company) => {
        for (const row of rows) {
          const companyInput = row.querySelector(
            '[data-field-path="company"] input',
          ) as HTMLInputElement | null;
          if (companyInput?.value !== company) continue;
          const roleInput = row.querySelector(
            '[data-field-path="role"] input',
          ) as HTMLInputElement | null;
          return roleInput?.value ?? null;
        }
        return null;
      },
      keepCompany,
    );
    expect(editedRole).toBe("Combo Edited Role");

    await abandonReview(page);
  });

  test("edit only some fields on one job + add project", async ({ page }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();

    const first = arrayRow(experience, 0);
    const companyBefore = await fieldInput(first, "company").inputValue();
    const periodBefore = await fieldInput(first, "period").inputValue();

    // Change role + bullets only — leave company/period alone
    await fieldInput(first, "role").fill("Partial Role");
    await fieldInput(first, "bullets").fill("Only this bullet changed");

    const projects = arraySection(page, "projects");
    await projects.scrollIntoViewIfNeeded();
    const projectCount = await projects.locator("[data-array-index]").count();
    await projects.getByTestId("array-add").click();
    await fieldInput(arrayRow(projects, projectCount), "name").fill(
      "Combo Project",
    );

    await goToReview(page);

    const sourceExp = reviewExperience(page, "source");
    await expect(fieldInput(arrayRow(sourceExp, 0), "company")).toHaveValue(
      companyBefore,
    );
    await expect(fieldInput(arrayRow(sourceExp, 0), "period")).toHaveValue(
      periodBefore,
    );
    await expect(fieldInput(arrayRow(sourceExp, 0), "role")).toHaveValue(
      "Partial Role",
    );
    await expect(fieldInput(arrayRow(sourceExp, 0), "role")).toHaveAttribute(
      "data-mark",
      "pending",
    );

    const sourceProjects = page.locator('[data-array-path="projects"]').nth(0);
    await expect(sourceProjects.getByText(/New/i).first()).toBeVisible();

    await abandonReview(page);
  });

  test("remove middle + add top + resolve role on target", async ({ page }) => {
    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();
    const before = await experience.locator("[data-array-index]").count();
    test.skip(before < 2, "need at least two jobs");

    const survivor = await fieldInput(
      arrayRow(experience, 0),
      "company",
    ).inputValue();

    await arrayRow(experience, 1).getByTestId("array-remove").click();
    await experience.getByTestId("array-add").click();
    await fieldInput(arrayRow(experience, 0), "company").fill("Resolve Co");
    await fieldInput(arrayRow(experience, 0), "role").fill("Resolve EN");
    await fieldInput(arrayRow(experience, 0), "period").fill("2026");
    await fieldInput(arrayRow(experience, 1), "role").fill("Survivor EN");

    await goToReview(page);

    const source = reviewExperience(page, "source");
    await expect(fieldInput(reviewRow(source, "experience#0"), "company")).toHaveValue(
      survivor,
    );
    await expect(fieldInput(reviewRow(source, "experience#0"), "role")).toHaveValue(
      "Survivor EN",
    );

    const target = reviewExperience(page, "target");
    await target.getByTestId("array-add-from-source").click();
    await expect(
      fieldInput(reviewRow(target, "experience#added#0"), "company"),
    ).toHaveValue("Resolve Co");

    const survivorRow = reviewRow(target, "experience#0");
    await fieldInput(survivorRow, "role").fill("Survivor TH");
    await expect(fieldInput(survivorRow, "role")).toHaveAttribute(
      "data-mark",
      "resolved",
    );

    await abandonReview(page);
  });

  test("skills add + experience partial edit together", async ({ page }) => {
    const skills = arraySection(page, "skills");
    await skills.scrollIntoViewIfNeeded();
    const skillCount = await skills.locator("[data-array-index]").count();
    await skills.getByTestId("array-add").click();
    await fieldInput(arrayRow(skills, skillCount), "label").fill("Combo Skills");
    await fieldInput(arrayRow(skills, skillCount), "items").fill(
      "[***E2E***]\nPlaywright",
    );

    const experience = arraySection(page, "experience");
    await experience.scrollIntoViewIfNeeded();
    await fieldInput(arrayRow(experience, 0), "period").fill("E2E Period Only");

    await goToReview(page);

    const sourceSkills = page.locator('[data-array-path="skills"]').nth(0);
    await expect(sourceSkills.getByText(/New/i).first()).toBeVisible();
    await expect(
      fieldInput(arrayRow(reviewExperience(page, "source"), 0), "period"),
    ).toHaveValue("E2E Period Only");

    await abandonReview(page);
  });
});
