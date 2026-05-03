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

## Player Manual
- **Goal**: Launch the satellite to the target height within eight attempts.
- **Aim Phase**: Use `Left/Right` or `A/D` to tune angle and `Up/Down` or `W/S` to tune speed. Hold `Shift` for fine adjustments. Press `Enter` or `Space` to launch.
- **Flight Phase**: Use the same controls for small trim corrections. Press `Space` when the broadcast-lock cursor crosses the green centre gate.
- **Debrief**: Feedback uses the original vocabulary: `TOO SHALLOW`, `TOO STEEP`, `TOO SLOW`, and `TOO FAST`. Press `Enter` to retry the same target or start the next event after success/firing.
- **Scoring**: A successful orbit earns the original `1000 / attempt` credit bonus, plus modern score from solution quality and broadcast lock.
