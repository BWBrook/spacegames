# Art Study

What the art of *Computer Spacegames* is like, described and measured from the book itself, as the reference for giving the reimagined lanes its feeling. This document describes the art; it reproduces none of it.

**Source.** Usborne's free PDF of the 1982 book, kept with the page images and palettes extracted from it in `reference/book/`. Git ignores that folder and nothing in it is published. Page numbers below are PDF pages; the printed page number is one less.

**The rule for everything that follows.** The book's art is a reference for idiom and technique. Game art is original work, never a copy, tracing or close paraphrase of any page.

---

## The book

The credits on page 2 name Daniel Isaaman and Jenny Tyler as authors. The illustrators are Martin Newton, Tony Baskeyfield, Graham Round, Jim Bamber, Mark Duffin and John Bolton, and the designers Graham Round and Roger Priddy. The book does not say who painted which page. Two programs are credited separately: Beat the Bug Eyes to Bob Merry and Starship Take-Off to Richard Nash.

Every game gets a spread built from the same parts:

- A title in a bold grotesque, and a story blurb in the second person, set into a painting that usually runs to the page edges and sits behind everything else.
- The listing in a flat-colour panel headed "How the program works", with bracket rules tying each group of lines to a plain-English note.
- Small boxes: "How to make the game harder", usually blue; "Puzzle corner", usually yellow; "Adding to the program".
- Tutor robots acting out what the BASIC does.

Around the games are several sections:

- About This Book, which covers typing in, the machine symbols and debugging.
- Chapters on adding to the programs and on writing your own.
- A BASIC summary told through robots.
- An ASCII chart, a chart for converting between BASIC dialects, and the answers.

The main listing is the ZX81's, except in Touchdown, which prints one version per machine. Lines that differ on other machines carry a symbol, with the replacement printed below the listing:

- ▲ VIC and PET
- ★ BBC and Electron
- ■ TRS-80
- ● Apple
- s Spectrum

A red starburst reading "1K" marks the programs that fit an unexpanded ZX81.

## The cover

Page 1. The top half is title: COMPUTER SPACEGAMES in a heavy, flared, condensed display face in signal red, with the list of machines beneath it, all on white. The painting enters below on a curve. A white and blue carrier with a red stripe and a hull number hovers over a red-brown cratered canyon. It has a saucer-shaped upper deck, cutaway glass domes with crew inside, and landing legs on round pads. Green delta-wing fighters with bubble canopies attack it, and yellow laser bolts and orange bursts cross the scene.

Along the bottom sit three screens drawn as rounded CRT faces, each showing a game's real output:

- magenta walls and a green column of stars on black (Death Valley);
- a small red lander between walls, over white spiky ground on blue (Touchdown);
- pairs of yellow eyes and a white star on red (Beat the Bug Eyes).

A yellow corner flash sells the programs.

The juxtaposition is the whole book in one image. The painting shows what the games are about. The insets show what the machines could draw. The reader closed the gap, and that gap is this project's brief: the reimagined lanes should look like the painting the listing was always pointing at.

## Screens in the book

The book pictures a game's screen in four different ways.

- **Beside the painting.** The cover sets the machines' real output, in CRT insets, next to the painted world.
- **As a window.** On page 8 a painted console holds a monitor showing a rocket lifting off in gold smoke, with a hand on the red launch button. The screen shows the painted world rather than text.
- **As a diagram.** Evil Alien's page 9 draws its 3-D target grid as a flat labelled schematic, which the story says is what the ship's screen shows.
- **As a cockpit.** Death Valley's page 24 puts the reader behind the pilot's blue helmet, red-gloved hands on the controls, between the ravine walls. There is no screen at all.

Touchdown, the one game built on graphics, never shows its own screen in its section. The cover does.

## Registers

The spreads use six registers, and most commit to one.

