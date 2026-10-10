import type { Dictionary } from "@/lib/i18n";
import { eventColors } from "../Map/palette";

/** Collapsible legend for the map's colours and markers (desktop only, like the reference atlas). */
export function MapKey({ t }: { t: Dictionary }) {
  return (
    <details
      open
      className="group fixed end-4 top-24 z-10 hidden w-56 rounded-2xl border border-line bg-surface/80 p-3 text-xs text-muted shadow-lg backdrop-blur-md lg:block"
    >
      <summary className="cursor-pointer list-none font-num uppercase ltr:tracking-widest marker:hidden">
        {t.mapKey}
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5">
        <KeyItem label={t.keyTerritory}>
          <span className="h-2.5 w-5 rounded-sm bg-gradient-to-r from-[#d9a441] to-[#4f9d8a] opacity-80" />
        </KeyItem>
        <KeyItem label={t.keyCapital}>
          <span className="size-2 rotate-45 bg-gold" />
        </KeyItem>
        <KeyItem label={t.type_battle}>
          <span className="size-2.5 rounded-full border-2" style={{ borderColor: eventColors.battle }} />
        </KeyItem>
        <KeyItem label={t.type_monument}>
          <span className="size-2 rotate-45" style={{ background: eventColors.monument }} />
        </KeyItem>
        <KeyItem label={`${t.type_city} / ${t.type_event}`}>
          <span className="size-2.5 rounded-full" style={{ background: eventColors.city }} />
        </KeyItem>
        <KeyItem label={t.keyIranToday}>
          <span className="w-5 border-t-2 border-dashed border-muted" />
        </KeyItem>
      </ul>
      <p className="mt-2 text-[0.65rem] leading-snug opacity-75">{t.keySource}</p>
    </details>
  );
}

function KeyItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="grid w-5 place-items-center">{children}</span>
      <span>{label}</span>
    </li>
  );
}
