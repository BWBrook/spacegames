# Field Notes

A running ledger of what each original listing turns out to be once you read it closely: the structure hiding under the BASIC, the quirks worth knowing, and what the two lanes do about them. Written to be read, and to be quarried later for in-game help text.

The per-game design documents cover implementation. This file is for the findings.

**Book or disk.** These notes read the BBC disk, which the retro lanes follow. The disk was typed in from the printed book, and the two differ in eight of the thirteen games. Some quirks are the book's own, some were introduced or repaired in the typing, and each entry below says which. `docs/05-book-vs-disk.md` has the line-by-line comparison.

---

## 1. Starship Take-Off

**What it really is.** A binary search, dressed as physics. The BBC listing rolls `G` from 0 to 19 and `W` from 0 to 39, sets the answer to `G*W`, then prints only `G`. The weight is never shown and never mentioned, so there is no sum to do. The intro is honest about this where the title is not: "You must **guess** the force required for a successful take off."

**The tuning is exact.** The answer lies between 0 and 741, and the listing gives ten tries. Ten halvings distinguish 1024 possibilities. The budget is precisely enough for a disciplined binary search and not one guess more, which is very unlikely to be an accident.

**Quirks.**
- When gravity rolls 0 the answer is 0 whatever the weight, so `GRAVITY= 0` is a free win on the first guess. It happens one run in twenty. The free win is the book's own: its main listing, for the ZX81, rolls 1 to 20 and 1 to 40, and the lines it prints for every other machine drop the `+1`.
- Multiples of the displayed gravity are the only possible answers, which cuts the real search space by a factor of `G` for a player who notices. At `GRAVITY= 19` there are only 40 candidates, and six guesses suffice.
- On the tenth and final guess the listing still prints `TOO HIGH` or `TOO LOW`, just without the `, TRY AGAIN`, so the game tells you which way you were wrong as it kills you.

---

## 2. Intergalactic Games

**What it really is.** A two-axis binary search under a tight budget. A target height from 1 to 100 is shown, and the hidden answers are `angle = ATN(H/3)` in degrees and `speed = 3000 * SQR(H + 1/H)`. Neither formula appears anywhere in the book text, so the player is searching, not calculating.

**The tuning is tight but fair.** Each attempt returns an independent verdict on both axes, so eight attempts buy eight bits on each. The angle spans about 70 degrees with a tolerance of 2, needing roughly five bits. The speed spans about 4,200 to 30,000 with a tolerance of 100, needing about seven. Eight attempts is just enough to binary search both at once, and is hopeless for anyone adjusting one variable at a time.

**Quirks.**
- The listing writes `3.14159` where it means pi. The resulting angle is off by about one part in a million, which is far inside the 2-degree tolerance and so has no effect on play. It is a period detail rather than a bug.
- The credit bonus is the book's optional "Adding to the program" extension, which the disk includes. It is `INT(1000/G)` where `G` is the loop counter, so it is genuinely 1000 divided by the attempt number, and winning on the first attempt pays ten times what winning on the tenth would.
- The book's listing does not run as printed. Line 80's prompt has no closing quote, so BBC BASIC stops there with `Missing "`. Line 120 sends a winner to line 200, which is `STOP`, though the margin note beside it says 210. The disk corrects both.

---

## 3. Evil Alien

**What it really is.** A three-dimensional ternary search with a budget that exactly fits. Elron hides at a random point in a 10 by 10 by 10 grid and you have four bombs. Each miss reports north or south, east or west, and too far or not far enough, independently. Three probes halve each axis down to a single value and the fourth bomb lands. A player who searches properly cannot lose.

**Quirks.**
- The compass words are concatenated with no separator, so a miss that is both north and east prints `NORTHEAST` as one word. This is printing, not a compass bearing.
- A shot with the right X and Y but the wrong distance prints a bare `SHOT WAS ` with nothing after it, because neither compass test fires. It looks like a bug and is in fact the most informative message in the game.
- The listing does no range checking on the typed numbers.

**What the lanes do.** The retro lane reproduces all of it including the bare `SHOT WAS `. The reimagined lane keeps the identical rules and adds a scanner that shades out the ruled-out rows, columns and depth bands, so the player still reasons but the display does the bookkeeping. Elron creeping closer on a timer is an addition, taken from the intro's own threat, and gives a stake to dithering that the original lacks.

