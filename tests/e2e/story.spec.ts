import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const scene = (page: Page) => page.locator("article[data-scene]");

test("era page shows Ravi, the intro and a chip per marked year", async ({ page }) => {
  await page.goto("/en/achaemenid/");
  await expect(page.locator("svg.ravi").first()).toBeVisible();
  await expect(scene(page)).toHaveAttribute("data-scene", "intro");
  const chips = page.getByRole("list", { name: "Key years" }).getByRole("button");
  await expect(chips).toHaveCount(10);
  await expect(chips.nth(2)).toHaveText("c. 547 BCE");
  await expect(chips.nth(3)).toHaveText("539 BCE");
});

test("next/previous event buttons and chips change the scene and the URL", async ({ page }) => {
  await page.goto("/en/achaemenid/");
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(page).toHaveURL(/\?e=cyrus-defeats-media$/);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Cyrus defeats the Medes");

  await page.getByRole("list", { name: "Key years" }).getByRole("button", { name: "480 BCE" }).click();
  await expect(page).toHaveURL(/\?e=xerxes-greece$/);
  await expect(scene(page)).toContainText("Salamis");

  await page.getByRole("button", { name: "Previous event" }).click();
  await expect(page).toHaveURL(/\?e=marathon$/);
});

test("a deep link opens that event", async ({ page }) => {
  await page.goto("/fa/achaemenid/?e=persepolis");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("برپایی تخت جمشید");
  await expect(page.locator('[data-scene="persepolis"][aria-current="step"]')).toBeVisible();
});

test("going past the last event continues into the next era", async ({ page }) => {
  await page.goto("/en/achaemenid/?e=alexander");
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(page).toHaveURL(/\/en\/parthian\/$/);
  await page.getByRole("button", { name: "Previous event" }).click();
  await expect(page).toHaveURL(/\/en\/achaemenid\/$/);
});

test("Ravi tells the story on his own when playing (reading pace without audio)", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/en/achaemenid/");
  await page.getByRole("button", { name: "Tell me, Ravi" }).click();
  await expect(page.locator('svg.ravi[data-speaking="true"]')).toBeVisible();
  await expect(page).toHaveURL(/\?e=cyrus-defeats-media$/, { timeout: 15_000 });
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.locator('svg.ravi[data-speaking="false"]')).toBeVisible();
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
