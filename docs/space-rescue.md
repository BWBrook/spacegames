# Space Rescue

## BASIC Origins
`basic/bbc/usborne-computer-space-games/12.bas` sends you across the spiral arm of the Galaxy with medical supplies. The distances are so great that you sleep for most of the trip, so before sleeping you program the ship, allocating energy to the engines, the life support system and the shields. On waking you get a report and, if all went well, you are in orbit, where you allocate what remains to landing boosters and heat shields. Succeed and you may be promoted to Space Admiral.

`12SR.bas` rolls a distance of 101 to 900 units, an energy supply of 401 to 800, and a time limit. It asks for the three allocations, flies six to ten checks for trouble with a pause of 2000 empty iterations between each, about 1.3 seconds on a BBC, reports asteroid storms, computer breakdowns, engine trouble and X-ray bursts as they happen, then judges the arrival. In orbit it names the gravity and the atmosphere only as low, medium or high, asks for boosters and heat shields, and lands you or does not.

## What the numbers are
- **The time limit is set by a fifth of the energy.** It is `INT(D/SQR(E/5)+.5)`, so putting about a fifth of the tank into the engines just makes it, before any trouble on the way.
- **Engine energy only counts in perfect squares.** Velocity is `INT(SQR(P))`. A hundred units give speed 10, and so do 120; the extra twenty buy nothing. Engine energy should always be a square.
- **Damage is predictable in aggregate.** Each check brings trouble half the time, one of four kinds equally. A storm or an X-ray burst does 21 to 60. Over six to ten checks the expected damage to each of shields and life support is about 40, but three hits are entirely possible.
- **The landing needs up to 306.** Gravity and atmosphere are each 5 to 14, and you need ten times the value in boosters and heat shields respectively. You are told only the band, so to be certain you must cover its top: 70 for low, 110 for medium, 140 for high. Two highs need 280, and the door needs more than 25 on top.

Simulating 60,000 missions:

| Plan | Rescued |
| --- | --- |
| Equal quarters to engines, life support and shields, landing energy halved | never |
| Engines just past the limit, 306 kept for landing, the rest split | 50% |
| The same, with engine energy not rounded to a square | 47% |
| Engines just past the limit, 270 kept for landing, landing cover chosen by band | 52% |

About half of all missions are lost however well they are planned, and most of that is decided by the energy the listing hands you. With the best plan, missions starting with 667 to 800 units succeed 78 per cent of the time; those starting with 401 to 533, only 20 per cent. At the bottom of the range there is not enough energy for the engines, a safe landing and any damage at all.

## Quirks
- **The door is a secret.** Line 810 requires more than 25 units left after landing. Neither the intro, the instructions nor any prompt mentions it. A careful player who covers both bands exactly is told `YOU LANDED SUCCESSFULLY - WELL DONE`, and then `PITY YOU DON'T HAVE ENOUGH` / `ENERGY TO OPEN THE DOOR`.
- **No engine energy divides by zero.** Anything under one unit gives a velocity of 0, and line 240 divides the distance by it: `Division by zero at line 240`. Negative engine energy fails a line earlier, with `-ve root at line 230`.
- **Engine trouble can crash the program.** Each bout costs half a unit of speed. If the velocity reaches exactly zero, line 460 divides by it before line 510 can report the failure: `Division by zero at line 460`. So `ENGINES ARE NON-FUNCTIONAL` only ever appears when the velocity has gone *below* zero, and then only after the listing has announced `ARRIVED IN -1738 DAYS` or similar. Both need a tiny engine allocation, since a normal one has far more speed than ten checks can remove.
- **You arrive even when you are dead.** `ARRIVED IN n DAYS` prints first, then any failures, and they stack: you can be blown up, dead and late all at once.
- **Negative allocations are accepted.** Only the total is checked. They never help, since negative shields or life support are fatal on arrival.
- **Shields and life support are judged differently.** Shields survive at exactly zero (`S<0` is fatal); life support does not (`L<=0` is fatal).
- **The heat shields reuse the shields' variable.** Harmless, since the voyage is over, but it means nothing left in the shields comes back to you.
- **The sleep is real.** Line 430 pauses `FOR J=1 TO 2000` after every check, two seconds at BBC speed, so the voyage takes twelve to twenty seconds of watching events arrive one at a time.

## Retro BASIC Lane
A prompt loop on `RetroTerminal`, with the input prompt hidden while the voyage prints. It reproduces the instructions and their wait for any key, the three allocations and the re-ask when they exceed the supply, both division-by-zero stops and the negative root, the voyage with its two-second pauses, arrival with stacked failures, the orbit report, the landing re-ask, and all four landing endings including the door.

Verified by script: the instructions and any-key wait; an over-budget allocation re-asking; zero and negative engine energy stopping at lines 240 and 230; a six-check voyage taking 12 seconds; and in orbit, boosters of 0 making a crater, heat shields of 0 a shooting star, 140 and 140 from 300 spare hitting the door, and 140 and 140 from 320 spare a clean rescue.

## Reimagined Lane
- **The same rules.** Identical rolls, damage, time limit, bands and door, except that the listing's crashes are closed: engines need at least one unit, and a velocity worn to zero is reported as failed engines.
- **The odds, shown.** While planning, the lane simulates the voyage three thousand times against the same risks and shows the chance the shields hold, life support holds, you arrive in time, and you reach orbit. The actual voyage draws separately, so the figures are a forecast, not a spoiler. This is the game's real content, a problem of spending one budget against several risks, and the listing hid every number a player would need to reason about it.
- **Engines step in perfect squares.** Left and Right on the engine field move one unit of speed at a time, so the square rule is learned by feel. Typing any figure still works.
- **The voyage, watched.** The ship crosses the spiral arm while the log reports each check and the shield and life-support meters drain.
- **The landing, explained.** Each band is shown with the exact range it could need, each allocation with the share of that range it covers, and the door is stated before you commit, not after.
- **Three missions to Space Admiral.** Ranks run from Grounded through Lieutenant Commander and Captain, by rescues.

## Playtest Notes
Verified by script on 26 September 2026: the retro checks above; and in the reimagined lane, a launch with no engine energy is refused, and a fixed campaign produced a rescue, a death from zero life support, and a landing with 20 units to spare that the door refused, ranking Lieutenant Commander.

Open questions for a human. Whether showing the odds turns a tense gamble into arithmetic, or makes an otherwise opaque game playable. Whether three missions is enough, given how much the energy roll decides. And whether the modern lane should let a player see a low-energy mission for what it is and decline it.