---

## 4. Beat The Bug Eyes

**What it really is.** A reaction test with four positions and a one-shot rule. Ten bugs appear in turn at one of four fixed screen spots and you press the matching number key.

**Three rules are easy to miss, and all three matter.**
- Only the first keypress counts. The polling loop exits the moment any key is struck.
- Any non-matching key misses exactly as a timeout does, because the test is `VAL("0"+R$)<>R`, which treats a letter and an empty string alike.
- A key struck while the bug is still hidden sits in the machine's keyboard buffer and is returned by the first poll of the window. Mashing early spends your shot on a bug you have not seen.

**Timing, and what had to be interpreted.** The reaction window is exact: `INKEY$(1)` waits one centisecond and is polled 150 times, so 1.5 seconds. The delay before the bug appears and the pause after a hit are empty `FOR` loops whose real duration depended on the machine, and the book targeted everything from a ZX81 upward. Every retro lane now reads such loops at BBC speed, timed in jsbeeb at 0.646 ms an iteration, since our canon is a BBC disk. That puts the delay at 0.13 to 0.32 seconds and the flash at 0.19. An earlier reading of 1/250 of a second, Sinclair speed, was abandoned once Asteroid Belt showed it would impose six-second pauses on a game the intro calls thick and fast. A later estimate of a thousand a second, used until the measurement, made every pause half as long again.

**What the lanes do.** The retro lane needed to print at a row and column rather than scroll a prompt, which is why `RetroScreen` exists alongside `RetroTerminal`. The reimagined lane keeps all three rules and dramatises the intro's line about the bugs hemming you in: every missed bug creeps its outcrop closer and three misses at one rock ends the run.

---

## 5. Moonlander

**What it really is.** A fuel budget that is secretly a time budget. Gravity adds 5 to your speed every turn and every unit of burn removes one, so the fuel spent over a flight of `T` turns is `50 + 5T` less whatever speed you still carry at touchdown. The tank holds 120. **You have about fourteen turns of flight, however you choose to spend them.** Hovering to think is the most expensive thing in the game. Neither the book nor the listing says this anywhere; it falls out of the arithmetic.

A minimum-time descent, falling freely then braking hard and late, is on the ground in about nine turns with a quarter of the tank unspent. A search over integer burn sequences confirms the game is winnable with real margin: `3 1 0 0 0 10 21 21 21 22 6` touches down at 0.5 and leaves 15 fuel. It arrives exactly on the surface, so the book and the disk score it the same.

**The disk rewrote the landing test.** The book's line 170 lands the craft when the turn's fall reaches the height remaining, `>=`, and estimates the touchdown speed forward from the start of that turn. The disk tests `=`, and adds line 205 to catch a fall through the surface after the height and velocity have been updated. So except on an exact arrival, it estimates backward from a point below the ground. Both versions land on the same turn, but they score it differently. Of the 873,435 landing moves reachable with whole-number burns, 2,089 are good landings on the disk and 31 in the book.

**Quirks.**
- The good-landing test is `IF V1<=1`, with no lower bound, so a touchdown speed of −8.5 is congratulated. On the disk almost every good landing is like this: 2,074 of the 2,089 report a negative speed. A final burn that leaves the craft rising by the end of the turn makes the backward estimate run the wrong way, although the craft struck the ground on its way down. Solving the final turn exactly, 1,918 of the disk's good landings hit the ground faster than 5. In the book a congratulated ascent needs the craft already rising as its final turn begins, which is true of 16 of its 31.
- On the disk an exact arrival is the one landing that still uses the height and velocity from *before* the turn. Falling freely for six turns and then burning 30 twice arrives exactly on the surface and is scored as a crash at 35.7, when the lander was doing 55 at a height of 42.5 a moment earlier. In the book every landing is scored that way, so there it is the ordinary rule. Both versions score this flight 35.7.
- Line 220 divides by the velocity it is handed, and a final burn can leave that at exactly zero. On the disk, `0 0 0 0 0 6 30 29 27 8` ends the final turn below the surface at rest and stops the program with `Division by zero at line 220`. That happens on 730 of the landing moves on the disk, and on 32 in the book, where a craft hovering just above the surface at the start of its final turn does the same.

