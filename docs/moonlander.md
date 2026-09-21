# Moonlander

## BASIC Origins
`basic/bbc/usborne-computer-space-games/05.bas` puts you at the controls of a lunar module carrying a small team down to the surface. Slowing the descent costs fuel and the tank is finite. The intro states the rule the whole game turns on: "A burn of 5 will keep your speed constant. A higher number will reduce it."

The playable listing, `05ML.bas`, starts at time 0, height 500, velocity 50, fuel 120. Each turn prints the four figures, asks `BURN? (0-30)`, clamps the answer to 0-30 and to the fuel remaining, then sets `V1 = V - B + 5`, deducts the burn from the tank, and drops the height by the mean of the old and new velocities. On reaching the ground it interpolates a touchdown speed and prints one of three verdicts: over 5 is `YOU CRASHED-ALL DEAD`, over 1 is `OK-BUT SOME INJURIES`, and 1 or less is `GOOD LANDING.`.

### What the arithmetic actually demands
Because gravity adds 5 per turn and every unit of burn removes one unit of velocity, the fuel spent over a flight of `T` turns is `50 + 5T` minus whatever speed you still carry at touchdown. The tank holds 120. **The fuel budget is therefore a time budget: roughly fourteen turns.** Hovering is not a free way to think; it is the most expensive thing you can do. A minimum-time descent, falling freely and then braking hard, gets down in about nine turns and leaves a quarter of the tank.

A search over integer burn sequences confirms the listing is winnable with real margin. `3 1 0 0 0 10 21 21 21 22 6` touches down at 0.5 and prints `GOOD LANDING.`, with 16 fuel unspent.

### Two quirks, both preserved in the retro lane
Line 250 is `IF V1<=1 THEN PRINT "GOOD LANDING."`, with no lower bound. A touchdown speed of −8.5 is therefore a good landing, so a player who arrives while still climbing is congratulated. Of the good landings found by search, a little under a third are ascending ones. The modern lane cannot reproduce this, because in continuous flight you do not reach the ground while moving away from it.

Line 170 diverts to the landing code when the fall exactly equals the height remaining, and the interpolation there then uses the height and velocity from *before* the turn rather than after. The result can be wildly wrong. Falling freely for six turns and then burning 30 twice arrives exactly on the surface and is scored as a touchdown at 35.7, a crash, when the lander was in fact doing 55 at a height of 42.5 a moment earlier. It is reachable in ordinary play, not a corner case.

## Retro BASIC Lane
A prompt loop, so this one uses the existing `RetroTerminal`. It reproduces the two-column status readout, the `BURN? (0-30)` prompt, the clamps, the arithmetic, both branches into the landing code, and the three verdict strings. The port was differentially tested against a direct transcription of the listing over four thousand random burn sequences; the logs agree turn for turn.

Two deviations. Line 90 skips the prompt entirely once the tank is empty, so the original prints the remaining turns in one burst; we pace that free fall at one turn every 0.6 seconds so it can be watched. And `R` or `Enter` restarts, matching the other retro lanes. One guard has no counterpart in the original: if velocity is zero at the landing interpolation the listing would divide by zero, which is unreachable on the path that gets there, but we return zero rather than infinity.

## Reimagined Lane
- **Fantasy** - The same descent, flown rather than tabulated.
- **Core Puzzle** - Identical constants, identical verdict thresholds. Gravity is 5, maximum throttle 30, tank 120, start at 500 units up doing 50. One turn of the listing reads as one second.
- **Continuous Flight** - The throttle is a dial rather than a typed number, moved with Up and Down, and the lander descends in real time with a plume that scales with the burn. The altitude scale zooms in as you close, so the last few units are readable.
- **The Book's Lesson, Drawn** - The throttle gauge carries a marked line at 5 labelled HOLD, which is the intro's "a burn of 5 will keep your speed constant" made visible.
- **Touchdown Projection** - The headline readout is the speed you will hit the ground at if you keep the current throttle until the tanks run dry and then fall. It is simulated forward each frame rather than solved, so hovering, climbing and fuel exhaustion all fall out of the same loop. It is coloured by the verdict band it lands in, which turns the original's mental arithmetic into a dial you can fly against without doing the sum for you.
- **Scoring** - 1200 for a good landing, 450 for injuries, nothing for a crash, plus 8 per unit of fuel left and up to 400 more the closer the touchdown is to zero.

A controller that coasts and then holds the exact deceleration needed lands at 0.5 with 25 fuel spare in 9.1 seconds, so the modern lane has the same comfortable-but-not-generous margin as the original.

## Playtest Notes
Verified by script on 21 September 2026, on Chromium and WebKit:
- Retro: the opening screen reads `TIME 0 / HEIGHT 500 / VEL. 50 / FUEL 120`; the proven burn sequence prints `GOOD LANDING.`; emptying the tank stops the prompt and coasts to a crash, as line 90 dictates; four thousand random sequences match a transcription of the listing exactly.
- Reimagined: the autopilot lands at 0.98 with 24 fuel left, and the runner now fails if a clean descent scrapes in under 15 fuel.

Open questions for a human. Whether the throttle rate of 45 units per second is too twitchy for fine trim near the surface. Whether the projection readout removes too much of the planning the original demanded. And whether the retro lane should surface the ascending-counts-as-good quirk to the player or leave it to be discovered.