1. **Painted hardware.** Gouache and airbrush in the idiom of 1970s British science-fiction paperback and reference-book illustration, with a Gerry Anderson sense of spacecraft as working machines. Hulls are hard-edged, with bold livery: stripes, checkerboards, lightning flashes, hull numbers. Panel detail is dense, viewpoints are dramatic, and craft are cropped by the page edge so they seem larger than the page. Examples: the cover, Evil Alien (9), Moonlander (14), Alien Snipers (17), Death Valley's cockpit (24).
2. **Painted places.** Environments that set a mood with colour more than detail:
   - Asteroid Belt (19): airbrushed asteroids close to photographic.
   - Space Mines (25–26): a sunset haze with silhouetted mining spires, then the colony's stilted platforms in a sketchier ink and wash.
   - Death Valley (23): olive and gold ravine walls.
   - Starship Take-Off (5): a magenta sky over bubbling acid-green rock.
3. **Creatures.** Menace played for fun:
   - Beat the Bug Eyes (11): segmented red worms with glowing yellow eyes and needle teeth.
   - Galacticon (15): a vast green reptile head with an orange eye and gaping jaw.
   - Starship Take-Off (5): red crab-like aliens.
4. **Storybook.** A friendlier line-and-colour cartoon. Trip into the Future (21) has a finned rocket, a boy standing in for the reader, and a domed garden city on red ground.
5. **Control-room graphics.** Flat colour panels, a tracking scope on a cyan grid, and the listing framed like a console (Intergalactic Games, 7), then a painted launch console (8). The listing panels on every other spread share this register.
6. **Monochrome.** Black-and-white airbrush with spatter and stipple:
   - Space Rescue (27–29): the listing reversed out of a starfield. Moonlander's first page (13) does the same.
   - Page 30: a banded ringed planet with speckled rings and moons.
   - Touchdown (31–36): a two-seat lander in ink and grey airbrush, drawn from a new angle beside each machine's listing, over a stippled crater strip. It reads like a technical manual.

**Tutor robots** run through most of the colour spreads. They are rounded, riveted and big-eyed, each with a BASIC keyword on its chest, and they act out the program:

- LET fills crates labelled with variable names, and INPUT posts a note into the crate marked F (6).
- STOP slaps a big red button while END sits down (6).
- GOSUB and RETURN go in and out of a subroutine room (11–12).
- A robot fans out four cards to show Galacticon's shuffle (15).
- INPUT, SQR and LET carry the crates V, D, T1 and T2 through the relativity sum (21).
- An ERROR robot digs up bugs, which turn out to be small crabs (3).

The robots make the machine a friendly colleague rather than a black box. The BASIC summary (41–45) gives nearly every keyword its own robot and mime. FOR and NEXT run in a circle, GOTO leaps a signpost, DIM stands before a wall of pigeonholes, and PEEK and POKE work a corridor of memory lockers. A small green robot sits in almost every Puzzle corner box, which makes it the book's closest thing to a mascot. The black-and-white games, Space Rescue and Touchdown, have no robots at all.

## Technique

The painted registers are built from a small set of methods. Most of them are vector operations, which matters for implementation.

- **Friskets and gradients.** Airbrush art is hard-edged masks filled with soft gradients. In canvas terms, that is a clip path and a linear or radial gradient.
- **Highlights.** Hull edges and glass carry white-cored streaks. Engines and lasers are drawn as a white core inside a coloured halo, which on canvas is additive blending.
- **Livery.** Stripes, checks, bolts and numbers: the fastest route to character on a simple shape.
- **Panel detail.** Circuit-like plating, vents and hatches; Alien Snipers' hull is covered in it. On canvas this is procedural greebles.
- **Starbursts.** Irregular stars with many points, in yellow, red and white, used for hits and as badges.
- **Starfields.** Dots of mixed size on a deep ground, with a soft nebula band.
- **Spheres.** Planets and moons with terminator shading, bands and rings.
- **Spatter and stipple.** Grain for rock, rings and crater fields, strongest in the monochrome pages.
- **Viewpoint.** Low or high angles, vanishing points, cropping at the page edge.

## Palette

Each page scan was quantised to ten colours. The values are approximate, because print, age and scanning all shift them. The full sheet is `reference/book/palettes/palette-sheet.png`.

