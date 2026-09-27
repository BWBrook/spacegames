# Anthology Documentation Structure

This repo is set up as a multi-game browser anthology. Each BASIC original should have a matching set of lightweight docs so design intent, player feedback, and final instructions stay organized as the anthology grows.

## Per-Game Documents

For a game with id `starship-takeoff`, use:

- `basic/starship_takeoff.bas`
  - Simple transcription used as a readable source reference.
- `basic/bbc/usborne-computer-space-games/`
  - Book-level BBC Micro source archive extracted from the `.ssd` image.
  - Keep the archive intact and link to relevant files from game metadata instead of copying them into per-game folders.
- `src/games/manifest.ts`
  - Register the game and its source references.
  - Use `sources` for the canonical mapping of intro files, game files, disk images, and catalogues.
- `docs/starship-takeoff.md`
  - Living design document for both lanes.
  - Include:
    - a short vignette about the BASIC original and its source files,
    - retro lane notes for the browser-native BASIC-style recreation,
    - design notes for the re-imagined version,
    - core mechanics,
    - notes on audio/visual direction,
    - playtest-driven follow-ups.
- `docs/human_playtest/starship_takeoff.md`
  - Fast human feedback form for GUI playtests.
  - Optimize for low-effort answers: multiple choice first, free-form notes last.
- `docs/manuals/starship-takeoff.md`
  - Player-facing instruction manual.
  - Create this once the game is stable enough that controls, win/loss flow, and presentation are unlikely to change every day.

## Why This Split Works

- `docs/<game>.md` is for design and development.
- `docs/human_playtest/<game>.md` is for fast evaluator feedback.
- `docs/manuals/<game>.md` is for players.
- `basic/bbc/usborne-computer-space-games/` is the shared source archive, not a per-game implementation folder.

That separation keeps design notes from turning into manuals, and keeps playtest feedback from getting lost inside implementation notes.

## Recommended Workflow

1. Add or refresh source archives, such as the BBC `.ssd` extraction, using a repeatable tool.
2. Add or update the game entry in `src/games/manifest.ts`, including `sources`.
3. Build the browser-native Retro BASIC lane from the original game source.
4. Build the Reimagined lane as the expanded TypeScript/Canvas game.
5. Create or update `docs/<game>.md` before or during implementation.
6. Once the game is playable, create `docs/human_playtest/<game>.md` to guide feedback.
7. After the mechanics and presentation settle, write `docs/manuals/<game>.md`.

## Shared Docs

- `docs/audio-sources.md` tracks provenance for imported sound assets.
- `docs/01-dual-lane-anthology.md` defines the Retro BASIC and Reimagined lane contract.
- `docs/04-art-study.md` describes the book's art and its measured palettes, as the visual reference for the reimagined lanes. It is written from a private scan of the book in `reference/`, which Git ignores; nothing from that folder is ever committed or published.
- Future anthology-wide docs can live in numbered files like `docs/00-...md`, `docs/01-...md`, and so on.

This gives us a stable pattern without over-engineering the repo before the next few games arrive.
