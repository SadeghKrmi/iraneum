type IconProps = { className?: string };

function Icon({ className = "size-5", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const LanguageIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5h8M8 3v2m2.5 0c-1 4.5-3.8 8-7 9.5M5.5 9c1 2.2 3 4 5.5 5" />
    <path d="M12.5 21l4-9 4 9m-6.8-3h5.6" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

/** Points toward the start of the line: left in LTR, right in RTL. */
export const ChevronBackIcon = ({ className = "size-5" }: IconProps) => (
  <Icon className={`${className} rtl:-scale-x-100`}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

/** Points toward the end of the line: right in LTR, left in RTL. */
export const ChevronForwardIcon = ({ className = "size-5" }: IconProps) => (
  <Icon className={`${className} -scale-x-100 rtl:scale-x-100`}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

/** Media icons keep their direction in RTL, as in every media player. */
export const PlayIcon = ({ className = "size-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);

export const PauseIcon = ({ className = "size-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const ChevronUpIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 15l6-6 6 6" />
  </Icon>
);

/** A side panel; mirrored in RTL so the panel is on the start side. */
export const PanelIcon = ({ className = "size-5" }: IconProps) => (
  <Icon className={`${className} rtl:-scale-x-100`}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M9.5 4v16M5.5 8.5h2M5.5 12h2" />
  </Icon>
);

/** Map layers, for the map key. */
export const LayersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 2.5 8 12 13l9.5-5z" />
    <path d="M2.5 12.5 12 17.5l9.5-5M2.5 16.5 12 21.5l9.5-5" />
  </Icon>
);

export const GlobeIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </Icon>
);