| Spread | PDF page | Dominant colours | Character |
|---|---|---|---|
| Cover | 1 | `#FA1423` `#282D48` `#BB635B` `#67BCEA` `#E6C13D` | Signal-red title, navy, red-brown canyon, sky blue, yellow lasers |
| Starship Take-Off | 5 | `#FB5BAF` `#B5CF51` `#589756` `#53AEB5` `#2B1C1E` | Magenta sky against acid and lizard greens |
| Intergalactic Games | 7 | `#FC443B` `#684EB0` `#FAF910` `#96C3CE` | Red and purple panels, yellow, pale cyan grid |
| Evil Alien | 9 | `#131B38` `#222953` `#5CA6DC` `#EB4944` `#F4DB28` | Deep navy space, red ship with yellow bolt |
| Beat the Bug Eyes | 11 | `#625297` `#4D408E` `#C85865` `#ECE721` | Purple ground, red worms, yellow eyes |
| Moonlander | 14 | `#3B4357` `#CEC6A8` `#56CAFA` `#E9D91F` | Slate night, silver and gold foil, cyan |
| Galacticon | 15 | `#9EE8FB` `#FDFD6D` `#4E6AC7` `#B56C4C` | Pale sky, yellow panel, blue, rust |
| Alien Snipers | 17 | `#FBEC16` `#5E48B7` `#5539A8` `#BB6378` `#C39E4D` | Cadmium-yellow hull on violet |
| Asteroid Belt | 19 | `#FB3946` `#4C53AF` `#FBFA05` `#9AC2CA` | Red panel, blue-violet space, grey-blue rock |
| Trip into the Future | 21 | `#FB5354` `#EDC84D` `#51B2BA` `#6B7A98` | Mars red, gold, teal, slate |
| Death Valley | 23 | `#FEFE1B` `#4A4731` `#A7A432` `#AE6A4B` | Yellow panel, olive ravine, rust |
| Space Mines | 25 | `#F85B19` `#FD6E2E` `#FC935D` `#FCA995` `#5A2F14` | One sunset ramp, brown silhouettes |
| Space Rescue, Touchdown | 27, 30, 35 | `#000000` `#5E5E5E` `#A0A0A0` `#D0D0D0` `#F9F9F9` | Greyscale only |

The pattern across the table:

- Saturated primaries and secondaries, with almost no pastels.
- Black used as a colour in its own right.
- Each spread is built on one dominant pair of colours, usually near-complementary: yellow and violet, red and blue, magenta and green, orange and brown.

## Typography

- **Display** (the cover): heavy, flared, condensed, red.
- **Titles and headings**: a bold grotesque, like Helvetica or Univers Bold.
- **Body and annotations**: a heavy serif with slab-like serifs, in the Clarendon and Rockwell family, set densely, either straight onto the art or into panels.
- **Listings**: a monospaced computer face.

Open-licence candidates to evaluate later:

- For the slab serif: Arvo, Roboto Slab or Zilla Slab.
- For the grotesque: Archivo or Inter Tight.
- The display face needs a search, or original lettering.

## The fiction

The story blurbs are written in the second person, and the reader usually has a job:

- a stranded captain;
- a launch engineer;
- a cruiser captain;
- an elected colony leader;
- a pilot sitting a handling test.

The stakes are as often professional as mortal. NCTV fires you, a rescue earns promotion to Space Admiral, and Captain Flash is watching your landing. The universe has institutions: TV companies, traders, a Red Cross, examiners.

The named cast and places:

