# Iraneum · ایرانیوم

An interactive, bilingual (Persian / English) website about the history of Iran.
A timeline bar at the bottom holds checkpoints. Pick one, and Ravi (راوی), the narrator, tells its story.

## Status
- [x] **Step 1: skeleton.** Next.js static site, `/fa/` (RTL) and `/en/` (LTR), Vazirmatn font, CI.
- [x] **Step 2: timeline bar.** Eras selectable by click, arrow keys (following the reading direction),
      prev/next buttons. Every era has its own URL.
- [x] **Step 3: Ravi v1.** Ravi, a naqqal storyteller, tells each era scene by scene: an intro, then the
      marked years (events) of the era. Play/pause, prev/next, year chips, swipe, `?e=<event>` deep links,
      narration audio, light/dark theme, menu with All eras, About, References and Contact pages.
- [x] **Step 4: 3D map atlas** (inspired by iranshahr.netlify.app). Full-screen tilted 3D map
      (Three.js via React Three Fiber): land and today's Iran border from Natural Earth, each era's territory,
      capitals and the current event; the camera flies to each event. Era card (capital, rulers, current
      event, event list), bottom dock (play, year, timeline), map key, light/dark map colours, WebGL fallback.
- [x] **Step 4b: 3D globe.** The whole world as a globe: drag to turn it, scroll or pinch to zoom; it tilts
      toward the horizon as you get close. Era card and map key collapse to icon buttons (remembered).
- [x] **Step 5: the full set of eras.** 14 eras from Elam to the Islamic Republic, each with an intro,
      capitals, rulers, a territory, 5–9 events (type, place, fa + en) and references.
- [x] **Step 6: a richer map.** Stylized mountain ranges (`content/map/mountains.json`), a wave-patterned sea,
      campaign routes as animated arrows (37 events), and borders that change within an era
      (Achaemenids, Afsharids).
- [x] **Step 7: compare civilizations.** At each scene's year the globe also shows the world's other
      civilizations (`content/world/civilizations.json`, from ancient Egypt to today) with their
      territory and name. A "Meanwhile in the world" panel lists them; picking one flies the camera there.
      The dock's "Compare with the world" button turns the layer on and off (remembered).
- [x] **Step 8: more border stages and a bigger world.** Iran's borders now change from event to event in
      12 of the 14 eras (the camera frames the new border). The world data grows to 169 civilizations
      across every continent, and 29 of them change their borders over time (Rome, the Ottomans, the Mongols,
      Russia, the USA, Qing China, the Mughals…). Nearest neighbours lead the "Meanwhile" list, and map
      labels that would overlap give way to Iran's own and to larger civilizations.
- [x] **Step 9: pick civilizations on the map.** Click a coloured territory on the globe to pick that
      civilization (the smallest one where they overlap); the "Meanwhile" panel opens and scrolls to its entry.
      A click anywhere else clears it, a drag still turns the globe, and the cursor shows what can be clicked.
      On phones a small card shows the picked civilization.
- [x] **Step 10: content review.** Dates, places, borders and Persian texts reviewed and corrected; Persian
      dates use the Gregorian calendar only. See [docs/content-review.md](docs/content-review.md) for every
      change and the open judgement calls; `tests/unit/review.test.ts` guards Persian typography and capitals.
- [ ] Step 11: polish (narration character, publish online)

Texts, territories and coordinates have had one review pass but are still simplified; see the review's open questions.

## Develop
```bash
npm install
npm run dev          # http://localhost:3000/fa/
```
The browser checks (`npm run test:e2e`, `npm run smoke:dev`) need Playwright's Chromium, a one-time download:
```bash
npx playwright install --with-deps chromium   # --with-deps also installs the system libraries (Linux)
```

## Check
```bash
npm run lint && npm run typecheck && npm test   # unit tests (Vitest)
npm run build                                   # static site in out/
npm run test:e2e                                # browser tests (Playwright) against out/
npm run smoke:dev                               # now and then: console errors under `next dev` (slow)
```

## Writing an era
Each era is one file, `content/eras/<id>.json`, listed in `content/eras/index.ts`:

```jsonc
{
  "id": "achaemenid",               // URL slug: /en/achaemenid/
  "start": -550, "end": -330,       // negative = BCE, no year 0; leave out "end" for an era that continues
  "shortTitle": { "fa": "…", "en": "…" }, // optional: shorter name for the timeline and map
  "title":   { "fa": "…", "en": "…" },
  "summary": { "fa": "…", "en": "…" },  // Ravi's intro
  "events": [                       // marked years, in chronological order
    { "id": "babylon", "year": -539, "circa": false,
      "title": { "fa": "…", "en": "…" }, "text": { "fa": "…", "en": "…" } }
  ],
  "references": [ { "author": "…", "title": "…", "publisher": "…", "year": 2002, "url": "https://…" } ]
}
```
Event map extras (optional): `route` (`[[lon, lat], …]`, a campaign drawn as an arrow, usually ending at the
event's place) and `territory` (the borders from this event on: rings, or `"full"` for the era at its height).

Map fields: `color` (territory colour), `capitals` (`{ "name": {fa, en}, "at": [lon, lat] }`), `rulers`
(`{fa, en}`), `territory` (one ring of `[lon, lat]` points per area, drawn on land only), and for each event
`type` (`battle`, `monument`, `city` or `event`) and `at` (`[lon, lat]`). All territories are simplified
drafts.

Other civilizations live in `content/world/civilizations.json`: `id`, `color`, `from` / `to` (years, `to`
left out if it still exists), `name` and `summary` (`{fa, en}`), `capital` (`{ "name", "at" }`), `territory`
(rings), and optional `stages` (`[{ "from": 1517, "territory": [rings] }, …]`, the borders from that year on).

`npm test` fails if an id is duplicated, an event falls outside its era or is out of order, or a text is
missing in either language. About and Contact texts live in `content/pages.json`; general references in
`content/references.json`.

## Map data
`public/geo/land-50m.json` (whole-world Natural Earth land, 1:50m, TopoJSON) and `public/geo/iran.json`
(today's borders of Iran) are generated by `npm run geo` from the `world-atlas` package. The browser
turns the land into a 3D globe in a background worker (`components/Map/land.worker.ts`).

## Narration audio (your own TTS)
Ravi plays one audio file per scene per language, if it exists:

```
public/audio/<fa|en>/<era-id>/<scene-id>.mp3     (scene-id = "intro" or the event id; .m4a/.ogg/.wav also work)
```

1. `npm run tts:export` writes every text Ravi speaks, with the file it should be saved to:
   - `tts/fa.tsv`, `tts/en.tsv`: `output<TAB>text`, one scene per line
   - `tts/script.json`: the same, with locale, era and scene ids
   - add `-- --missing` to export only the scenes that have no audio yet
2. Run your TTS over those rows and save each result at its `output` path.
3. `npm run tts:check` lists scenes still missing audio, and audio files that match no scene
   (for example after renaming an event).
4. `npm run build`: the play button now uses the audio. Scenes without audio are still told: Ravi
   advances at reading pace.

Use the event `id`, not its position, to name files, so adding or reordering events never breaks audio.
If you change a text, re-synthesize that scene.
