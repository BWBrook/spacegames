# Successor Handover

Prepared 7 September 2026 for a fresh task in `/Users/bwbrook/games/spacegames`.
Use this as orientation, then trust the current code and the user's new brief.
You do not need to reconstruct the previous conversation.

## Purpose And Direction

We are building a browser anthology of Usborne BASIC games, with two playable
lanes per entry: a faithful Retro BASIC recreation and a richer TypeScript/Canvas
reimagining that preserves the original puzzle's central tension. The immediate
audience is Barry playing and evaluating the games. Readability, satisfying
controls, and felt playability matter more than feature or test counts.

The closeout request was to prepare, commit, and push this handover and clean
the checkout, not to start another feature.
The foundation simplification is committed; there is no next game or development
tranche specified in the current repository notes. Recommended next step: play
the existing entries, identify the most consequential usability or gameplay gap,
then propose one coherent improvement tranche. Treat that as a recommendation,
not an inherited approval. Expand the anthology when the current pattern earns
reuse; avoid another open-ended architecture or polish campaign.

## What Has Happened

- The initial scaffold and Starship Take-Off came from Linux. The macOS pass
  established installation/build compatibility, fixed Start-to-canvas keyboard
  focus in WebKit, prevented captured game keys from triggering browser actions,
  and cleared held keys on blur. Preserve those interaction fixes.
- Starship's modern lane gained clearer target-versus-projected burn telemetry,
  ignition timing, ascent feedback, and balance that rewards burn matching.
- The anthology adopted canonical BBC source references and a consistent
  design-document, player-manual, and human-playtest structure.
- Intergalactic Games added the second complete pair of lanes: angle/speed
  orbital insertion, with modern flight trim and broadcast-lock scoring.
- Latest implementation commit: `5f20124` (`refactor: simplify anthology
  foundation`, 4 August 2026). It separated rendering from game orchestration,
  unified the active game lifecycle, guarded against stale asynchronous loads,
  consolidated browser smoke scripts, confined debug globals to development,
  and removed unused scaffolding and duplicated metadata. Do not recreate those
  old paths merely because older notes mention them.

## Bootstrap Reading Route

1. Read `AGENTS.md`, `README.md`, and `package.json` for local conventions and
   actual commands. Some AGENTS prose predates the BBC archive and browser suite:
   Retro BASIC is a native recreation, and Playwright smoke coverage exists.
2. Read `docs/01-dual-lane-anthology.md` for the lane/source contract and
   `src/games/manifest.ts` plus `src/games/types.ts` for the implementation seam.
3. Read the relevant `docs/<game-id>.md`, then its game directory. Consult
   `docs/manuals/<game-id>.md` for player controls and
   `docs/human_playtest/` for lightweight feedback forms.

The ignored historical `progress.md` log was superseded by this handover and
removed at closeout. Its old per-game autopilot commands and proposed broader
smoke suite are superseded by the unified runner. The checked-in human feedback
forms are blank; they do not establish player acceptance.

## Current System

`src/main.ts` connects the Start/audio gate, input, stage, clock, and scene manager.
`src/scenes/` owns menu/mode selection and gameplay loading; `src/core/` provides
shared input, audio, canvas, scene management, and `RetroTerminal` services.
Each modern game has `index.ts` for orchestration, `state.ts`/`types.ts` for its
model, and `render.ts` for drawing. Its `retro.ts` recreates the BASIC prompt loop.
Both lanes use the shared `GameInstance` lifecycle and must clean up on exit.

| Entry | Source pair in the BBC archive | Core contract |
| --- | --- | --- |
| `starship-takeoff` | `01.bas`, `01ST.bas` | Retro: ten guesses for `G * W`. Modern: prep, ignition, ascent, debrief. |
| `intergalactic-games` | `02.bas`, `02IG.bas` | Retro: eight attempts, angle error under 2 degrees and speed error under 100. Modern preserves orbit tolerances and adds trim/broadcast scoring. |

Canon lives in `assets-src/Disc999-ComputerSpaceGamesUsborne.ssd` and its
repeatable extraction under `basic/bbc/usborne-computer-space-games/`, including
`catalog.json`. Keep the book archive intact; reference it through manifest
`sources`, without per-game copies. Preserve the original listings and source
provenance. Imported audio provenance belongs in `docs/audio-sources.md`.

## Run And Verify

The package manager is pinned to `pnpm@10.32.1`; follow the manifest/lockfile.

```sh
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1
# In another terminal, with the dev server running:
pnpm playtest -- --game starship-takeoff --mode modern --browser chromium
pnpm build
```

The runner is `scripts/playtest/anthology.mjs`. It accepts either game ID,
`modern|retro`, `chromium|webkit`, and optional `--url`/`--out-dir`; reports and
screenshots default to ignored `output/`. Run `pnpm extract:bbc` when source
extraction changes. Before a human handoff, the lane contract calls for relevant
Chromium/WebKit smoke checks and one visible browser pass through mode selection,
both lanes, and Escape back to the menu.

Debug hooks (`render_game_to_text`, `advanceTime`, `__spacegamesDebug`) exist only on
the Vite dev server. The smoke runner therefore cannot target `pnpm preview`.
Production preview needs ordinary browser interaction. Smoke coverage has limits:
retro checks entry/return, Starship checks reaching debrief, and Intergalactic
uses a debug solution and checks successful orbit. These are not proofs of
human solvability, balance, complete failure paths, or enjoyable controls.

Before this note, `main` was at `5f20124`, matching `origin/main` after a fresh
fetch. This is the primary checkout, with no additional worktrees. Closeout
removes generated builds, browser reports/screenshots, and caches; installed
dependencies are retained for the successor.
`pnpm build` passed on macOS on 7 September 2026. Browser playtests were not
rerun for this documentation-only task; older reports are historical evidence.

## Working Style And Skills

- Use [Twilight Laboratory](/Users/bwbrook/.codex/skills/twilight-laboratory/SKILL.md)
  to frame substantial work as a coherent playable tranche with an observable
  stopping point. Execute routine authorized steps autonomously; involve Barry
  where gameplay direction or scope needs his judgment. Apply its collaboration
  discipline proportionally to this game project.
- Use [Kill Your Darlings](/Users/bwbrook/.codex/skills/kill-your-darlings/SKILL.md)
  to keep each mechanic, abstraction, dependency, and check accountable to actual
  player value. Protect source integrity and both supported lanes. This is not
  authorization for another deletion pass.
- For implementation/playtesting, consult
  [develop-web-game](/Users/bwbrook/.codex/skills/develop-web-game/SKILL.md)
  when relevant, and reuse the repository's runner and hooks. Load additional
  skills only for a distinct need; avoid importing a new framework or workflow
  merely because a skill offers one.

Make targeted changes, verify material behavior, perform one focused review and
repair pass, and stop when the remainder is optional polish. Use bounded
delegation when it helps substantial independent work. Do not infer publication,
push, deployment, or unrelated rewrite authority from this handover.