| Game | Names |
|---|---|
| Intergalactic Games | the First Intergalactic Games; New Century TV (NCTV) and its rival broadcasters |
| Evil Alien | Elron, whose ship is invisible |
| Beat the Bug Eyes | space bugs that entangle their prey in web; your proton blaster |
| Monsters of Galacticon | the planet Galacticon; Sulfacidor, Flamgondar, Balnolotin and Golandor; the ray gun, trypton blaster and sword laser |
| Alien Snipers | an interstellar cruiser, strayed into a forbidden zone after hyperspace-motor damage; alien snipers that jam its radar |
| Death Valley | the evil Dissectitrons; the single-seat Speed Dart; the ravine called Death Valley |
| Space Mines | the Planet Astron; the Intergalactic Traders |
| Space Rescue | the Galaxy's spiral arm; promotion to Space Admiral; the Intergalactic Red Cross H.Q. |
| Touchdown | Captain Flash; the Advanced Spacecraft Handling Test (Part III); a lightweight two-man lander |

Starship Take-Off, Moonlander, Asteroid Belt and Trip into the Future name nobody. In Starship Take-Off you are escaping in a captured alien ship.

## Per game

Pages, subject, and the book's own ideas for extending each game. The sidebar boxes are the authors' sanctioned roadmap for a reimagining, so each one is paraphrased specifically enough to build from.

| Game | Pages | Art | The book's extensions |
|---|---|---|---|
| Starship Take-Off | 5–6 | A green alien ship seen head-on under a magenta sky, with a ringed planet, acid-green rock and red crab aliens. The listing is on a white page with robots. | *Harder:* fewer goes. *Puzzle:* change the range of forces. |
| Intergalactic Games | 7–8 | A tracking scope on flat purple (7). A painted launch console whose monitor shows the rocket lifting off (8). | *Adding:* a speed bonus of 1000 divided by the attempt number. *Puzzle:* a win rolls into a new game with the bonus carried over, played until NCTV fires you. |
| Evil Alien | 9–10 | A red fighter with a yellow bolt and checkerboard fins, and a silver shuttle, on deep navy, with the target grid as a schematic. A cartoon explosion beside the BOOM line. | *Harder:* a bigger grid, with more bombs to keep it fair. *Puzzle:* ask for a difficulty between 6 and 30 and give about a third as many bombs. |
| Beat the Bug Eyes | 11–12 | Segmented red worms with yellow eyes and needle teeth coil round the panel on purple, one claw over its edge. | *Speed:* shorten the delay. *Screen:* spread the positions across a wider display. *Puzzle:* more positions and more bugs. |
| Moonlander | 13–14 | The listing reversed out of black, with a small painted moon (13). An Apollo-style lander in silver and gold foil, orange plume, over grey craters (14). | *Adding:* a star whose distance across the screen shows height. *Changes to try:* the starting height, speed and fuel. *Puzzle:* a higher safe landing speed. |
| Monsters of Galacticon | 15–16 | A vast green reptile head and a second blue-grey head on pale blue sky, a claw draped over the yellow panel. | *Puzzle:* find at least four ways to make it harder. |
| Alien Snipers | 17–18 | The player's yellow-and-red cruiser from below, with the story printed on its hull, red checker-winged fighters and a starburst. Robots with a letter-to-number chart. | *Speed:* shorten the firing window. *Harder:* raise the minimum difficulty, for example to 3. *Puzzle:* score the code number rather than 1 per hit. |
| Asteroid Belt | 19–20 | Airbrushed rocks in a blue-violet field with starbursts, a yellow story box and a red listing panel. | *Speed:* a shorter reaction time. *Puzzle:* score the star count rather than 1 per rock. |
| Trip into the Future | 21–22 | Storybook: a rocket with a bolt decal, a boy, domed cities with a monorail and a hovering disc on red ground. Robots act out the variables. | *Puzzle:* a wider range of target years, an accuracy window of two years instead of five, and a different lifespan than 50 years. |
| Death Valley | 23–24 | Olive and gold ravine walls under lightning (23). The cockpit from behind the pilot (24). | *Slower:* a delay loop in the main pass. *Puzzle:* a longer valley. |
| Space Mines | 25–26 | A sunset haze with mining spires (25), then the colony in ink and wash (26). The listing is printed straight over the sky. | *Puzzle:* offer another term and carry the money over. |
| Space Rescue | 27–30 | White listing on a starfield (27–29). A ringed gas giant in spatter airbrush (30). No robots. | *Adding:* a third part, crossing from the landing site to the Intergalactic Red Cross H.Q. |
| Touchdown | 31–36 | The lander from a new angle beside each machine's listing, in ink and grey airbrush over a stippled crater strip. No robots. | None, only a ZX81 note on typing graphics characters. |

