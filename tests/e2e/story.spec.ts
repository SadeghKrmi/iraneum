import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const scene = (page: Page) => page.locator("article[data-scene]");

test("era page shows the intro, and the era's marked years as points on the timeline", async ({ page }) => {
  await page.goto("/en/achaemenid/");
  await expect(scene(page)).toHaveAttribute("data-scene", "intro");
  await expect(page.locator("svg.ravi")).toHaveCount(0);
  const points = page.getByRole("navigation", { name: "Timeline" }).locator('a[data-event][href*="/achaemenid/"]');
  await expect(points).toHaveCount(9);
  await expect(points.nth(1)).toHaveAccessibleName("c. 547 BCE — The fall of Sardis");
});

test("next/previous event buttons and timeline points change the scene and the URL", async ({ page }) => {
  await page.goto("/en/achaemenid/");
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(page).toHaveURL(/\?e=cyrus-defeats-media$/);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Cyrus defeats the Medes");

  await page.getByRole("link", { name: "480 BCE — Xerxes invades Greece" }).click();
  await expect(page).toHaveURL(/\?e=xerxes-greece$/);
  await expect(scene(page)).toContainText("Salamis");
  await expect(page.locator('a[data-event="xerxes-greece"]')).toHaveAttribute("aria-current", "true");

  await page.getByRole("button", { name: "Previous event" }).click();
  await expect(page).toHaveURL(/\?e=marathon$/);
  await expect(page.locator('a[data-event="marathon"]')).toHaveAttribute("aria-current", "true");
});

test("event points work from any page", async ({ page }) => {
  await page.goto("/en/about/");
  await page.getByRole("link", { name: "539 BCE — Babylon opens its gates" }).click();
  await expect(page).toHaveURL(/\/en\/achaemenid\/\?e=babylon$/);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Babylon opens its gates");
});

test("a deep link opens that event", async ({ page }) => {
  await page.goto("/fa/achaemenid/?e=persepolis");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("برپایی تخت جمشید");
  await expect(page.locator('a[data-event="persepolis"]')).toHaveAttribute("aria-current", "true");
});

test("going past the last event continues into the next era", async ({ page }) => {
  await page.goto("/en/achaemenid/?e=alexander");
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(page).toHaveURL(/\/en\/seleucid\/$/);
  await page.getByRole("button", { name: "Previous event" }).click();
  await expect(page).toHaveURL(/\/en\/achaemenid\/$/);
});

test("playing tells the story on its own (reading pace without audio)", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/en/achaemenid/");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.locator('[data-story][data-playing="true"]')).toBeVisible();
  await expect(page).toHaveURL(/\?e=cyrus-defeats-media$/, { timeout: 15_000 });
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.locator('[data-story][data-playing="false"]')).toBeVisible();
});

test("swiping on the story moves between events", async ({ page }) => {
  const swipe = (dx: number) =>
    scene(page).evaluate((el, dx) => {
      const base = { pointerType: "touch", bubbles: true, clientY: 300 };
      el.dispatchEvent(new PointerEvent("pointerdown", { ...base, clientX: 200 }));
      el.dispatchEvent(new PointerEvent("pointerup", { ...base, clientX: 200 + dx }));
    }, dx);

  await page.goto("/en/achaemenid/");
  await swipe(-120); // swipe left in LTR = forward
  await expect(page).toHaveURL(/\?e=cyrus-defeats-media$/);

  await page.goto("/fa/achaemenid/");
  await swipe(120); // swipe right in RTL = forward
  await expect(page).toHaveURL(/\?e=cyrus-defeats-media$/);
});
