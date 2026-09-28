# Book Versus Disk

The retro lanes follow the BBC Micro disk. This document compares each disk listing with the BBC listing printed in the 1982 book, line by line, classifies every material difference, and says which retro-lane behaviours and field-note claims each one affects. Whether the retro lanes should follow the book or the disk is Barry's decision; the last section recommends one and lists the lanes each option would change.

**Sources.** The book is Usborne's free PDF, kept as a private, untracked scan in `reference/book/`; nothing from it is committed. Page numbers are PDF pages, and the printed page number is one less. The disk listings are the detokenised files in `basic/bbc/usborne-computer-space-games/`, checked against the tokenised bytes in the `.ssd` image where it mattered what the BBC actually stored. Code excerpts are single lines, retyped.

**In brief.**

- Eight listings behave differently from the book, two differ only in wording, and three are identical apart from `STOP` becoming `END`, which the book allows.
- Where the book is wrong, the disk mostly fixes it: two misprints that break Intergalactic Games, a missing separator in Space Mines and a missing space in Galacticon.
- The disk adds errors of its own with real consequences: Space Mines' `RND81)` and, probably, Trip Into The Future's speed test.
- The disk's deliberate changes are a rewritten landing test in Moonlander, longer pauses in three games, a slower reaction window and a keyboard flush in Asteroid Belt, and Touchdown's keys.
- Touchdown's printed key codes do not read A and D on a real BBC. On OS 1.20 with BASIC II the book's listing lets D raise the thrust and gives nothing to lower it, and the disk's reversed keys look like a repair of exactly that.
- Asteroid Belt's unreachable crash is in the book's own BBC line, not a disk error.
- Checking the disk's own behaviour turned up two retro lanes that are not faithful to the disk: Space Mines stops with the wrong error, and Moonlander hides a division by zero.

---

## How the comparison was made

For each game the printed BBC listing was reconstructed from the main listing, which is the ZX81's, by applying every line marked ★ (BBC and Electron) from the substitutions printed beneath it. A ★ line number with nothing after it deletes that line. Touchdown prints a complete BBC version, which fills PDF page 35; page 36 is the Apple version. Each listing was transcribed from the scan under magnification and compared with the disk file mechanically, ignoring spaces outside strings. The disk files are tokenised, so keyword abbreviations cannot differ.

`STOP` against `END` is noted once here rather than in every game. A speech bubble on Starship's page (6) tells owners of anything but a ZX81 or Spectrum that `END` may replace `STOP`, and the disk does so throughout. On a BBC the only visible difference is that `STOP` prints `STOP at line n`.

Behaviour was checked three ways:

- The arithmetic consequences of each difference were simulated.
- What BBC BASIC II and OS 1.20 do with the book's unusual lines was read from TobyLobster's annotated reassembly of OS 1.20 (tobylobster.github.io/mos) and the annotated BASIC II disassembly at acornaeology.uk.
- Each such reading was confirmed in jsbeeb (bbc.xania.org), which runs the genuine OS 1.20 and BASIC II ROMs, with test lines typed through the ROM's own tokeniser.

No physical BBC Micro was used, so claims about the machine are emulator-confirmed, not hardware-confirmed. The comparison is with this scan only; if the disk was typed from a different printing, some differences could come from there, which is unverified.

Each difference is classed as one of:

- **Transcription error**: the disk's typist got the book's line wrong.
- **Deliberate change**: the disk's author changed the line on purpose, to suit the BBC or to repair something.
- **Book error**: the book's line is wrong. The disk corrects most of these.

## Summary

| Game | Differences | Kind | Play affected |
| --- | --- | --- | --- |
| Starship Take-Off | none | | no |
| Intergalactic Games | 80 closing quote; 120 jump target; bonus lines 222–227; opening `CLS` | book errors corrected; the book's optional addition; deliberate | the book's listing fails as printed; the disk plays as the book meant |
| Evil Alien | 80 prompt reads `INPUT X POSITION` | transcription error (probable) | wording |
| Beat The Bug Eyes | none | | no |
| Moonlander | 170 `=` for `>=`, new line 205; spaces in 70–80 | deliberate | yes: landing verdicts, division by zero |
| Monsters of Galacticon | 380 pause of 1200 for 300; space in 340 | deliberate; book error corrected | pacing |
| Alien Snipers | none | | no |
| Asteroid Belt | 190 `INKEY(120)` for `INKEY(100)`; 290 pause of 1500 for 500; new `*FX15` | deliberate | pacing and buffered keys |
| Trip Into The Future | 90 accepts 0 and 1; 180 `<5` for `<=5`; spacing | transcription errors (probable) | yes: two crashes and a silent verdict |
| Death Valley | opening `CLS`; placeholder at 145 | deliberate | no |
| Space Mines | 500 `RND81)`; 140 `THERRE`; 150 separator | transcription errors; book error corrected | yes: the colony can never grow |
| Space Rescue | 430 pause of 2000 for 1000 | deliberate | pacing |
| Touchdown | 540–550 key codes; new line 695 | book error, repaired deliberately; deliberate | yes: the controls |

