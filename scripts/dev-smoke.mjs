// Opens the site under `next dev` and fails on any console error or three.js warning, and on errors logged by the
// dev server itself. React reports some mistakes, such as duplicate keys, only in development, so the browser
// tests (which run against the production build) miss them.
// Slow (each page compiles on first visit): run it now and then, not with every change.
import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(import.meta.dirname, "..");
const SWIFTSHADER = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

const eras = readdirSync(path.join(ROOT, "content/eras"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(path.join(ROOT, "content/eras", f), "utf8")));

// Every era's intro, its first event with a campaign route, and its first border change.
const pages = ["/en/", "/fa/about/"];
for (const era of eras) {
  pages.push(`/en/${era.id}/`);
  const routed = era.events.find((e) => e.route);
  if (routed) pages.push(`/en/${era.id}/?e=${routed.id}`);
  const border = era.events.find((e) => e.territory && e !== routed);
  if (border) pages.push(`/fa/${era.id}/?e=${border.id}`);
}

const freePort = () =>
  new Promise((resolve) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

// The browser first: if it is missing, say so before waiting for the dev server.
let browser;
try {
  browser = await chromium.launch({ args: SWIFTSHADER });
} catch (err) {
  if (!/Executable doesn't exist/.test(String(err))) throw err;
  console.error(
    "Playwright's Chromium isn't installed. Run once:\n" +
      "  npx playwright install chromium\n" +
      "(on a fresh Linux machine: npx playwright install --with-deps chromium)",
  );
  process.exit(1);
}

const port = await freePort();
const base = `http://localhost:${port}`;
// Its own process group, so stopping it also stops the next-server it starts.
const dev = spawn(path.join(ROOT, "node_modules/.bin/next"), ["dev", "-p", String(port)], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
// The dev server's own errors (e.g. a route that fails to render) never reach the browser console.
const serverErrors = new Set();
for (const stream of [dev.stdout, dev.stderr]) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) if (/⨯|\bError:/.test(line)) serverErrors.add(line.trim());
  });
}

let stopped = false;
const stop = () => {
  if (stopped) return;
  stopped = true;
  try {
    process.kill(-dev.pid, "SIGTERM");
  } catch {
    // Already gone.
  }
};
process.on("exit", stop);

for (let i = 0; ; i++) {
  try {
    if ((await fetch(`${base}/en/`)).ok) break;
  } catch {
    // Not up yet.
  }
  if (i > 240) throw new Error("next dev did not start");
  await new Promise((r) => setTimeout(r, 500));
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = new Set();
let current = "";
page.on("console", (msg) => {
  // Errors, and three.js warnings (deprecations and misuse show up there first).
  if (msg.type() === "error" || (msg.type() === "warning" && msg.text().startsWith("THREE.")))
    problems.add(`${current}: ${msg.text().split("\n")[0]}`);
});
page.on("pageerror", (err) => problems.add(`${current}: ${err.message}`));

for (const url of pages) {
  current = url;
  await page.goto(base + url, { timeout: 180_000 });
  await page.locator("body[data-hydrated]").waitFor({ timeout: 180_000 });
  await page.locator('[data-map="ready"]').waitFor({ timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log(`checked ${url}`);
}

// The icons browsers ask for on every page.
for (const icon of ["/favicon.ico", "/icon.svg"]) {
  const res = await fetch(base + icon);
  if (!res.ok) problems.add(`${icon}: HTTP ${res.status}`);
}

// Pick a civilization in the panel, then move on to the next event (the pick is dropped).
current = "/en/parthian/?e=carrhae (pick)";
await page.goto(`${base}/en/parthian/?e=carrhae`);
await page.locator("[data-meanwhile] [data-civ]").first().click();
await page.getByRole("button", { name: "Next event" }).click();
await page.waitForTimeout(1500);

await browser.close();
stop();

for (const line of serverErrors) problems.add(`next dev: ${line}`);
if (problems.size) {
  console.error(`\n${problems.size} console error(s):\n${[...problems].map((p) => `- ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`\nNo console errors on ${pages.length + 1} pages.`);
