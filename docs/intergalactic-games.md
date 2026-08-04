# Intergalactic Games

## BASIC Origins
`basic/bbc/usborne-computer-space-games/02.bas` frames a TV-rights race for the First Intergalactic Games: New Century TV must beat rival broadcasters by launching a satellite to the right orbital height. The playable listing, `02IG.bas`, rolls a target height `H`, gives eight attempts, and asks for an angle and a speed. The hidden solution is `angle = ATN(H/3)` in degrees and `speed = 3000 * SQR(H + 1/H)`. Success requires angle error under 2 degrees and speed error under 100 units.

## Retro BASIC Lane
The retro lane recreates the original prompt loop in a terminal: target height, angle input, speed input, terse feedback, eight attempts, and the original success/failure copy. It keeps the BBC source pair as canon and uses the shared `RetroTerminal` helper rather than embedding a real emulator.

## Reimagined Lane
- **Fantasy** - You are the NCTV launch engineer trying to secure exclusive broadcast rights before rival networks steal the opening ceremony feed.
- **Core Puzzle** - The exact BASIC tolerances still decide orbit. The modern console gives noisy analyst bands around angle and speed, so the player is still solving the original two-variable launch equation.
- **Flight Phase** - After launch, the satellite visibly arcs toward the target orbital band. Players can make small trim corrections with the same angle/speed controls.
- **Broadcast Lock** - During flight, a timing meter lets the player press `Space` near centre to increase signal lock. This does not replace the original win condition, but it affects score and makes successful launches feel more like a live TV operation.
- **Rival Pressure** - Failed attempts raise rival coverage. It adds drama and scoring pressure while preserving the original eight-attempt structure.
