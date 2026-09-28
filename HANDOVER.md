# Successor Handover

Prepared 26 September 2026, at the close of the first development tranche.
Use this as orientation, then trust the current code and the user's new brief.

## Where The Project Stands

All thirteen games from Usborne's 1982 *Computer Spacegames* are playable, each
in two lanes: a retro lane faithful to the BBC Micro listing on the disk,
bugs included, and a reimagined lane that keeps the listing's central tension
and adds what it lacked. An HTML landing page lists them all; `pnpm play` builds
and opens it, and `tools/install-launcher.sh` wraps that in a macOS app.

Barry chose to implement every game before playtesting any of them, expecting
later games to prompt repairs to earlier ones. **The next tranche is playtesting**:
Barry plays both lanes of each game, fills in `docs/human_playtest/<game>.md`,
and the findings are worked through alongside `docs/02-revisit-log.md`. Treat
that as the recommended direction, not an inherited approval.

## Reading Route

1. `AGENTS.md` for conventions and commands. `CLAUDE.md` includes it.
2. `docs/03-field-notes.md`: what each listing turns out to be once read
   closely, its quirks, and the patterns across the anthology. The fastest way
   to understand the project, and written to be quarried for in-game help.
3. `docs/01-dual-lane-anthology.md` for what each lane must do. The retro lane
   follows the disk, crashes and all; the reimagined lane follows the listing's
   evident intent where its code breaks it.
4. `docs/02-revisit-log.md` for shared code worth extracting, retro-fidelity
   fixes, and open design questions.
5. `docs/<game>.md` and `src/games/<game>/` for any one game.

## System

`src/main.ts` wires the canvas, input, audio and scene manager. `src/scenes/`
holds the HTML landing scene (registered as `menu`) and the gameplay scene.
`src/games/manifest.ts` registers each game with its BBC sources. Each game
folder has `state.ts` (the listing's rules first, then the reimagined lane's
state), `retro.ts`, `render.ts`, `index.ts`, and usually `types.ts`.

Shared services in `src/core/` that the retro lanes depend on:

- `bbcTiming.ts`: empty `FOR` loops at the BBC speed measured in jsbeeb, the rounding of an `INKEY$(1)` poll to the next centisecond, and
  `INKEY` centiseconds. One reading for every lane.
- `bbcNumber.ts`: nine-significant-figure `PRINT` output, and `INPUT` reading a
  blank line as 0.
- `retroTerminal.ts` for prompt-driven listings, `retroScreen.ts` for ones that
  print at a row and column. Touchdown carries its own MODE 5 sliver in
  `src/games/touchdown/mode5.ts`.

## Run And Verify

```sh
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1
# In another terminal, with the dev server running:
pnpm playtest -- --game space-rescue --mode modern --browser chromium
pnpm build
```

The runner in `scripts/playtest/anthology.mjs` takes any game id, both modes
and both browsers. Modern runs drive each game through a scripted autopilot and
assert a specific outcome; retro runs check entry and return to the menu. The
debug hooks it relies on exist only on the dev server. At the close of this
tranche all twenty-six lanes passed on Chromium and all thirteen modern lanes
on WebKit, each with no console errors.

Scripted runs press keys one frame at a time: the engine records at most one
press of a given key per frame, so a script that presses the same key twice
without advancing the clock loses the second press. Humans are unaffected.

The deeper checks behind each game's claims, simulations of the listings and
scripted retro walkthroughs, were run from a scratchpad and are described in
each design document's playtest notes rather than kept as tests.

## Working Style

- Barry has given standing approval to commit and push to `main` in this repo.
- Per game, the pattern that worked: read the listing closely; simulate it
  before designing, because several listings hide structure or bugs that change
  what the lanes should do; build the retro lane faithfully and verify its
  branches by script; design the reimagined lane around the listing's real
  tension; add a runner autopilot that asserts a specific outcome; write the
  design doc, manual, playtest form and field-notes section; run the full
  regression; commit.
- Twilight Laboratory and Kill Your Darlings are available as Claude skills.
  Use them proportionally. Kill Your Darlings is not authority for a deletion
  pass.
- Make targeted changes, verify material behaviour, and stop when the
  remainder is optional polish. Do not infer publication or deployment
  authority from this handover.
