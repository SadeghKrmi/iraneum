import { test as base, expect } from "@playwright/test";

/** Waits until React is interactive, so clicks and swipes don't land on not-yet-hydrated markup. */
async function waitForHydration(page: import("@playwright/test").Page) {
  await page.locator("body[data-hydrated]").waitFor({ state: "attached" });
  await page.waitForFunction(() => !document.querySelector("[data-story]:not([data-interactive])"));
}

export const test = base.extend({
  page: async ({ page }, provide) => {
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (...args) => {
      const response = await goto(...args);
      await waitForHydration(page);
      return response;
    };
    page.reload = async (...args) => {
      const response = await reload(...args);
      await waitForHydration(page);
      return response;
    };
    await provide(page);
  },
});

export { expect };
