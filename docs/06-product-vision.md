# Product Vision

What the reimagined anthology is for, and the decisions that shape it. `docs/04-art-study.md` describes the book's art that this builds on. `docs/01-dual-lane-anthology.md` remains the contract for the two lanes.

**North star.** In Barry's words, "the most faithfully retro-art-inspired version of the original games possible", built iteratively. In practice there are two aims:

- Each reimagined lane should feel like its spread in the book come alive.
- Opening the anthology should feel like opening the book.

**Status.** Signed off by Barry on 28 September 2026: "I absolutely love the product vision." Implementation follows the path below, one gate at a time.

---

## Decisions

1. **The book is the shell.** The landing page becomes the book: a cover, a contents page, and a spread per game.
   - The cover matters most. Barry's strongest memory is "the cover art itself, even though it's not connected to any specific game."
   - An original cover painting in its idiom opens the anthology: painted hardware over a canyon, a heavy red title, and CRT insets of the games' real output.
2. **Spread as screen is the default layout.** Each lane lays out like its spread: the painting is the world, and flat panels are the interface. Bracket-ruled notes explain live values the way the book explains lines. Barry: "if there is a choice required, we go with A by default."
3. **The painting is the playfield in the real-time lanes.** Death Valley, Asteroid Belt, Beat the Bug Eyes, Moonlander and Touchdown play on a full-screen painted scene, and the book's panels are confined to the HUD. Death Valley's cockpit (page 24) is the model.
4. **Robots are the help.** Original tutor robots, each labelled with a BASIC keyword, explain how the original program worked. They act out its key lines, as the book's robots do, and the field notes are their script. A mascot in the role of the book's Puzzle-corner robot guides the player through the anthology.
5. **The book's sidebars are the variants.**
   - "How to make the game harder" becomes difficulty settings.
   - "Puzzle corner" becomes challenges.
   - "Adding to the program" becomes extensions.

   Space Rescue's third leg, to the Intergalactic Red Cross H.Q., is the largest of these. The art study lists every one.
6. **A career runs through it, accumulative and progressive.** The book gives the player a job in every game, inside institutions, with promotion to Space Admiral on offer. The career strings those jobs into one service record, ordered from simplest to most complex, as Barry suggested: "re-ordering, to make it move from easiest/simplest to hardest/most-complex".
7. **The retro lanes do not change.** They stay faithful to the disk, and every spread keeps its ★ lane one click away.
8. **All art is original.** It works in the book's idiom and techniques, never from a page. The scan in `reference/` is a private reference and is never shipped.

## The career

A draft order in five chapters. It uses the book's own fiction wherever it offers one. The order within chapters waits on playtesting, because the landing page's difficulty labels were never calibrated against each other.

| Chapter | Games | Why here |
|---|---|---|
| I. Cadet | Starship Take-Off, Asteroid Belt, Beat the Bug Eyes | One number, a count, a keypress. The book opens with Starship Take-Off, and a career should open with a take-off. |
| II. Pilot | Alien Snipers, Intergalactic Games, Evil Alien, Monsters of Galacticon | Searches and deductions under a budget, from one axis to three and a hidden table. |
| III. The Advanced Spacecraft Handling Test | Moonlander, Death Valley, Touchdown | Touchdown is Part III of this test in the book, with Captain Flash as the examiner. The book names only Part III, so casting Moonlander and Death Valley as Parts I and II is our invention: landing by the numbers, then flying the Speed Dart, then landing by hand. |
| IV. Command | Space Mines, Space Rescue | A colony to run for ten years, then the mission the book says earns promotion to Space Admiral. |
| Epilogue | Trip into the Future | The Admiral's last voyage returns to an Earth far in the future. It also ends the career on the book's hardest idea, relativity, and on the spread Barry remembers best. In his words, "Having Trip last is coda." |

What accumulates, as a first cut:

