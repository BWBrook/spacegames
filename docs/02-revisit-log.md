# Revisit Log

Things worth doing to games already built, noticed while building later ones. Nothing here is urgent; the plan is to implement all thirteen games first, then play them and work through this list alongside the playtest feedback.

## Shared code that has earned extraction

- **Audio cue loading.** Every modern lane now carries its own near-identical `loadCue` / `play` pair with an `active` guard, and Starship and Moonlander each carry their own looped-bed handling on top. Thirteen copies is well past enough evidence; this belongs in `src/core/audio.ts` as a small per-game cue player that cleans up on exit.
- **Starfields.** Most modern lanes draw their own, eleven in all. They differ only in density, colour and drift, and Asteroid Belt's are streaks rather than points. One helper in `src/core/` with a few options would remove roughly a hundred lines.
- **Debrief panels.** Nearly every modern lane now draws a centred bordered panel with a headline, a summary line, a statistics line and a "press Enter" footer. The layout maths is copied about a dozen times.
- **Phase state machines.** Each modern lane hand-rolls `phase` plus `phaseElapsed` and has hit the same TypeScript narrowing problem, where calling a function that mutates `state.phase` leaves the compiler thinking it cannot have changed. Worked around locally in Bug Eyes and Moonlander by widening to the phase union. A shared tiny phase helper would fix it once.

- **Monster and creature art.** Galacticon's four monsters are drawn from primitives and one of them reads as a rounded rectangle rather than a creature. Worth a pass once the anthology is complete and there is a house style to match.

## Retro fidelity

- **`ENTER A NUMBER.` is not a BBC message.** The retro lanes for Starship Take-Off, Intergalactic Games, Evil Alien and Moonlander print it when a line is blank or non-numeric. BBC `INPUT` into a numeric variable reads such a line as 0 and carries on. `readBbcNumber` in `src/core/bbcNumber.ts` does the right thing and Trip Into The Future uses it, because there a blank speed is one of the routes to a division by zero. The other four should follow; in Moonlander, for instance, a blank burn should simply be a burn of 0.
- **Retro fidelity to the disk or to the book.** Every retro lane follows the disk. Asteroid Belt reproduces a bug that is almost certainly the BBC converter's rather than the book's. The printed book is now available as a local scan under `reference/book/` (untracked), so the two can be compared line by line and a decision made on where they disagree. The first discrepancy is Touchdown. The printed BBC version (PDF page 35, lines 540 and 550) raises thrust on `INKEY(-194)` and lowers it on `INKEY(-179)`. These are A's and D's codes (−66 and −51) offset by −128, so the book pairs the keys the way its own instructions do, while the disk swaps them. The field note calling the instructions backwards is therefore true of the disk and possibly not of the book. It is unverified whether `INKEY(-194)` reads A on a real BBC, since it lies outside the documented range of −1 to −128.
- **Number formatting.** `formatBbcNumber` now prints nine significant figures as the BBC did, and Moonlander has been moved onto it. Its old formatter rounded to two decimal places, which only differed from the BBC for fractional burns. Every other retro lane prints integers only, so none needs it yet.

- **Numeric form fields.** Space Mines and Space Rescue each carry their own field navigation, digit typing and Backspace handling on the canvas. Two copies of a genuinely fiddly piece of UI; if a third game ever wants one it should be shared, and it may be worth asking whether HTML form fields over the canvas would serve better.
- **Autopilots in the runner.** `scripts/playtest/anthology.mjs` now carries a planner for several games, including two copies of lander physics for Moonlander and Touchdown. It works, but it is long and growing. Splitting it per game would make it easier to read.

## Loose ends

- `public/audio/bleep.wav` has been unreferenced since the Start gate was replaced by the landing page. Delete it, or give it a use.
- Manifest years were wrong for the first two games, stated as 1980 and corrected to 1982 when the landing page went in. Worth a pass over the metadata once all thirteen are registered.
- Retro lanes duplicate the "find the game source, else fall back" lookup and the title and source-label construction. A one-line helper would do.
- No automated test suite exists. The differential test of Moonlander's physics against a transcription of the listing lived in the scratchpad and was thrown away. Several games now have pure rule modules that would be cheap to test properly, which is what `AGENTS.md` says to do once logic stabilises.

## Settled along the way

- **Empty-loop timing** was read three different ways across the first eight games: 1/250 s per iteration in Beat The Bug Eyes, an arbitrary 1.4 s in Galacticon, and nothing yet for Asteroid Belt, where the Bug Eyes reading would have paused six seconds between asteroids. All retro lanes now share `src/core/bbcTiming.ts` at BBC speed. Whether BBC speed feels right in Beat The Bug Eyes, where it makes the game very brisk, is a playtest question.

- **Browser key-repeat versus the BBC's.** Death Valley's retro lane emulates the BBC's auto-repeat itself and ignores the browser's, so held keys behave the same on every machine. No other lane needed it, but any future real-time retro lane should do the same.

## Design questions raised by later games

- Evil Alien and Beat The Bug Eyes both added a creeping threat with a hard loss the original lacked, and Moonlander did not need one because the original already had a real failure state. Worth checking, once they are all playable, whether that device is used too often across the anthology.
- The landing page shows difficulty as Easy, Medium or Hard, assigned per game as it was built without any comparison between them. With all thirteen in, they should be calibrated against each other after playtesting.
- Several reimagined lanes disclose rules the listing hid: Evil Alien's scanner, Space Mines' thresholds, Space Rescue's odds and door, Touchdown's fuel ceiling. Whether that makes them too easy is the single most important question to put to playtesters, because it is a choice made the same way thirteen times.
