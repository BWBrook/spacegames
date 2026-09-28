# Touchdown

## BASIC Origins
`basic/bbc/usborne-computer-space-games/13.bas` puts you in a two-man landing craft with ace space pilot Captain Flash beside you, on the final part of your Advanced Spacecraft Handling Test (Part III). Your velocity must be almost zero as you touch down; too much thrust and you go back up, too little and you make a new crater.

`13T.bas` is unlike every other listing in the book. It is written for the BBC Micro specifically: it switches to MODE 5, a four-colour graphics mode, draws a jagged strip of lunar surface and a lander outline with `MOVE`, `DRAW` and `PLOT`, shows fuel, velocity, height and thrust as filled bars that change colour as they run low, and reads the keyboard directly with negative `INKEY`. It runs flat out, redrawing the craft every pass, until you land or climb back above your starting height.

## The instructions are backwards
The intro says "presing Ato increase it and D to decrease it". The listing tests:

```basic
540 IF INKEY(-51) THEN T=T+4
550 IF INKEY(-66) THEN T=T-4
```

A negative `INKEY` scans one key by its internal number, and in the BBC's key table −51 is D and −66 is A. So D raises the thrust and A lowers it, the reverse of the instructions. A player who follows the intro presses A for more thrust, gets less, and makes a new crater; eases off with D, gets more, and is lost in space.

The book's printed BBC version tests `INKEY(-194)` and `INKEY(-179)`, which are A's and D's codes less 128. On OS 1.20 those numbers scan the keyboard from that key upward instead of testing the key, so on a real BBC the printed game raises the thrust on D and has nothing to lower it. The disk's keys look like a repair of that, paired the opposite way to the intro. See `docs/05-book-vs-disk.md`.

## What the physics allows
Each pass, a held key moves the thrust by 4, gravity adds 0.41 to 0.80 to the velocity, thrust removes a twentieth of itself, and the fuel falls by a tenth of the thrust. Two rules shape everything:

- **Thrust can never exceed the fuel left.** Line 560 caps it, so the fuel never quite runs out. Ramping flat out from zero, thrust peaks at 58 after about fourteen passes and then decays by a tenth each pass. Full thrust is unreachable, and the whole tank can remove exactly 50 units of velocity.
- **The lever is slow and the fall is quick.** Unpowered, the craft hits the ground in 22 to 37 passes, about two to four seconds at the BBC's pace of ten a second, doing 21 to 32. Reaching peak thrust takes fourteen passes.

So the skill is timing, not effort. An instinctive pilot who fights the fall from the top spends the tank before the bottom: a pilot that brakes whenever the projected landing is too fast, which is always true at the start, lands only a quarter of the time. Letting the craft fall first and then committing to the burn lands every one of the 400 possible starting conditions. A slow start is harder than a fast one, because a longer descent gives gravity more time against a fixed budget.

## Quirks
- **`*FX12,1` and the per-pass flush do nothing useful.** Line 30 sets the fastest possible keyboard auto-repeat and line 530 empties the keyboard buffer every pass, but negative `INKEY` reads the key directly and never looks at the buffer. The only effect is on what might spill into BASIC after the program ends.
- **The craft flickers.** Each pass draws the lander in white and later erases it in black before moving it. The retro lane draws it steadily instead, the one deliberate deviation.
- **Getting lost is easy.** You start at the ceiling, so any upward drift near the top loses you. Holding the thrust key from the start does it within a few seconds.
- **The disk's intro has typos:** "presing Ato" and "allthe", which MODE 7 wraps as "a" / "llthe time". The book's printed intro has neither.

## Retro BASIC Lane
It opens with the intro page from `13.bas`, wrapped at 40 columns as MODE 7 wraps it, because that page is the only place the controls are explained. The game then runs on a small MODE 5 emulation in `mode5.ts`: a 160 by 256 four-colour pixel buffer addressed in BASIC's 1280 by 1024 logical coordinates, with its own line drawing and filled bars, scaled up with hard edges, and text on the 20-column grid. It reproduces the jagged ground, the labels and gravity reading, the four bars and their colour warnings, the lander outline, D for more thrust and A for less, the fuel ceiling, both endings, and the "LANDED / AT VEL / SAFELY" or "ALL DEAD" panel. A pass takes a tenth of a second, from a statement count at the shared BBC speed.

Verified by script: the intro, then the game on Space; ten passes a second; five passes of D raising thrust to 20 and three of A lowering it to 8; free fall hitting the ground in 34 passes; a planned landing flown pass by pass with the listing's own keys printing `SAFELY`; and holding D from the start printing `LOST IN SPACE!!`.

## Reimagined Lane
- **Captain Flash's test.** Three landings under different gravity and entry speed, rolled as the listing rolls them, with a pass only if all three are safe.
- **The listing's physics, exactly.** The same pass, the same lever speed, the same fuel ceiling, the same safety threshold, run at the BBC's pace and drawn smoothly between passes.
- **The controls the intro meant.** A for more thrust, D for less, alongside the arrows and W and S.
- **The ceiling, drawn.** The thrust gauge carries a marker at the fuel level, so the limit the listing never explains closes in visibly as the tank drains.
- **An examiner who talks.** Captain Flash comments as you fly. His first rule is the lesson the listing leaves you to discover: let her fall a little, because thrust spent near the top is thrust you will not have near the bottom. He also warns when you are climbing, too fast near the ground, or short of fuel.
- **Grades.** Feather-light under 1, smooth under 2, safe under 4, and the examiner's report at the end.

There is no touchdown forecast, unlike Moonlander's reimagined lane. That game is about planning a budget; this one is about feel.

## Playtest Notes
Verified by script on 26 September 2026: the retro checks above, and in the reimagined lane a fixed three-landing test flown pass by pass with the arrow keys: two planned landings safe, a deliberate free fall crashed, and the examiner failing the candidate on two of three.

Open questions for a human. Whether ten passes a second is humanly flyable in the retro lane, where the descent lasts a few seconds. Whether Captain Flash's remarks help or nag. And whether the retro lane should say that its controls are reversed, or leave the discovery as it was in 1982.
