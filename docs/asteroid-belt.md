# Asteroid Belt

## BASIC Origins
`basic/bbc/usborne-computer-space-games/08.bas` sends you through the Asteroid Belt, where the force needed to destroy each asteroid depends on its size. Asteroids appear as groups of stars and you press the number key matching how many there are. "Be prepared - asteroids come at you thick and fast."

`08AB.bas` runs ten asteroids. Each is 1 to 9 stars printed at a random row and column, and the machine then waits `INKEY(120)`, 1.2 seconds, for a single key. The right number destroys it; too low is `NOT STRONG ENOUGH`, too high is `TOO STRONG`. After ten it prints `YOU HIT n OUT OF 10`.

## The rows of three are the design
Lines 110 to 160 start a new line and `TAB` back to the same column before the first, fourth and seventh star, so the asteroid is always printed in rows of three, left-aligned: five stars are `***` over `**`, nine are a three-by-three block. That grouping is what makes nine countable in 1.2 seconds. People take in up to about four items at a glance and have to count beyond that, but "two full rows and two more" is instant. Take the grouping away and the time limit becomes unfair; keep it and it is tight but reasonable.

## The crash message is unreachable by crashing
This is a porting bug, and the clearest one in the anthology so far.

```basic
190 Q=INKEY(120)-48
200 IF Q<>0 THEN GOTO 240
220 PRINT "CRASHED INTO ASTEROID"
```

On a BBC, `INKEY(120)` returns the code of the key pressed, or −1 if nothing is pressed in time. A digit key therefore gives `Q` from 1 to 9. A timeout gives `−1 − 48 = −49`, which is not 0, so line 200 jumps to the strength comparison, finds −49 smaller than any asteroid, and prints `NOT STRONG ENOUGH`. The only way to reach `CRASHED INTO ASTEROID` is to press the `0` key, which gives exactly 0.

So sitting still while an asteroid bears down on you is described as having hit it too gently, and the crash is reserved for a key that makes no sense to press, since no asteroid has zero stars.

The structure of line 200 makes the intent plain. It is written for a key read that returns 0 when nothing was pressed, as `VAL(INKEY$)` does on most BASICs of the period, because `VAL("")` is 0. The BBC conversion replaced it with the numeric `INKEY(120)-48`, which agrees with `VAL` for every digit and differs only when no key arrives, which is exactly the case line 200 was there to catch. The conversion is the book's own. Its BBC substitutions delete the ZX81's polling loop and print `190 Q=INKEY(100)-48` beside an unchanged line 200. The disk inherited the bug and lengthened the wait to `INKEY(120)`. See `docs/05-book-vs-disk.md`.

## Other quirks
- **Any key is a shot.** The value is simply the key's character code minus 48, so letters come out between 17 and 42 and always read `TOO STRONG`, and a space comes out at −16 and reads `NOT STRONG ENOUGH`.
- **This listing flushes the keyboard; the others do not.** Line 305 issues `*FX15` after each pause, discarding anything typed meanwhile. The line is the disk's own; the book has no flush. Beat The Bug Eyes and Alien Snipers both lack it, so an early press in either is spent on the next target. Here it costs nothing.
- **The title is never seen.** Line 10 prints `ASTEROID BELT` and line 40 clears the screen a moment later.

## Retro BASIC Lane
It prints positionally, so it uses `RetroScreen`. It reproduces the rows of three at the rolled column and row, the 1.2 second `INKEY` window, every branch of lines 200 to 280 including the porting bug, the `*FX15` flush, the 1.5 second pause read at BBC speed, and the final score printed on the line after the last verdict, where the cursor would have been.

Verified by script: the stars land in rows of three at the rolled column starting one line below the rolled row; the exact count destroys and scores; one too few, one too many, `0` and a timeout print `NOT STRONG ENOUGH`, `TOO STRONG`, `CRASHED INTO ASTEROID` and `NOT STRONG ENOUGH` respectively; a key struck during the pause does not carry into the next window; and the score line appears beneath the last verdict.

## Reimagined Lane
- **Fantasy** - Flying through the belt, with rubble streaming past and each cluster closing on the ship.
- **Core Puzzle** - Identical: ten asteroids of 1 to 9 rocks, one shot each, 1.2 seconds, directional feedback.
- **The intended crash** - Letting an asteroid reach you is now `CRASHED INTO ASTEROID`, as the listing meant. The retro lane keeps the bug.
- **Rows of three, as rubble** - The rocks keep the original grouping with a little jitter, and are drawn at full size from the first frame so the counting time is not eaten by an approach animation.
- **The three misses look different** - Too weak bounces off, too strong shatters the rock into fragments that still hit you, and a crash is a crash. Each shakes the ship and dents the hull.
- **The report says which way you err** - Undercounts, overcounts and crashes are totalled separately, and accuracy is broken down by cluster size, so a player can see that they are fine to six and start guessing at eight.

No loss condition was added. The listing scores out of ten and so does this lane.

## Playtest Notes
Verified by script on 23 September 2026:
- Retro: every branch of the verdict logic, the flush, and the ending, as above.
- Reimagined: a run with one deliberate miscount and one deliberate timeout scored 8 with exactly one crash and one miscount, and the runner fails if any of those three figures moves.

Open questions for a human. Whether 1.2 seconds is fair for eight and nine. Whether the approach animation, even at full size from the start, makes counting harder than the static stars did. Whether the retro lane should keep the porting bug is settled: it is in the book's own BBC version as well as on the disk, so keeping it is faithful to both.
