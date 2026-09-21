# Monsters of Galacticon

## BASIC Origins
`basic/bbc/usborne-computer-space-games/06.bas` lands you on Galacticon, where "some of the nastiest monsters in the known Universe are to be found". As each one threatens you choose a ray gun, a trypton blaster or a sword laser. The playable listing, `06MOG.bas`, holds four monster names, shuffles them, and puts you through eight encounters with a group of five. A right weapon kills the monster. A wrong one either does nothing, with a 40 per cent chance of angering it into taking one of your group, or is useless and costs you a member outright. Lose all five and you are all dead.

## The hidden structure
The whole game is two lines:

```basic
230 LET W=ASC(R$)-81+R
240 LET W=W+3*(W>3)+3*(W>6)
```

`ASC(R$)-81` turns R, S and T into 1, 2 and 3. Adding the monster slot gives 2 to 7. BBC BASIC returns −1 for a true comparison, so line 240 subtracts 3 once above 3 and again above 6, folding the result back into 1 to 3. The outcome is read as 2 kills, 3 does nothing, and anything else eats a crew member.

That makes the answer a rotation, and it has a consequence the book never mentions. **For any monster, the weapon after the killing one does nothing, and the one after that gets somebody eaten, cycling R to S to T and round again.** A single observation therefore fixes the entire row. Learn that a sword laser does nothing to a Flamgondar and you know, without risking anyone, that a trypton blaster kills it and a ray gun will cost you a member.

Simulation puts the value of that at 40,000 runs each: guessing at random survives 70 per cent of the time, remembering which weapon you already tried survives 92 per cent, and using the rotation survives **every time**. It cannot fail, because at most four probes are needed and each can cost at most one of five.

## Quirks
- **The listing is dialect-dependent.** Line 240 only works because a true comparison is −1. On a Sinclair machine, where true is +1, the additions push `W` upward instead of folding it back, and two of the four monsters become unkillable by any weapon. The BBC reading is plainly the intended one, and it is the reading our canon uses.
- **Two of the four monsters always share an answer.** Slots 1 and 4 resolve identically, so whichever two names land in them need the same weapon. There are four monsters but only three distinct puzzles.
- **The shuffle is poor.** Lines 90 to 150 perform four swaps of a randomly chosen pair, and a pair can be the same slot twice. Over 200,000 trials the arrangement comes out unshuffled 6.8 per cent of the time against 4.2 per cent for a fair shuffle. The names are meaningfully more likely to sit in their original order than chance would give.
- **Any input that is not R, S or T costs a crew member.** A stray letter lands outside the rotation and falls through to the eaten branch, and `ASC("")` returns −1 on a BBC so pressing Enter alone does the same. In practice this rarely bit anyone, because the BBC Micro powered up with CAPS LOCK on and so delivered capitals.

## Retro BASIC Lane
A prompt loop, so it uses `RetroTerminal`. It reproduces the screen clear between encounters, `MONSTER COMING...`, `IT'S A <NAME>`, the `WHICH WEAPON ? (R,S OR T) ` prompt, the rotation, all five outcome strings, the anger roll, the group counter, and both endings. Input is uppercased, matching a real BBC keyboard, and a stray letter still costs a member. `R` or `Enter` restarts once the run is over.

Every printed outcome was checked against an independent implementation of lines 230 to 240 across a full run, and both endings were driven deliberately: killing all eight leaves the group of five intact and prints `YOU HAVE SURVIVED TO CONQUER GALACTICON`, and choosing the eaten weapon every time wipes the group out on the fifth encounter with `YOU'RE ALL DEAD`.

## Reimagined Lane
- **Fantasy** - The same eight encounters, with your group as five named people rather than a counter, and each monster drawn rather than named.
- **Core Puzzle** - Identical. The same rotation, the same 40 per cent anger roll, the same five lives and eight encounters.
- **Field Journal** - A panel records what each weapon did to each monster as you learn it. It records observations only. It does **not** apply the rotation for you, because spotting that pattern is the real content of the game and handing it over would end it.
- **Appearance follows the name** - Each monster name has a fixed look, so a Sulfacidor is recognisable across runs while its weapon changes, and the art never leaks the answer.
- **The answers are revealed in the debrief** - Once a run is over, the log lists what each monster actually needed. A player who reads a few of those will see the rotation for themselves, which is the intended route to the discovery.
- **Scoring** - 100 per kill, 200 per surviving crew member, and up to 300 more for wasting few probes, with a rank from Sole survivors up to Conqueror of Galacticon.

No timer and no creeping threat were added. The original already has a real failure state in losing the group, and two of the earlier reimagined lanes lean on a closing-threat device that should not become a house style.

## Playtest Notes
Verified by script on 21 September 2026:
- Retro: every outcome across a run matches an independent implementation of the listing's arithmetic; a stray `Q` costs a crew member; both endings print the original text.
- Reimagined: an autopilot that probes an unfamiliar monster once and then follows the rotation survived with four of five crew and six kills, which is the behaviour the structure predicts. The runner now fails if that strategy ever loses, since it provably cannot.

Open questions for a human. Whether the journal should hint that the rows are related once two are known. Whether eight encounters is long enough to make the discovery land, given three or four distinct monsters appear. And whether the monster art is distinct enough to attach a name to a face on a first run.