Pauses are given below as loop counts and as seconds at the speed jsbeeb measures for BBC BASIC II, about 0.65 ms per empty `FOR` iteration. `src/core/bbcTiming.ts` assumes 1 ms, so the retro lanes' pauses run about half as long again as these figures; see the side findings.

---

## Touchdown: the keys

The book raises the thrust on `INKEY(-194)` and lowers it on `INKEY(-179)`. The disk uses `INKEY(-51)` and `INKEY(-66)`:

```basic
540 IF INKEY(-194) THEN T=T+4 : IF T>100 THEN T=100
540 IF INKEY(-51) THEN T=T+4:IF T>100 THEN T=100
```

The first line is the book's (page 35), the second the disk's. In the BBC's documented key table −51 is D and −66 is A, so the disk raises the thrust on D, the reverse of the intro. The book's numbers are A's and D's codes less 128, so on paper the book pairs the keys as its intro does: A to increase, D to decrease.

**What the book's numbers do on OS 1.20.** The documented range for reading one key is −1 to −128. BASIC II passes the argument's low and high bytes straight to OSBYTE &81. OS 1.20 flips the low byte with `EOR #&7F` and passes it to the keyboard routine. When the result has its top bit set, that routine tests the one key it names. Otherwise it scans for the first pressed key numbered at or above the result, and returns &FF if there is none. OSBYTE &81 then reports TRUE if bit 7 of the answer is set.

- For −66 the flipped byte is &C1, a test of key &41, which is A.
- For −194 it is &41 with the top bit clear. The call becomes a scan from A's key number upward, and bit 7 is set only when the scan finds nothing.

So `INKEY(-194)` is TRUE exactly when no key from A's number upward is held. `INKEY(-179)` scans from D's number and is TRUE when no key from D's number upward is held. jsbeeb agrees. With no key held both return TRUE; holding A makes both FALSE; holding D makes `INKEY(-194)` TRUE and `INKEY(-179)` FALSE. Holding X behaved like A and holding R like D, as the scan predicts.

**The printed game on a real BBC.** Lines 540 and 550 then act as follows each pass:

- **No key held:** both fire, adding 4 and taking it away, so the thrust holds. Above 96 it is trimmed to 96.
- **D held:** only line 540 fires, so the thrust rises by 4. R, 6, U, O, P, `[`, cursor up and CAPS LOCK do the same.
- **A held:** neither fires, so the thrust holds. So does any key numbered from A's upward, SPACE and RETURN included.

Nothing lowers the thrust except the fuel ceiling at line 560. The game is still winnable. Simulating all 400 starting conditions, one well-timed burst of D and then letting go lands every one, because the ceiling trims the thrust as the tank drains. But a pilot who overdoes it can never take thrust off again, and the intro is wrong about both keys: A does nothing and D increases the thrust.

**The disk's keys look like a repair.** Typed in from the book, the listing makes D raise the thrust and gives nothing to lower it. The disk keeps D raising it, now with D's documented code, and gives A's documented code the job of lowering it. That is what someone would do who found that D worked for more thrust, nothing worked for less, and fixed the missing half. The motive is conjecture; the behaviour of both versions is confirmed.

**Line 695.** `PRINT:*FX15,0` is the disk's own. It flushes whatever held keys would otherwise leave for BASIC after the program ends.

**Classification.** The printed codes are a book error: they lie outside the documented range and do not read A and D. The disk's codes are a deliberate repair that keeps the working key and pairs the keys the opposite way to the intro. Line 695 is a deliberate addition.

**What it affects.**

