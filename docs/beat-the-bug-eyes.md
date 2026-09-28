# Beat The Bug Eyes

## BASIC Origins
`basic/bbc/usborne-computer-space-games/04.bas` sets the trap: you are hemmed in on a rocky world, catching glimpses of "the steely cold light of a space bug's eyes" before each one slithers back behind a rock. You have a proton blaster and there are ten bugs. The playable listing, `04BE.bas`, clears the screen, waits out an empty `FOR` loop, rolls `R` between 1 and 4, and prints `OO` at one of four fixed screen positions. You press the matching number key. A hit clears the screen, prints `*` in the same spot, and pauses. Ten bugs later it prints `YOU BLASTED n/10 BUGS`.

The four positions come from the `GOSUB`s at lines 240 to 340, as newlines down and a `TAB` across:

| Key | Row | Column |
| --- | --- | --- |
| 1 | 5 | 1 |
| 2 | 1 | 9 |
| 3 | 5 | 18 |
| 4 | 10 | 7 |

Three rules in the listing are easy to miss and both lanes keep them. Only the first keypress counts, because `R$<>""` leaves the polling loop at once. Any non-matching key misses, because `VAL("0"+R$)<>R` covers letters and the empty timeout string alike. A key struck while the bug is still hidden sits in the BBC keyboard buffer and is returned by the first `INKEY$` of the window, so mashing early spends your shot on a bug you have not seen yet.

### Timing, and what we had to interpret
`INKEY$(1)` waits one centisecond and the listing polls it 150 times, so the reaction window is 1.5 seconds. That needs no interpretation. The other two delays are empty `FOR` loops whose wall-clock length depended on the interpreter, and the book targeted everything from a ZX81 to a BBC. Every retro lane reads them through one shared constant in `src/core/bbcTiming.ts`, at BBC speed, because our canon is a BBC disk. Timed in jsbeeb, the disk's loops run at 0.646 ms an iteration, about fifteen hundred a second. That puts the lurk delay at 0.13 to 0.32 seconds and the hit flash at 0.19, which is brisk: on a real BBC this game ran almost without pause.

The first version of this lane read one iteration as 1/250 s, Sinclair speed, giving a 0.8 to 2.0 second lurk. That reading was dropped when Asteroid Belt arrived, because applied to its 1500-iteration pause it would stop the game for six seconds between asteroids that the intro says come "thick and fast".

## Retro BASIC Lane
The retro lane needs to print at a row and column rather than scroll a prompt, so it uses a new shared service, `RetroScreen` in `src/core/`, which is a plain character grid at the BBC MODE 7 width. `RetroTerminal` is untouched and still serves the three prompt-driven games.

The lane reproduces the `BUG EYES` header, the blank screen between bugs, `OO` at the position from the table above, the `*` on a hit, the one-shot rule, the buffer quirk, and the `YOU BLASTED n/10 BUGS` line. Two deviations: the score line is printed on a cleared screen rather than wherever the cursor happened to stop, and `R` or `Enter` restarts, matching the other retro lanes.

## Reimagined Lane
- **Fantasy** - You stand in the open with your blaster while four rock outcrops ring you, one per key.
- **Core Puzzle** - Ten bugs, one of four rocks each time, one shot, and the same miss conditions. Hesitation, the wrong key, and an early trigger all cost you the bug.
- **Encirclement** - This is the expansion, and it comes straight from the intro's "slowly the bugs edge towards you, hemming you in". Every bug you fail to blast creeps its outcrop closer, shown by pips under the key badge and by the rock physically advancing. Three misses at the same outcrop and that bug reaches you: the run ends as a loss, whatever the score. A hit pushes that outcrop back one step, so a rock you keep fumbling can be recovered.
- **Ramp** - The window starts at the original 1.5 seconds and tightens to 0.9 by the tenth bug. A ring around the player drains to show what is left.
- **Debrief** - Escaping prints the original `YOU BLASTED n/10 BUGS` verbatim; being caught prints `THE BUGS HAVE YOU`. Fastest and average reaction times are reported in milliseconds. Score is 100 per bug, up to 120 more per bug for speed, and 500 for escaping.
- **Audio** - Reuses the Starship cues: plasma shot for a blast, vent hiss for a miss, success sting for escape, impact for capture. There is deliberately no cue when the eyes appear, because a sound would let a player react without watching the rocks.

## Playtest Notes
Verified by script on 21 September 2026, on Chromium and WebKit:
- Retro: eyes land at row 10 column 7 for key 4, matching the listing; the correct key scores and flashes `*`; a wrong key scores nothing and moves on; a key struck during the delay is spent the instant the window opens; a full run prints `YOU BLASTED 9/10 BUGS` after one deliberate miss.
- Reimagined: a run that blasts nine of ten escapes with the original headline; firing at nothing during the lurk is recorded as `jumpy` and advances that outcrop; never firing at all gets you caught on the seventh bug with one outcrop at the threshold.

None of that is evidence about how it feels to play. Open questions for a human: whether 1.5 down to 0.9 seconds is the right ramp, whether three misses at one rock is too forgiving or too harsh, and whether the retro lane at BBC speed feels frantic in a good way or simply abrupt.
