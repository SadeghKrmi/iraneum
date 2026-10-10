# Iraneum · ایرانیوم

An interactive, bilingual (Persian / English) website about the history of Iran.
A timeline bar at the bottom holds checkpoints. Pick one, and Ravi (راوی), the narrator, tells its story.

## Status
- [x] **Step 1: skeleton.** Next.js static site, `/fa/` (RTL) and `/en/` (LTR), Vazirmatn font, language switcher, CI.
- [x] **Step 2: timeline bar.** Checkpoints from `content/checkpoints.json`, selectable by click, keyboard
      arrows (following the reading direction), prev/next buttons and touch swipe. Every checkpoint has its own URL.
- [ ] Step 3: Ravi v1 (character, speech bubble, scene-by-scene story)
- [ ] Step 4: stage visuals and transitions
- [ ] Step 5: world map (SVG + d3-geo)
- [ ] Step 6: compare civilizations at the same moment
- [ ] Step 7: polish (animated Ravi, narration audio, deploy)

The checkpoint texts are short placeholders and still need historical review.

## Develop
```bash
npm install
npm run dev          # http://localhost:3000/fa/
```

## Check
```bash
npm run lint && npm run typecheck && npm test   # unit tests (Vitest)
npm run build                                   # static site in out/
npm run test:e2e                                # browser tests (Playwright) against out/
```

## Adding or editing a checkpoint
Edit `content/checkpoints.json`. Each entry needs a URL-safe `id`, `start`/`end` years (negative = BCE,
no year 0) and `title`/`summary` in both `fa` and `en`. `npm test` fails if anything is missing.