**What the lanes do.** The retro lane reproduces the disk's quirks, the division by zero included. An earlier guard hid it behind a `GOOD LANDING.`. The lane was differentially tested against a direct transcription of the listing over four thousand random burn sequences, matching turn for turn. The reimagined lane flies the same constants continuously and cannot reproduce the ascending-landing quirk, because in continuous flight you do not reach the ground while moving away from it. Its throttle gauge marks the hover point at 5, which is the intro's own sentence about a burn of 5 holding your speed, drawn rather than stated.

---

## 6. Monsters of Galacticon

**What it really is.** A rotation, hidden behind two lines of arithmetic. `ASC(R$)-81` turns the weapon letter into 1, 2 or 3; the monster's slot is added; and the result is folded back into 1 to 3, where 2 kills, 3 does nothing and anything else costs a crew member.

**The consequence the book never states.** Because the fold is a rotation, the outcomes always sit in the same cyclic order. For any monster the weapon after the killing one does nothing, and the one after that gets someone eaten, cycling R to S to T. **One observation therefore fixes the whole row.** Over 40,000 simulated runs, guessing at random survives 70 per cent of the time, remembering what you already tried survives 92 per cent, and using the rotation survives every time without exception. It provably cannot fail, since at most four probes are needed and each costs at most one of five.

**Quirks.**
- The fold at line 240 depends on what a true comparison is worth, and the book handles both conventions. The main listing subtracts, which is right for the ZX81, the Spectrum and the Apple, where true is +1. The line it prints for the BBC, TRS-80, VIC and PET adds, because true is −1 there. The disk carries the BBC version. Run the wrong version for the machine, and two of the four monsters become unkillable by any weapon.
- Slots 1 and 4 resolve identically, so two of the four names always share an answer. There are four monsters but three puzzles.
- The shuffle is four swaps of a randomly chosen pair, and the pair can be the same slot twice. The names come out in their original order 6.8 per cent of the time against 4.2 per cent for a fair shuffle.
- Any input that is not R, S or T falls through to the eaten branch, and an empty line does too. On real hardware this almost never bit anyone, because the BBC Micro powered up with CAPS LOCK on.

**What the lanes do.** The retro lane reproduces all of it, uppercasing input as a real BBC keyboard would. The reimagined lane keeps the rules exactly and adds a field journal that records observations without applying the rotation, because working that out is the game. The debrief reveals what each monster needed, which is the intended route to the discovery.

---

## 7. Alien Snipers

**What it really is.** A Caesar-shift drill against a clock. You get a letter and a number, count that many letters on, and type the one you land on, ten times.

**One quietly good piece of design.** The letter is drawn from A to `CHR$(90-D)` and the shift from 1 to `D`, so the answer can never run past Z and the listing needs no wraparound. The cost is that the late alphabet disappears as difficulty rises: A to Y at the easiest setting, only A to P at the hardest.

**Difficulty buys time as well as spending it.** The window is `200 + D*50` centiseconds, so 2.5 seconds at 1 and 7 at 10. Since the expected shift is `(D+1)/2`, the time per letter you actually have to count falls from 2.5 seconds to about 1.27 across the whole range. The setting is far gentler than the number implies.

**Its real flaw.** The listing scores in total silence. A hit increments a variable, the screen clears, and the next target appears with no pause and no message. You fire ten times into the dark and find out at the end. Of the seven originals read so far this is the one clear design failure rather than a quirk, and it is the whole reason the reimagined lane exists.

**Quirks.**
- One shot per sniper, taken by any key, so a stray press spends it. A key struck during the previous round is buffered and consumed the moment the next target appears, exactly as in Beat The Bug Eyes.
- A rejected difficulty jumps back to the `INPUT` rather than the prompt, producing a bare `?` with no explanation.
- A wrong letter and a timeout score identically, so there is never a reason to hold fire.

**What the lanes do.** The retro lane reproduces the silence, which is the point of having a faithful lane at all. The reimagined lane reports every shot, draws the shift twice over as an arc on the scope and a path along an alphabet strip, and breaks final accuracy down by code number so a player can see exactly where their counting fails.

