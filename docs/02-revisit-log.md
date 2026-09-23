# Revisit Log

Things worth doing to games already built, noticed while building later ones. Nothing here is urgent; the plan is to implement all thirteen games first, then play them and work through this list alongside the playtest feedback.

## Shared code that has earned extraction

- **Audio cue loading.** Every modern lane now carries its own near-identical `loadCue` / `play` pair with an `active` guard, and Starship and Moonlander each carry their own looped-bed handling on top. Six copies is well past enough evidence; this belongs in `src/core/audio.ts` as a small per-game cue player that cleans up on exit.
- **Starfields.** Starship, Intergalactic, Evil Alien, Moonlander, Galacticon and Alien Snipers each draw their own. They differ only in density, colour and drift. One helper in `src/core/` with a few options would remove roughly a hundred lines.
- **Debrief panels.** Every modern lane except Starship now draws a centred bordered panel with a headline, a summary line, a statistics line and a "press Enter" footer. The layout maths is copied six times.
- **Phase state machines.** Each modern lane hand-rolls `phase` plus `phaseElapsed` and has hit the same TypeScript narrowing problem, where calling a function that mutates `state.phase` leaves the compiler thinking it cannot have changed. Worked around locally in Bug Eyes and Moonlander by widening to the phase union. A shared tiny phase helper would fix it once.

- **Monster and creature art.** Galacticon's four monsters are drawn from primitives and one of them reads as a rounded rectangle rather than a creature. Worth a pass once the anthology is complete and there is a house style to match.

## Loose ends

- `public/audio/bleep.wav` has been unreferenced since the Start gate was replaced by the landing page. Delete it, or give it a use.
- Manifest years were wrong for the first two games, stated as 1980 and corrected to 1982 when the landing page went in. Worth a pass over the metadata once all thirteen are registered.
- Retro lanes duplicate the "find the game source, else fall back" lookup and the title and source-label construction. A one-line helper would do.
- No automated test suite exists. The differential test of Moonlander's physics against a transcription of the listing lived in the scratchpad and was thrown away. Several games now have pure rule modules that would be cheap to test properly, which is what `AGENTS.md` says to do once logic stabilises.

## Settled along the way

- **Empty-loop timing** was read three different ways across the first eight games: 1/250 s per iteration in Beat The Bug Eyes, an arbitrary 1.4 s in Galacticon, and nothing yet for Asteroid Belt, where the Bug Eyes reading would have paused six seconds between asteroids. All retro lanes now share `src/core/bbcTiming.ts` at BBC speed. Whether BBC speed feels right in Beat The Bug Eyes, where it makes the game very brisk, is a playtest question.

## Design questions raised by later games

- Evil Alien and Beat The Bug Eyes both added a creeping threat with a hard loss the original lacked, and Moonlander did not need one because the original already had a real failure state. Worth checking, once they are all playable, whether that device is used too often across the anthology.
- The landing page shows difficulty as Easy, Medium or Hard, assigned per game as it was built without any comparison between them. They should be calibrated against each other once there are enough to compare.
