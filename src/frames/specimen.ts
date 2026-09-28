/**
 * The print system on one page: the faces and their alternatives, a listing
 * panel with bracket rules, the sidebar boxes, a badge, the machine marks,
 * the robots, and the palettes measured from each spread.
 */
import { robot } from '../core/paint/robot';
import { seeded } from '../core/paint/rng';
import { badge, bracketNote, machineMark, panel, sidebar, type Machine } from '../core/print/panel';
import { font, set } from '../core/print/type';
import type { Frame } from './frame';

type G = CanvasRenderingContext2D;

const INK = '#1c1620';
const PAPER = '#fffaf0';

const PALETTES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['Cover', ['#FA1423', '#282D48', '#BB635B', '#67BCEA', '#E6C13D']],
  ['Starship', ['#FB5BAF', '#B5CF51', '#589756', '#53AEB5', '#2B1C1E']],
  ['Evil Alien', ['#131B38', '#222953', '#5CA6DC', '#EB4944', '#F4DB28']],
  ['Bug Eyes', ['#625297', '#4D408E', '#C85865', '#ECE721']],
  ['Snipers', ['#FBEC16', '#5E48B7', '#5539A8', '#BB6378', '#C39E4D']],
  ['Trip', ['#FB5354', '#EDC84D', '#51B2BA', '#6B7A98']],
  ['Space Mines', ['#F85B19', '#FD6E2E', '#FC935D', '#FCA995', '#5A2F14']],
  ['Touchdown', ['#000000', '#5E5E5E', '#A0A0A0', '#D0D0D0', '#F9F9F9']],
];

function typeColumn(g: G) {
  let y = 118;
  const label = (text: string) => {
    set(g, text, 40, y, { face: 'grotesque', size: 12, color: '#7a6a70', weight: 700 });
    y += 18;
  };
  label('DISPLAY · OPTIMA, EMBOLDENED');
  g.save();
  g.translate(40, y);
  g.scale(1, 1.18);
  g.font = font('display', 56, 700);
  g.textBaseline = 'top';
  g.lineJoin = 'round';
  g.strokeStyle = '#e8141f';
  g.lineWidth = 3;
  g.strokeText('SPACEGAMES', 0, 0);
  g.fillStyle = '#e8141f';
  g.fillText('SPACEGAMES', 0, 0);
  g.restore();
  y += 84;
  label('TITLES · HELVETICA NEUE, HEAVY');
  set(g, 'Asteroid Belt', 40, y, { face: 'grotesque', size: 40, color: INK, weight: 800 });
  y += 58;
  label('TEXT · ROCKWELL, BOLD');
  y = set(g, 'You are on a trip through the belt. Rocks come at you thick and fast, and each one needs exactly the right force.', 40, y, { face: 'slab', size: 17, color: INK, width: 380 }) + 14;
  label('TEXT, ALTERNATIVE · SUPERCLARENDON');
  y = set(g, 'You are on a trip through the belt. Rocks come at you thick and fast, and each one needs exactly the right force.', 40, y, { face: 'clarendon', size: 16, color: INK, width: 380 }) + 14;
  label('LISTINGS · MENLO');
  set(g, '10 PRINT "SPACEGAMES"\n20 LET S=0\n30 FOR G=1 TO 10', 40, y, { face: 'mono', size: 16, color: INK, weight: 700, leading: 1.4 });
}

function listingPanel(g: G) {
  const box = { x: 460, y: 112, w: 440, h: 300 };
  panel(g, box, '#f63b40');
  set(g, 'How the program works', box.x + box.w - 20, box.y + 14, { face: 'grotesque', size: 18, color: INK, weight: 800, align: 'right' });
  const lines = ['10 PRINT "BELT"', '20 LET S=0', '30 FOR G=1 TO 10', '40 CLS', '50 LET N=INT(RND(1)*9+1)', '60 PRINT N', '70 NEXT G'];
  lines.forEach((line, i) => set(g, line, box.x + 20, box.y + 56 + i * 32, { face: 'mono', size: 15, color: '#ffffff', weight: 700 }));
  const noteX = box.x + 262;
  const width = 160;
  bracketNote(g, { x: box.x + 244, top: box.y + 96, bottom: box.y + 96, noteX, text: 'Sets the score to zero.', width, color: INK, size: 13 });
  bracketNote(g, { x: box.x + 244, top: box.y + 122, bottom: box.y + 250, noteX, text: 'Ten goes, each with a new number of stars.', width, color: INK, size: 13 });
  machineMark(g, 'bbc', box.x + 12, box.y + 225, 12, INK);
}

function sidebars(g: G) {
  sidebar(g, { x: 930, y: 112, w: 310, h: 128 }, 'How to make the game harder', 'Give yourself fewer goes. The number of goes is the last number in line 30.', '#2f5fd0', '#ffffff');
  sidebar(g, { x: 930, y: 258, w: 310, h: 118 }, 'Puzzle corner', 'Can you make the program remember your best score between games?', '#ffe617', INK);
  badge(g, 1188, 420, 50, 'NEW', seeded(7));
}

function marks(g: G) {
  const y = 470;
  set(g, 'MACHINE MARKS', 460, y - 6, { face: 'grotesque', size: 12, color: '#7a6a70', weight: 700 });
  const list: ReadonlyArray<readonly [Machine, string]> = [['vic', 'VIC and PET'], ['bbc', 'BBC: the retro lane'], ['trs80', 'TRS-80'], ['apple', 'Apple'], ['spectrum', 'Spectrum']];
  list.forEach(([machine, label], i) => {
    const x = 470 + i * 150;
    machineMark(g, machine, x, y + 30, 16, INK);
    set(g, label, x + 16, y + 21, { face: 'slab', size: 14, color: INK, width: 128 });
  });
}

function robots(g: G) {
  robot(g, 560, 700, 150, { body: '#4f9f5a', label: 'INPUT' });
  robot(g, 720, 700, 150, { body: '#e98a3a', label: 'GOSUB', wave: true });
  robot(g, 880, 700, 150, { body: '#9a7fd1', crate: { label: 'N', color: '#edc84d' } });
  set(g, 'The tutor robots: original designs that wear the keyword they act out.', 470, 716, { face: 'slab', size: 14, color: INK, width: 460 });
}

function palettes(g: G) {
  set(g, 'PALETTES MEASURED FROM THE SPREADS', 40, 606, { face: 'grotesque', size: 12, color: '#7a6a70', weight: 700 });
  PALETTES.forEach(([name, colors], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 40 + col * 200;
    const y = 628 + row * 40;
    colors.forEach((color, k) => {
      g.fillStyle = color;
      g.fillRect(x + k * 18, y, 18, 18);
    });
    set(g, name, x + 100, y + 2, { face: 'slab', size: 13, color: INK });
  });
}

function draw(g: G, w: number, h: number) {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, w, h);
  set(g, 'The print system', 40, 34, { face: 'grotesque', size: 42, color: INK, weight: 800 });
  set(g, 'The book’s furniture, set with faces this Mac already has: flat panels over the art, bracket rules, sidebars, badges and marks.', 40, 84, { face: 'slab', size: 16, color: INK, width: 1100 });
  typeColumn(g);
  listingPanel(g);
  sidebars(g);
  marks(g);
  robots(g);
  palettes(g);
  g.fillStyle = '#e8e0cf';
  g.fillRect(0, h - 6, w, 6);
}

export const specimenFrame: Frame = {
  id: 'print',
  title: 'Print system',
  note: 'The typefaces, with alternatives to choose between, and the book’s graphic furniture. Which body face, Rockwell or Superclarendon?',
  draw,
};
