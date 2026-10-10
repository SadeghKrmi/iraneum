import { expect, test } from "./fixtures";

const map = (page: import("@playwright/test").Page) => page.locator("[data-map]");

test("the 3D map renders and follows the era and the event", async ({ page }) => {
  await page.goto("/en/achaemenid/?e=babylon");
  await expect(map(page)).toHaveAttribute("data-map", "ready", { timeout: 30_000 });
  await expect(map(page).locator("canvas")).toBeVisible();
  await expect(map(page)).toHaveAttribute("data-map-era", "achaemenid");
  await expect(map(page)).toHaveAttribute("data-map-event", "babylon");

  await page.getByRole("button", { name: "Next event" }).click();
  await expect(map(page)).toHaveAttribute("data-map-event", "cambyses-egypt");

  await page.getByRole("navigation", { name: "Timeline" }).locator('a[data-era="parthian"]').click();
  await expect(map(page)).toHaveAttribute("data-map-era", "parthian");
  await expect(map(page)).toHaveAttribute("data-map-event", "");
});

test("era card shows capitals and rulers, and its event list selects events", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "phones show a compact card without these details");
  await page.goto("/en/achaemenid/");
  const card = page.locator("aside[data-story]");
  await expect(card.getByRole("heading", { level: 1 })).toHaveText("Achaemenid Empire");
  await expect(card).toContainText("Persepolis, Susa, Babylon, Ecbatana");
  await expect(card).toContainText("Cyrus II, Cambyses II, Darius I, Xerxes I");
  await card.getByRole("button", { name: /The fall of Sardis/ }).click();
  await expect(page).toHaveURL(/\?e=fall-of-sardis$/);
  await expect(card.getByRole("heading", { level: 2 })).toHaveText("The fall of Sardis");
  await expect(card.locator('[data-scene-item="fall-of-sardis"]')).toHaveAttribute("aria-current", "step");
});

test("Persian card uses Persian digits", async ({ page }) => {
  await page.goto("/fa/achaemenid/");
  await expect(page.locator("aside[data-story]")).toContainText("دورهٔ ۲ از ۶");
});

test("space bar plays and pauses", async ({ page }) => {
  await page.goto("/en/achaemenid/");
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.keyboard.press("Space");
  await expect(page.locator('[data-story][data-playing="true"]')).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator('[data-story][data-playing="false"]')).toBeVisible();
});

test("without WebGL a notice replaces the map and the story still works", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error -- simulating a browser with WebGL turned off
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      return type.startsWith("webgl") ? null : original.call(this, type as "2d", ...(rest as []));
    };
  });
  await page.goto("/en/achaemenid/");
  await expect(page.locator("[data-no-webgl]")).toBeVisible();
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Cyrus defeats the Medes");
});
