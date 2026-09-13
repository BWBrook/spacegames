import type { GameManifestEntry, GameMode } from '../games/types';
import { iconFor } from './icons';

export interface LandingOptions {
  root: HTMLElement;
  manifest: GameManifestEntry[];
  onSelect: (entry: GameManifestEntry, mode: GameMode) => void;
}

export function buildLanding({ root, manifest, onSelect }: LandingOptions) {
  root.innerHTML = '';

  const header = el('header', 'landing-header');
  header.innerHTML = `
    <p class="landing-kicker">Usborne · Computer Spacegames · 1982</p>
    <h1>Spacegames</h1>
    <p class="landing-lede">Thirteen type-in BASIC games, replayed two ways: the original listing running in the browser, and a reimagining that keeps each puzzle's central tension.</p>
  `;

  const grid = el('section', 'game-grid');
  grid.setAttribute('aria-label', 'Games');
  for (const entry of manifest) grid.appendChild(card(entry, onSelect));

  const footer = el('footer', 'landing-footer');
  footer.innerHTML = `
    <p>Sources are the BBC Micro listings from the book's DFS disk image. In a game, <kbd>Esc</kbd> returns here.</p>
    <p>${manifest.length} of 13 games so far.</p>
  `;

  root.append(header, grid, footer);
}

function card(entry: GameManifestEntry, onSelect: LandingOptions['onSelect']) {
  const article = el('article', 'game-card');
  article.dataset.game = entry.id;
  const source = entry.sources.find(s => s.role === 'game');
  article.innerHTML = `
    <div class="game-icon">${iconFor(entry.id)}</div>
    <div class="game-body">
      <h2>${entry.title}</h2>
      <p class="game-meta">${entry.year} · ${entry.difficulty}${source?.dfsName ? ` · <span class="game-source">${source.dfsName}</span>` : ''}</p>
      <p class="game-summary">${entry.summary}</p>
    </div>
    <div class="game-actions"></div>
  `;
  const actions = article.querySelector('.game-actions')!;
  if (entry.retro) {
    actions.appendChild(button('Original listing', 'retro', () => onSelect(entry, 'retro')));
  }
  actions.appendChild(button('Reimagined', 'modern', () => onSelect(entry, 'modern')));
  return article;
}

function button(label: string, mode: GameMode, onClick: () => void) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `lane-button lane-${mode}`;
  b.dataset.mode = mode;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function el(tag: string, className: string) {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}