---

## 8. Asteroid Belt

**What it really is.** A counting reflex. Up to nine stars appear and you press the number, within 1.2 seconds on the disk. The book's BBC line allows 1.0.

**The layout is the design.** The listing starts a fresh line and tabs back to the same column before the first, fourth and seventh star, so every asteroid is printed in left-aligned rows of three. People take in about four items at a glance and have to count beyond that, but two full rows and two more reads as eight instantly. The grouping is what makes nine countable in the time.

**The crash is unreachable by crashing.** On a BBC, `INKEY(120)` returns −1 when no key arrives, so `INKEY(120)-48` is −49, not 0, and line 200's test for "no key pressed" never fires. Sitting still as an asteroid arrives prints `NOT STRONG ENOUGH`. The only route to `CRASHED INTO ASTEROID` is pressing the `0` key. Line 200 was plainly written for a read that returns 0 on no key, as `VAL(INKEY$)` does. The BBC conversion's numeric `INKEY` agrees with it on every digit and differs only in exactly the case line 200 exists to catch. The conversion is the book's own: it prints `Q=INKEY(100)-48` as the BBC's line 190 and leaves line 200 unchanged, and the disk inherited the bug.

**Quirks.**
- Any key is a shot, valued as its character code minus 48. Letters always read `TOO STRONG` and a space reads `NOT STRONG ENOUGH`.
- The disk flushes the keyboard between rounds, with a `*FX15` at line 305 that the book does not have. It is the only listing on the disk that does. Beat The Bug Eyes and Alien Snipers let an early press carry into the next target; this one does not.
- The title is printed and cleared in the same instant, and so is never seen.

**What the lanes do.** The retro lane keeps the bug, since the disk and the book's own BBC version both have it. The reimagined lane implements the evident intent, so letting an asteroid reach you is a crash, draws the rocks in the same rows of three, and reports undercounts and overcounts separately so a player can see which way they err.

---

## 9. Trip Into The Future

**What it really is.** The only game in the book built on real physics, and the physics has a problem. You are told how many years must pass on Earth, and you choose a speed and a distance.

**Right formula, wrong clock.** The listing prints distance over speed as the years you spent aboard, and multiplies by the dilation factor to get the years that passed on Earth. Those two figures are correctly related to each other. But distance over speed is Earth's time, not the ship's, unless the distance is measured from the ship and so already contracted. The intro gives the distance in plain light years, which are normally measured from Earth.

**So correct physics loses.** To have 100 years pass on Earth at 0.9c you need to cover 90 light years, and in reality you would age 43.6 years and arrive on time. The listing tells you that you took 100 years, arrived 229 years in the future, and died on the way. It wants 39.2 light years, which in reality would get you home after 43.6 Earth years. Over 44,000 random cases the listing accepts a physically correct answer only 26.6 per cent of the time, all at low speeds where dilation barely matters.

**Quirks.**
- On the disk the prompt offers speeds from 0 to 1 and accepts both ends, and both stop the program: `Division by zero at line 120` for 0 and `at line 130` for 1. A blank line counts as 0, because BBC `INPUT` reads it that way. The book's line 90 rejects both ends, `V>=1 OR V<=0`, so the printed game asks again. The disk's version dropped both `=` signs.
- Thirty of the hundred possible targets need no relativity at all; slow travel under 50 years aboard reaches anything up to 54.
- On the disk a miss of exactly 5 years gets no verdict, since one line tests for under 5 and the next for over. The book's line 180 tests `<=5`, so there a five-year miss is on time.
- One attempt per run, and finding the right dilation factor without a calculator is guesswork.

**What the lanes do.** The retro lane keeps the wrong clock, which is the book's, and the disk's two crashes and silent gap, printing nine significant figures as a BBC would. The reimagined lane uses correct physics, shows the dilation factor and its curve, caps each mission's engine speed so that choosing a speed is a real decision, and runs the voyage with the two clocks side by side.

---

## 10. Death Valley

**What it really is.** A random walk you have to cancel out by hand. Each row the ravine drifts one column left, right or not at all, and you steer against it.

