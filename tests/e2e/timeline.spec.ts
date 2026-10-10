import { expect, test } from "./fixtures";

const ERAS = ["elam", "achaemenid", "parthian", "sasanian", "safavid", "qajar"];

test("root forwards to the Persian site", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fa\/$/);
});

test("Persian pages are right-to-left, English pages left-to-right", async ({ page }) => {
  await page.goto("/fa/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

for (const locale of ["fa", "en"] as const) {
  test(`[${locale}] selecting each era opens its story`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    const timeline = page.getByRole("navigation", { name: locale === "fa" ? "خط زمان" : "Timeline" });
    const links = timeline.locator("a[data-era]");
    expect(await links.evaluateAll((els) => els.map((el) => el.getAttribute("data-era")))).toEqual(ERAS);

    for (const id of ERAS) {
      await timeline.locator(`a[data-era="${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/${id}/$`));
      await expect(page.locator('article[data-scene="intro"]')).toBeVisible();
      await expect(timeline.locator('[aria-current="step"]')).toHaveAttribute("data-era", id);
    }
  });
}

test("[fa] time flows right-to-left on the timeline", async ({ page }) => {
  await page.goto("/fa/");
  const first = await page.locator('a[data-era="elam"]').boundingBox();
  const second = await page.locator('a[data-era="achaemenid"]').boundingBox();
  expect(first!.x).toBeGreaterThan(second!.x);
});

test("[en] time flows left-to-right on the timeline", async ({ page }) => {
  await page.goto("/en/");
  const first = await page.locator('a[data-era="elam"]').boundingBox();
  const second = await page.locator('a[data-era="achaemenid"]').boundingBox();
  expect(first!.x).toBeLessThan(second!.x);
});

test("[fa] an era's event points sit between it and the next era", async ({ page }) => {
  await page.goto("/fa/");
  const era = (await page.locator('a[data-era="achaemenid"]').boundingBox())!;
  const next = (await page.locator('a[data-era="parthian"]').boundingBox())!;
  for (const id of ["cyrus-defeats-media", "alexander"]) {
    const point = (await page.locator(`a[data-event="${id}"]`).boundingBox())!;
    expect(point.x, id).toBeLessThan(era.x);
    expect(point.x, id).toBeGreaterThan(next.x + next.width - 1);
  }
});

test("[en] an era's event points sit between it and the next era", async ({ page }) => {
  await page.goto("/en/");
  const era = (await page.locator('a[data-era="achaemenid"]').boundingBox())!;
  const next = (await page.locator('a[data-era="parthian"]').boundingBox())!;
  for (const id of ["cyrus-defeats-media", "alexander"]) {
    const point = (await page.locator(`a[data-event="${id}"]`).boundingBox())!;
    expect(point.x, id).toBeGreaterThan(era.x + era.width - 1);
    expect(point.x, id).toBeLessThan(next.x);
  }
});

test("timeline next/previous buttons move between eras", async ({ page }) => {
  await page.goto("/en/achaemenid/");
  await page.getByRole("button", { name: "Next checkpoint" }).click();
  await expect(page).toHaveURL(/\/en\/parthian\/$/);
  await page.getByRole("button", { name: "Previous checkpoint" }).click();
  await page.getByRole("button", { name: "Previous checkpoint" }).click();
  await expect(page).toHaveURL(/\/en\/elam\/$/);
  await expect(page.getByRole("button", { name: "Previous checkpoint" })).toBeDisabled();
});

test("arrow keys on the timeline follow the reading direction", async ({ page }) => {
  await page.goto("/fa/achaemenid/");
  await page.locator('a[data-era="achaemenid"]').focus();
  await page.keyboard.press("ArrowLeft"); // in RTL, left = later in time
  await expect(page).toHaveURL(/\/fa\/parthian\/$/);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/fa\/achaemenid\/$/);

  await page.goto("/en/achaemenid/");
  await page.locator('a[data-era="achaemenid"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/en\/parthian\/$/);
});

test("language switcher keeps the era and the scene", async ({ page }) => {
  await page.goto("/fa/achaemenid/?e=babylon");
  await expect(page.locator('article[data-scene="babylon"]')).toBeVisible();
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en\/achaemenid\/\?e=babylon$/);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Babylon opens its gates");
  await page.getByRole("link", { name: "تغییر زبان به فارسی" }).click();
  await expect(page).toHaveURL(/\/fa\/achaemenid\/\?e=babylon$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("هخامنشیان");
});

test("the page never scrolls horizontally", async ({ page }) => {
  for (const path of ["/fa/", "/en/qajar/", "/fa/achaemenid/?e=xerxes-greece", "/en/references/"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
