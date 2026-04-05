# Anthology Documentation Structure

This repo is set up as a multi-game browser anthology. Each BASIC original should have a matching set of lightweight docs so design intent, player feedback, and final instructions stay organized as the anthology grows.

## Per-Game Documents

For a game with id `starship-takeoff`, use:

- `basic/starship_takeoff.bas`
  - Untouched source-of-truth BASIC original.
- `docs/starship-takeoff.md`
  - Living design document for the remake.
  - Include:
    - a short vignette about the BASIC original,
    - design notes for the re-imagined version,
    - core mechanics,
    - notes on audio/visual direction,
    - playtest-driven follow-ups.
- `docs/human_playtest/starship_takeoff.md`
  - Fast human feedback form for GUI playtests.
  - Optimize for low-effort answers: multiple choice first, free-form notes last.
- `docs/manuals/starship_takeoff.md`
  - Player-facing instruction manual.
  - Create this once the game is stable enough that controls, win/loss flow, and presentation are unlikely to change every day.

## Why This Split Works

- `docs/<game>.md` is for design and development.
- `docs/human_playtest/<game>.md` is for fast evaluator feedback.
- `docs/manuals/<game>.md` is for players.

That separation keeps design notes from turning into manuals, and keeps playtest feedback from getting lost inside implementation notes.

## Recommended Workflow

1. Add the untouched BASIC original under `basic/`.
2. Create the remake entry in `src/games/manifest.ts`.
3. Create or update `docs/<game>.md` before or during implementation.
4. Once the game is playable, create `docs/human_playtest/<game>.md` to guide feedback.
5. After the mechanics and presentation settle, write `docs/manuals/<game>.md`.

## Shared Docs

- `docs/audio-sources.md` tracks provenance for imported sound assets.
- Future anthology-wide docs can live in numbered files like `docs/00-...md`, `docs/01-...md`, and so on.

This gives us a stable pattern without over-engineering the repo before the next few games arrive.