**You only see where you have been.** Every row prints at the bottom and the screen scrolls up, so the ship is always on the newest line. There is no view ahead, and you steer in reaction to a drift that has already happened.

**The interpreter sets the pace.** The listing never pauses; a row takes as long as BBC BASIC takes to run it. Timed in jsbeeb, the work is about 35 ms plus 1.26 ms per space printed. `INKEY$(1)` then waits for the next tick of the centisecond clock, which rounds each row up to whole centiseconds: 70 ms at width 15 and 60 at width 8, about fourteen and seventeen rows a second. A narrower valley prints fewer spaces, so it scrolls faster as well as leaving less room.

**On a BBC the intro's advice is optimistic.** Simulating players who react a fixed number of rows late, a quarter-second reaction at nine or ten rows a second is two to three rows. At that lag width 15 is always survivable, 10 and 12 manageable, and 8 almost never, which is exactly "try 15 first and then work your way down - 8 is quite difficult". But the BBC ran fourteen rows a second, which makes the same reaction three to four rows. That falls between the simulation's columns for two and four rows late. At four rows late, width 15 clears one run in seven, and 12 and below almost never. The advice was written for six machines, and the BBC's BASIC was the fastest of them. An earlier estimate of nine rows a second matched the advice so well that it was taken as confirmed, until jsbeeb measured the real machine.

**Quirks.**
- The BBC's auto-repeat, as best established, waits half a second and then fires about twelve times a second, close to the scroll rate. Holding a key queues little: after three seconds, one press is left in the buffer at width 15 and three at width 31, where rows are slowest, so the ship moves on a row or so after you let go.
- From width 18 up, a row can overflow the 40-column screen when the valley wanders right, and wrapped lines scramble the display.
- A width of 0, 1 or a blank line crashes on the first row; width 2 leaves a single safe column.
- The valley never narrows. The width you type is the whole difficulty.

**What the lanes do.** The retro lane emulates the measured per-row timing with its rounding to the centisecond clock, the keyboard buffer, the auto-repeat and the wrap. The reimagined lane generates the ravine with the listing's own random walk but gives the Speed Dart headlights that light six rows ahead, the one change of kind, trading pure reaction for short-range anticipation.

---

## 11. Space Mines

**What it really is.** A small economy in the tradition of Hamurabi: sell ore and mines, buy food and mines, and keep satisfaction and the ratio of people to mines in range for ten years.

**A missed Shift key.** The disk's line 500 reads `RND81)` where the book prints `RND(1)`. On a BBC Micro keyboard the opening bracket is Shift and 8, so this is what comes out when the typist misses the Shift. BBC BASIC turns `RND` into a keyword only when no letter or digit follows, so the disk stores `RND81` as a variable name that was never set. The program only evaluates a statement when it runs it, and this one only runs once satisfaction passes 1.1. So the game plays normally until you do well, then stops with `No such variable at line 500`.

**On the disk, being a good leader is fatal.** One generous year leaves satisfaction at exactly 1.1; the second takes it past, and the program halts. Because line 500 is the only way production rises, and population growth sits behind the same test, neither can ever increase on the disk, and the market glut can never occur. Over 40,000 simulated runs a generous strategy halts at line 500 two times in three. On the book's rules, with line 500 as printed, it survives 64 per cent of the time and ends with 94 people against 58 for a cautious leader.

**What the numbers reward.**
- $80 a head is the real floor, not the "APPR. $100" the prompt suggests: feeding at $80 and holding ore in poor years survives 79 per cent of runs, feeding at $100 only 66.
- Satisfaction never decays. Under the book's rules two generous years buy growth for the rest of the term.
- Ore never spoils, so selling in good years and holding in bad is the real skill.

**Quirks.**
- One start in three already has fewer than ten people a mine and loses at the end of the first year unless the player sells mines, with no warning.
- Selling every mine is allowed and then divides by zero at line 520.
- Production can fall below zero, after which the ore prompt rejects every answer for ever.
- The leak and glut messages are cleared before they can be read.
- A food price is rolled on line 40 and never used; the disk misspells `THERE ARE` as `THERRE ARE`, which the book does not; and on a BBC the year prints as `YEAR1`, with no space before the number.

