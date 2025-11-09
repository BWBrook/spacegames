# Starship Take-Off

## BASIC Origins
`basic/starship_takeoff.bas` is a tight 20-line guessing puzzle from the C64 era: gravity (`G`) and wind shear (`W`) are rolled at launch, you type in a thrust value, and ten guesses later you either pierce the sky or get abducted by aliens. There are no visuals, no audio cues, just terse feedback—"TOO HIGH" or "TOO LOW"—before a single perfect number (`R = G × W`) unlocks success. Our re-imagining keeps that hidden-variable tension but translates it into a tactile, minute-long ride with telemetry jitter instead of raw multiplication.

## Design Notes
- **Phases** – Prep (dial-in boosters/vector/fuel), Commit (timed ignition gate), Ascent (live thrust + events), Debrief (accuracy + rewards). Each exposes a different layer of the original math: base thrust approximates `R`, ignition timing applies a multiplier, ascent modulation and events try to knock you off target.
- **Telemetry Noise** – Gravity and wind are still there, but displayed values drift and spike; investing in better prep reduces the spread, mirroring the BASIC game's guesswork.
- **Events Deck** – Solar flares, debris clouds, reactor spikes, and alien interceptors are scheduled along a timeline to keep runs replayable. Effects are short, punchy, and always legible on the HUD.
- **Heat vs. Integrity** – Overshooting thrust raises heat; heat bleeds into hull damage if unmanaged. Venting reduces velocity, creating the push/pull we wanted from "too high / too low" feedback loops.
- **Retro Mode** – Press Enter on the anthology menu to pick between the modern canvas build and a terminal-style BASIC recreation. The retro version mirrors the original flow (10 guesses, `R = G × W`) with a text buffer and keyboard input, so players can compare the old puzzle verbatim.

## Pilot Manual
- **Goal**: Reach orbital altitude (120,000 m) without exceeding 140 heat or 0 integrity. Scoring is based on how close your true thrust stayed to the secret `R` target.
- **Controls**:
  - Prep Phase – Drag sliders or use `A/D` (booster power) and arrow keys (`←/→` for booster, `↑/↓` for vector) to tune systems. `Enter` skips to commit early.
  - Commit Phase – Press `Enter` or `Space` when the cyan cursor is inside the golden gate to capture a clean ignition bonus.
  - Ascent Phase – `W/S` (or `↑/↓`) adjusts live thrust; hold `Space` or `Shift` to vent heat; `Esc` returns to the anthology menu at any time.
- **HUD**: Left sidebar shows jittery `G`/`W` telemetry, right slider controls live thrust, bottom timeline previews random events. Heat and hull meters glow when in danger.
- **Replay Loop**: After debrief, press `Enter` to reset telemetry, roll a new hidden target, and chase a higher medal or cleaner curve.
