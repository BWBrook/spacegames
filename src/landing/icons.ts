const ATTRS = 'viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

const ICONS: Record<string, string> = {
  'starship-takeoff': `<svg ${ATTRS}><path d="M24 6c6 6 8 14 8 22H16c0-8 2-16 8-22z"/><path d="M16 28l-6 8h8M32 28l6 8h-8"/><path d="M20 36l4 8 4-8"/><circle cx="24" cy="20" r="3"/></svg>`,
  'intergalactic-games': `<svg ${ATTRS}><circle cx="24" cy="24" r="6"/><ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(-25 24 24)"/><circle cx="38" cy="14" r="2.5" fill="currentColor" stroke="none"/><path d="M8 40l4-4M40 8l-3 3"/></svg>`,
  'evil-alien': `<svg ${ATTRS}><path d="M8 8h8M8 8v8M40 8h-8M40 8v8M8 40h8M8 40v-8M40 40h-8M40 40v-8"/><ellipse cx="24" cy="26" rx="11" ry="7"/><circle cx="20" cy="25" r="1.8" fill="currentColor" stroke="none"/><circle cx="28" cy="25" r="1.8" fill="currentColor" stroke="none"/><path d="M24 12v4"/></svg>`,
};

const FALLBACK = `<svg ${ATTRS}><circle cx="24" cy="24" r="14"/><path d="M24 10v28M10 24h28"/></svg>`;

export function iconFor(id: string) {
  return ICONS[id] ?? FALLBACK;
}