**What the lanes do.** The retro lane keeps every one of these, crashes included. The reimagined lane uses the book's rules, so the colony can grow, and shows each rule's effect as the orders are set.

---

## 12. Space Rescue

**What it really is.** One budget spent against several risks. The same tank of energy must buy speed against a deadline, absorb random damage to two systems, and cover a landing whose demands you learn only roughly and only on arrival.

**The numbers behind it.**
- The time limit is `D/SQR(E/5)`, rounded, so about a fifth of the tank in the engines just makes it.
- Velocity is `INT(SQR(P))`, so engine energy pays off only in perfect squares; 120 units buy the same speed as 100.
- A safe landing needs up to 140 in boosters and 140 in heat shields, because you are told only whether gravity and atmosphere are low, medium or high and must cover the top of the band.

**How hard it is.** Over 60,000 simulated missions, an even split never succeeds at all. Engines just past the limit as a perfect square, about 270 kept for landing and the rest split between the damage buffers, succeeds 52 per cent of the time, and most of the remainder is decided before the player types anything. Missions that start with 667 to 800 units of energy succeed 78 per cent of the time with that plan; those that start with 401 to 533, 20 per cent.

**The door.** Line 810 demands more than 25 units left after landing. Nothing mentions it until then. A player who lands perfectly is told `YOU LANDED SUCCESSFULLY - WELL DONE` and then that there is not enough energy to open the door.

**Quirks.**
- No engine energy divides by zero at line 240; negative engine energy fails at line 230 with `-ve root`.
- Engine trouble can wear the velocity to exactly zero, and line 460 divides by it before line 510 can report failed engines, so that message appears only when the velocity has gone negative, after the listing has announced a negative arrival time.
- `ARRIVED IN n DAYS` prints even when you are dead, and failures stack: blown up, dead and late together.
- Negative allocations are accepted; only the total is checked.
- Shields survive at zero, life support does not.

**What the lanes do.** The retro lane keeps every trap and the door. The reimagined lane keeps the rules, closes the crashes, and shows the odds of each risk while you plan and the coverage of each band while you land, with the door stated in advance.

---

## 13. Touchdown

**What it really is.** The one listing written for the BBC Micro itself rather than for six machines at once: MODE 5 graphics, a lander drawn in outline, four instrument bars, and the keyboard read directly, running as fast as the interpreter allows.

**The instructions are backwards.** The intro says A increases the thrust and D decreases it. The listing raises it on `INKEY(-51)` and lowers it on `INKEY(-66)`, and in the BBC's key table −51 is D and −66 is A. A player who trusts the intro cuts the thrust when they mean to add it and crashes, or adds it when they mean to ease off and is lost in space.

**The book's keys never worked either.** The printed BBC version tests `INKEY(-194)` and `INKEY(-179)`, A's and D's codes less 128, so on paper it pairs the keys as the intro does. But OS 1.20 treats a number below −128 as a keyboard scan from that key upward, not a test of the key itself. On a real BBC the printed game raises the thrust on D, holds it on A or with no key held, and has nothing to lower it. The disk keeps D for more thrust and gives A's code the job of less, which looks like someone repairing exactly that and pairing the keys the opposite way to the intro.

**Thrust is capped by the fuel left.** So the fuel never quite runs out, full thrust is unreachable, and ramping flat out from zero peaks at 58 before decaying by a tenth each pass. The whole tank removes exactly 50 units of velocity.

**The lesson is timing.** Unpowered, the craft reaches the ground in 22 to 37 passes; the lever takes fourteen to reach peak thrust. Timed in jsbeeb, a BBC takes about a quarter of a second a pass, most of it filling the four bars, so the real fall lasts 5.5 to 9.5 seconds and the lever three and a half. The reimagined lane runs the same passes at a tenth of a second. A pilot who fights the fall from the top lands a quarter of the time. One who lets it drop and then commits lands every one of the 400 possible starting conditions. Slow starts are the hard ones, because a longer descent gives gravity more time against a fixed budget.

**Quirks.** `*FX12,1` sets the fastest possible auto-repeat and every pass flushes the keyboard buffer, neither of which touches a key read directly. The craft flickers because it is erased and redrawn every pass. The disk's intro program misspells "pressing" and runs "all the" together; the book's printed intro has neither slip.

