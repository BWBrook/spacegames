# Spacegames

Spacegames is a browser anthology of modern games re-imagined from the Usborne computer-game listings. Each entry has two lanes: a browser-native Retro BASIC recreation and an expanded TypeScript/Canvas version.

## Run It

```sh
pnpm install
pnpm play
```

`pnpm play` builds the anthology, serves it on http://127.0.0.1:4173, and opens it in your browser. The landing page lists every game with two buttons: the original 1982 listing running in the browser, and the reimagining. `Esc` in a game returns to the landing page.

For day-to-day development use `pnpm dev` and open the Vite URL. Build the production bundle alone with `pnpm build`.

### Desktop launcher (macOS)

```sh
tools/install-launcher.sh
```

This creates `~/Applications/Spacegames.app`, which opens a Terminal window running `pnpm play`. Closing that window stops the server. Once the build is hosted somewhere, Safari's "Add to Dock" on that URL gives a server-free launcher instead.

## Checks

```sh
pnpm extract:bbc
pnpm build
pnpm playtest -- --game starship-takeoff --mode modern --browser chromium
```

The Playwright smoke runner accepts `starship-takeoff` and `intergalactic-games`, plus `modern` or `retro` modes. Use `--url` when a dev server is already running on another port.

## Source

The original BBC disk image is kept in `assets-src/Disc999-ComputerSpaceGamesUsborne.ssd`. Its repeatable, book-level extraction lives in `basic/bbc/usborne-computer-space-games/`; game manifests link to those files without copying them into per-game folders.

## Looking for the Python port?

This repository took over the `spacegames` name in September 2026. The earlier pure-Python recreation of the Usborne "Computer Spacegames" listings, previously at this URL, now lives at [BWBrook/spacegames-python](https://github.com/BWBrook/spacegames-python).
