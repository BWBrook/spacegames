# Alien Snipers

## BASIC Origins
`basic/bbc/usborne-computer-space-games/07.bas` strands an interstellar cruiser in a forbidden area with a damaged hyperspace motor, under attack from sniper ships that jam the radar into giving false readings. Your computer knows the code: the machine prints a letter and a number, and you must count that many letters on through the alphabet and type the one you land on. The intro gives worked examples, "for M 4, you must type Q, and for C 2, you must type E", and both check out against the listing.

`07AS.bas` asks for a difficulty from 1 to 10, then runs ten targets. Each rolls a letter and a shift, prints them, and waits. Any key commits, and a hit is scored only on an exact match. After ten it prints `YOU HIT n/10`.

## What the listing does well, and what it does not
**The letter range is chosen so the answer can never run past Z.** Line 90 draws the letter from A to `CHR$(90-D)` and the shift from 1 to `D`, so the maximum possible answer is exactly Z and no wraparound logic is needed. It is a tidy piece of design. The side effect is that the late alphabet stops appearing as difficulty rises: at 1 the letters run A to Y, at 10 only A to P.

**Harder settings give you more time, not less.** The window is `200 + D*50` centiseconds, so 2.5 seconds at difficulty 1 and 7 at difficulty 10. Since the expected shift is `(D+1)/2`, the time available per letter you have to count falls from 2.5 seconds at the easiest setting to about 1.27 at the hardest, converging rather than collapsing. The curve is gentler than the difficulty number suggests.

**It never tells you whether you hit.** Line 190 increments the score in complete silence and line 110 clears the screen for the next target. There is no pause, no message, and no indication of the right answer. You fire ten times into the dark and learn the total at the end. This is the single largest gap between the listing and a game you would want to practise at, and it is what the reimagined lane exists to fix.

## Quirks
- **One shot per sniper, and any key takes it.** The polling loop exits on `I$<>""`, so a stray keypress spends the shot. A key struck during the previous round sits in the keyboard buffer and is consumed the instant the next target appears, which is the same trap Beat The Bug Eyes sets.
- **A rejected difficulty is not re-prompted.** Line 60 jumps back to the `INPUT` at line 50 rather than the `PRINT` at 40, so an out-of-range answer produces a bare `?` with no explanation.
- **Case matters, in principle.** The comparison is against an uppercase letter, and the BBC Micro powered up with CAPS LOCK on, so in practice it never bit anyone.
- **There is no penalty for a wrong answer beyond missing.** A wrong letter and a timeout score identically, so there is never a reason to hold fire. The game is purely speed against accuracy.

## Retro BASIC Lane
A prompt loop for the difficulty and then a bare two-line display per target, so it uses `RetroTerminal` with its own single-key handler for the timed rounds. It reproduces the opening screen, the bare `?` on a rejected difficulty, the cleared screen showing only the letter and the code number in two print zones, the one-shot rule, the silence, the timeout, and the `YOU HIT n/10` tally.

Verified by script: the letter ranges match the listing at every difficulty and the answer never passes Z over two million rolls; an out-of-range difficulty produces `?` with no reprompt; and across a run of alternating hits, wrong letters and timeouts the screen shows exactly one line throughout and the final tally is correct.

## Reimagined Lane
- **Fantasy** - A radar scope on the bridge, with the jammed contact showing at a false bearing.
- **Core Puzzle** - Identical. The same letter range, the same shift, the same window formula, the same one shot per target, and the same ten targets.
- **Difficulty chosen up front** - As in the original, but shown with what it means: which letters can appear and how long each shot gives you.
- **Feedback, which is the point** - Every shot now reports. A hit fires a beam and the sniper goes; a miss names the letter you fired at and the letter it should have been. This is the one thing the listing withholds and the one thing a player needs.
- **The shift drawn twice** - The scope draws an arc from the false bearing to the true one with one tick per letter counted, and an alphabet strip below highlights the path from the false letter to the answer. Both appear only after the shot, so they teach without solving anything in the moment.
- **Stats worth reading** - The report breaks accuracy down by code number, so a player can see that they are fine to plus four and fall apart at plus eight. That turns a drill into something you can improve at deliberately.

No loss condition was added. The original scores out of ten with no way to fail, and two of the earlier reimagined lanes already lean on a closing-threat device that should not become a house style. What this game needed was feedback, not jeopardy.

## Playtest Notes
Verified by script on 22 September 2026:
- Retro: opening screen, the bare `?` quirk, per-target display, silent scoring across hit, wrong and timeout, and a correct final tally.
- Reimagined: a run at difficulty 6 with one deliberate miss produced 9 hits and a best streak of 9, and the runner now fails if either figure moves.

Open questions for a human. Whether the 1.5 second report between targets breaks the rhythm of what should feel like a drill. Whether the scope adds anything over the plain letter and number, given the bearings are deliberately unlabelled. And whether the difficulty numbers should be relabelled, since the listing's 1 to 10 conflates shift size with time allowed.