- **Retro lane:** follows the disk, correctly.
- **Field note, "The instructions are backwards":** true of the disk. The book's listing was meant to match its intro, but on a real BBC it does not work as intended either, and D raises the thrust in both versions.
- **Field note on the intro's typos:** "presing" and "allthe" are in the disk's intro program, `13.bas`. The book's printed intro has neither.
- **Revisit log:** its open question, whether `INKEY(-194)` reads A on a real BBC, is settled. It does not.

Unverified: behaviour on OS 0.1 and 1.00, the Electron and the Master. Only OS 1.20 with BASIC II was checked.

## Moonlander: the landing test

The book's line 170 (page 13) is `IF (V1+V)/2>=H THEN GOTO 220`. The disk's is `IF (V1+V)/2=H THEN GOTO 220`, and the disk adds `205 IF H<0 THEN GOTO 220` after the height, time and velocity have been updated.

Both versions land on the same turn. They differ in what line 220, `V1=V+(5-B)*H/V`, is given when the fall overshoots the surface:

- **Book:** the height and velocity at the start of the final turn, which makes line 220 a forward estimate of the touchdown speed.
- **Disk:** the height, now negative, and velocity at the end of the turn, a backward estimate. Only an exact arrival still gets the start-of-turn values.

**How much it changes.** Every state reachable with whole-number burns was enumerated, giving 873,435 landing moves, a move being a state plus a final burn. The versions disagree on 2,965 of them. That is a small share, but most of it falls on the good landings:

- The disk calls 2,089 moves good landings and the book 31. Twenty-three are good in both, 18 of them exact arrivals.
- 2,074 of the disk's good landings report a negative touchdown speed. Nearly all come from a final burn that leaves the craft moving upward by the end of the turn. The backward estimate then runs the wrong way, although the craft struck the ground on its way down.
- Solving the final turn exactly, under the constant acceleration the listing's own fall formula assumes, 1,918 of the disk's good landings touch down faster than 5 and so were crashes. The book's forward estimate is the closer of the two: its median error is 0.06 against the disk's 0.09, and its 95th-percentile error 2.1 against 4.9.
- Burns `0 0 0 0 0 7 29 30 22 13`, for example: the disk prints `GOOD LANDING.` at −21, and the book prints `YOU CRASHED-ALL DEAD` at 6.4. The exact touchdown speed is 6.4.

**Division by zero is reachable in both.** Line 220 divides by whatever velocity it is given.

- **Disk:** burns `0 0 0 0 0 6 30 29 27 8` end the final turn below the surface at exactly zero velocity, and the program stops with `Division by zero at line 220`. jsbeeb, running the disk listing, does exactly that. The book scores the same flight 2.5, `OK-BUT SOME INJURIES`.
- **Book:** burns `0 0 0 0 0 6 29 30 30 0` start the final turn hovering a unit above the surface at zero velocity, so the book divides by zero, while the disk scores the flight 3.5.

In all, 730 landing moves divide by zero on the disk and 32 in the book.

**Lines 70 and 80.** The disk puts a space after `TIME`, `HEIGHT`, `VEL.` and `FUEL`. The book's lines print `TIME0` and `HEIGHT500` on a BBC.

**Classification.** Deliberate change: line 205 is an inserted line, not a slip. It may repair a `>=` typed as `=`, which on its own would let the craft fall through the surface, but that is conjecture.

**What it affects.**

- **Retro lane:** follows the disk's rule. It used to guard line 220 against a zero velocity and print `GOOD LANDING.` where the disk stops with the error; that is now fixed. See the side findings.
- **Field note on ascending landings:** a congratulated ascending landing is almost entirely a product of the disk's line 205. Under the book's rule it needs the craft to be rising already at the start of its final turn, which is true of 16 of the book's 31 good landings. The note's "just under a third" does not match an exhaustive count under any measure tried. Moves, positions ignoring fuel and distinct speeds all put the disk's share at about 99 per cent. The measure behind the note is not recorded.
- **Field note on the exact-arrival quirk:** in the book every landing uses the start-of-turn values, so the crash at 35.7 is the book's ordinary rule, not an exception. Both versions score that flight 35.7.
- **Field note, "It cannot happen on the path that reaches that line":** false for both versions.
- The winning sequence in the field notes, `3 1 0 0 0 10 21 21 21 22 6`, is an exact arrival and scores 0.5 in both. It leaves 15 fuel, not the note's 16.

