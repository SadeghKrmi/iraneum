import { expect, test } from "@playwright/test";

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
  test(`[${locale}] selecting each checkpoint shows its story`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    const timeline = page.getByRole("navigation");
    const links = timeline.locator("a[data-checkpoint]");
    const ids = await links.evaluateAll((els) => els.map((el) => el.getAttribute("data-checkpoint")!));
    expect(ids).toEqual(["elam", "achaemenid", "parthian", "sasanian", "safavid", "qajar"]);

    for (const id of ids) {
      await timeline.locator(`a[data-checkpoint="${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/${id}/$`));
      await expect(page.locator(`article[data-checkpoint="${id}"]`)).toBeVisible();
      await expect(timeline.locator('[aria-current="step"]')).toHaveAttribute("data-checkpoint", id);
    }
  });
}

test("[fa] time flows right-to-left on the timeline", async ({ page }) => {
  await page.goto("/fa/");
  const first = await page.locator('a[data-checkpoint="elam"]').boundingBox();
  const second = await page.locator('a[data-checkpoint="achaemenid"]').boundingBox();
  expect(first!.x).toBeGreaterThan(second!.x);
});

test("[en] time flows left-to-right on the timeline", async ({ page }) => {
  await page.goto("/en/");
  const first = await page.locator('a[data-checkpoint="elam"]').boundingBox();
  const second = await page.locator('a[data-checkpoint="achaemenid"]').boundingBox();
  expect(first!.x).toBeLessThan(second!.x);
});

test("next/previous buttons move along the timeline", async ({ page }) => {
  await page.goto("/en/achaemenid/");
  await page.getByRole("button", { name: "Next checkpoint" }).click();
  await expect(page).toHaveURL(/\/en\/parthian\/$/);
  await page.getByRole("button", { name: "Previous checkpoint" }).click();
  await page.getByRole("button", { name: "Previous checkpoint" }).click();
  await expect(page).toHaveURL(/\/en\/elam\/$/);
  await expect(page.getByRole("button", { name: "Previous checkpoint" })).toBeDisabled();
});

test("arrow keys follow the reading direction", async ({ page }) => {
  await page.goto("/fa/achaemenid/");
  await page.locator('a[data-checkpoint="achaemenid"]').focus();
  await page.keyboard.press("ArrowLeft"); // in RTL, left = later in time
  await expect(page).toHaveURL(/\/fa\/parthian\/$/);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/fa\/achaemenid\/$/);

  await page.goto("/en/achaemenid/");
  await page.locator('a[data-checkpoint="achaemenid"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/en\/parthian\/$/);
});

test("language switcher keeps the selected checkpoint", async ({ page }) => {
  await page.goto("/fa/sasanian/");
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en\/sasanian\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sasanian Empire");
  await page.getByRole("link", { name: "تغییر زبان به فارسی" }).click();
  await expect(page).toHaveURL(/\/fa\/sasanian\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ساسانیان");
});

test("the page never scrolls horizontally", async ({ page }) => {
  for (const path of ["/fa/", "/en/qajar/"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("swiping on the stage changes checkpoint on touch screens", async ({ page }) => {
  const swipe = (dx: number) =>
    page.locator("main").evaluate((main, dx) => {
      const base = { pointerType: "touch", bubbles: true, clientY: 300 };
      main.dispatchEvent(new PointerEvent("pointerdown", { ...base, clientX: 200 }));
      main.dispatchEvent(new PointerEvent("pointerup", { ...base, clientX: 200 + dx }));
    }, dx);

  await page.goto("/en/achaemenid/");
  await swipe(-120); // swipe left in LTR = forward
  await expect(page).toHaveURL(/\/en\/parthian\/$/);

  await page.goto("/fa/achaemenid/");
  await swipe(120); // swipe right in RTL = forward
  await expect(page).toHaveURL(/\/fa\/parthian\/$/);
});
