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
  const card = page.locator("[data-story]");
  await expect(card.getByRole("heading", { level: 1 })).toHaveText("Achaemenid Empire");
  await expect(card).toContainText("Persepolis, Pasargadae, Susa, Babylon, Ecbatana");
  await expect(card).toContainText("Cyrus II, Cambyses II, Darius I, Xerxes I");
  await card.getByRole("button", { name: /The fall of Sardis/ }).click();
  await expect(page).toHaveURL(/\?e=fall-of-sardis$/);
  await expect(card.getByRole("heading", { level: 2 })).toHaveText("The fall of Sardis");
  await expect(card.locator('[data-scene-item="fall-of-sardis"]')).toHaveAttribute("aria-current", "step");
});

test("Persian card uses Persian digits", async ({ page }) => {
  await page.goto("/fa/achaemenid/");
  await expect(page.locator("[data-story]")).toContainText("دورهٔ ۳ از ۱۴");
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

test("labels follow the globe when it is dragged", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/en/parthian/");
  await expect(map(page)).toHaveAttribute("data-map", "ready", { timeout: 45_000 });
  const label = page.locator('[data-label="era-parthian"]');
  await expect(label).toBeVisible();
  await page.waitForTimeout(3000); // let the camera arrive
  const before = await label.boundingBox();
  const box = (await map(page).boundingBox())!;
  const x = box.x + box.width * 0.75;
  const y = box.y + box.height * 0.4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x - i * 12, y + i * 4);
  await page.mouse.up();
  await expect.poll(async () => (await label.boundingBox())?.x).not.toBeCloseTo(before!.x, 0);
});

test("era card collapses and expands with its icons, and stays collapsed across eras", async ({ page }) => {
  await page.goto("/en/achaemenid/");
  const story = page.locator("[data-story]");
  await expect(story).toHaveAttribute("data-open", "true");
  await page.getByRole("button", { name: "Hide panel" }).first().click();
  await expect(story).toHaveAttribute("data-open", "false");
  await expect(page.locator("aside[inert]")).toHaveCount(1);
  await page.getByRole("navigation", { name: "Timeline" }).locator('a[data-era="parthian"]').click();
  await expect(page).toHaveURL(/\/en\/parthian\/$/);
  await expect(page.locator("[data-story]")).toHaveAttribute("data-open", "false");
  await page.getByRole("button", { name: "Show panel" }).click();
  await expect(page.locator("[data-story]")).toHaveAttribute("data-open", "true");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Parthian Empire");
});

test("map key collapses to a layers button and expands again", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "the map key is shown on wide screens only");
  await page.goto("/en/achaemenid/");
  const key = page.locator("[data-map-key]");
  await expect(key).toHaveAttribute("data-open", "true");
  await key.getByRole("button", { name: "Hide panel" }).click();
  await expect(key).toHaveAttribute("data-open", "false");
  await page.getByRole("button", { name: "Map key" }).click();
  await expect(key).toHaveAttribute("data-open", "true");
});

test("campaign routes and changing borders follow the story", async ({ page }) => {
  await page.goto("/en/achaemenid/?e=cyrus-defeats-media");
  await expect(map(page)).toHaveAttribute("data-map-route", "cyrus-defeats-media");
  await expect(map(page)).toHaveAttribute("data-map-territory", "achaemenid/cyrus-defeats-media");
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(map(page)).toHaveAttribute("data-map-territory", "achaemenid/fall-of-sardis");
  await page.getByRole("link", { name: /Persepolis rises/ }).first().click();
  await expect(map(page)).toHaveAttribute("data-map-route", "");
  await expect(map(page)).toHaveAttribute("data-map-territory", "achaemenid");
});

test("other civilizations of the scene's year are shown on the map", async ({ page }) => {
  await page.goto("/en/achaemenid/?e=xerxes-greece");
  await expect(map(page)).toHaveAttribute("data-map-world", /\bgreek-poleis\b/);
  await expect(map(page)).toHaveAttribute("data-map-world", /\bzhou\b/);
  await expect(map(page)).not.toHaveAttribute("data-map-world", /\busa\b/);
  await page.goto("/en/pahlavi/");
  await expect(map(page)).toHaveAttribute("data-map-world", /\busa\b/);
});

test("Meanwhile panel lists civilizations and picks one on the map", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "the Meanwhile panel is shown on wide screens only");
  await page.goto("/en/achaemenid/?e=xerxes-greece");
  const panel = page.locator("[data-meanwhile]");
  await expect(panel).toBeVisible();
  const greeks = panel.locator('[data-civ="greek-poleis"]');
  await expect(greeks).toHaveAttribute("aria-pressed", "false");
  await greeks.click();
  await expect(greeks).toHaveAttribute("aria-pressed", "true");
  await expect(map(page)).toHaveAttribute("data-map-focus", "greek-poleis");
  // The pick belongs to its scene.
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(map(page)).toHaveAttribute("data-map-focus", "");
});

