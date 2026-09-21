const ATTRS = 'viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

const ICONS: Record<string, string> = {
  'starship-takeoff': `<svg ${ATTRS}><path d="M24 6c6 6 8 14 8 22H16c0-8 2-16 8-22z"/><path d="M16 28l-6 8h8M32 28l6 8h-8"/><path d="M20 36l4 8 4-8"/><circle cx="24" cy="20" r="3"/></svg>`,
  'intergalactic-games': `<svg ${ATTRS}><circle cx="24" cy="24" r="6"/><ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(-25 24 24)"/><circle cx="38" cy="14" r="2.5" fill="currentColor" stroke="none"/><path d="M8 40l4-4M40 8l-3 3"/></svg>`,
  'evil-alien': `<svg ${ATTRS}><path d="M8 8h8M8 8v8M40 8h-8M40 8v8M8 40h8M8 40v-8M40 40h-8M40 40v-8"/><ellipse cx="24" cy="26" rx="11" ry="7"/><circle cx="20" cy="25" r="1.8" fill="currentColor" stroke="none"/><circle cx="28" cy="25" r="1.8" fill="currentColor" stroke="none"/><path d="M24 12v4"/></svg>`,
  'beat-the-bug-eyes': `<svg ${ATTRS}><path d="M6 34c6-3 10-9 12-16 2 7 6 13 12 16"/><path d="M4 42h40"/><path d="M14 42c0-6 4-10 10-10s10 4 10 10"/><circle cx="19" cy="16" r="3.4"/><circle cx="29" cy="16" r="3.4"/><path d="M38 10l4-4M42 16h4"/></svg>`,
  moonlander: `<svg ${ATTRS}><path d="M4 40h40"/><path d="M17 40l4-9M31 40l-4-9"/><path d="M18 31h12l3-12H15z"/><path d="M20 19V9h8v10"/><circle cx="24" cy="25" r="2.6"/><path d="M8 36c2-2 5-2 7 0M33 36c2-2 5-2 7 0"/></svg>`,
};

const FALLBACK = `<svg ${ATTRS}><circle cx="24" cy="24" r="14"/><path d="M24 10v28M10 24h28"/></svg>`;

export function iconFor(id: string) {
  return ICONS[id] ?? FALLBACK;
}
