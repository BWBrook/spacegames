# Trip Into The Future

## BASIC Origins
`basic/bbc/usborne-computer-space-games/09.bas` explains time dilation to a child: in a ship travelling nearly as fast as light, time passes more slowly aboard than outside, so a long fast trip returns you to Earth further in the future than the ship's clocks say. The computer names how many years must pass on Earth; you choose the speed, as a fraction of light, and the length of the trip, in light years. "Take care not to travel too slowly or you will die of old age on the way."

`09TITF.bas` rolls a target of 25 to 124 years and asks once for each input. It prints `YOU TOOK T1 YEARS` and `AND ARRIVED T2 YEARS IN THE FUTURE`, then says you died if `T1` is over 50, arrived on time if `T2` is within 5 of the target, and were not even close otherwise. There is one attempt per run.

## The physics is assigned to the wrong clock
The listing computes:

```basic
120 LET T1=D/V
130 LET T2=T1/SQR(1-V*V)
```

The two printed times are correctly related: Earth time is the time aboard multiplied by the dilation factor, `1/SQR(1-V*V)`. The error is in which clock `D/V` belongs to. Distance divided by speed is the time that passes **on Earth**, where the distance is measured. The time aboard is that figure divided by the dilation factor. The listing has it the other way round, which is correct only if the distance you type is the one measured from the moving ship, already contracted by the same factor. The intro says light years without qualification, and light years to a destination are normally measured from Earth.

The consequence is that **correct physics loses**. A player who wants 100 years to pass on Earth at 0.9c reasons, rightly, that they need to cover 90 light years, which in reality takes 100 Earth years and ages them 43.6. The listing prints `YOU TOOK 100 YEARS`, `AND ARRIVED 229.415734 YEARS IN THE FUTURE`, and `YOU DIED ON THE WAY`. To satisfy it they must type 39.2 light years, a trip that in reality would bring them home after 43.6 Earth years, nowhere near the target.

Over 44,000 random targets and speeds, answers that are correct in reality are accepted by the listing 26.6 per cent of the time, all of them at speeds low enough that dilation hardly matters.

## Quirks
- **On the disk, both ends of the offered range crash.** The prompt says `SPEED OF SHIP (0-1)` and the disk's line 90 accepts both endpoints. The book's line 90 rejects them with `V>=1 OR V<=0`; the disk dropped both `=` signs. A speed of 0 stops the program with `Division by zero at line 120`; a speed of 1 with `Division by zero at line 130`. So does a blank line, which BBC `INPUT` reads as 0.
- **Thirty of the hundred targets need no relativity at all.** Any target up to 54 can be reached by travelling slowly and spending under 50 years aboard. Only above that does the game ask for anything relativistic.
- **On the disk, exactly 5 years out gets no verdict.** Lines 180 and 190 test for less than 5 and more than 5, so a miss of exactly 5 prints nothing. The book's line 180 tests `<=5`. In binary floating point the arithmetic almost never lands exactly, so it is latent rather than reachable.
- **One attempt.** The listing ends after a single trip. Without a calculator, finding a speed whose dilation factor is right is guesswork.

## Retro BASIC Lane
A prompt loop, so it uses `RetroTerminal`. It reproduces the prompts, the reprinted speed prompt on an out-of-range value, the listing's arithmetic including the wrong clock, all three verdicts and the silent gap between them, both division-by-zero stops with their line numbers, and BBC `INPUT`'s reading of a blank line as 0. Numbers print through a new shared `formatBbcNumber`, which gives the nine significant figures a BBC would, so the output reads `YOU TOOK 11.9907253 YEARS` rather than a rounded figure.

Verified by script: the opening screen; `1.5` reprinting the prompt; the physicist's answer dying; the listing's contracted answer at 0.99c arriving on time; and speeds of 0, 1 and blank each stopping with the right line number.

## Reimagined Lane
- **Correct physics.** Earth time is distance over speed and the time aboard is that divided by the dilation factor. Entering the same numbers in the two lanes gives different results, deliberately.
- **Five missions a run**, targets rolled exactly as the listing rolls them, sorted so the run escalates from trips that need no relativity to trips that need a great deal.
- **Engines with a rating.** Each mission caps the top speed: generously when no dilation is needed, and only a few per cent above the survival floor when it is. Without a cap the answer to every mission is to fly as close to light as the dial allows, and there would be no decision to make.
- **Dilation made visible.** While planning, the lane shows the factor at the chosen speed, "1 year aboard = 2.29 years on Earth", and plots it against speed, with the engine's limit marked. It does not show the resulting times. Working out distance over speed, and whether you survive, is left to the player.
- **The voyage, two clocks.** The ship flies out and back while the time aboard and the time on Earth run side by side at their different rates, with the traveller's age. If the time aboard reaches 50 the clock stops, the ship goes dark mid-voyage, and the arrival line explains how much dilation was needed.
- **The listing's verdicts, verbatim.** `YOU ARRIVED ON TIME`, `NOT EVEN CLOSE` and `YOU DIED ON THE WAY`.

## Playtest Notes
Verified by script on 23 September 2026:
- Retro: the cases above.
- Reimagined: a fixed set of five missions with four flown correctly at the engine limit and the fifth flown deliberately at 0.5c. The first four arrived on time; the fifth hit Earth's calendar at exactly 124 years and killed the traveller on the way, since at 0.5c a year aboard is only 1.15 on Earth and surviving needed 2.48. The runner fails if any of that changes.

Open questions for a human. Whether distance over speed is too easy to calculate once the dilation factor is on screen, or too hard to do quickly. Whether the engine rating reads as a fair constraint or an arbitrary one. And whether the curve, which makes the steep rise near light speed obvious, gives too much away.