- **A service record.** Every mission flown, its result, and commendations for the book's Puzzle-corner challenges. Rank rises as chapters close.
- **The book's own carry-overs.** Intergalactic Games' Puzzle corner carries the bonus into the next launch, and Space Mines' carries the treasury into the next term. The career uses these where the book suggests them, rather than inventing a shared currency.
- **Gated career, open free play.** Career mode opens its chapters in order, and free play keeps every game and both lanes open at all times. Barry: "Career mode should be gated. Free mode stays open."
- **Local storage for now.** Progress lives in the browser, which suits `pnpm play` and a later offline build.

## How each lane should look

The layout follows decisions 2 and 3. The register and palette come from each game's spread, with page references as in the art study.

| Game | Layout | Register and reference |
|---|---|---|
| Starship Take-Off | Spread | Painted place and creatures: magenta sky, green alien ship, red crab aliens (5) |
| Intergalactic Games | Spread | Control room: the painted launch console whose monitor shows the launch (8) |
| Evil Alien | Spread | Painted hardware on deep navy, with the target grid as a schematic (9) |
| Beat the Bug Eyes | Playfield | Creatures: segmented worms with glowing eyes on purple (11–12) |
| Moonlander | Playfield | Painted hardware: the gold-foil lander over grey craters (14) |
| Monsters of Galacticon | Spread | Creatures: the reptile heads on pale sky (15–16) |
| Alien Snipers | Spread | Painted hardware: the deck of the yellow cruiser, fighters and starbursts (17) |
| Asteroid Belt | Playfield | Painted place: airbrushed rocks on blue-violet (19) |
| Trip into the Future | Spread | Storybook: the rocket, the domed city and the boy on red ground (21–22) |
| Death Valley | Playfield | The cockpit between olive and gold walls (23–24) |
| Space Mines | Spread | Painted place: the sunset haze and the colony (25–26) |
| Space Rescue | Spread | Monochrome: white on a starfield, the ringed planet (27–30) |
| Touchdown | Playfield | Monochrome: the lander in ink and grey over the crater strip (31–36) |

## The art system

The system has three shared parts, so that each game's cost is its composition alone.

- **A painter** in `src/core/`. It draws in the book's techniques, as listed in the art study: masked gradients, highlights, livery, panel detail, starbursts, starfields, spheres and rings, and spatter. It needs three modes:
  - airbrush, for most spreads;
  - ink outline over flat colour, for Trip's storybook;
  - greyscale with stipple, for Space Rescue and Touchdown.

  Static layers are painted once to an offscreen canvas.
- **A print system.** Slab-serif body text, grotesque headings and a monospaced listing face, all under open licences. Also flat panels, bracket rules, starburst badges and the machine symbols.
- **Palettes per spread**, taken from the art study's measurements.

## The path

1. **Style frames.** Built, and awaiting Barry's judgement: run `pnpm dev` and open `/style-frames.html`, or see the exports in `output/style-frames/`. They are drawn by the painter in `src/core/paint/` and the print system in `src/core/print/`, which the games will use. A local page of still frames, one for each image Barry ranked. Each is judged on one question: does it feel like the book?
   - The cover's idiom, for the landing page.
   - Trip's storybook.
   - Starship Take-Off's painted place.
   - Alien Snipers' hardware in perspective.
   - One print-system specimen.
2. **The pilot: Trip into the Future, with the landing page as the book.** Trip is Barry's favourite spread, and it exercises every layer at once:
   - the storybook painter;
   - the panels;
   - robots that already act out its variables in the book;
   - its place as the career's epilogue.
3. **Starship Take-Off, then Alien Snipers,** the next two in Barry's ranking, to prove the airbrush modes.
4. **The career shell,** once three lanes carry the new art.
5. **The remaining lanes,** in career order.

## Settled

- The career order and Trip as the epilogue: "the career ladder progression feels right."
- Career mode is gated; free play stays open.