test("the compare toggle hides the other civilizations", async ({ page }, testInfo) => {
  await page.goto("/en/achaemenid/?e=xerxes-greece");
  const toggle = page.getByRole("button", { name: "Compare with the world" });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(map(page)).toHaveAttribute("data-map-world", "");
  await expect(page.locator("[data-meanwhile]")).toHaveCount(0);
  if (testInfo.project.name !== "mobile") {
    await toggle.click();
    await expect(page.locator("[data-meanwhile]")).toBeVisible();
  }
});

test("Iran's borders change from event to event", async ({ page }) => {
  await page.goto("/en/seleucid/?e=bactria-roxana");
  await expect(map(page)).toHaveAttribute("data-map-territory", "seleucid/bactria-roxana");
  await page.goto("/en/seleucid/?e=arsaces-parthia");
  await expect(map(page)).toHaveAttribute("data-map-territory", "seleucid/arsaces-parthia");
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(map(page)).toHaveAttribute("data-map-territory", "seleucid/antiochus-east");
  await page.goto("/en/qajar/?e=turkmenchay");
  await expect(map(page)).toHaveAttribute("data-map-territory", "qajar/turkmenchay");
});

test("other civilizations' borders follow the scene's year", async ({ page }) => {
  await page.goto("/en/parthian/?e=carrhae");
  await expect(map(page)).toHaveAttribute("data-map-world-stages", /\brome-republic@-146\b/);
  await page.goto("/en/parthian/?e=trajan-ctesiphon");
  await expect(map(page)).toHaveAttribute("data-map-world-stages", /\brome-empire@114\b/);
  await page.goto("/en/safavid/?e=chaldiran");
  await expect(map(page)).toHaveAttribute("data-map-world-stages", /\bottoman@1453\b/);
  await page.getByRole("button", { name: "Next event" }).click();
  await expect(map(page)).toHaveAttribute("data-map-world-stages", /\bottoman@1534\b/);
});

/** Where a world civilization's label sits once the camera has stopped moving (labels mark its centre). */
async function settledLabel(page: import("@playwright/test").Page, id: string) {
  const label = page.locator(`[data-label="world-${id}"]`);
  let last: { x: number; y: number } | null = null;
  let centre = { x: 0, y: 0 };
  await expect
    .poll(
      async () => {
        const box = await label.boundingBox();
        const visible = await label.evaluate((el) => getComputedStyle(el).visibility === "visible");
        if (!box || !visible) return false;
        centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const still = !!last && Math.abs(last.x - centre.x) < 1 && Math.abs(last.y - centre.y) < 1;
        last = centre;
        return still;
      },
      { timeout: 40_000, intervals: [700] },
    )
    .toBe(true);
  return centre;
}

test("clicking a civilization on the map picks it and shows its entry", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto("/en/parthian/?e=carrhae");
  await expect(map(page)).toHaveAttribute("data-map", "ready", { timeout: 30_000 });
  const wide = testInfo.project.name !== "mobile";
  if (wide) {
    // Even with the panel folded away, a click on the map opens it at the picked entry.
    await page.locator("[data-meanwhile]").getByRole("button", { name: "Hide panel" }).click();
    await expect(page.locator("[data-meanwhile]")).toHaveCount(0);
  }
  const { x, y } = await settledLabel(page, "armenia");
  await page.mouse.click(x, y);
  await expect(map(page)).toHaveAttribute("data-map-focus", "armenia");
  if (wide) {
    const entry = page.locator('[data-meanwhile] [data-civ="armenia"]');
    await expect(entry).toHaveAttribute("aria-pressed", "true");
    await expect(entry).toBeInViewport();
    await expect(page.locator("[data-civ-card]")).toBeHidden();
  } else {
    const card = page.locator('[data-civ-card="armenia"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText("Kingdom of Armenia");
    await card.getByRole("button", { name: "Close" }).click();
    await expect(map(page)).toHaveAttribute("data-map-focus", "");
  }
});

test("clicking away clears the pick, and dragging never picks", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/en/parthian/?e=carrhae");
  await expect(map(page)).toHaveAttribute("data-map", "ready", { timeout: 30_000 });
  const { x, y } = await settledLabel(page, "armenia");

  // A drag that starts on the territory turns the globe instead.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 40, y + 20, { steps: 5 });
  await page.mouse.up();
  await expect(map(page)).toHaveAttribute("data-map-focus", "");

  await page.reload();
  await expect(map(page)).toHaveAttribute("data-map", "ready", { timeout: 30_000 });
  const again = await settledLabel(page, "armenia");
  await page.mouse.click(again.x, again.y);
  await expect(map(page)).toHaveAttribute("data-map-focus", "armenia");
  // Top corner, beyond the globe's edge: nothing there.
  const box = (await map(page).boundingBox())!;
  await page.mouse.click(box.x + 4, box.y + box.height * 0.18);
  await expect(map(page)).toHaveAttribute("data-map-focus", "");
});