**What the lanes do.** The retro lane shows the intro, then runs the listing on a small MODE 5 emulation with its reversed keys intact. The reimagined lane makes it Captain Flash's three-landing test, with the intro's intended keys, the fuel ceiling drawn on the thrust gauge, and the examiner telling you, among other things, not to spend your thrust at the top.

---

## Patterns across the anthology

**The budget is always exactly enough.** Ten guesses for a 742-wide binary search, eight attempts for two axes needing five and seven bits, four bombs for three ternary searches, fourteen turns of fuel for a nine-turn descent, a tank in Touchdown that removes exactly 50 units of velocity. Whoever tuned these listings tuned them carefully, and the margin is consistently thin enough to punish sloppiness and wide enough to reward method.

**Most of them are search or budgeting problems in costume.** Starship, Intergalactic Games and Evil Alien are searches under a guess limit; Moonlander, Space Rescue and Touchdown are budgets spent against gravity, time or risk; Galacticon is a search for a hidden table. The presentation varies wildly and the underlying activity much less.

**Several hide a structure that collapses the problem.** Moonlander's fuel is secretly a clock. Galacticon's weapon table is secretly a rotation, so one observation fixes a whole row. Space Mines' satisfaction never wears off, so two generous years buy growth for good. Space Rescue's engine energy only counts in perfect squares. Touchdown rewards waiting before the burn. Nothing in the book mentions any of these; each turns the stated game into a much easier one for a player who sees it.

**The intros know things the listings do not say, and sometimes contradict them.** Starship's intro admits you are guessing and Moonlander's states the hover rule the arithmetic only implies. Evil Alien's and Beat The Bug Eyes' describe closing threats the listings never implement, which is where both reimagined lanes found their expansion. Touchdown's controls match its intro in neither the book nor the disk.

**Some rules are kept secret until they have cost you.** Space Rescue's door, Space Mines' overworked starts, Touchdown's reversed keys: each catches a player who did everything the game asked, with nothing on screen to warn them. Disclosing hidden rules is the most common single change the reimagined lanes make.

**One teaches the wrong physics, and one is simply broken.** Trip Into The Future, the book's only game about real science, assigns distance over speed to the traveller's clock instead of Earth's, so a player who understands relativity loses to it. Alien Snipers never tells you whether you hit, which is the difference between a game and a test.

**Our canon is a disk typed in from a book, and both show.**
- The book's own BBC conversions broke things. Asteroid Belt's crash detection was written for a key read that returns 0 when nothing is pressed, and the book's BBC line swaps in one that returns −49. Touchdown's printed key codes do not read A and D on a real BBC. Intergalactic Games does not run as printed at all.
- The typist added errors of their own: Space Mines' `RND81)` is `RND(1)` with the Shift missed, and Trip Into The Future's speed test lost two `=` signs.
- The disk also repaired and retuned, sometimes wrongly. It fixed Intergalactic Games, gave Touchdown keys that work but the wrong way round, rewrote Moonlander's landing test, and lengthened pauses in three games.
- Galacticon, which looks like a dialect trap, is not one: the book printed line 240 for both conventions of truth.

Writing one listing for six dialects, on machines with a few kilobytes of memory and no way to test on all of them, some of this was inevitable.

**The machine is part of the game.** Listings that wait on the keyboard or never pause inherit their feel from the BBC: Death Valley's scroll rate and Touchdown's pace are the interpreter's speed, Death Valley's steering is shaped by the keyboard's auto-repeat, and Beat The Bug Eyes and Alien Snipers are shaped by its keyboard buffer. Reproducing them faithfully meant emulating the machine as well as the program, which is why the retro lanes share a timing module, a number formatter, a character grid and, for Touchdown, a sliver of MODE 5.

**Division by zero is the commonest crash.** It occurs in several places:

- Trip Into The Future, at both ends of its speed range on the disk.
- Space Mines, on selling every mine.
- Space Rescue, twice over.
- Moonlander, where a final burn can bring the craft to rest as it lands.

Each is a line that divides by a quantity the player controls and nothing checks.