## Space Mines: line 500

The book's substitutions (page 26) tell BBC owners to change `RND` to `RND(1)` on line 500 among others. The disk's line reads `CE=CE+INT(RND81)*20+1)`. The opening bracket is Shift and 8 on a BBC keyboard, and the Shift was missed. Transcription error.

**What the book's line does.** With `RND(1)`, satisfaction above 1.1 raises each mine's output by 1 to 20 tons, line 530 grows the population, and the market glut at line 590 becomes reachable. The "repaired rules" that the field notes simulate and the reimagined lane plays are simply the book's printed rules.

**What the disk says when it fails.** The error is not `Missing )`. BASIC II turns `RND` into a keyword only when the next character is not a letter or a digit, so when the line was typed, `RND81` became a variable name. The disk's tokenised bytes confirm it: line 500 holds the letters R, N, D, 8 and 1, where line 510 holds the `RND` token. A BBC therefore stops with `No such variable at line 500`, and jsbeeb does the same with the line typed in. The retro lane, `docs/space-mines.md` and the field notes all say `Missing ) at line 500`.

**Lines 140 and 150.**

- Line 140: the disk's `THERRE ARE` and missing full stop are transcription errors. The book has `THERE ARE` and ends the line with `COLONY.`.
- Line 150: the book prints `" MINES,AND $"M`, with no separator before `M`. A ZX81 would refuse that line, so it is a misprint. BASIC II accepts it and prints the money right-justified in a ten-character field, as `$      4200`. The disk's `" MINES, AND $";M` corrects it.

**What it affects.**

- **Retro lane:** keeps the disk's growth freeze and halt faithfully. It used to print the wrong error; that is now fixed.
- **Field notes:** "Being a good leader is fatal", production and population that can never rise, and the unreachable glut all come from the disk's typo, not from the book. `THERRE ARE` is the disk's alone.

## Trip Into The Future: the speed test

The book (pages 21–22) rejects both ends of the speed range; the disk accepts them.

- Line 90: the book has `IF V>=1 OR V<=0 THEN GOTO 70`, the disk `IF V>1 OR V<0 THEN GOTO 70`.
- Line 180: the book has `IF ABS(T-T2)<=5`, the disk `<5`.

**What it changes.** In the book, a speed of 0 or 1, or a blank line, which BBC `INPUT` reads as 0, simply asks again, so neither division by zero can happen. A miss of exactly five years counts as on time. On the disk, 0 stops the program at line 120 and 1 at line 130, and a miss of exactly five gets no verdict.

**Spacing.** The disk puts a space before `YEARS` in lines 140 and 150, so a BBC prints `55.5555556 YEARS` where the book gives `55.5555556YEARS`. It also drops the full stop from the book's `IN THE FUTURE.`.

**Classification.** Probably transcription errors. Three `=` signs are dropped from comparisons in one short listing, each drop makes the program worse, and the BBC gives no reason for any of them.

**What it affects.** The retro lane reproduces the disk correctly. The field note's quirks, both crashes and the silent five-year gap, describe the disk only.

## Asteroid Belt: the reaction window and the flush

The book's BBC lines (page 20) delete the ZX81's polling loop at 180 and 210, read `190 Q=INKEY(100)-48`, and pause at `290 FOR I=1 TO 500`. The disk differs in four ways:

- It waits `INKEY(120)`, 1.2 seconds against the book's 1.0. A sidebar in the book invites BBC owners to lower that number to speed the game up.
- It pauses for 1500 iterations, about 1.0 second, against the book's 500, about 0.33.
- It adds `305 *FX15`, which empties the keyboard buffer before each asteroid.
- It keeps `:` placeholders at 180 and 210 where the book deletes the lines, which changes nothing.

**What it changes.** Without the flush, a key pressed during the pause, or a second key pressed during the window, waits in the buffer and answers the next asteroid the moment it appears, as early presses do in Beat The Bug Eyes and Alien Snipers.

**The crash branch is the book's.** Line 200, `IF Q<>0 THEN GOTO 240`, is unchanged in the book's BBC version. A timeout therefore gives −49 and prints `NOT STRONG ENOUGH` in the book exactly as it does on the disk. The conversion bug the field notes describe was made by the book's own ★ line.

