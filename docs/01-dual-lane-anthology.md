# Dual-Lane Anthology

This anthology has two player-facing lanes for each classic BASIC game.

## Retro BASIC Lane

The retro lane is a browser-native recreation of the original play experience. It should preserve the original game's verbs, win/loss conditions, pacing, wording, and constraints closely enough that a player can understand what the BASIC listing did without launching an emulator.

The extracted sources remain the canon:

- `assets-src/Disc999-ComputerSpaceGamesUsborne.ssd` is the archival BBC Micro DFS disk image.
- `basic/bbc/usborne-computer-space-games/` is the book-level extracted source archive.
- `catalog.json` records DFS names, load and exec addresses, file lengths, and source-to-output mapping.

Do not duplicate extracted BBC source into per-game folders. Link each game to its relevant source files through `sources` in `src/games/manifest.ts`.

## Reimagined Lane

The reimagined lane is the modern TypeScript and Canvas game. It should keep the original game's central tension, but expand interaction, feedback, visuals, audio, and replayability.

For example, `Starship Take-Off` keeps the hidden `G * W` force puzzle, while turning the single typed number into launch preparation, ignition timing, ascent management, and debrief scoring.

## Manifest Contract

Every game entry should keep `basicSource` for the current menu and backwards compatibility, and add richer `sources` metadata:

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
