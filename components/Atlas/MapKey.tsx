import type { Dictionary } from "@/lib/i18n";
import { ChevronUpIcon, LayersIcon } from "../icons";
import { eventColors, routeColors } from "../Map/palette";

type Props = { t: Dictionary; open: boolean; onToggle: (open: boolean) => void };

/** Legend for the map's colours and markers. Collapses to a layers button. */
export function MapKey({ t, open, onToggle }: Props) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        aria-label={t.mapKey}
        title={t.mapKey}
        data-map-key
        data-open="false"
        className="pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface/90 text-muted shadow-lg backdrop-blur-md transition-transform hover:scale-105 hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
      >
        <LayersIcon />
      </button>
    );
  }
  return (
    <section
      aria-label={t.mapKey}
      data-map-key
      data-open="true"
      className="pointer-events-auto w-full shrink-0 rounded-2xl border border-line bg-surface/80 p-3 text-xs text-muted shadow-lg backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <p className="font-num uppercase ltr:tracking-widest">{t.mapKey}</p>
        <button
          type="button"
          onClick={() => onToggle(false)}
          aria-label={t.hidePanel}
          title={t.hidePanel}
          className="-me-1 grid size-7 place-items-center rounded-full transition-colors hover:bg-gold/10 hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
        >
          <ChevronUpIcon className="size-4" />
        </button>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        <KeyItem label={t.keyTerritory}>
          <span className="h-2.5 w-5 rounded-sm bg-gradient-to-r from-[#d9a441] to-[#4f9d8a] opacity-80" />
        </KeyItem>
        <KeyItem label={t.keyWorld}>
          <span className="h-2.5 w-5 rounded-sm border border-[#5b8cc4] bg-[#5b8cc4]/30" />
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
        <KeyItem label={t.keyRoute}>
          <span className="w-5 border-t-2 border-dashed" style={{ borderColor: routeColors.battle }} />
        </KeyItem>
        <KeyItem label={t.keyIranToday}>
          <span className="w-5 border-t-2 border-dashed border-muted" />
        </KeyItem>
      </ul>
      <p className="mt-2 text-[0.65rem] leading-snug opacity-75">{t.keySource}</p>
    </section>
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