Pages 37–40 give extensions that apply to any game: instructions at the start, a pause for a keypress, a computer that answers back, a play-again loop instead of retyping `RUN`, and sound. That includes a worked BBC `SOUND` line for a gunshot.

## Where the reimagined lanes stand

The current reimagined lanes share one look:

- near-black teal backgrounds;
- instruments drawn in thin lines;
- a pastel-neon palette of mint `#7DFFB3`, gold `#FFD166`, cyan `#9EDCFF` and salmon `#FF9F89`;
- Space Mono for all text.

The book is the inverse. Every spread has its own painted world, and one print system holds them together: slab body text, grotesque headings, flat panels and bracket rules. The lanes also draw the instrument without the world. Alien Snipers' reimagined lane shows a radar scope on black. The book puts the reader on the deck of a yellow cruiser while red fighters dive through a violet sky.

## Toward a vision

A working reading of the north star: **each reimagined lane should feel like its spread come alive.** That means three things:

- the world its painting promised;
- the book's graphic language as its interface;
- the book's own ideas for extending the game as its design brief.

These options are not exclusive.

- **A. Spread as screen.** Lay each lane out like its spread. The painting is the world and flat panels are the interface. Bracket-ruled annotations explain live values the way the book explains lines, and robots give help.
- **B. Painting as playfield.** A full-screen painted scene, with the book's graphic language kept to the HUD. Death Valley's cockpit (24) is the model. More game, less book.
- **C. Screen and painting together.** Either the cover's juxtaposition, with the machine's own output in a CRT inset beside the painted world, or page 8's inversion, with a painted console whose monitor shows the world. The first puts the two lanes side by side. The second makes the console part of the art.
- **D. The book as shell.** The landing page becomes the book: cover, contents, and a spread per game. Machine symbols select the lane; ★ is the BBC, so it marks the retro lane. The sidebar boxes become variants:
  - "How to make the game harder" as difficulty settings;
  - "Puzzle corner" as challenges;
  - "Adding to the program" as extensions.
- **E. The cast.** Original tutor robots serve as the in-game guide and help, voicing the field notes, led by a mascot in the role of the Puzzle-corner robot. The story's characters act as narrators, such as Captain Flash sitting beside you in Touchdown. The jobs and institutions could run as a thread across the anthology, towards promotion to Space Admiral.

**How to paint: airbrush as code.** A shared painter module in `src/core/` would provide the techniques listed above: masked gradients, highlights, livery, panel detail, starbursts, starfields, spheres and rings, and spatter.

- It is original by construction, light, animatable and resolution-independent.
- It needs no asset licences, and it gives one vocabulary across thirteen games.
- Its ceiling is creatures and faces. Galacticon's reptile and the Bug Eyes worms are the hardest subjects for procedural art. For those, the alternatives are hand-drawn SVG or commissioned art.
- Generated imagery raises licence questions and risks imitating the hand of named living artists. Aim for the period idiom, not any one painter.

**Risks.**

- **Pastiche instead of homage.** Work in the idiom, never from a page.
- **Legibility.** Paint must not bury the game state. The book solved this with flat panels over the art, and that is the answer on screen too.
- **Cost per frame.** Layered gradients are expensive. Paint static layers once to an offscreen canvas.
- **Scope.** There are thirteen worlds. A shared painter and print system keep each game's cost down to its composition.

**Proposed path.**

1. The art study: this document.
2. A vision decision with Barry, recorded in its own document.
3. Style frames. A standalone local page of static frames tests the technique before any game changes: one hull with livery, one planet, a starburst, a starfield, one panel with bracket rules, and a type specimen. They are judged on one question: does it feel like the book?
4. A pilot: one game end to end, plus the landing page.
5. Rollout, in book order.
