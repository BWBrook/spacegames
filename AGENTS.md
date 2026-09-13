# Repository Guidelines

## Project Structure & Module Organization
- `basic/` keeps untouched C64 BASIC originals; add references here before reimagining them.
- `src/main.ts` wires the canvas, input, audio, and `SceneManager`, while `src/style.css` defines the shared look.
- `src/core/` houses reusable engine services (`stage`, `input`, `audio`, `sceneManager`); extend these instead of duplicating logic per game.
- `src/games/manifest.ts` is the single registry. Each game lives in `src/games/<id>/index.ts`, exports `createGame(ctx)`, and relies on types from `src/games/types.ts`. If a BASIC emulator exists, add `retro.loader` in the manifest and ship a companion module at `src/games/<id>/retro.ts` exporting `createRetroGame(ctx)`.
- `src/scenes/` handles high-level flows. `landingScene` shows the HTML landing page in `src/landing/` (the canvas is idle while it is visible); `gameplayScene` loads and runs a lane on the canvas. Keep scenes UI/state oriented and call `ctx.goto(...)` for transitions; the landing scene is registered under the name `menu`.
- `public/` serves static art/audio verbatim; reference files via absolute `/audio/...` or `/assets/...` paths.

## Build, Test, and Development Commands
- `pnpm dev` — Vite dev server with HMR at http://localhost:5173 for day-to-day iteration.
- `pnpm build` — `tsc --noEmit` plus `vite build`; fails fast on type issues and emits `dist/` assets.
- `pnpm preview` — static preview of the production build; use before capturing footage or publishing.
- `pnpm play` — build, serve on 127.0.0.1:4173, and open the browser; `tools/install-launcher.sh` wraps it in `~/Applications/Spacegames.app`.

## Coding Style & Naming Conventions
- Stay within strict TypeScript; type every exported symbol, scene payload, and manifest entry.
- PascalCase classes, camelCase functions/variables, SCREAMING_SNAKE_CASE only for constants.
- Separate logic (`update`) from drawing (`render`); pull reusable math/input helpers into `src/core/`.
- Game folders mirror their manifest id, aim for ~200-line modules, and explain unusual controls with short comments. Retro modules should keep text buffers/UI self-contained and clean up any `keydown` listeners on `exit()`.

## Testing Guidelines
- No automated suite yet—record manual scenarios in PRs (controls tried, win/loss paths, edge cases) and attach GIFs where helpful.
- When logic stabilizes, add Vitest suites under `src/__tests__/`, expose a `pnpm test` script, and keep fixtures lightweight.

## Commit & Pull Request Guidelines
- Use conventional, action-focused commit titles (`feat: add scene manager HUD`) and explain the why when it is non-obvious.
- PRs include a summary, testing notes (command + outcome), media for visual changes, and a reference to the motivating BASIC file. Note whether you touched the modern build, the retro emulator, or both so regressions stay isolated.
- Scope PRs to a single game or shared subsystem; raise follow-ups for tangential refactors.

## Security & Configuration Tips
- Keep secrets, licensed art, and paid fonts out of the repo; store keys in `.env.local` (ignored) and document requirements in the PR.
- Confirm asset licenses before adding anything to `public/`, and attribute sources in the PR or an `ASSETS.md` entry. `docs/audio-sources.md` tracks imported SFX; update it whenever you add or swap cues.
