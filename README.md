# Spacegames

> **Status:** developed in the open as a working record. This is work in progress: contents may change, and nothing here is peer-reviewed unless stated.

Spacegames is a browser anthology of all thirteen games from Usborne's 1982 *Computer Spacegames*. Each game has two lanes: the original BBC Micro listing recreated faithfully in the browser, bugs and all, and a reimagining that keeps the original's central tension while adding what the listing lacked.

The games: Starship Take-Off, Intergalactic Games, Evil Alien, Beat The Bug Eyes, Moonlander, Monsters of Galacticon, Alien Snipers, Asteroid Belt, Trip Into The Future, Death Valley, Space Mines, Space Rescue and Touchdown.

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

The Playwright smoke runner takes any game's id, `modern` or `retro`, and `chromium` or `webkit`. It needs the dev server running, because it drives the games through development-only hooks. Use `--url` when that server is on another port.

## Reading

- `docs/03-field-notes.md` is the best place to start: what each listing turns out to be once read closely, its quirks, and the patterns across all thirteen.
- `docs/<game>.md` is each game's design document; `docs/manuals/` holds the player manuals and `docs/human_playtest/` the feedback forms.
- `docs/01-dual-lane-anthology.md` sets out what each lane must do, and `docs/02-revisit-log.md` collects repairs worth making now the anthology is complete.

## Source

The original BBC disk image is kept in `assets-src/Disc999-ComputerSpaceGamesUsborne.ssd`. Its repeatable, book-level extraction lives in `basic/bbc/usborne-computer-space-games/`; game manifests link to those files without copying them into per-game folders.

## Looking for the Python port?

This repository took over the `spacegames` name in September 2026. The earlier pure-Python recreation of the Usborne "Computer Spacegames" listings, previously at this URL, now lives at [BWBrook/spacegames-python](https://github.com/BWBrook/spacegames-python).

## Licence

Code is released under the [MIT Licence](LICENSE). Text, figures and data created for this project are released under [CC BY-SA 4.0](LICENSE-CONTENT). Third-party material keeps its own terms where stated.
