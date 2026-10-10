import { expect, test } from "./fixtures";

test("theme toggle switches light/dark and remembers the choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Toggle light and dark theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.goto("/fa/");
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("theme follows the system when nothing is chosen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

const menuPages = {
  en: {
    open: "Open menu",
    items: [
      ["All eras", "/en/eras/", "All eras"],
      ["About", "/en/about/", "About Iraneum"],
      ["References", "/en/references/", "References"],
      ["Contact & feedback", "/en/contact/", "Contact & feedback"],
    ],
  },
  fa: {
    open: "باز کردن منو",
    items: [
      ["همهٔ دوره‌ها", "/fa/eras/", "همهٔ دوره‌ها"],
      ["درباره", "/fa/about/", "دربارهٔ ایرانیوم"],
      ["منابع", "/fa/references/", "منابع"],
      ["تماس و بازخورد", "/fa/contact/", "تماس و بازخورد"],
    ],
  },
};

for (const [locale, { open, items }] of Object.entries(menuPages)) {
  test(`[${locale}] menu links open each page`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    for (const [label, path, heading] of items) {
      await page.getByRole("button", { name: open }).click();
      const drawer = page.getByRole("dialog");
      await expect(drawer).toBeVisible();
      await drawer.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(drawer).toBeHidden();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    }
  });
}

test("menu closes with Escape", async ({ page }) => {
  await page.goto("/en/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("menu drawer opens from the end side (right in English, left in Persian)", async ({ page }) => {
  const width = page.viewportSize()!.width;
  await page.goto("/en/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const en = (await page.getByRole("dialog").boundingBox())!;
  expect(Math.abs(en.x + en.width - width)).toBeLessThan(2);

  await page.goto("/fa/");
  await page.getByRole("button", { name: "باز کردن منو" }).click();
  const fa = (await page.getByRole("dialog").boundingBox())!;
  expect(Math.abs(fa.x)).toBeLessThan(2);
});

test("references page lists the Achaemenid sources", async ({ page }) => {
  await page.goto("/en/references/");
  await expect(page.getByText("From Cyrus to Alexander")).toBeVisible();
});

test("language switch shows an icon and the other language's name", async ({ page }) => {
  await page.goto("/en/");
  const link = page.getByRole("link", { name: "تغییر زبان به فارسی" });
  await expect(link).toHaveText("فارسی");
  await expect(link.locator("svg")).toHaveCount(1);
});

test("pages hydrate without errors, also on repeated reloads", async ({ page }) => {
  test.setTimeout(120_000); // every reload starts the 3D map again
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  for (const path of ["/fa/", "/en/achaemenid/?e=babylon", "/en/about/"]) {
    await page.goto(path);
    for (let i = 0; i < 4; i++) await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  }
  expect(errors).toEqual([]);
});
