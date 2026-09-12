# Evil Alien

## BASIC Origins
`basic/bbc/usborne-computer-space-games/03.bas` sets the scene: Elron, the Evil Alien, lurks cloaked somewhere in a three-dimensional grid beneath your ship. You have deactivated all but his short-range weapons, and you carry four space bombs. The playable listing, `03EA.bas`, rolls a hidden `X`, `Y`, `D` (each 0 to 9), then loops four times asking for `X POSITION`, `Y POSITION`, and `DISTANCE`. An exact three-way match prints `*BOOM* YOU GOT HIM!`. A miss prints `SHOT WAS ` followed by `NORTH` or `SOUTH` (shot Y above or below Elron's Y), then `EAST` or `WEST` (shot X above or below Elron's X), concatenated with no separator, and on the next line `TOO FAR` or `NOT FAR ENOUGH` for distance. Four misses end with `YOUR TIME HAS RUN OUT!!`.

The listing is a pure deduction puzzle. Each shot gives three-way feedback on each axis independently, so ternary search pins any axis in at most three probes and lands the fourth bomb. A perfect player always wins; the budget is tight but never unfair. Two quirks are preserved: a shot that matches `X` and `Y` but not `D` prints a bare `SHOT WAS `, and the original does no range checking on the typed numbers.

## Retro BASIC Lane
The retro lane recreates the prompt loop in the shared `RetroTerminal`: the `EVIL ALIEN` header, the three prompts per bomb, echoed input, the compass and range lines, and the original win and loss copy. Digit input is limited to 0 to 9 with two characters, which keeps typed values in the original grid without changing the feedback rules. The terminal shows 24 lines so a full four-bomb round scrolls like a MODE 7 screen. `R` or `Enter` restarts after a round ends.

Shared rules (`state.ts`) hold the grid size, bomb count, hit test, compass word, and range word, so both lanes are judged by identical logic.

## Reimagined Lane
- **Fantasy** - You are the tactical officer at a scanner console. Elron's cloaked ship is somewhere in a 10 by 10 by 10 sector below you, and he is creeping closer while you search.
- **Core Puzzle** - Four bombs, an exact three-coordinate hit, and the same compass-plus-range feedback, judged by the shared rules in `state.ts`. The hidden solution and the budget are unchanged.
- **Direct Control** - A targeting cursor on a top-down 10 by 10 grid (X increases eastward, Y increases northward, so row 9 is at the top) and a distance gauge (D, 0 near the ship at the top to 9 at the bottom). Arrow keys move the cursor, `W`/`S` change distance, `Enter` or `Space` drops a bomb. The bomb visibly descends the gauge to the chosen distance and detonates.
- **Scanner Deduction Aid** - Always on. After each miss the console translates the compass and range words into shaded-out rows, columns, and distance bands, and the log footer states the remaining possible span on each axis. The player still reasons; the display keeps the bookkeeping.
- **Creeping Elron** - The proximity gauge fills over 90 seconds with no bombs dropped, and each drop multiplies the rate by a further 0.45, so the fourth bomb is under real pressure. From 35% a red vignette pulses faster and Elron's silhouette rises from the corner. At 100% he captures you, which is a loss. He never moves and the feedback never changes.
- **Debrief and Score** - `*BOOM* YOU GOT HIM!` on a hit, `YOUR TIME HAS RUN OUT!!` after four misses, `ELRON HAS YOU` on capture. Score is 1000 plus 500 per bomb remaining plus up to 1000 for low proximity; losses score zero. The debrief reveals Elron's cell on both the grid and the gauge.
- **Audio** - Reuses the Starship cues: ignition burst for detonation, success sting for the hit, failure hit for either loss, and the warning ping at 50%, 75%, and 90% proximity.

## Playtest Notes
- Retro lane: a miss prints compass then range on separate lines, a correct X and Y with a wrong D prints a bare `SHOT WAS `, and the fourth miss ends the round. Verified by script on 12 September 2026.
- Reimagined lane: `pnpm playtest --game evil-alien` drops a deliberate miss, checks the scanner shading, loads the debug solution, and expects the `destroyed` outcome. The capture loss path and the keyboard cursor were exercised by a separate script. Neither is evidence of human enjoyment or of whether the 90-second base timer feels right.
- Open balance question: whether the proximity ramp should also pause during the drop animation. It currently does, which keeps the animation free.
