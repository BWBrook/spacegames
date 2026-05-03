# Starship Take-Off

## BASIC Origins
`basic/starship_takeoff.bas` and the BBC Micro source pair `basic/bbc/usborne-computer-space-games/01.bas` / `01ST.bas` describe the same tight guessing puzzle: gravity (`G`) and a hidden second factor (`W`) are rolled at launch, you type in a thrust value, and ten guesses later you either pierce the sky or get captured by aliens. The BBC intro adds the best fiction frame: you are a crashed starship captain trying to take off again in a captured alien ship, with a fail-safe that cuts in if the force is too high. There are no action visuals, just terse feedback—"TOO HIGH" or "TOO LOW"—before a single perfect number (`R = G × W`) unlocks success. Our re-imagining keeps that hidden-variable tension but translates it into a tactile, minute-long ride with telemetry jitter instead of raw multiplication.

## Design Notes
- **Phases** – Prep (dial-in boosters/vector/fuel), Commit (timed ignition gate), Ascent (live thrust + events), Debrief (accuracy + rewards). Each exposes a different layer of the original math: base thrust approximates `R`, ignition timing applies a multiplier, ascent modulation and events try to knock you off target.
- **Telemetry Noise** – Gravity and wind are still there, but displayed values drift and spike. The prep panel converts those noisy readings into a visible target burn, so the player is still solving the original `G × W` puzzle, just through a cockpit-style UI instead of raw arithmetic.
- **Events Deck** – Solar flares, debris clouds, reactor spikes, and alien interceptors are scheduled along a timeline to keep runs replayable. Effects are short, punchy, and always legible on the HUD.
- **Heat vs. Integrity** – Overshooting thrust raises heat and wakes the captured ship's fail-safe; heat bleeds into hull damage if unmanaged. Venting reduces velocity, creating the push/pull we wanted from "too high / too low" feedback loops, while clean burn matching produces the steadiest climb.
- **Retro Mode** – Press Enter on the anthology menu to pick between the modern canvas build and a terminal-style BASIC recreation. The retro version mirrors the original flow (10 guesses, `R = G × W`) with a text buffer and keyboard input, so players can compare the old puzzle verbatim.

## Pilot Manual
- **Goal**: Reach orbital altitude (32,000 m) without exceeding 140 heat or 0 integrity. Scoring is based on how close your true thrust stayed to the secret `R` target.
- **Controls**:
  - Prep Phase – Drag controls or use `A/D` (booster power), `W/S` (vector bias), and `Q/E` (fuel mix) to tune systems. Match the `Projected burn` readout to the noisy `Telemetry target`, then press `Enter`.
  - Commit Phase – Press `Enter` or `Space` when the cyan cursor is inside the golden gate to capture a clean ignition bonus.
  - Ascent Phase – `W/S` (or `↑/↓`) adjusts live thrust; hold `Space` or `Shift` to vent heat; `Esc` returns to the anthology menu at any time.
- **HUD**: Left mission panel shows jittery `G`/`W` telemetry, burn offset, altitude, hull, heat, and the next event. The right slider controls live thrust, and the bottom timeline previews upcoming incidents.
- **Replay Loop**: After debrief, press `Enter` to reset telemetry, roll a new hidden target, and chase a higher medal or cleaner curve.