**Classification.** The timing and the flush are deliberate changes. The unreachable crash is a book error that the disk inherited.

**What it affects.**

- **Retro lane:** follows the disk, with the 1.2-second window, the long pause and the flush.
- **Field notes:** "within 1.2 seconds" and "the only listing so far that flushes the keyboard between rounds" describe the disk. "Very probably a porting bug, not the book's" should say that the port was the book's own BBC line. The open question in `docs/asteroid-belt.md`, whether to keep a bug "faithful to the disk but almost certainly not to the book", rests on the same misattribution: keeping it is faithful to both.

## Monsters of Galacticon and Space Rescue: longer pauses

- **Galacticon, line 380 (page 16).** The book's BBC pause is 300 iterations, about 0.2 seconds, and that is all the time there is to read the outcome before the screen clears. The book's own margin note says the loop is there so the message can be read. The disk's 1200, about 0.8 seconds, makes that possible. The disk also adds the space missing from the book's line 340, which would otherwise print `SULFACIDORAND IT`.
- **Space Rescue, line 430 (page 29).** The book's BBC pause between voyage reports is 1000 iterations, about 0.65 seconds; the disk's is 2000.

Both pauses are deliberate changes, and the space in line 340 corrects a book error. The retro lanes follow the disk.

## Intergalactic Games: two misprints and an addition

- **Line 120.** The book jumps to 200 on a win, and line 200 is `STOP`, so a winner would see nothing at all. The book's own margin note says the jump goes to 210, and the disk's line does. Book error, corrected.
- **Line 80.** The book prints the speed prompt with no closing quote (page 7), perhaps hidden by the bracket rule beside it. BASIC II stops such a line with `Missing "` when it runs, as jsbeeb shows, so the book's listing would fail at the first speed prompt. Book error, corrected.
- **Lines 222 to 227.** The credit bonus comes from the book's optional "Adding to the program" box on page 8, and the disk includes it. The field note on the bonus describes an optional addition, not the main listing.
- **Cosmetic.** The disk adds `1 CLS` and spaces out `NCTV WINS - THANKS TO YOU`.

## Evil Alien and Death Valley: wording only

- **Evil Alien, line 80.** The disk's prompt `INPUT X POSITION (0 TO 9)?` has a stray `INPUT`, probably the typist anticipating line 85. The book's prompt is `X POSITION (0 TO 9)?`, which matches the Y and distance prompts. The retro lane reproduces the disk.
- **Death Valley.** The disk adds `1 CLS` and keeps a `:` at 145, where the book deletes `SCROLL` for the BBC. The book also offers an optional delay loop at 141–142 for players who find the game too fast, which the disk leaves out.

The disk's `02IG` and `10DV` are also the only game files saved with a load address of &0E00 rather than &1900. That suggests these two were edited and saved separately, perhaps when their opening `CLS` lines went in.

## Starship Take-Off, Beat The Bug Eyes and Alien Snipers

Identical to the book's BBC listings apart from `STOP` and `END`.

---

## The book outside documented BBC BASIC

Three of the book's BBC lines go beyond documented BBC BASIC, two of them by misprint. On OS 1.20 with BASIC II:

- **`INKEY(-194)` and `INKEY(-179)`, Touchdown 540–550.** They run without error but do not read A and D. They report whether no key from A's or D's key number upward is held; see Touchdown above. Derived from the ROM sources and confirmed in jsbeeb, but not tested on hardware.
- **An unclosed string, Intergalactic 80.** It fails with `Missing "` when the line runs (jsbeeb).
- **A `PRINT` item with no separator, Space Mines 150.** It is accepted, and the number prints right-justified in a ten-character field (jsbeeb).

Everything else in the thirteen reconstructed listings is documented BBC BASIC. No ZX81-only construct survives unmarked: every `RND`, `INKEY$`, `CODE`, `SCROLL` and substring form has its ★ replacement. `STOP` remains, and BBC BASIC supports it.

## Field-note claims the book corrects where book and disk agree

- **Asteroid Belt.** The unreachable crash is in the book's own ★ line, as described above.
- **Monsters of Galacticon.** The note says the listing works only where true is −1, and that reading true as +1, as a Sinclair does, leaves two monsters unkillable. In fact the book prints its main line 240, `W=W-3*(W>3)-3*(W>6)`, for machines where true is +1, and a ★ version with plus signs for the BBC, TRS-80, VIC and PET. Its symbols also put the Apple with the ZX81 here, not with the BBC. The book handled both conventions.
- **Starship Take-Off.** The free win at `GRAVITY= 0` and the range of 0 to 741 come from the book's BBC lines, which drop the `+1` of the ZX81 lines. On a ZX81 gravity runs from 1 to 20.

