# Dual-Lane Anthology

This anthology has two player-facing lanes for each classic BASIC game.

## Retro BASIC Lane

The retro lane is a browser-native recreation of the original play experience. It should preserve the original game's verbs, win/loss conditions, pacing, wording, and constraints closely enough that a player can understand what the BASIC listing did without launching an emulator.

The extracted sources remain the canon:

- `assets-src/Disc999-ComputerSpaceGamesUsborne.ssd` is the archival BBC Micro DFS disk image.
- `basic/bbc/usborne-computer-space-games/` is the book-level extracted source archive.
- `catalog.json` records DFS names, load and exec addresses, file lengths, and source-to-output mapping.

Do not duplicate extracted BBC source into per-game folders. Link each game to its relevant source files through `sources` in `src/games/manifest.ts`.

The retro lane is faithful to the disk, including its bugs. When the listing divides by zero, the lane stops with BBC BASIC's error and line number; when a message is cleared before it can be read, it is cleared; when the controls contradict the intro, they stay contradicted. The one kind of liberty allowed is pacing that the original left to the machine, and it is taken through shared modules rather than per game: `src/core/bbcTiming.ts` reads empty `FOR` loops and flat-out loops at BBC speed, `src/core/bbcNumber.ts` prints numbers and reads `INPUT` as the BBC did, `RetroTerminal` serves prompt-driven listings and `RetroScreen` positional ones. Anything else a lane deliberately does differently, such as drawing Touchdown's craft without its flicker, is recorded in that game's design document.

## Reimagined Lane

The reimagined lane is the modern TypeScript and Canvas game. It should keep the original game's central tension, but expand interaction, feedback, visuals, audio, and replayability. Where the listing's intent is plain and its code breaks it, as with Asteroid Belt's unreachable crash or Space Mines' mistyped line, the reimagined lane follows the intent.

For example, `Starship Take-Off` keeps the hidden `G * W` force puzzle, while turning the single typed number into launch preparation, ignition timing, ascent management, and debrief scoring.

## Manifest Contract

Every game entry should include a `sources` array with the relevant canonical files:

- `transcription` for any simple hand-entered or legacy `.bas` source.
- `intro` for original framing, instructions, or menu programs.
- `game` for the original playable BASIC program.
- `disk-image` and `catalog` for archival source context.

The retro mode should prefer `sources` with role `game`, then fall back to `transcription`.

## Documentation Contract

For each game:

- `docs/<game>.md` describes the original source, the retro lane, and the reimagined lane.
- `docs/human_playtest/<game>.md` captures fast player feedback.
- `docs/manuals/<game>.md` is added once controls and presentation settle.

The design doc should name the specific BBC source files used as canon, especially when the intro file contains fiction or instructions not present in the short game listing.

## Playtest Contract

Before handing a game to a human tester:

- Run the extraction command if source files changed: `pnpm extract:bbc`.
- Run the build: `pnpm build`.
- Run browser smoke checks for the relevant game in Chromium and WebKit.
- Do one visible browser pass with Computer Use for mode selection, retro lane, reimagined lane, and return-to-menu behavior.
