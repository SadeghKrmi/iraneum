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
- [ ] Step 4: stage visuals and transitions
- [ ] Step 5: world map (SVG + d3-geo)
- [ ] Step 6: compare civilizations at the same moment
- [ ] Step 7: polish (animated Ravi, deploy)

The Achaemenid era has a full draft story; the other eras only have their intro so far.
All texts are drafts that still need historical review.

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

## Writing an era
Each era is one file, `content/eras/<id>.json`, listed in `content/eras/index.ts`:

```jsonc
{
  "id": "achaemenid",               // URL slug: /en/achaemenid/
  "start": -550, "end": -330,       // negative = BCE, no year 0
  "title":   { "fa": "…", "en": "…" },
  "summary": { "fa": "…", "en": "…" },  // Ravi's intro
  "events": [                       // marked years, in chronological order
    { "id": "babylon", "year": -539, "circa": false,
      "title": { "fa": "…", "en": "…" }, "text": { "fa": "…", "en": "…" } }
  ],
  "references": [ { "author": "…", "title": "…", "publisher": "…", "year": 2002, "url": "https://…" } ]
}
```
`npm test` fails if an id is duplicated, an event falls outside its era or is out of order, or a text is
missing in either language. About and Contact texts live in `content/pages.json`; general references in
`content/references.json`.

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