## Side findings

These turned up while checking the disk's own behaviour. None is a difference from the book.

- **Space Mines stopped with the wrong error.** The disk stops with `No such variable at line 500`, not `Missing ) at line 500`, for the reason given under Space Mines. Fixed: the retro lane now prints the disk's error, and `docs/space-mines.md` and the field notes are corrected.
- **Moonlander can divide by zero on the disk.** Burns `0 0 0 0 0 6 30 29 27 8` stop the disk with `Division by zero at line 220`, confirmed in jsbeeb. The retro lane used to guard the division and print `GOOD LANDING.`. Fixed: it now stops with the disk's error, and the notes no longer say the case cannot arise.
- **Empty loops may run faster than the lanes assume.** In jsbeeb, BBC BASIC II runs an empty `FOR` loop at about 0.65 ms per iteration whether `FOR` and `NEXT` share a line or not: 1200 iterations took 78 centiseconds and 2000 took 130. `bbcTiming.ts` assumes 1 ms, so every retro lane's empty-loop pause runs about half as long again as on a BBC, and Death Valley's and Touchdown's flat-out pacing is built on the same constant. This is an emulator measurement. The constant was originally set by reasoning about play, so whether to change it is a separate decision. A fuller measurement since, including Death Valley's rows and Touchdown's passes, is in the revisit log.

---

## Recommendation

Keep the disk as the retro lanes' canon, as `docs/01-dual-lane-anthology.md` already requires, and record the book's versions in the documentation. The reasons:

- The disk is a single artefact that runs, byte for byte. The book's BBC listings are not: Intergalactic Games fails as printed, and Touchdown's controls behave on a real BBC in a way nobody intended. Following the book means choosing which misprints to correct and how, and the result is a version nobody ran.
- Most of the disk's deliberate changes are repairs or sensible tuning for the BBC's speed, so the disk is the better record of how these games were played on one.
- Where the book's intent matters most, the reimagined lanes already carry it: Space Mines' working line 500, Touchdown's intro keys and Asteroid Belt's crash.
- Switching would change ten lanes and void verified analyses in the field notes, Moonlander's especially.

Whichever option is chosen, fix the two lanes that are not faithful to the disk (see the side findings), and revise the field-note claims listed above so that each quirk is attributed correctly to the book or the disk.

**Outcome.** On 28 September 2026 Barry approved the follow-up on the basis of keeping the disk. Both lanes are fixed, and the field notes and design documents now attribute each quirk to the book or the disk. The loop-speed question is being measured in jsbeeb for his decision.

**Lanes each option would change.**

- **Disk, as now (recommended).** No lane changes from this comparison. The fidelity fixes, needed anyway, touch the Space Mines retro lane (its error text) and the Moonlander retro lane (the division by zero).
- **The book as printed, running on OS 1.20, correcting only the misprints that stop or derail a program** (Intergalactic 80 and 120). Ten lanes would change:
  - Moonlander: the forward landing estimate, different verdicts, the book's own division by zero, and status lines without spaces.
  - Space Mines: line 500 works, so production and population grow and the glut can occur; `THERE ARE`; the padded money line.
  - Trip Into The Future: 0 and 1 are rejected, a five-year miss counts as on time, and the spacing changes.
  - Touchdown: D raises the thrust, A or no key holds it, and nothing lowers it; no final flush.
  - Asteroid Belt: a 1.0-second window, a shorter pause and no flush.
  - Monsters of Galacticon: a 0.2-second outcome pause and the missing space.
  - Space Rescue: a shorter voyage pause.
  - Intergalactic Games, Evil Alien and Death Valley: wording or the opening `CLS` only.
  - Starship Take-Off, Beat The Bug Eyes and Alien Snipers would not change.
- **The disk, but with the book's lines where the disk mistyped.** Three lanes would change: Space Mines (line 500 and `THERE ARE`), Trip Into The Future (the speed test and the five-year verdict) and Evil Alien (its prompt). This hybrid matches no version anyone ran.
