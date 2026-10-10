/**
 * Ravi (راوی), the narrator: a naqqal, the traditional Persian coffeehouse storyteller.
 * While `speaking`, his mouth moves and he sways gently (see .ravi rules in globals.css).
 */
export function Ravi({ speaking, className = "" }: { speaking: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 140 170"
      aria-hidden
      data-speaking={speaking}
      className={`ravi rtl:-scale-x-100 ${className}`}
    >
      <circle className="ravi-glow" cx="70" cy="88" r="66" fill="var(--gold)" opacity="0.15" />
      <g className="ravi-body">
        {/* staff (matarsak) */}
        <rect x="108" y="22" width="5" height="146" rx="2.5" fill="#7a4e24" />
        <circle cx="110.5" cy="22" r="6" fill="#d9a441" />
        {/* robe (aba) */}
        <path d="M42 86 Q70 74 98 86 L112 168 H28 Z" fill="#1f4e79" />
        <path d="M62 84 L70 168 L78 84 Z" fill="#c0392b" />
        <path d="M42 86 Q70 74 98 86 L96 96 Q70 86 44 96 Z" fill="#163a5c" />
        {/* sash */}
        <rect x="38" y="120" width="66" height="8" rx="2" fill="#d9a441" />
        {/* arm reaching to the staff */}
        <path d="M92 96 Q104 104 108 112" stroke="#1f4e79" strokeWidth="11" strokeLinecap="round" fill="none" />
        <circle cx="109" cy="112" r="5.5" fill="#e0b48c" />
        {/* other arm, raised as if telling the story */}
        <path d="M46 98 Q32 96 28 82" stroke="#1f4e79" strokeWidth="11" strokeLinecap="round" fill="none" />
        <circle cx="27" cy="78" r="5.5" fill="#e0b48c" />
        {/* head */}
        <circle cx="70" cy="56" r="17" fill="#e0b48c" />
        {/* beard */}
        <path d="M53 56 Q56 92 70 96 Q84 92 87 56 Q78 66 70 64 Q62 66 53 56 Z" fill="#ece6da" />
        <path d="M60 64 Q70 60 80 64" stroke="#d5cdbd" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse className="ravi-mouth" cx="70" cy="69" rx="4" ry="1.8" fill="#5a2e1a" />
        {/* eyes and brows */}
        <circle cx="63.5" cy="53" r="1.8" fill="#2a1a10" />
        <circle cx="76.5" cy="53" r="1.8" fill="#2a1a10" />
        <path d="M59.5 48.5 Q63.5 46.5 67 48.5 M73 48.5 Q76.5 46.5 80.5 48.5" stroke="#ece6da" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* felt hat (kolah) */}
        <path d="M52 44 Q53 18 70 14 Q87 18 88 44 Z" fill="#6b4226" />
        <rect x="50" y="40" width="40" height="7" rx="3.5" fill="#d9a441" />
      </g>
    </svg>
  );
}
