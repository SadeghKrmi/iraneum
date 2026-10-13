// Synthesizes Ravi's narration with a TTS server and saves it where the site looks for it
// (public/audio/<locale>/<era>/<scene>.mp3). Scenes that already have audio are skipped, so an interrupted run
// can simply be started again.
//
//   npm run tts:generate -- --only achaemenid/babylon --locale fa   # try one scene first
//   npm run tts:generate -- --voice-en <english voice>              # everything still missing
//
// Options (or environment variables):
//   --url <url>         TTS_URL       default http://localhost:8000/synthesis/wav
//   --voice-fa <name>   TTS_VOICE_FA  default ganji_formal_poetic
//   --voice-en <name>   TTS_VOICE_EN  no default: English is skipped without it
//   --locale fa|en|all                default all
//   --only <era>[/<scene>]            repeatable
//   --force                           regenerate scenes that already have audio
//   --dry-run                         list what would be generated, without calling the server
// The server receives POST {"text", "voice"} as JSON and answers with a WAV file. With ffmpeg installed the
// WAV is converted to MP3 (about 10× smaller); without it the WAV is kept, which the site plays as well.
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LOCALES, ROOT, isWav, listScenes, selectScenes, wavDurationSeconds } from "./tts-lib.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const values = (name) => args.flatMap((a, i) => (a === `--${name}` && args[i + 1] ? [args[i + 1]] : []));
const value = (name, fallback) => values(name).at(-1) ?? fallback;

const url = value("url", process.env.TTS_URL ?? "http://localhost:8000/synthesis/wav");
const voices = {
  fa: value("voice-fa", process.env.TTS_VOICE_FA ?? "ganji_formal_poetic"),
  en: value("voice-en", process.env.TTS_VOICE_EN),
};
const localeArg = value("locale", "all");
if (localeArg !== "all" && !LOCALES.includes(localeArg)) {
  console.error(`Unknown --locale ${localeArg} (use fa, en or all).`);
  process.exit(2);
}
let locales = localeArg === "all" ? LOCALES : [localeArg];
const missingVoice = locales.filter((l) => !voices[l]);
if (missingVoice.length) {
  console.warn(
    `No voice for ${missingVoice.join(", ")}: skipping it. Pass --voice-${missingVoice[0]} <name> ` +
      `(or set TTS_VOICE_${missingVoice[0].toUpperCase()}).`,
  );
  locales = locales.filter((l) => voices[l]);
}

const scenes = selectScenes(listScenes(), { locales, only: values("only"), force: flag("force") });
if (scenes.length === 0) {
  console.log("Nothing to generate: every selected scene already has audio (use --force to redo).");
  process.exit(0);
}

if (flag("dry-run")) {
  for (const s of scenes) console.log(`${s.locale} ${s.era}/${s.scene}  ${s.text.length} characters → ${s.output}`);
  console.log(`\n${scenes.length} scene(s) would be generated.`);
  process.exit(0);
}

let ffmpeg = true;
try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  ffmpeg = false;
  console.warn("ffmpeg not found: keeping WAV files. Install ffmpeg to get MP3s about 10× smaller.\n");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Calls the server, with two retries on network errors and server errors (5xx). */
async function synthesize(text, voice) {
  for (let attempt = 0; ; attempt++) {
    let problem;
    let retry = true;
    let unreachable = false;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });
      const body = Buffer.from(await res.arrayBuffer());
      if (res.ok && isWav(body)) return body;
      const preview = body.toString("utf8", 0, 200);
      problem = res.ok ? `the reply is not a WAV file (${body.length} bytes: ${preview})` : `HTTP ${res.status}: ${preview}`;
      retry = res.status >= 500;
    } catch (err) {
      problem = `cannot reach ${url}: ${err.cause?.code ?? err.message}`;
      unreachable = true;
    }
    if (!retry || attempt === 2) throw Object.assign(new Error(problem), { unreachable });
    await sleep(attempt === 0 ? 2000 : 5000);
  }
}

const failed = [];
let done = 0;
let seconds = 0;
for (const [i, s] of scenes.entries()) {
  const label = `[${i + 1}/${scenes.length}] ${s.locale} ${s.era}/${s.scene}`;
  try {
    const wav = await synthesize(s.text, voices[s.locale]);
    const target = path.join(ROOT, ffmpeg ? s.output : s.output.replace(/\.mp3$/, ".wav"));
    mkdirSync(path.dirname(target), { recursive: true });
    // Write next to the target and rename at the end, so an interrupted run never leaves half a file.
    const tmpWav = `${target}.part.wav`;
    writeFileSync(tmpWav, wav);
    if (ffmpeg) {
      const tmpMp3 = `${target}.part.mp3`;
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tmpWav, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", tmpMp3]);
      rmSync(tmpWav);
      renameSync(tmpMp3, target);
    } else {
      renameSync(tmpWav, target);
    }
    // A redone scene may have left a file in another format behind: the site would pick the first it finds.
    if (s.existing && path.join(ROOT, s.existing) !== target) rmSync(path.join(ROOT, s.existing), { force: true });
    const length = wavDurationSeconds(wav);
    seconds += length;
    done++;
    console.log(`${label} ✓ ${length.toFixed(1)} s`);
  } catch (err) {
    failed.push(`${s.locale} ${s.era}/${s.scene}: ${err.message}`);
    console.log(`${label} ✗ ${err.message}`);
    if (err.unreachable) {
      console.error("\nThe TTS server is not answering: is it running? Stopping here; run again to continue.");
      break;
    }
  }
}

const minutes = Math.floor(seconds / 60);
console.log(`\nDone: ${done} scene(s), ${minutes} min ${Math.round(seconds - minutes * 60)} s of audio.`);
if (failed.length) {
  console.error(`Failed: ${failed.length}\n${failed.map((f) => `- ${f}`).join("\n")}`);
  process.exit(1);
}
