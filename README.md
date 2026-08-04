# Vibe Game

Vibe Game is a browser anthology of modern games re-imagined from the Usborne computer-game listings. Each entry has two lanes: a browser-native Retro BASIC recreation and an expanded TypeScript/Canvas version.

## Run It

```sh
pnpm install
pnpm dev
```

Open the local Vite URL, choose a game, and select either lane. Build the production bundle with `pnpm build`.

## Checks

```sh
pnpm extract:bbc
pnpm build
pnpm playtest -- --game starship-takeoff --mode modern --browser chromium
```

The Playwright smoke runner accepts `starship-takeoff` and `intergalactic-games`, plus `modern` or `retro` modes. Use `--url` when a dev server is already running on another port.

## Source

The original BBC disk image is kept in `assets-src/Disc999-ComputerSpaceGamesUsborne.ssd`. Its repeatable, book-level extraction lives in `basic/bbc/usborne-computer-space-games/`; game manifests link to those files without copying them into per-game folders.
